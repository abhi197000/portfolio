// Builds the whole demo dataset from the reference data, deterministically.
//
// Sales come from a week-by-week simulation per store × style: demand is drawn from
// a weather- and season-aware rate, but a store can only sell what it holds, so
// stockouts censor sales exactly as they do in real history. A handful of
// "hero" overrides then plant each LinkedIn video's scenario in the data.
import { rng, hashSeed } from "./random.js";
import { AS_OF, addDays, daysBetween, weekStarts } from "./calendar.js";
import { RETAILER, DCS, STORES, VENDORS, PRODUCTS, PROMOTIONS, SIZE_GROUPS, SCENARIOS, ARTICLES } from "./reference.js";
import { GRADE_VOLUME, DEPTH_BY_GRADE, pushPlan } from "./policies.js";
import { apportion, sum } from "./stats.js";

// bumped whenever the generated data changes, so the app can tell a stale Supabase seed
// (v2: the cross-dock truck, its ASNs and Columbus's empty white-tee and sock slots;
//  v3: articles, the style-colors the planner story tags)
export const DATA_VERSION = "v3";

const WEEKS = weekStarts();
const LAST_WEEK = WEEKS[WEEKS.length - 1];
const PRODUCT = Object.fromEntries(PRODUCTS.map((p) => [p.style_id, p]));

// ---- hero scenarios planted in the data -------------------------------------------

// store × style rates (units/week over the last 8 weeks) and the position "today"
const HERO = {
  "CHINO-KHK": { 14: { rate: 60, oh: 6 }, 22: { rate: 12, oh: 40 }, 31: { rate: 14, oh: 22 }, 47: { rate: 2, oh: 55 }, 58: { rate: 3, oh: 85 } },
  "CREW-TEE": { 14: { rate: 35, oh: 17 }, 19: { rate: 6, oh: 48 } },
  "POLO-TEE": { 27: { rate: 5 } }, // the college-town store sells enough polos to read its own curve
};
// Store 31 never got the fall outerwear, so its history reads "zero demand"
const NEVER_SUPPLIED = new Set(["31|WOOL-COAT", "31|CORD-JACKET"]);
// the linen shirt's DC ran dry for six weeks mid-summer
const LINEN_DC_OUT = ["2026-07-06", "2026-08-10"];
// Columbus (DC-E) shipped its last white tees and socks at the start of October, so its
// stores missed their last two weekly deliveries; Sola's Monday truck is the next stock
// (the cross-dock video)
const DC_E_DRY = { styles: ["WHITE-TEE", "SOCKS-3PK"], from: "2026-10-12", note: "Ran out Oct 6; Sola truck lands Mon Oct 19 (ASN 30418)" };
// what v2 changed in rows that already existed at v1, for the seed builder's upgrade file
// (v3 only adds rows: the articles)
export const V2_CHANGED = { styles: DC_E_DRY.styles, since: addDays(DC_E_DRY.from, -7) };
// Sola's weekly truck into Columbus, at the dock Monday morning. The ship notice (ASN)
// came in Saturday, so there's time to split it before it lands.
const SOLA_TRUCK = {
  asn_no: 30418, vendor_id: "SOLA", dc_id: "DC-E", order_date: "2026-10-09", shipped_on: "2026-10-17", eta: AS_OF, carrier: "Truckload via Laredo · trailer 2218",
  lines: [["WHITE-TEE", 960], ["SOCKS-3PK", 720], ["OXFORD", 600], ["POLO-TEE", 600]],
};
// Northline's open hoodie PO is drifting late, like the lead-time video says
const NORTHLINE_ETA = { HOODIE: "2026-10-23" };
// hoodie: shoppers barely moved (+5%) while store orders swung (the bullwhip video)
const HOODIE_POS_IDX = [100, 100, 101, 103, 105, 105, 105, 104, 105, 105, 105, 105];
const HOODIE_ORDER_IDX = [100, 100, 98, 114, 140, 126, 70, 45, 82, 102, 108, 104];
// parka launch week sell-through for the fixed-push video's stores
const PARKA_ST = { 14: 1.0, 22: 0.7, 31: 0.8, 47: 0.25, 58: 0.1 };
const PARKA_DC_TOTAL = 6000;
// POLO-TEE size curves (S, M, L, XL, XXL)
const CHAIN_CURVE = [0.125, 0.25, 0.29, 0.21, 0.125];
const STORE_CURVE = { 27: [0.29, 0.33, 0.21, 0.125, 0.045], 41: [0.04, 0.125, 0.21, 0.33, 0.295], 12: CHAIN_CURVE };
// DC position "today" (chain totals, split across the two DCs)
const DC_ON_HAND = {
  "CREW-TEE": 5200, "WHITE-TEE": 3600, "POLO-TEE": 1400, OXFORD: 800, "SOCKS-3PK": 2400, "SLIM-DENIM": 1300,
  "CHINO-KHK": 2400, "CHINO-BLK": 1100, "CARGO-PANT": 0, "CORD-JACKET": 0, HOODIE: 1450, "MERINO-CREW": 700,
  "KNIT-BEANIE": 900, "PROMO-HOODIE": 3000, FAIRISLE: 2880, "WOOL-COAT": 900, "PUFFER-VEST": 400,
  PARKA: PARKA_DC_TOTAL - Math.round(PARKA_DC_TOTAL * SCENARIOS.fixedPush.pushPct), "RAIN-SHELL": 420,
  "PRINT-SHIRT": 600, "LINEN-SHIRT": 1200, "RETRO-RUNNER": 900, "COLLAB-SNKR": 600, "CHELSEA-BOOT": 260, "LEATHER-BELT": 380,
};
const DC_NOTES = {
  "CHINO-KHK": "Repeat delivery received Oct 16",
  PARKA: "Held back at launch (40% reserve)",
  "LINEN-SHIRT": "Resort reorder; allocates Nov 16",
  "COLLAB-SNKR": "Limited run; drops Oct 30",
  FAIRISLE: "Launches Nov 2",
  "PROMO-HOODIE": "Campaign starts Fri Oct 23",
};

