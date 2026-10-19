// Video: "Lead-time variability & DC safety stock". Vendors promise a lead time; POs
// arrive on a spread. The agent measures each vendor's real arrivals, spots drift,
// and sizes DC safety stock vendor by vendor instead of one flat rule.
import { SCENARIOS } from "../reference.js";
import { daysBetween } from "../calendar.js";
import { mean, std, pct, sum, round } from "../stats.js";
import { byKey, chainWeeks } from "./util.js";

export const meta = {
  id: "lead-time",
  title: "Lead-time variability & DC safety stock",
  video: "linkedin_lead_time_video",
  question: "How late do vendors really deliver, and how much safety stock does each one need?",
};

const DRIFT_FROM = "2026-08-01";

export async function run(src, params = {}) {
  const cfg = { ...SCENARIOS.leadTime, ...params };
  const flat = Number(cfg.flatRuleDays);
  const window = Number(cfg.window);
  const [vendors, products, pos, sales] = await Promise.all([src.get("vendors"), src.get("products"), src.get("purchaseOrders"), src.get("salesWeekly")]);
  const productBy = byKey(products, "style_id");

  // daily chain demand per vendor, from the last four weeks of sales
  const daily = {};
  const byStyle = {};
  for (const r of sales) (byStyle[r.style_id] ||= []).push(r);
  for (const [style, rows] of Object.entries(byStyle)) {
    const weeks = chainWeeks(rows).slice(-4);
    const v = productBy[style]?.vendor_id;
    if (v && weeks.length) daily[v] = (daily[v] ?? 0) + mean(weeks.map((w) => w.units)) / 7;
  }

  const summaries = vendors.map((v) => {
    const received = pos
      .filter((x) => x.vendor_id === v.vendor_id && x.status === "received")
      .sort((a, b) => a.order_date.localeCompare(b.order_date))
      .slice(-window)
      .map((x) => ({ ...x, lead: daysBetween(x.order_date, x.received_date) }));
    const leads = received.map((x) => x.lead);
    const promised = v.promised_lead_days;
    const p90 = pct(leads, 0.9);
    const before = received.filter((x) => x.order_date < DRIFT_FROM).map((x) => x.lead);
    const since = received.filter((x) => x.order_date >= DRIFT_FROM).map((x) => x.lead);
    const drift = before.length && since.length ? mean(since) - mean(before) : 0;
    const buffer = Math.max(1, Math.round(p90 - promised) + 1);
    const status = drift >= 3 ? "drifting" : p90 - promised > 4 || mean(since) - promised > 4 ? "watch" : "ok";

    // share of POs that land before a buffer of this many days runs out
    const covered = (bufferDays) => leads.filter((l) => l <= promised + bufferDays).length / (leads.length || 1);

    return {
      vendor_id: v.vendor_id,
      name: v.name,
      country: v.country,
      ship_mode: v.ship_mode,
      notes: v.notes,
      promised,
      pos_measured: leads.length,
      mean: round(mean(leads), 1),
      p50: round(pct(leads, 0.5), 1),
      p90: round(p90, 1),
      min: leads.length ? Math.min(...leads) : null,
      max: leads.length ? Math.max(...leads) : null,
      spread: leads.length ? Math.max(...leads) - Math.min(...leads) : null,
      std: round(std(leads), 1),
      on_time_pct: round(leads.filter((l) => l <= promised + 1).length / (leads.length || 1), 3),
      week_late_pct: round(leads.filter((l) => l >= promised + 7).length / (leads.length || 1), 3),
      drift_days: round(drift, 1),
      status,
      daily_demand: round(daily[v.vendor_id] ?? 0, 1),
      buffer_days: buffer,
      flat_rule_gap: flat - buffer, // + means the flat rule holds too much, − too little
      covered_flat: round(covered(flat), 3),
      covered_resized: round(covered(buffer), 3),
      history: received.map((x) => ({ po_no: x.po_no, style_id: x.style_id, order_date: x.order_date, promised_date: x.promised_date, received_date: x.received_date, lead: x.lead, late_by: x.lead - promised })),
    };
  });

  const weight = (s) => s.daily_demand || 0;
  const W = sum(summaries.map(weight)) || 1;
  const coveredFlat = sum(summaries.map((s) => s.covered_flat * weight(s))) / W;
  const coveredResized = sum(summaries.map((s) => s.covered_resized * weight(s))) / W;
  const invFlat = sum(summaries.map((s) => flat * weight(s)));
  const invResized = sum(summaries.map((s) => s.buffer_days * weight(s)));

  // what one late PO did at the DC: planned on the promise plus a day, it arrived on its real lead time
  const focus = summaries.find((s) => s.vendor_id === cfg.vendor) ?? summaries[0];
  const worst = [...focus.history].sort((a, b) => b.lead - a.lead)[0];
  const styleDaily = (() => {
    const weeks = chainWeeks(byStyle[worst?.style_id] ?? []).slice(-4);
    return weeks.length ? mean(weeks.map((w) => w.units)) / 7 : 0;
  })();
  const gapDays = worst ? Math.max(0, worst.lead - focus.promised - 1) : 0;

  return {
    focus: { vendor_id: focus.vendor_id, name: focus.name, style_id: cfg.style, flat_rule_days: flat, window },
    kpis: [
      { label: `${focus.name}: promised`, value: focus.promised, format: "days" },
      { label: `${focus.name}: real range`, value: `${focus.min}–${focus.max}`, format: "days" },
      { label: `${focus.name}: POs covered, flat ${flat} days`, value: focus.covered_flat, format: "pct" },
      { label: `${focus.name}: POs covered, resized`, value: focus.covered_resized, format: "pct" },
      { label: "Network POs covered, flat → resized", value: `${Math.round(coveredFlat * 100)}% → ${Math.round(coveredResized * 100)}%` },
      { label: "Safety-stock inventory change", value: round(invResized / invFlat - 1, 3), format: "pct_signed" },
    ],
    vendors: summaries.sort((a, b) => b.daily_demand - a.daily_demand),
    flags: summaries.filter((s) => s.status !== "ok").map((s) => ({ vendor_id: s.vendor_id, name: s.name, status: s.status, why: s.status === "drifting" ? `Arriving ${s.drift_days} days later since August` : `p90 lead time ${s.p90} days vs ${s.promised} promised${s.notes ? `; ${s.notes.toLowerCase()}` : ""}` })),
    stockout_example: worst
      ? { po_no: worst.po_no, style_id: worst.style_id, name: productBy[worst.style_id]?.name ?? worst.style_id, promised: focus.promised, landed: worst.lead, days_out_of_stock: gapDays, daily_demand: round(styleDaily, 1), units_lost: Math.round(gapDays * styleDaily) }
      : null,
  };
}
