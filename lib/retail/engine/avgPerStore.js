// Video: "Average per store". Per item, decide whether allocation should trust a
// forecast built on sales history, or fall back to an average-per-store quantity —
// and when it's the latter, suggest that average by store grade.
import { SCENARIOS } from "../reference.js";
import { AS_OF, daysBetween } from "../calendar.js";
import { cv, mean, sum, round } from "../stats.js";
import { byKey, openStores, storeSeries, chainWeeks, cleanRate } from "./util.js";

export const meta = {
  id: "avg-per-store",
  title: "Forecast or average per store?",
  video: "linkedin_avg_per_store_video",
  question: "Which items can trust a forecast, and which need an average per store?",
};

const GRADES = ["A", "B", "C"];

export async function run(src, params = {}) {
  const cfg = { ...SCENARIOS.avgPerStore, ...params };
  const products = byKey(await src.get("products"), "style_id");
  const styles = cfg.styles.filter((id) => products[id]);
  const basisIds = [...new Set(styles.map((id) => products[id].like_item || id))];
  const [stores, sales, dcInv] = await Promise.all([
    src.get("stores"),
    src.get("salesWeekly", { styles: [...new Set([...styles, ...basisIds])] }),
    src.get("dcInventory", { styles }),
  ]);
  const live = openStores(stores);
  const grade = Object.fromEntries(live.map((s) => [s.store_no, s.grade]));

  const items = styles.map((id) => {
    const p = products[id];
    const rows = sales.filter((r) => r.style_id === id);
    const weeks = chainWeeks(rows);
    const last10 = weeks.slice(-10);
    const stockoutWeeks = last10.filter((w) => w.stockout_stores / w.stores >= 0.3).length;
    const dcQty = sum(dcInv.filter((r) => r.style_id === id).map((r) => r.on_hand + r.on_order));
    const limited = dcQty < live.length * p.presentation_min * 2.5;
    const variability = cv(weeks.map((w) => w.units));
    const daysToLaunch = daysBetween(AS_OF, p.launch_date);

    let method = "forecast";
    let reason;
    if (weeks.length === 0) {
      method = "avg_per_store";
      reason = daysToLaunch > 0 ? `New launch in ${daysToLaunch} days, no sales history` : "No sales history";
    } else if (weeks.length < 8) {
      method = "avg_per_store";
      reason = `Only ${weeks.length} weeks of history`;
    } else if (stockoutWeeks >= 4) {
      method = "avg_per_store";
      reason = `Stocked out ${stockoutWeeks} of its last ${last10.length} weeks, so history understates demand`;
    } else if (limited) {
      method = "avg_per_store";
      reason = `Limited DC stock: ${dcQty} units for ${live.length} stores`;
    } else {
      reason = `${weeks.length} weeks of steady sales (week-to-week variation ${Math.round(variability * 100)}%)`;
    }
    if (limited && method === "avg_per_store" && !reason.startsWith("Limited")) reason += `; limited DC stock (${dcQty} units)`;

    // per-store weekly rate: own clean history for forecast items, a like item's for the rest
    const basisId = method === "forecast" ? id : p.like_item || id;
    const basis = storeSeries(sales.filter((r) => r.style_id === basisId));
    const rate = Object.fromEntries(live.map((s) => [s.store_no, basis[s.store_no] ? cleanRate(basis[s.store_no], 6) : 0]));
    const perGrade = Object.fromEntries(
      GRADES.map((g) => {
        const rates = live.filter((s) => s.grade === g).map((s) => rate[s.store_no]);
        return [g, Math.max(p.presentation_min, Math.round(mean(rates) * cfg.coverWeeks))];
      })
    );
    let total = sum(live.map((s) => perGrade[grade[s.store_no]]));
    if (dcQty && total > dcQty) {
      const k = dcQty / total; // not enough stock to go round: scale every grade down together
      for (const g of GRADES) perGrade[g] = Math.max(1, Math.floor(perGrade[g] * k));
      total = sum(live.map((s) => perGrade[grade[s.store_no]]));
    }

    return {
      style_id: id,
      name: p.name,
      lifecycle: p.lifecycle,
      method,
      reason,
      basis: basisId === id ? "own history" : `like item: ${products[basisId]?.name ?? basisId}`,
      signal: { history_weeks: weeks.length, stockout_weeks_last10: stockoutWeeks, variability: round(variability, 2), dc_units: dcQty, stores: live.length },
      per_store_by_grade: perGrade,
      total_units: total,
      weekly_history: weeks.map((w) => ({ week_start: w.week_start, units: w.units, stockout_stores: w.stockout_stores })),
    };
  });

  return {
    focus: { cover_weeks: cfg.coverWeeks, stores: live.length },
    kpis: [
      { label: "Items checked", value: items.length },
      { label: "Trust the forecast", value: items.filter((i) => i.method === "forecast").length },
      { label: "Use average per store", value: items.filter((i) => i.method === "avg_per_store").length },
    ],
    items,
  };
}