// ---- demand model -------------------------------------------------------------------

function storeVolume(store, weekStart) {
  let v = GRADE_VOLUME[store.grade] * rng(hashSeed("vol", store.store_no)).between(0.88, 1.12);
  const ageWeeks = daysBetween(store.opened_on, weekStart) / 7;
  if (ageWeeks < 52) v *= Math.min(1, 0.25 + 0.02 * Math.max(0, ageWeeks)); // new stores ramp up slowly
  return v;
}

// 0 in high summer → 1 by mid-November
const coldness = (weekStart) => Math.min(1, Math.max(0, daysBetween("2026-08-15", weekStart) / 90));

function climateFactor(profile, climate, weekStart) {
  const c = coldness(weekStart);
  switch (profile) {
    case "warm-wear":
      return { warm: 1.35, mild: 1.0, cold: 0.72 }[climate];
    case "cold-wear":
      return ({ cold: 1.45, mild: 1.0, warm: 0.45 }[climate]) * (0.7 + 0.6 * c);
    case "cold-only":
      return ({ cold: 1.6, mild: 0.5, warm: 0.07 }[climate]) * (0.6 + 0.8 * c);
    default:
      return 1;
  }
}

function curveFactor(p, weekStart, wi) {
  const t = Math.max(0, daysBetween(p.launch_date, weekStart) / 7);
  switch (p.curve) {
    case "summer": {
      const d = daysBetween("2026-07-13", weekStart);
      return 0.65 + 0.55 * Math.exp(-((d / 55) ** 2));
    }
    case "fall": {
      const toEnd = p.end_date ? daysBetween(weekStart, p.end_date) : 99;
      return (0.7 + 0.5 * Math.min(1, t / 8)) * (toEnd < 21 ? 0.9 : 1);
    }
    case "rising":
      return Math.min(1.4, 0.5 + 0.09 * t);
    case "dud":
      return 0.86 ** t;
    case "launch":
      return [1, 0.92, 0.86][Math.min(2, Math.floor(t))];
    case "hoodie": {
      const k = wi - (WEEKS.length - 12);
      return k >= 0 ? HOODIE_POS_IDX[k] / 100 : 0.92;
    }
    default:
      return 1;
  }
}

const activeIn = (p, weekStart) => p.launch_date <= addDays(weekStart, 6) && (!p.end_date || weekStart <= p.end_date);

