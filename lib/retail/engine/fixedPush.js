// Video: "Fixed push". A new item has no history, so a share of DC stock is pushed by
// store grade and the rest held back. The agent checks which stores' "zero demand"
// was really zero stock, then reads launch-week sell-through and releases the reserve.
import { SCENARIOS } from "../reference.js";
import { sum, round, apportion, groupBy } from "../stats.js";
import { pushPlan } from "../policies.js";
import { byKey, openStores } from "./util.js";

export const meta = {
  id: "fixed-push",
  title: "Fixed push, then chase demand",
  video: "linkedin_fixed_push_video",
  question: "How much should a new item push to stores, and where should the held-back stock go?",
};

export async function run(src, params = {}) {
  const cfg = { ...SCENARIOS.fixedPush, ...params };
  const products = byKey(await src.get("products"), "style_id");
  const p = products[cfg.style];
  if (!p) throw new Error(`Unknown style ${cfg.style}`);
  const like = p.like_item;
  const [stores, inv, dcInv, daily, likeSales] = await Promise.all([
    src.get("stores"),
    src.get("storeInventory", { styles: [cfg.style] }),
    src.get("dcInventory", { styles: [cfg.style] }),
    src.get("salesDaily", { styles: [cfg.style] }),
    like ? src.get("salesWeekly", { styles: [like] }) : [],
  ]);
  const live = openStores(stores);
  const storeBy = byKey(live, "store_no");
  const pushed = Object.fromEntries(inv.map((r) => [r.store_no, r.last_alloc_qty ?? 0]));
  const pushedTotal = sum(Object.values(pushed));
  const reserve = sum(dcInv.map((r) => r.on_hand));
  const dcTotal = pushedTotal + reserve;

  // the plan, recomputed from the rule: same % of DC stock, split by grade
  const plan = pushPlan(live, dcTotal, Number(cfg.pushPct));
  const byGrade = Object.fromEntries(["A", "B", "C"].map((g) => {
    const units = plan.filter((x) => x.grade === g).map((x) => x.units);
    return [g, { stores: units.length, units_each: units.length ? Math.round(sum(units) / units.length) : 0 }];
  }));

  // "zero demand" that was really zero stock, read from the like item's history
  const likeByStore = groupBy(likeSales, "store_no");
  const censored = live
    .map((s) => {
      const rows = likeByStore[s.store_no] ?? [];
      const sold = sum(rows.map((r) => r.units));
      const dark = rows.filter((r) => r.stockout_days >= 6).length;
      return { store_no: s.store_no, name: s.name, weeks: rows.length, sold, weeks_out_of_stock: dark };
    })
    .filter((x) => x.weeks > 0 && x.sold === 0 && x.weeks_out_of_stock >= 0.8 * x.weeks)
    .map((x) => ({ ...x, reason: `Zero ${products[like]?.name ?? like} sales, but no stock for ${x.weeks_out_of_stock} of ${x.weeks} weeks`, action: "Ignore the zero: give it the grade push" }));
  const censoredSet = new Set(censored.map((c) => c.store_no));

  // launch week, day by day
  const days = groupBy(daily, "store_no");
  const sell = live
    .map((s) => {
      const rows = (days[s.store_no] ?? []).sort((a, b) => a.day.localeCompare(b.day));
      const sold = sum(rows.map((r) => r.units));
      let cum = 0;
      const curve = rows.map((r) => {
        cum += r.units;
        return { day: r.day, sell_through: pushed[s.store_no] ? round(cum / pushed[s.store_no], 3) : 0 };
      });
      return { store_no: s.store_no, name: s.name, grade: s.grade, climate: s.climate, pushed: pushed[s.store_no] ?? 0, sold, sell_through: pushed[s.store_no] ? round(sold / pushed[s.store_no], 3) : 0, sold_out: rows.length > 0 && rows[rows.length - 1].on_hand_end === 0, curve, was_zero_demand: censoredSet.has(s.store_no) };
    })
    .sort((a, b) => b.sell_through - a.sell_through);

  // release the reserve to stores past the trigger, in proportion to what they sold,
  // capped at 1.5x their push so one hot store can't swallow it all
  const eligible = sell.filter((x) => x.sell_through >= Number(cfg.releaseTrigger));
  let release = apportion(reserve, eligible.map((x) => x.sold));
  release = release.map((u, i) => Math.min(u, Math.round(eligible[i].pushed * 1.5)));
  const releases = eligible.map((x, i) => ({ store_no: x.store_no, name: x.name, sell_through: x.sell_through, units: release[i], was_zero_demand: x.was_zero_demand })).filter((x) => x.units > 0);
  const released = sum(releases.map((x) => x.units));
  const hero = new Set(cfg.heroStores ?? []);

  return {
    focus: { style_id: p.style_id, name: p.name, launch_date: p.launch_date, like_item: like, push_pct: Number(cfg.pushPct), release_trigger: Number(cfg.releaseTrigger) },
    kpis: [
      { label: "DC units at launch", value: dcTotal },
      { label: "Pushed to stores", value: pushedTotal },
      { label: "Held back", value: reserve },
      { label: "Stores past the trigger", value: eligible.length },
      { label: "Released from reserve", value: released },
    ],
    plan: { dc_total: dcTotal, pushed: pushedTotal, held: reserve, by_grade: byGrade },
    censored_demand: censored,
    sell_through: sell,
    hero_stores: sell.filter((x) => hero.has(x.store_no)),
    release: { reserve, released, kept: reserve - released, stores: releases, holds: sell.filter((x) => x.sell_through < Number(cfg.releaseTrigger)).map((x) => ({ store_no: x.store_no, name: x.name, sell_through: x.sell_through })) },
    stores_total: live.length,
    store_names: Object.fromEntries(live.map((s) => [s.store_no, storeBy[s.store_no].name])),
  };
}
