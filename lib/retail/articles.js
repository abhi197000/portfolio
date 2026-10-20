// Style-level numbers split into articles (style-colors). Sales follow each color's sales
// mix, tilted toward warm or cold stores and trending week to week; stock follows its
// stock mix. Sales split exactly (a store selling 2 units a week of a 3-color style can't
// be rounded per week without drowning the color's trend), stock splits into whole units
// by largest remainder. Either way the colors add back up to the style.
import { apportion, sum, round, slope, mean } from "./stats.js";
import { cleanRate } from "./engine/util.js";

const CLIMATE = { warm: 1, mild: 0, cold: -1 };

function weights(colors, climate, weeksBack) {
  return colors.map((a) => Math.max(0.001, Number(a.sales_mix) * (1 + Number(a.warm_tilt) * CLIMATE[climate]) * (1 + Number(a.trend)) ** -weeksBack));
}
function stockWeights(colors, climate) {
  return colors.map((a) => Math.max(0.001, Number(a.stock_mix) * (1 + Number(a.warm_tilt) * CLIMATE[climate])));
}

// → { [article_id]: { weekly, stores: { [store_no]: { rate, on_hand, in_transit, next_delivery } }, dc: { [dc_id]: on_hand } } }
export function deriveArticles({ articles, stores, salesWeekly, storeInventory, dcInventory }) {
  const byStyle = {};
  for (const a of articles) (byStyle[a.style_id] ||= []).push(a);
  const storeBy = Object.fromEntries(stores.map((s) => [s.store_no, s]));
  const weeks = [...new Set(salesWeekly.map((r) => r.week_start))].sort();
  const last = weeks.length - 1;
  const wIndex = Object.fromEntries(weeks.map((w, i) => [w, i]));
  const out = Object.fromEntries(articles.map((a) => [a.article_id, { weekly: weeks.map(() => 0), series: {}, stores: {}, dc: {} }]));

  // sales: each store × week row split across the style's colors
  for (const r of salesWeekly) {
    const colors = byStyle[r.style_id];
    const store = storeBy[r.store_no];
    if (!colors || !store) continue;
    const w = weights(colors, store.climate, last - wIndex[r.week_start]);
    const total = sum(w);
    const units = w.map((x) => (r.units * x) / total);
    const left = apportion(r.on_hand_end, stockWeights(colors, store.climate));
    colors.forEach((a, i) => {
      const o = out[a.article_id];
      o.weekly[wIndex[r.week_start]] += units[i];
      (o.series[r.store_no] ||= []).push({ week_start: r.week_start, units: units[i], on_hand_end: left[i], stockout_days: r.stockout_days });
    });
  }
  // today's store positions
  for (const r of storeInventory) {
    const colors = byStyle[r.style_id];
    const store = storeBy[r.store_no];
    if (!colors || !store) continue;
    const sw = stockWeights(colors, store.climate);
    const oh = apportion(r.on_hand, sw);
    const it = apportion(r.in_transit ?? 0, sw);
    colors.forEach((a, i) => {
      const rows = (out[a.article_id].series[r.store_no] ?? []).sort((x, y) => x.week_start.localeCompare(y.week_start));
      out[a.article_id].stores[r.store_no] = { on_hand: oh[i], in_transit: it[i], next_delivery: r.next_delivery, rate: rows.length ? cleanRate(rows, 4) : 0, presentation_min: r.presentation_min };
    });
  }
  // DC reserve
  for (const r of dcInventory) {
    const colors = byStyle[r.style_id];
    if (!colors) continue;
    const dc = apportion(r.on_hand, colors.map((a) => Number(a.stock_mix)));
    colors.forEach((a, i) => (out[a.article_id].dc[r.dc_id] = dc[i]));
  }
  for (const o of Object.values(out)) delete o.series;
  return { weeks, articles: out };
}

// headline numbers for one article
// styleWeekly: the style's total units per week (all its colors), to read the color's share
export function articleStats(a, d, styleWeekly) {
  const recent = d.weekly.slice(-4);
  const rate = mean(recent);
  const tail = d.weekly.slice(-8);
  const storeUnits = sum(Object.values(d.stores).map((s) => s.on_hand));
  const transit = sum(Object.values(d.stores).map((s) => s.in_transit));
  const dcUnits = sum(Object.values(d.dc));
  const stock = storeUnits + transit + dcUnits;
  return {
    weekly_rate: round(rate, 1),
    trend: tail.length >= 4 && mean(tail) > 0 ? round(slope(tail) / mean(tail), 3) : 0,
    // the color's share of its style, last 4 weeks vs the 4 before, as a weekly rate
    mix_trend: mixTrend(d.weekly, styleWeekly),
    share_of_sales: styleWeekly ? round(sum(d.weekly.slice(-4)) / Math.max(1, sum(styleWeekly.slice(-4))), 3) : null,
    store_units: storeUnits,
    in_transit: transit,
    dc_units: dcUnits,
    weeks_of_cover: rate > 0 ? round(stock / rate, 1) : null,
    store_cover: rate > 0 ? round((storeUnits + transit) / rate, 1) : null,
    sell_through: stock > 0 ? round(rate / stock, 3) : 0,
    mix_gap: round(Number(a.stock_mix) / Number(a.sales_mix), 2),
  };
}

function mixTrend(weekly, styleWeekly) {
  if (!styleWeekly) return 0;
  const share = (from, to) => sum(weekly.slice(from, to)) / Math.max(1, sum(styleWeekly.slice(from, to)));
  const now = share(-4), before = share(-8, -4);
  if (!now || !before || sum(styleWeekly.slice(-8, -4)) < 20) return 0;
  return round((now / before) ** (1 / 4) - 1, 3);
}