// ---- simulation -------------------------------------------------------------------

function simulate(store, p) {
  const key = `${store.store_no}|${p.style_id}`;
  const r = rng(hashSeed("sim", key));
  const personality = r.lognormal(0.18); // some stores just sell more of some things
  const hero = HERO[p.style_id]?.[store.store_no];
  const cover = { HOODIE: 3, "CHINO-KHK": 3 }[p.style_id] ?? (p.lifecycle === "core" ? 2.5 : 2);
  const rows = [];
  let onHand = null;
  let pending = 0;
  let forecast = 0;

  // the twelve stores that ran short of hoodies in August and then rebuilt their buffer
  const hoodieShort = p.style_id === "HOODIE" && rng(hashSeed("hoodie-short", store.store_no)).next() < 0.32;

  WEEKS.forEach((weekStart, wi) => {
    if (!activeIn(p, weekStart) || store.opened_on > addDays(weekStart, 6)) return;
    let lambda = p.base * storeVolume(store, weekStart) * climateFactor(p.climate, store.climate, weekStart) * curveFactor(p, weekStart, wi) * personality;
    if (hero && wi >= WEEKS.length - 8) lambda = hero.rate;
    else lambda *= r.lognormal(p.style_id === "HOODIE" ? 0.06 : 0.2);

    if (onHand === null) {
      onHand = NEVER_SUPPLIED.has(key) ? 0 : Math.round(lambda * cover + p.presentation_min);
      forecast = lambda;
    }
    onHand += pending;
    pending = 0;

    const demand = r.poisson(lambda);
    const units = Math.min(demand, onHand);
    const stockoutDays = demand > onHand ? Math.min(7, Math.max(1, Math.round((7 * (demand - onHand)) / Math.max(demand, 1)))) : 0;
    onHand -= units;
    forecast = 0.6 * forecast + 0.4 * units; // learns from sales, so stockouts drag the forecast down

    let markdown = 0;
    if (p.style_id === "PRINT-SHIRT" && weekStart >= "2026-10-05") markdown = 30;
    if (p.style_id === "LINEN-SHIRT" && weekStart >= "2026-08-10") markdown = 40;

    rows.push({
      store_no: store.store_no,
      style_id: p.style_id,
      week_start: weekStart,
      units,
      on_hand_end: onHand,
      stockout_days: stockoutDays,
      markdown_pct: markdown,
    });

    // weekly replenishment from the DC, arriving next week
    const nextWeek = addDays(weekStart, 7);
    let supply = !NEVER_SUPPLIED.has(key);
    if (p.style_id === "LINEN-SHIRT" && nextWeek >= LINEN_DC_OUT[0] && nextWeek <= LINEN_DC_OUT[1]) supply = false;
    if (store.dc_id === "DC-E" && DC_E_DRY.styles.includes(p.style_id) && nextWeek >= DC_E_DRY.from) supply = false;
    if (hoodieShort && (nextWeek === "2026-08-10" || nextWeek === "2026-08-17")) supply = false;
    // khaki chino comes in repeat deliveries every six weeks, so stores run thin in between
    if (p.style_id === "CHINO-KHK" && !hero && (wi + 1) % 6 !== 0) supply = false;
    if (p.end_date && nextWeek > p.end_date) supply = false;
    const target = Math.max(forecast, lambda * 0.8) * cover + p.presentation_min;
    if (supply) pending = Math.max(0, Math.round(target - onHand));
  });

  return { rows, onHand: onHand ?? 0, pending };
}

// ---- builders ---------------------------------------------------------------------

