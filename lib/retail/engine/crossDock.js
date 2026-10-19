// Video: "Cross-dock at receipt". The ship notice (ASN) arrives before the truck, so the
// agent can split it then: units stores need before the normal flow would reach them go
// straight from the inbound door to the store trucks; the rest goes into reserve.
import { SCENARIOS } from "../reference.js";
import { DC_FLOW } from "../policies.js";
import { AS_OF, addDays, daysBetween, weekday, pretty } from "../calendar.js";
import { sum, round, apportion } from "../stats.js";
import { byKey, openStores, storeSeries, cleanRate } from "./util.js";

export const meta = {
  id: "cross-dock",
  title: "Cross-dock at receipt",
  video: "linkedin_cross_dock_video",
  question: "When the ship notice comes in, which units should skip the shelf and go straight to stores?",
  minDataVersion: 2,
};

// first date on or after `from` that falls on the given weekday
function nextWeekday(from, day) {
  for (let i = 0; i < 7; i++) {
    const d = addDays(from, i);
    if (weekday(d) === day) return d;
  }
  return from;
}

// the receipt's two routes through the DC, as dates
export function routes(eta) {
  const putAway = addDays(eta, DC_FLOW.putAwayDays);
  // the run goes out before receiving opens, so a receipt never makes its own day's run
  const release = nextWeekday(addDays(putAway, weekday(putAway) === DC_FLOW.runDay ? 1 : 0), DC_FLOW.runDay);
  const ready = addDays(release, DC_FLOW.pickPackDays);
  return { receipt: eta, put_away: putAway, release, ready, sorted: eta };
}

