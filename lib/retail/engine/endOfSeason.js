// Video: "End of season". Weeks before a season ends, what's left in the DC has three
// ways out: flush it to stores, hold it for next season, or clear it off-price. The
// agent prices each exit per item and compares the mix with one rule for everything.
import { SCENARIOS } from "../reference.js";
import { AS_OF, daysBetween } from "../calendar.js";
import { sum, round } from "../stats.js";
import { byKey, openStores, storeSeries, cleanRate } from "./util.js";

export const meta = {
  id: "end-of-season",
  title: "End of season: flush, hold or clear",
  video: "linkedin_end_of_season_video",
  question: "With the season ending, which exit recovers the most for each item still in the DC?",
};

const FASHION_HOLD_VALUE = 0.4; // a fashion item held a year comes back at well under half price

export async function run(src, params = {}) {
  const cfg = { ...SCENARIOS.endOfSeason, ...params };
  // only what actually ends with the season; longer-running items aren't leftovers yet
  const products = (await src.get("products")).filter((p) => p.season === cfg.season && p.end_date && p.end_date <= cfg.seasonEnd);
  const ids = products.map((p) => p.style_id);
  const [stores, dcInv, inv, sales] = await Promise.all([
    src.get("stores"),
    src.get("dcInventory", { styles: ids }),
    src.get("storeInventory", { styles: ids }),
    src.get("salesWeekly", { styles: ids }),
  ]);
  const live = openStores(stores);
  const storeBy = byKey(live, "store_no");
  const daysLeft = daysBetween(AS_OF, cfg.seasonEnd);
  const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));

  const items = products
    .map((p) => {
      const dc = sum(dcInv.filter((r) => r.style_id === p.style_id).map((r) => r.on_hand));
      if (!dc) return null;
      const series = storeSeries(sales.filter((r) => r.style_id === p.style_id));
      const invBy = byKey(inv.filter((r) => r.style_id === p.style_id), "store_no");

      // what each store can still sell before the season ends, beyond what it holds
      const capacity = live
        .map((s) => {
          const rate = cleanRate(series[s.store_no] ?? [], 4);
          const holds = invBy[s.store_no]?.on_hand ?? 0;
          return { store_no: s.store_no, name: s.name, climate: s.climate, rate: round(rate, 1), can_take: Math.max(0, Math.round(rate * weeksLeft - holds)) };
        })
        .filter((x) => x.can_take > 0)
        .sort((a, b) => b.can_take - a.can_take);
      const totalCapacity = sum(capacity.map((x) => x.can_take));
      const flushable = Math.min(dc, totalCapacity);
      const chainRate = sum(capacity.map((x) => x.rate));

      const recovery = {
        flush: (flushable * (1 - cfg.flushMarkdown) + (dc - flushable) * cfg.postSeasonClearance) / dc,
        hold: (p.carryover ? 1 : FASHION_HOLD_VALUE) - cfg.holdingCostPct,
        off_price: cfg.offPriceRecovery,
      };
      const best = Object.entries(recovery).sort((a, b) => b[1] - a[1])[0][0];

      // flush only where it sells: the smallest set of stores that takes 80% of what can move
      let acc = 0;
      const targets = [];
      for (const c of capacity) {
        if (acc >= 0.8 * flushable) break;
        targets.push(c);
        acc += c.can_take;
      }
      const targeted = best === "flush" && targets.length <= 0.5 * live.length;

      const why = {
        flush: `Stores can still sell ~${flushable} of ${dc} in ${weeksLeft} weeks (${Math.round(chainRate)} a week chain-wide)`,
        hold: p.carryover ? "Same style runs next season; holding keeps full price" : "Held a year, a fashion item comes back at well under half price",
        off_price: `Stores can only move ${flushable} of ${dc}; clear the rest while it still has value`,
      };
      return {
        style_id: p.style_id,
        name: p.name,
        carryover: p.carryover,
        dc_units: dc,
        full_price: Number(p.full_price),
        full_price_value: dc * Number(p.full_price),
        weekly_rate: round(chainRate, 1),
        store_capacity: totalCapacity,
        flushable,
        recovery: Object.fromEntries(Object.entries(recovery).map(([k, v]) => [k, round(v, 3)])),
        best,
        action: best === "flush" ? (targeted ? `Flush to ${targets.length} stores` : "Flush to stores") : best === "hold" ? "Hold over" : "Off-price",
        reason: why[best],
        flush_targets: best === "flush" ? (targeted ? targets : capacity).map((t) => ({ store_no: t.store_no, name: storeBy[t.store_no].name, units: t.can_take })) : [],
      };
    })
    .filter(Boolean);

  const value = sum(items.map((i) => i.full_price_value));
  const policy = (pick) => sum(items.map((i) => i.recovery[pick(i)] * i.full_price_value)) / value;
  const policies = [
    { id: "flush_all", label: "Flush everything", recovery: policy(() => "flush") },
    { id: "hold_all", label: "Hold everything", recovery: policy(() => "hold") },
    { id: "off_price_all", label: "Off-price everything", recovery: policy(() => "off_price") },
    { id: "agent_mix", label: "Agent's mix", recovery: policy((i) => i.best) },
  ].map((x) => ({ ...x, recovery: round(x.recovery, 3), dollars: Math.round(x.recovery * value) }));
  const bestSingle = Math.max(...policies.slice(0, 3).map((x) => x.dollars));
  const agent = policies[3];
  const unitsOut = sum(items.map((i) => (i.best === "flush" ? i.flushable : i.best === "off_price" ? i.dc_units : 0)));

  return {
    focus: { season: cfg.season, season_end: cfg.seasonEnd, days_left: daysLeft, weeks_left: weeksLeft, next_season_start: cfg.nextSeasonStart },
    kpis: [
      { label: "Units left in the DC", value: sum(items.map((i) => i.dc_units)) },
      { label: "Full-price value", value: value, format: "usd" },
      { label: "Agent's mix recovers", value: agent.recovery, format: "pct" },
      { label: "vs the best single rule", value: agent.dollars - bestSingle, format: "usd" },
      { label: "Units out before next season", value: unitsOut },
    ],
    assumptions: { flush_markdown: cfg.flushMarkdown, post_season_clearance: cfg.postSeasonClearance, holding_cost: cfg.holdingCostPct, fashion_hold_value: FASHION_HOLD_VALUE, off_price_recovery: cfg.offPriceRecovery },
    items,
    policies,
  };
}