function buildSalesAndPositions() {
  const salesWeekly = [];
  const storeInventory = [];
  const salesDaily = [];

  const plan = pushPlan(STORES, PARKA_DC_TOTAL, SCENARIOS.fixedPush.pushPct);
  const pushed = Object.fromEntries(plan.map((x) => [x.store_no, x.units]));

  for (const store of STORES) {
    const deliveryOffset = rng(hashSeed("delivery", store.store_no)).int(1, 5); // Tue..Sat
    const nextDelivery = store.store_no === 14 ? "2026-10-24" : addDays(AS_OF, deliveryOffset);

    for (const p of PRODUCTS) {
      const position = (onHand, inTransit) => ({
        store_no: store.store_no,
        style_id: p.style_id,
        on_hand: onHand,
        in_transit: inTransit,
        next_delivery: nextDelivery,
        depth_target: DEPTH_BY_GRADE[p.style_id]?.[store.grade] ?? null,
        presentation_min: p.presentation_min,
        min_qty: p.min_qty ?? null,
        max_qty: p.max_qty ?? null,
        last_alloc_qty: null,
        by_size: null,
      });

      if (p.style_id === "PARKA") {
        // launch week, day by day: the fixed push landed Oct 10, doors opened Oct 12
        const units = pushed[store.store_no];
        const r = rng(hashSeed("parka", store.store_no));
        const st = PARKA_ST[store.store_no] ?? { cold: r.between(0.55, 0.85), mild: r.between(0.35, 0.6), warm: r.between(0.12, 0.35) }[store.climate];
        const sold = Math.min(units, Math.round(units * st));
        const shape = store.store_no === 14 ? [0.24, 0.22, 0.2, 0.18, 0.16, 0, 0] : [0.18, 0.16, 0.14, 0.15, 0.16, 0.11, 0.1];
        const daily = apportion(sold, shape);
        let left = units;
        daily.forEach((u, d) => {
          left -= u;
          salesDaily.push({ store_no: store.store_no, style_id: "PARKA", day: addDays(LAST_WEEK, d), units: u, on_hand_end: left });
        });
        salesWeekly.push({ store_no: store.store_no, style_id: "PARKA", week_start: LAST_WEEK, units: sold, on_hand_end: left, stockout_days: left === 0 ? 2 : 0, markdown_pct: 0 });
        storeInventory.push({ ...position(left, 0), last_alloc_qty: units });
        continue;
      }

      if (p.launch_date > AS_OF || !p.base) {
        // allocated but not on the floor yet (or launching soon): stores hold nothing
        if (p.launch_date <= addDays(AS_OF, 30)) storeInventory.push(position(0, 0));
        continue;
      }

      const sim = simulate(store, p);
      salesWeekly.push(...sim.rows);
      const active = !p.end_date || p.end_date >= AS_OF;
      if (!sim.rows.length || !active) continue;

      const hero = HERO[p.style_id]?.[store.store_no];
      const pinned = hero?.oh != null;
      const onHand = pinned ? hero.oh : sim.onHand;
      const inv = position(onHand, pinned ? 0 : sim.pending);
      if (p.style_id === "POLO-TEE") inv.by_size = sizeSplit(store, onHand, true);
      storeInventory.push(inv);
    }
  }
  return { salesWeekly, storeInventory, salesDaily };
}

function storeCurve(store) {
  if (STORE_CURVE[store.store_no]) return STORE_CURVE[store.store_no];
  const r = rng(hashSeed("curve", store.store_no));
  const tilt = ["South", "Southwest"].includes(store.region) ? 0.02 : ["Northeast", "West"].includes(store.region) ? -0.01 : 0;
  const raw = CHAIN_CURVE.map((x, i) => Math.max(0.02, x + (i >= 3 ? tilt : -tilt / 1.5) + r.between(-0.015, 0.015)));
  const s = sum(raw);
  return raw.map((x) => x / s);
}

function sizeSplit(store, units, onHandView) {
  // Store 14 is the "40 units, sale still lost" store: the core sizes are gone
  if (onHandView && store.store_no === 14) return { S: 14, M: 0, L: 0, XL: 12, XXL: 14 };
  const parts = apportion(units, storeCurve(store));
  return Object.fromEntries(SIZE_GROUPS.alpha.map((s, i) => [s, parts[i]]));
}

function buildSizeSales(salesWeekly) {
  const since = WEEKS[WEEKS.length - 13];
  const out = [];
  for (const store of STORES) {
    const units = sum(salesWeekly.filter((r) => r.style_id === "POLO-TEE" && r.store_no === store.store_no && r.week_start >= since).map((r) => r.units));
    const split = sizeSplit(store, units, false);
    for (const size of SIZE_GROUPS.alpha) out.push({ store_no: store.store_no, style_id: "POLO-TEE", size, units_13w: split[size] });
  }
  return out;
}

