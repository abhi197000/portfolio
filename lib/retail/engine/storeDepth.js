// Video: "Store depth". Fill each store to its depth target instead of pushing the same
// amount everywhere; flag depth targets that have gone stale; flag items whose
// allocation method no longer fits; and lay out when a launch should switch methods.
import { SCENARIOS } from "../reference.js";
import { AS_OF, addDays, daysBetween, pretty } from "../calendar.js";
import { sum, round, apportion, roundUpTo, cv } from "../stats.js";
import { byKey, openStores, storeSeries, chainWeeks, cleanRate } from "./util.js";

export const meta = {
  id: "store-depth",
  title: "Store depth vs fixed push",
  video: "linkedin_store_depth_video",
  question: "Once stores hold stock, how much should each one get, and which method fits each item?",
};

// Which method an item should be on, from what the data says about it today.
function recommendMethod(p, { weeks, storesWithStock, liveStores, stockoutShare, variability, promo }) {
  const daysLive = daysBetween(p.launch_date, AS_OF);
  if (promo && daysBetween(AS_OF, promo.start_date) <= 7 && daysBetween(AS_OF, promo.start_date) >= 0)
    return { method: "push", reason: `Campaign starts ${pretty(promo.start_date)}; every store needs stock on day one` };
  if (daysLive < 0 || storesWithStock < 0.8 * liveStores)
    return { method: "push", reason: daysLive < 0 ? `Launches ${pretty(p.launch_date)}; not in stores yet` : `Only ${storesWithStock} of ${liveStores} stores hold stock` };
  if (daysLive < 14) return { method: "push", reason: "Launch week: let the push land before reacting" };
  if (weeks >= 26 && variability <= 0.2 && stockoutShare <= 0.08)
    return { method: "demand", reason: `${weeks} weeks of stable sales; let the forecast lead` };
  return { method: "depth", reason: stockoutShare > 0.08 ? `Stores hold stock but ran out in ${Math.round(stockoutShare * 100)}% of store-weeks; ship the gap to depth` : `Stores hold stock, ${weeks} weeks of history; ship the gap to depth` };
}

