// Video: "The bullwhip effect". Shopper sales barely move, store orders swing, DC
// orders swing harder. The agent separates real demand from the echo and sizes the
// next PO on what shoppers bought, not on what stores ordered.
import { SCENARIOS } from "../reference.js";
import { AS_OF, addDays, daysBetween, pretty } from "../calendar.js";
import { mean, cv, round, roundUpTo } from "../stats.js";
import { byKey } from "./util.js";

export const meta = {
  id: "bullwhip",
  title: "The bullwhip effect",
  video: "linkedin_bullwhip_video",
  question: "Is the DC ordering from real shopper demand, or from an echo of store orders?",
};

export async function run(src, params = {}) {
  const cfg = { ...SCENARIOS.bullwhip, ...params };
  const products = byKey(await src.get("products"), "style_id");
  const p = products[cfg.style];
  if (!p) throw new Error(`Unknown style ${cfg.style}`);
  const [replen, sales, pos, promos, stores] = await Promise.all([
    src.get("replenWeekly", { styles: [cfg.style] }),
    src.get("salesWeekly", { styles: [cfg.style] }),
    src.get("purchaseOrders", { styles: [cfg.style] }),
    src.get("promotions"),
    src.get("stores"),
  ]);
  const weeks = [...replen].sort((a, b) => a.week_start.localeCompare(b.week_start)).slice(-Number(cfg.weeks));
  if (!weeks.length) throw new Error(`No replenishment history for ${cfg.style}`);
  const base = mean(weeks.slice(0, 3).map((w) => w.pos_units));
  const series = weeks.map((w) => ({
    week_start: w.week_start,
    pos: w.pos_units,
    store_orders: w.store_order_units,
    dc_orders: w.dc_order_units,
    pos_index: round((100 * w.pos_units) / base),
    orders_index: round((100 * w.store_order_units) / base),
  }));

  const realGrowth = mean(weeks.slice(-3).map((w) => w.pos_units)) / base - 1;
  const peak = weeks.reduce((m, w) => (w.store_order_units > m.store_order_units ? w : m), weeks[0]);
  const orderSwing = peak.store_order_units / base - 1;
  // week-to-week variability of each stage (std ÷ mean)
  const variability = {
    shoppers: round(cv(weeks.map((w) => w.pos_units)), 3),
    store_orders: round(cv(weeks.map((w) => w.store_order_units)), 3),
    dc_orders: round(cv(weeks.map((w) => w.dc_order_units)), 3),
  };

  // why store orders jumped: stores that ran thin just before the spike (stocked out, or
  // ended a week holding under 3/4 of a week's sales) and ordered extra to rebuild
  const spikeWindow = [addDays(peak.week_start, -14), addDays(peak.week_start, -1)];
  const rebuilding = [...new Set(sales.filter((r) => r.week_start >= spikeWindow[0] && r.week_start <= spikeWindow[1] && (r.stockout_days > 0 || r.on_hand_end < 0.75 * r.units)).map((r) => r.store_no))];
  const relatedPromo = promos.find((x) => x.style_id !== cfg.style && products[x.style_id]?.vendor_id === p.vendor_id && products[x.style_id]?.category === p.category && daysBetween(AS_OF, x.start_date) >= 0 && daysBetween(AS_OF, x.start_date) <= 21);
  const reasons = rebuilding.length
    ? [`${rebuilding.length} store${rebuilding.length === 1 ? "" : "s"} ran thin just before the spike, then ordered extra to rebuild ${rebuilding.length === 1 ? "its" : "their"} safety stock`, "Every store's order rounds up to case packs and a little \"just in case\", so small dips become big orders"]
    : ["Store orders moved without any store running thin: an ordering habit, not demand"];
  const watch = relatedPromo ? `${products[relatedPromo.style_id].name} campaign starts ${pretty(relatedPromo.start_date)}: it may pull ${p.name.toLowerCase()} demand forward, so treat that week as a one-off` : null;

  // the next order cycle, sized on shopper demand
  const draft = pos.find((x) => x.status === "draft");
  const weekly = mean(weeks.slice(-4).map((w) => w.pos_units));
  const suggested = roundUpTo(weekly * Number(cfg.coverWeeks) * (1 + Number(cfg.safetyPct)), p.case_pack);

  return {
    focus: { style_id: p.style_id, name: p.name, vendor_id: p.vendor_id, weeks: weeks.length },
    kpis: [
      { label: "Shopper demand change", value: round(realGrowth, 3), format: "pct_signed" },
      { label: "Store-order peak", value: round(orderSwing, 3), format: "pct_signed" },
      { label: "Variability: shoppers", value: variability.shoppers, format: "pct" },
      { label: "Variability: store orders", value: variability.store_orders, format: "pct" },
      { label: "Variability: DC orders", value: variability.dc_orders, format: "pct" },
    ],
    series,
    peak_week: peak.week_start,
    variability,
    echo_reasons: reasons,
    watch,
    rebuilding_stores: rebuilding.map((n) => stores.find((s) => s.store_no === n)?.name ?? `Store ${n}`),
    po_check: draft
      ? {
          po_no: draft.po_no,
          vendor_id: draft.vendor_id,
          drafted_qty: draft.qty_ordered,
          suggested_qty: suggested,
          delta: suggested - draft.qty_ordered,
          basis: `${Math.round(weekly)} shopper units a week × ${cfg.coverWeeks} weeks + ${Math.round(cfg.safetyPct * 100)}% safety, rounded to case packs of ${p.case_pack}`,
        }
      : null,
  };
}