function buildDcInventory(purchaseOrders) {
  const out = [];
  const eastShare = STORES.filter((s) => s.dc_id === "DC-E").length / STORES.length;
  for (const [style_id, total] of Object.entries(DC_ON_HAND)) {
    const [east, west] = apportion(total, [eastShare, 1 - eastShare]);
    for (const [dc_id, on_hand] of [["DC-E", east], ["DC-W", west]]) {
      const open = purchaseOrders.filter((po) => po.style_id === style_id && po.dc_id === dc_id && po.status === "open");
      const dry = dc_id === "DC-E" && DC_E_DRY.styles.includes(style_id);
      out.push({
        dc_id,
        style_id,
        on_hand: dry ? 0 : on_hand,
        on_order: sum(open.map((po) => po.qty_ordered)),
        next_receipt: open.map((po) => po.promised_date).sort()[0] ?? null,
        note: dry ? DC_E_DRY.note : DC_NOTES[style_id] ?? null,
      });
    }
  }
  return out;
}

// ---- purchase orders: promised vs actual lead times --------------------------------

// Northline's last 24 POs are spelled out: the lead-time video's spread lives here.
const NORTHLINE_POS = [
  ...[13, 15, 12, 14, 16, 11, 14, 15, 13, 17, 12, 14].map((lead, i) => ({ order_date: addDays("2025-11-10", 14 * i), style_id: "HOODIE", qty: [1800, 2000, 2400, 2200, 1600, 1400, 1500, 1300, 1200, 1200, 1300, 1200][i], lead })),
  { order_date: "2026-04-27", style_id: "HOODIE", qty: 1200, lead: 14 },
  { order_date: "2026-05-11", style_id: "HOODIE", qty: 1100, lead: 9 },
  { order_date: "2026-05-25", style_id: "HOODIE", qty: 1200, lead: 16 },
  { order_date: "2026-06-08", style_id: "KNIT-BEANIE", qty: 1400, lead: 12 },
  { order_date: "2026-06-22", style_id: "MERINO-CREW", qty: 1500, lead: 21 },
  { order_date: "2026-07-06", style_id: "HOODIE", qty: 1300, lead: 14 },
  { order_date: "2026-07-20", style_id: "HOODIE", qty: 1400, lead: 13 },
  { order_date: "2026-08-03", style_id: "HOODIE", qty: 1500, lead: 27, po_no: 4471 },
  { order_date: "2026-08-17", style_id: "PROMO-HOODIE", qty: 3000, lead: 11 },
  { order_date: "2026-08-31", style_id: "HOODIE", qty: 3200, lead: 15 },
  { order_date: "2026-09-14", style_id: "FAIRISLE", qty: 2880, lead: 23 },
  { order_date: "2026-09-28", style_id: "HOODIE", qty: 600, lead: 19 },
  { order_date: "2026-10-05", style_id: "HOODIE", qty: 1800, lead: null },
  { order_date: "2026-10-12", style_id: "MERINO-CREW", qty: 600, lead: null },
];

const VENDOR_LEAD = {
  SOLA: (r) => r.int(9, 12),
  BALTIC: (r) => r.int(13, 15),
  KORA: (r, orderDate) => (orderDate >= "2026-08-20" ? r.int(26, 35) : r.int(20, 24)),
  RIDGEWAY: (r) => r.int(33, 42),
  MARIGOLD: (r) => r.int(38, 55),
  CALDER: (r) => r.int(44, 50),
};
const VENDOR_CADENCE = { SOLA: 14, BALTIC: 21, KORA: 21, RIDGEWAY: 21, MARIGOLD: 21, CALDER: 21 };