export async function run(src, params = {}) {
  const cfg = { ...SCENARIOS.storeDepth, ...params };
  const products = byKey(await src.get("products"), "style_id");
  const p = products[cfg.style];
  if (!p) throw new Error(`Unknown style ${cfg.style}`);
  const methodStyles = cfg.methodStyles.filter((id) => products[id]);
  const [stores, inv, dcInv, sales, allInv, promos] = await Promise.all([
    src.get("stores"),
    src.get("storeInventory", { styles: [cfg.style] }),
    src.get("dcInventory", { styles: [cfg.style] }),
    src.get("salesWeekly", { styles: [...new Set([cfg.style, ...methodStyles])] }),
    src.get("storeInventory", { styles: methodStyles }),
    src.get("promotions"),
  ]);
  const live = openStores(stores);
  const invBy = byKey(inv, "store_no");
  const delivery = sum(dcInv.map((r) => r.on_hand));
  const series = storeSeries(sales.filter((r) => r.style_id === cfg.style));

  // ---- the same delivery, two ways ----
  const rows = live
    .filter((s) => invBy[s.store_no] && invBy[s.store_no].depth_target != null)
    .map((s) => {
      const r = invBy[s.store_no];
      const position = r.on_hand + r.in_transit;
      return { store_no: s.store_no, name: s.name, grade: s.grade, on_hand: r.on_hand, in_transit: r.in_transit, depth: r.depth_target, position, need: Math.max(0, r.depth_target - position), rate: round(cleanRate(series[s.store_no] ?? [], 6), 1) };
    });
  const pushEach = Math.floor(delivery / rows.length);
  const needTotal = sum(rows.map((r) => r.need));
  const depthAlloc = needTotal > delivery ? apportion(delivery, rows.map((r) => r.need)) : rows.map((r) => r.need);
  rows.forEach((r, i) => {
    r.fixed_push = pushEach;
    r.fixed_past_target = Math.max(0, r.position + pushEach - Math.max(r.depth, r.position));
    r.fixed_short = Math.max(0, r.depth - r.position - pushEach);
    r.depth_send = depthAlloc[i];
  });
  const depthSent = sum(depthAlloc);

  // ---- are the depth targets still right? weeks of cover each one buys ----
  const [lo, hi] = cfg.healthyCover;
  const floor = p.presentation_min;
  const staleness = rows.map((r) => {
    const cover = r.rate > 0 ? r.depth / r.rate : null;
    const status = cover == null ? "no_sales" : cover < lo ? "too_shallow" : cover > hi ? "too_deep" : "ok";
    const suggested = r.rate > 0 ? Math.max(floor, roundUpTo(r.rate * cfg.targetCoverWeeks, p.case_pack)) : floor;
    return { store_no: r.store_no, name: r.name, depth: r.depth, weekly_rate: r.rate, weeks_of_cover: cover == null ? null : round(cover, 1), status, suggested_depth: status === "ok" ? r.depth : suggested, display_min_applied: status !== "ok" && suggested === floor };
  });

  // ---- which method fits each item today ----
  const methods = methodStyles.map((id) => {
    const q = products[id];
    const rowsQ = sales.filter((r) => r.style_id === id);
    const weeks = chainWeeks(rowsQ);
    const stocked = allInv.filter((r) => r.style_id === id && r.on_hand > 0).length;
    const stockoutShare = rowsQ.length ? rowsQ.filter((r) => r.stockout_days >= 3).length / rowsQ.length : 0;
    const promo = promos.find((x) => x.style_id === id);
    const rec = recommendMethod(q, { weeks: weeks.length, storesWithStock: stocked, liveStores: live.length, stockoutShare, variability: cv(weeks.map((w) => w.units)), promo });
    return { style_id: id, name: q.name, current: q.current_method, recommended: rec.method, reason: rec.reason, flagged: rec.method !== q.current_method };
  });

  // ---- a launch's lifecycle: push → depth → demand ----
  const launch = products[SCENARIOS.fixedPush.style];
  const launchWeek = Math.floor(daysBetween(launch.launch_date, AS_OF) / 7) + 1;
  const toDepth = Math.max(3, launchWeek + 1); // push until most stores are stocked and the first sales are in
  const toDemand = toDepth + 5; // five clean weeks of sales before the forecast leads
  const timeline = {
    style_id: launch.style_id,
    name: launch.name,
    current_week: launchWeek,
    phases: [
      { method: "push", from_week: 1, to_week: toDepth - 1 },
      { method: "depth", from_week: toDepth, to_week: toDemand - 1 },
      { method: "demand", from_week: toDemand, to_week: null },
    ],
    switches: [
      { week: toDepth, on: addDays(launch.launch_date, 7 * (toDepth - 1)), trigger: "80% of stores stocked and first sales in" },
      { week: toDemand, on: addDays(launch.launch_date, 7 * (toDemand - 1)), trigger: "5 weeks of clean (in-stock) sales" },
    ],
  };

  const hero = new Set(cfg.heroStores);
  return {
    focus: { style_id: p.style_id, name: p.name, delivery_units: delivery, stores: rows.length, push_each: pushEach },
    kpis: [
      { label: "Delivery to allocate", value: delivery },
      { label: "Fixed push: sent past target", value: sum(rows.map((r) => r.fixed_past_target)) },
      { label: "Fixed push: stores still short", value: rows.filter((r) => r.fixed_short > 0).length },
      { label: "Store depth: units sent", value: depthSent },
      { label: "Store depth: kept at DC", value: delivery - depthSent },
      { label: "Depth targets to fix", value: staleness.filter((x) => x.status === "too_shallow" || x.status === "too_deep").length },
      { label: "Items on the wrong method", value: methods.filter((m) => m.flagged).length },
    ],
    comparison: rows,
    hero_stores: rows.filter((r) => hero.has(r.store_no)),
    staleness,
    methods,
    timeline,
  };
}