export async function run(src, params = {}) {
  const cfg = { ...SCENARIOS.crossDock, ...params };
  const allLines = await src.get("asnLines");
  const asns = [...new Set(allLines.map((l) => l.asn_no))].sort((a, b) => a - b);
  const asnNo = asns.includes(Number(cfg.asn)) ? Number(cfg.asn) : asns[0];
  const lines = allLines.filter((l) => l.asn_no === asnNo).sort((a, b) => a.line_no - b.line_no);
  if (!lines.length) throw new Error(`Unknown ASN ${cfg.asn}`);
  const head = lines[0];
  const styles = lines.map((l) => l.style_id);

  const [stores, products, vendors, inv, dcInv, sales] = await Promise.all([
    src.get("stores"),
    src.get("products"),
    src.get("vendors"),
    src.get("storeInventory", { styles }),
    src.get("dcInventory", { styles }),
    src.get("salesWeekly", { styles }),
  ]);
  const productBy = byKey(products, "style_id");
  const served = openStores(stores).filter((s) => s.dc_id === head.dc_id);
  const storeBy = byKey(served, "store_no");
  const r = routes(head.eta);
  const day = (d) => daysBetween(head.eta, d); // days after the truck lands
  const fromToday = (d) => daysBetween(AS_OF, d); // stores keep selling from today

  const decided = lines.map((line) => {
    const p = productBy[line.style_id];
    const series = storeSeries(sales.filter((x) => x.style_id === line.style_id));
    const reserve = sum(dcInv.filter((x) => x.style_id === line.style_id && x.dc_id === head.dc_id).map((x) => x.on_hand));

    // every store this DC serves: when it runs out, and whether it can wait for the normal flow
    const rows = inv
      .filter((x) => x.style_id === line.style_id && storeBy[x.store_no] && series[x.store_no]?.length)
      .map((x) => {
        const rate = cleanRate(series[x.store_no], 6);
        const daily = rate / 7;
        const position = x.on_hand + x.in_transit;
        const truckDay = weekday(x.next_delivery);
        const viaPutAway = nextWeekday(addDays(r.ready, 1), truckDay);
        const viaCrossDock = nextWeekday(addDays(r.sorted, 1), truckDay);
        const runsOutIn = daily > 0 ? position / daily : null;
        const floor = p.presentation_min + daily * cfg.safetyDays;
        const thin = daily > 0 && position - daily * fromToday(viaPutAway) < floor;
        const target = p.presentation_min + rate * cfg.targetWeeks;
        const gap = thin ? Math.max(0, target - Math.max(0, position - daily * fromToday(viaCrossDock))) : 0;
        const lost = (arrive) => (runsOutIn == null ? 0 : Math.max(0, fromToday(arrive) - runsOutIn) * daily);
        return {
          store_no: x.store_no,
          name: storeBy[x.store_no].name,
          grade: storeBy[x.store_no].grade,
          truck_day: truckDay,
          on_hand: x.on_hand,
          in_transit: x.in_transit,
          weekly_rate: round(rate, 1),
          runs_out: runsOutIn == null ? null : addDays(AS_OF, Math.floor(runsOutIn)),
          thin,
          want_cartons: Math.ceil(gap / p.case_pack),
          via_put_away: viaPutAway,
          via_cross_dock: viaCrossDock,
          lost_put_away: lost(viaPutAway),
          lost_cross_dock: lost(viaCrossDock),
        };
      });

    // the truck may not cover every gap: share its cartons out in proportion
    const want = sum(rows.map((x) => x.want_cartons));
    const cartons = want > line.cartons ? apportion(line.cartons, rows.map((x) => x.want_cartons)) : rows.map((x) => x.want_cartons);
    rows.forEach((x, i) => {
      x.cross_dock = cartons[i] * p.case_pack;
      const share = x.want_cartons ? cartons[i] / x.want_cartons : 0;
      // stock that lands early protects the sales the put-away route would have lost
      x.sales_protected = round((x.lost_put_away - x.lost_cross_dock) * share, 1);
      x.days_saved = x.cross_dock ? day(x.via_put_away) - day(x.via_cross_dock) : 0;
    });

    const xd = sum(rows.map((x) => x.cross_dock));
    const n = rows.filter((x) => x.cross_dock > 0).length;
    const share = xd / line.units;
    // most of it straight out · a real split · a top-up for a few stores · all into reserve
    const decision = share >= 0.5 ? "cross_dock" : share >= 0.2 ? "split" : xd > 0 ? "top_up" : "put_away";
    const stores = n === 1 ? "1 store runs" : `${n} stores run`;
    const inReserve = reserve > 0 ? `${reserve.toLocaleString("en-US")} already in reserve` : "none in reserve";
    const reason = {
      cross_dock: `${stores} thin before the next run could reach ${n === 1 ? "it" : "them"}, and the DC has ${inReserve}`,
      split: `${stores} thin before the next run; the rest restocks reserve (${inReserve})`,
      top_up: `Only ${stores} thin before the next run; the rest goes to reserve (${inReserve})`,
      put_away: `Every store holds enough to reach the next run (${inReserve})`,
    }[decision];
    return {
      line_no: line.line_no,
      po_no: line.po_no,
      style_id: line.style_id,
      name: p.name,
      case_pack: p.case_pack,
      price: Number(p.full_price),
      units: line.units,
      cartons: line.cartons,
      reserve_before: reserve,
      cross_dock: xd,
      cross_dock_cartons: xd / p.case_pack,
      put_away: line.units - xd,
      stores: rows.filter((x) => x.cross_dock > 0).length,
      thin_stores: rows.filter((x) => x.thin).length,
      share: round(share, 3),
      decision,
      reason,
      sales_protected: Math.round(sum(rows.map((x) => x.sales_protected))),
      stores_detail: rows.sort((a, b) => b.cross_dock - a.cross_dock || (a.runs_out ?? "9").localeCompare(b.runs_out ?? "9")),
    };
  });

  // ---- the truck as a whole ----
  const units = sum(decided.map((l) => l.units));
  const cartons = sum(decided.map((l) => l.cartons));
  const xdUnits = sum(decided.map((l) => l.cross_dock));
  const xdCartons = sum(decided.map((l) => l.cross_dock_cartons));
  const touchesSaved = xdCartons * (DC_FLOW.touches.putAway - DC_FLOW.touches.crossDock);
  const salesUnits = sum(decided.map((l) => l.sales_protected));
  const salesUsd = Math.round(sum(decided.map((l) => l.sales_protected * l.price)));
  const flows = decided.flatMap((l) => l.stores_detail.filter((x) => x.cross_dock > 0).map((x) => ({ ...x, units: x.cross_dock })));
  const everyStore = decided.flatMap((l) => l.stores_detail);
  // weighted by the units that take each route; with nothing cross-docked, route A is every store's wait
  const avgDays = (key) =>
    flows.length
      ? round(sum(flows.map((x) => day(x[key]) * x.units)) / sum(flows.map((x) => x.units)), 1)
      : key === "via_put_away" && everyStore.length
        ? round(sum(everyStore.map((x) => day(x[key]))) / everyStore.length, 1)
        : null;
  const storesServed = new Set(flows.map((x) => x.store_no)).size;
  const vendor = vendors.find((v) => v.vendor_id === head.vendor_id);

  // one store to follow through both routes: the hero if it's on this truck, else the most urgent
  const follow = decided.flatMap((l) => l.stores_detail.filter((x) => x.cross_dock > 0).map((x) => ({ ...x, style_id: l.style_id, style: l.name })));
  const hero = follow.find((x) => x.store_no === cfg.heroStore && x.lost_put_away > 0) ?? follow.sort((a, b) => b.lost_put_away - a.lost_put_away)[0] ?? null;

  return {
    asn: {
      asn_no: asnNo,
      vendor_id: head.vendor_id,
      vendor: vendor?.name ?? head.vendor_id,
      dc_id: head.dc_id,
      shipped_on: head.shipped_on,
      eta: head.eta,
      eta_day: weekday(head.eta),
      carrier: head.carrier,
      units,
      cartons,
      stores_served_by_dc: served.length,
    },
    asns: asns.map((n) => {
      const ls = allLines.filter((l) => l.asn_no === n);
      return { asn_no: n, vendor_id: ls[0].vendor_id, eta: ls[0].eta, dc_id: ls[0].dc_id, styles: ls.map((l) => l.style_id), units: sum(ls.map((l) => l.units)) };
    }),
    timeline: {
      ...r,
      run_day: DC_FLOW.runDay,
      put_away_days: { put_away: day(r.put_away), release: day(r.release), ready: day(r.ready) },
      put_away_route: [
        { step: "Receive and check in", day: 0 },
        { step: "Put away to reserve", day: day(r.put_away) },
        { step: `Wait for ${pretty(r.release)}'s allocation run`, day: day(r.release) },
        { step: "Pick and pack", day: day(r.ready) },
        { step: "On the store's next truck", day: avgDays("via_put_away") },
      ],
      cross_dock_route: [
        { step: "Receive and sort to the store's door", day: 0 },
        { step: "On the store's next truck", day: avgDays("via_cross_dock") },
      ],
    },
    lines: decided,
    hero,
    totals: {
      units,
      cartons,
      cross_dock: xdUnits,
      cross_dock_cartons: xdCartons,
      put_away: units - xdUnits,
      share: units ? round(xdUnits / units, 3) : 0,
      stores: storesServed,
      dock_to_store_put_away: avgDays("via_put_away"),
      dock_to_store_cross_dock: avgDays("via_cross_dock"),
      touches_saved: touchesSaved,
      labor_saved: round(touchesSaved * DC_FLOW.costPerTouch),
      sales_protected_units: salesUnits,
      sales_protected: salesUsd,
    },
    kpis: [
      { label: `On the truck (ASN ${asnNo})`, value: units },
      { label: "Cross-docked at receipt", value: xdUnits },
      { label: "Stores served this week", value: storesServed },
      { label: "Dock to store, days", value: xdUnits ? `${avgDays("via_put_away")} → ${avgDays("via_cross_dock")}` : `${avgDays("via_put_away") ?? "—"}, all put away` },
      { label: "Carton touches saved", value: touchesSaved },
      { label: "Sales protected", value: salesUsd, format: "usd" },
    ],
  };
}