function buildPurchaseOrders() {
  const pos = [];
  const roundCase = (q, p) => Math.max(p.case_pack, Math.round(q / p.case_pack) * p.case_pack);

  for (const v of VENDORS) {
    const vendorStyles = PRODUCTS.filter((p) => p.vendor_id === v.vendor_id);
    if (v.vendor_id === "NORTHLINE") {
      NORTHLINE_POS.forEach((x) => pos.push({ vendor_id: v.vendor_id, ...x, promised: v.promised_lead_days }));
      continue;
    }
    const r = rng(hashSeed("po", v.vendor_id));
    let k = 0;
    for (let d = addDays("2025-10-20", r.int(0, 6)); d <= AS_OF; d = addDays(d, VENDOR_CADENCE[v.vendor_id])) {
      // order whatever this vendor makes that will be selling when it lands
      const landing = addDays(d, v.promised_lead_days);
      const live = vendorStyles.filter((p) => p.base > 0 && p.launch_date <= addDays(landing, 30) && (!p.end_date || p.end_date >= landing));
      if (!live.length) continue;
      const p = live[k % live.length];
      k += 1;
      const weekly = p.base * STORES.length * 0.95;
      const qty = roundCase(Math.max(v.moq, weekly * (VENDOR_CADENCE[v.vendor_id] / 7) * live.length * r.lognormal(0.15)), p);
      pos.push({ vendor_id: v.vendor_id, order_date: d, style_id: p.style_id, qty, lead: VENDOR_LEAD[v.vendor_id](r, d), promised: v.promised_lead_days });
    }
  }

  // number POs in date order, anchored so the hoodie PO from the video is PO 4471
  pos.sort((a, b) => (a.order_date === b.order_date ? a.vendor_id.localeCompare(b.vendor_id) : a.order_date.localeCompare(b.order_date)));
  const anchor = pos.findIndex((x) => x.po_no === 4471);
  const fill = Object.fromEntries(VENDORS.map((v) => [v.vendor_id, v.fill_rate]));

  const out = pos.map((x, i) => {
    const r = rng(hashSeed("fill", x.vendor_id, x.order_date));
    const received = x.lead != null ? addDays(x.order_date, x.lead) : null;
    const done = received && received < AS_OF;
    return {
      po_no: 4471 + (i - anchor),
      vendor_id: x.vendor_id,
      style_id: x.style_id,
      dc_id: i % 5 < 3 ? "DC-E" : "DC-W",
      qty_ordered: x.qty,
      qty_received: done ? Math.round(x.qty * Math.min(1, fill[x.vendor_id] + r.between(-0.03, 0.03))) : null,
      order_date: x.order_date,
      promised_date: addDays(x.order_date, x.promised),
      received_date: done ? received : null,
      status: done ? "received" : "open",
    };
  });

  // the bullwhip video's draft PO, built from store orders and waiting for approval
  out.push({
    po_no: out[out.length - 1].po_no + 1,
    vendor_id: "NORTHLINE",
    style_id: "HOODIE",
    dc_id: "DC-E",
    qty_ordered: 3080,
    qty_received: null,
    order_date: AS_OF,
    promised_date: addDays(AS_OF, 14),
    received_date: null,
    status: "draft",
  });

  // the cross-dock video's truck: one PO per style, numbered after the draft so the
  // earlier videos' PO numbers stay put
  const sola = VENDORS.find((v) => v.vendor_id === SOLA_TRUCK.vendor_id);
  for (const [style_id, qty] of SOLA_TRUCK.lines) {
    out.push({
      po_no: out[out.length - 1].po_no + 1,
      vendor_id: SOLA_TRUCK.vendor_id,
      style_id,
      dc_id: SOLA_TRUCK.dc_id,
      qty_ordered: qty,
      qty_received: null,
      order_date: SOLA_TRUCK.order_date,
      promised_date: addDays(SOLA_TRUCK.order_date, sola.promised_lead_days),
      received_date: null,
      status: "open",
    });
  }

  // ship notices for everything landing this week, before the next allocation run: the
  // Sola truck, plus any open PO whose (already drawn) arrival date falls in the window
  const arrives = new Map(pos.map((x, i) => [out[i].po_no, x.lead != null ? addDays(x.order_date, x.lead) : NORTHLINE_ETA[x.style_id] && x.order_date >= "2026-10-01" ? NORTHLINE_ETA[x.style_id] : null]));
  const caseOf = (id) => PRODUCT[id].case_pack;
  const asnLines = SOLA_TRUCK.lines.map(([style_id, units], i) => ({
    asn_no: SOLA_TRUCK.asn_no,
    line_no: i + 1,
    vendor_id: SOLA_TRUCK.vendor_id,
    po_no: out.find((po) => po.style_id === style_id && po.order_date === SOLA_TRUCK.order_date).po_no,
    style_id,
    dc_id: SOLA_TRUCK.dc_id,
    units,
    cartons: units / caseOf(style_id),
    shipped_on: SOLA_TRUCK.shipped_on,
    eta: SOLA_TRUCK.eta,
    carrier: SOLA_TRUCK.carrier,
  }));
  const MODE = Object.fromEntries(VENDORS.map((v) => [v.vendor_id, v.ship_mode]));
  out
    .filter((po) => po.status === "open" && arrives.get(po.po_no) && arrives.get(po.po_no) >= AS_OF && arrives.get(po.po_no) <= addDays(AS_OF, 5))
    .sort((a, b) => arrives.get(a.po_no).localeCompare(arrives.get(b.po_no)) || a.po_no - b.po_no)
    .forEach((po, i) => {
      const units = Math.round(po.qty_ordered * FILL_SHIPPED[po.vendor_id]);
      const shipped = Math.max(caseOf(po.style_id), Math.round(units / caseOf(po.style_id)) * caseOf(po.style_id));
      asnLines.push({
        asn_no: SOLA_TRUCK.asn_no + 1 + i,
        line_no: 1,
        vendor_id: po.vendor_id,
        po_no: po.po_no,
        style_id: po.style_id,
        dc_id: po.dc_id,
        units: shipped,
        cartons: shipped / caseOf(po.style_id),
        shipped_on: addDays(arrives.get(po.po_no), MODE[po.vendor_id] === "truck" ? -2 : -4),
        eta: arrives.get(po.po_no),
        carrier: MODE[po.vendor_id] === "truck" ? "Truckload" : "Container from port, by rail",
      });
    });
  return { purchaseOrders: out, asnLines };
}

