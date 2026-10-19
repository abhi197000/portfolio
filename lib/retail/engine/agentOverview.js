// Video: "Agentic AI in retail". One pass over every store × style position:
// stockouts coming before the next truck, excess that's slow-but-healthy vs truly
// dead, store-to-store transfers only when the math works, and replenishment
// order-up-to levels re-tuned from each store's real selling rate.
import { SCENARIOS } from "../reference.js";
import { AS_OF, addDays, daysBetween, weekday } from "../calendar.js";
import { sum, mean, round, slope, kmBetween } from "../stats.js";
import { byKey, openStores, chainWeeks, cleanRate } from "./util.js";

export const meta = {
  id: "agentic-overview",
  title: "Agentic AI across the network",
  video: "linkedin_agentic_ai_video",
  question: "Across every store and style, what needs a decision today?",
};

export async function run(src, params = {}) {
  const cfg = { ...SCENARIOS.overview, ...params };
  const [stores, products, sales, inv, dcInv, asnLines] = await Promise.all([
    src.get("stores"),
    src.get("products"),
    src.get("salesWeekly"),
    src.get("storeInventory"),
    src.get("dcInventory"),
    src.get("asnLines").catch(() => []), // seeds from before the cross-dock video have no ASNs
  ]);
  const live = openStores(stores);
  const storeBy = byKey(live, "store_no");
  const productBy = byKey(products, "style_id");
  const seriesBy = {};
  for (const r of sales) ((seriesBy[r.style_id] ||= {})[r.store_no] ||= []).push(r);
  for (const style of Object.values(seriesBy)) for (const rows of Object.values(style)) rows.sort((a, b) => a.week_start.localeCompare(b.week_start));
  const rateOf = (style, store) => cleanRate(seriesBy[style]?.[store] ?? [], 4);
  const dcOnHand = (style, dc) => sum(dcInv.filter((r) => r.style_id === style && (!dc || r.dc_id === dc)).map((r) => r.on_hand));

  // positions we can reason about: on the floor, still selling
  const positions = inv
    .filter((r) => storeBy[r.store_no] && productBy[r.style_id] && seriesBy[r.style_id]?.[r.store_no]?.length >= 3)
    .map((r) => {
      const weekly = rateOf(r.style_id, r.store_no);
      return { ...r, weekly, daily: weekly / 7, cover_weeks: weekly > 0 ? r.on_hand / weekly : Infinity };
    });

  // ---- transfers: a nearby store sitting on the same SKU ----
  const transferFrom = (risk) => {
    const p = productBy[risk.style_id];
    const candidates = positions
      .filter((x) => x.style_id === risk.style_id && x.store_no !== risk.store_no && x.cover_weeks > 6 && x.on_hand > x.weekly * 4)
      .map((x) => ({ ...x, km: kmBetween(storeBy[risk.store_no], storeBy[x.store_no]) }))
      .sort((a, b) => a.km - b.km);
    const near = candidates.find((x) => x.km <= cfg.transferRadiusKm);
    const best = near ?? candidates[0];
    if (!best) return null;
    const units = Math.min(Math.ceil(risk.daily * risk.days_uncovered + risk.weekly), Math.floor(best.on_hand - best.weekly * 4));
    const cost = cfg.transferFixedCost + cfg.transferCostPerUnit * units;
    const margin = units * (Number(p.full_price) - Number(p.unit_cost)) * 0.9;
    const worth = !!near && units > 0 && margin > cost;
    return {
      from_store: best.store_no,
      from_name: storeBy[best.store_no].name,
      km: round(best.km),
      sender_weeks_of_cover: round(best.cover_weeks, 1),
      units,
      cost: round(cost, 2),
      margin_saved: round(margin, 2),
      recommended: worth,
      why: !near ? `Nearest store with spare stock is ${round(best.km)} km away; not worth the freight` : worth ? `Saves $${Math.round(margin)} of margin for $${Math.round(cost)} of transfer cost` : "Margin saved doesn't cover the transfer cost",
    };
  };

  // ---- stockouts before the next delivery ----
  const stockouts = positions
    .filter((x) => x.daily > 0 && x.on_hand > 0)
    .map((x) => {
      const runsOut = addDays(AS_OF, Math.floor(x.on_hand / x.daily));
      const daysUncovered = x.in_transit > 0 ? 0 : daysBetween(runsOut, x.next_delivery);
      return { ...x, runs_out: runsOut, days_uncovered: daysUncovered };
    })
    .filter((x) => x.days_uncovered > 0)
    .map((x) => {
      const p = productBy[x.style_id];
      const lost = x.daily * x.days_uncovered;
      const dcStock = dcOnHand(x.style_id, storeBy[x.store_no].dc_id);
      const transfer = transferFrom(x);
      // a truck carrying this style lands at the store's DC before its next delivery: cross-dock it
      const inbound = asnLines.find((l) => l.style_id === x.style_id && l.dc_id === storeBy[x.store_no].dc_id && l.eta < x.next_delivery);
      const options = [];
      if (inbound) options.push(`Cross-dock off ${weekday(inbound.eta)}'s inbound truck (ASN ${inbound.asn_no})`);
      if (transfer?.recommended) options.push(`Transfer ${transfer.units} from ${transfer.from_name} (${transfer.km} km)`);
      if (dcStock > 0) options.push(`Pull forward on the next DC truck (${dcStock} at ${storeBy[x.store_no].dc_id})`);
      return {
        store_no: x.store_no,
        name: storeBy[x.store_no].name,
        style_id: x.style_id,
        style: p.name,
        on_hand: x.on_hand,
        weekly_rate: round(x.weekly, 1),
        runs_out: x.runs_out,
        runs_out_day: weekday(x.runs_out),
        next_delivery: x.next_delivery,
        next_delivery_day: weekday(x.next_delivery),
        days_uncovered: x.days_uncovered,
        margin_at_risk: round(lost * (Number(p.full_price) - Number(p.unit_cost))),
        transfer,
        options,
      };
    })
    .sort((a, b) => b.margin_at_risk - a.margin_at_risk);

  // ---- excess: slow but healthy, or truly dead ----
  const excess = products
    .filter((p) => seriesBy[p.style_id] && (!p.end_date || p.end_date >= AS_OF))
    .map((p) => {
      const weeks = chainWeeks(sales.filter((r) => r.style_id === p.style_id)).slice(-6);
      if (weeks.length < 4) return null;
      const weekly = mean(weeks.slice(-3).map((w) => w.units));
      const stock = sum(inv.filter((r) => r.style_id === p.style_id).map((r) => r.on_hand)) + dcOnHand(p.style_id);
      const cover = weekly > 0 ? stock / weekly : Infinity;
      const trend = slope(weeks.map((w) => w.units)) / Math.max(1, mean(weeks.map((w) => w.units)));
      const sellThrough = weekly / Math.max(1, stock);
      if (cover < 10) return null;
      const dead = trend < -0.04 && sellThrough < 0.03;
      return {
        style_id: p.style_id,
        name: p.name,
        units: stock,
        weekly_sales: round(weekly),
        weeks_of_cover: cover === Infinity ? null : round(cover, 1),
        weekly_sell_through: round(sellThrough, 3),
        trend_per_week: round(trend, 3),
        verdict: dead ? "truly_dead" : "slow_but_healthy",
        weekly: weeks.map((w) => w.units),
        action: dead ? "Mark down or clear now, while it still has value" : "Hold; demand is building",
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.verdict === b.verdict ? (b.weeks_of_cover ?? 999) - (a.weeks_of_cover ?? 999) : a.verdict === "truly_dead" ? -1 : 1));

  // ---- replenishment: static min/max vs a level tuned to each store ----
  const rp = productBy[cfg.replenStyle];
  const replen = positions
    .filter((x) => x.style_id === cfg.replenStyle)
    .map((x) => {
      const rows = seriesBy[x.style_id][x.store_no].slice(-8).map((r) => r.units);
      const sd = rows.length > 1 ? Math.sqrt(mean(rows.map((u) => (u - mean(rows)) ** 2))) : 0;
      // review weekly, one-week DC lead time, ~95% service on weekly demand noise
      const tuned = Math.max(rp.presentation_min, Math.round(x.weekly * 2 + 1.65 * sd * Math.SQRT2));
      // styles without a configured max are run on a rule of thumb: three display minimums
      const staticMax = x.max_qty ?? rp.max_qty ?? rp.presentation_min * 3;
      return { store_no: x.store_no, name: storeBy[x.store_no].name, weekly_rate: round(x.weekly, 1), static_max: staticMax, tuned_max: tuned, change: tuned - staticMax };
    })
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  const transfers = stockouts.filter((s) => s.transfer).map((s) => ({ to_store: s.store_no, to_name: s.name, style: s.style, ...s.transfer }));

  return {
    focus: { stores: live.length, positions: positions.length, replen_style: rp.name },
    kpis: [
      { label: "Positions scanned", value: positions.length },
      { label: "Stockouts before next truck", value: stockouts.length },
      { label: "Transfers worth making", value: transfers.filter((t) => t.recommended).length },
      { label: "Excess items", value: excess.length },
      { label: `${rp.name}: stores to re-tune`, value: replen.filter((r) => Math.abs(r.change) >= 6).length },
    ],
    stockouts: stockouts.slice(0, 12),
    transfers,
    excess,
    replenishment: { style_id: rp.style_id, name: rp.name, stores: replen },
  };
}
