import { AS_OF } from "../calendar.js";
import { mean, sum, groupBy } from "../stats.js";

export const byKey = (rows, key) => Object.fromEntries(rows.map((r) => [r[key], r]));

export const openStores = (stores) => stores.filter((s) => s.opened_on <= AS_OF);

// weekly rows for one store, oldest first
export function storeSeries(rows) {
  const out = groupBy(rows, "store_no");
  for (const k of Object.keys(out)) out[k].sort((a, b) => a.week_start.localeCompare(b.week_start));
  return out;
}

// chain totals per week: units, store count, stores that ran out for 3+ days
export function chainWeeks(rows) {
  const weeks = groupBy(rows, "week_start");
  return Object.keys(weeks)
    .sort()
    .map((w) => ({
      week_start: w,
      units: sum(weeks[w].map((r) => r.units)),
      stores: weeks[w].length,
      stockout_stores: weeks[w].filter((r) => r.stockout_days >= 3).length,
    }));
}

// Recent selling rate (units/week) from the last n weeks where the store had stock,
// because a stocked-out week records what was on the shelf, not what shoppers wanted.
export function cleanRate(series, n = 6) {
  const recent = series.slice(-n);
  const clean = recent.filter((r) => r.stockout_days === 0);
  return mean((clean.length >= 2 ? clean : recent).map((r) => r.units));
}

export const pctFmt = (x) => `${Math.round(x * 100)}%`;