// what each vendor actually loads against a PO (its fill rate, rounded to case packs)
const FILL_SHIPPED = Object.fromEntries(VENDORS.map((v) => [v.vendor_id, v.fill_rate]));

// chain-level weekly flow for the bullwhip view: shopper sales vs store orders vs DC orders
function buildReplenWeekly(salesWeekly, purchaseOrders) {
  const out = [];
  for (const style_id of ["HOODIE", "CREW-TEE"]) {
    const r = rng(hashSeed("replen", style_id));
    WEEKS.forEach((weekStart, wi) => {
      const pos = sum(salesWeekly.filter((x) => x.style_id === style_id && x.week_start === weekStart).map((x) => x.units));
      const k = wi - (WEEKS.length - 12);
      const ratio = style_id === "HOODIE" && k >= 0 ? HOODIE_ORDER_IDX[k] / HOODIE_POS_IDX[k] : r.between(0.96, 1.04);
      const weekEnd = addDays(weekStart, 6);
      const dcOrders = sum(purchaseOrders.filter((po) => po.style_id === style_id && po.status !== "draft" && po.order_date >= weekStart && po.order_date <= weekEnd).map((po) => po.qty_ordered));
      out.push({ style_id, week_start: weekStart, pos_units: pos, store_order_units: Math.round(pos * ratio), dc_order_units: dcOrders });
    });
  }
  return out;
}

let cached;

export function generateDataset() {
  if (cached) return cached;
  const { salesWeekly, storeInventory, salesDaily } = buildSalesAndPositions();
  const { purchaseOrders, asnLines } = buildPurchaseOrders();
  cached = {
    meta: { ...RETAILER, data_version: DATA_VERSION, history_weeks: WEEKS.length, history_from: WEEKS[0], history_to: addDays(LAST_WEEK, 6) },
    dcs: DCS,
    stores: STORES,
    vendors: VENDORS,
    products: PRODUCTS.map(({ base, climate, curve, ...p }) => ({ ...p, sizes: SIZE_GROUPS[p.size_group] })),
    promotions: PROMOTIONS,
    salesWeekly,
    salesDaily,
    sizeSales: buildSizeSales(salesWeekly),
    storeInventory,
    dcInventory: buildDcInventory(purchaseOrders),
    purchaseOrders,
    asnLines,
    articles: ARTICLES,
    replenWeekly: buildReplenWeekly(salesWeekly, purchaseOrders),
  };
  return cached;
}
