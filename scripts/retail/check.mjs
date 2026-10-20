// Run with: node scripts/retail/check.mjs
//
// Runs every retail use case against the generated dataset (no Supabase needed)
// and checks that each video's story actually shows up in the numbers.
import assert from "node:assert/strict";
import { generateDataset } from "../../lib/retail/generate.js";
import { runUseCase, useCases } from "../../lib/retail/engine/index.js";
import { runPlanner } from "../../lib/retail/planner.js";

const ds = generateDataset();
const source = { kind: "generated", meta: async () => ds.meta, get: async (name, f = {}) => ds[name].filter((r) => (!f.styles || f.styles.includes(r.style_id)) && (!f.vendors || f.vendors.includes(r.vendor_id))) };
const run = (id, params) => runUseCase(id, source, params);
const fmt = (k) => `${k.label}: ${typeof k.value === "number" && k.format?.startsWith("pct") ? `${(k.value * 100).toFixed(1)}%` : k.value}`;

const results = {};
for (const uc of useCases()) {
  results[uc.id] = await run(uc.id);
  console.log(`\n■ ${uc.title}\n  ${results[uc.id].kpis.map(fmt).join(" · ")}`);
}

const checks = [];
const check = (name, fn) => {
  try {
    fn();
    checks.push(`✓ ${name}`);
  } catch (err) {
    checks.push(`✗ ${name}: ${err.message}`);
  }
};

const ov = results["agentic-overview"];
check("Store 14 runs out of crew tees before Saturday's truck", () => {
  const s = ov.stockouts.find((x) => x.store_no === 14 && x.style_id === "CREW-TEE");
  assert.ok(s, "no stockout flagged");
  assert.equal(s.runs_out_day, "Thu");
  assert.equal(s.next_delivery_day, "Sat");
});
check("…and Evanston's spare tees are a transfer worth making", () => {
  const t = ov.transfers.find((x) => x.to_store === 14 && x.style === "Core crew tee");
  assert.ok(t?.recommended, "transfer not recommended");
  assert.equal(t.from_store, 19);
});
check("Printed shirt is truly dead; merino is slow but healthy", () => {
  assert.equal(ov.excess.find((x) => x.style_id === "PRINT-SHIRT")?.verdict, "truly_dead");
  const merino = ov.excess.find((x) => x.style_id === "MERINO-CREW");
  if (merino) assert.equal(merino.verdict, "slow_but_healthy");
});

const aps = results["avg-per-store"];
const method = (id) => aps.items.find((i) => i.style_id === id)?.method;
check("Forecast for steady core items, average per store for the rest", () => {
  assert.equal(method("CREW-TEE"), "forecast");
  assert.equal(method("SLIM-DENIM"), "forecast");
  assert.equal(method("FAIRISLE"), "avg_per_store");
  assert.equal(method("COLLAB-SNKR"), "avg_per_store");
  assert.equal(method("LINEN-SHIRT"), "avg_per_store");
});

const sc = results["size-curves"];
const curveOf = (n) => sc.stores.find((s) => s.store_no === n)?.method;
check("Size curves: Ann Arbor and Plano get their own, Century City the chain's, Raleigh a cluster", () => {
  assert.equal(curveOf(27), "own");
  assert.equal(curveOf(41), "own");
  assert.equal(curveOf(12), "chain");
  assert.equal(curveOf(58), "cluster");
  assert.ok(sc.broken_sizes.some((b) => b.store_no === 14), "Store 14 broken sizes not flagged");
});

const fp = results["fixed-push"];
check("Fixed push: Denver's zero is flagged as censored, and Denver earns reserve", () => {
  assert.ok(fp.censored_demand.some((c) => c.store_no === 31));
  assert.ok(fp.release.stores.some((r) => r.store_no === 31 && r.was_zero_demand));
  assert.ok(!fp.release.stores.some((r) => r.store_no === 58), "Raleigh shouldn't get reserve");
});

const sd = results["store-depth"];
check("Store depth sends nothing past target; fixed push overshoots", () => {
  assert.ok(sd.kpis.find((k) => k.label.startsWith("Fixed push: sent past")).value > 0);
  const raleigh = sd.comparison.find((r) => r.store_no === 58);
  assert.equal(raleigh.depth_send, 0);
  assert.equal(sd.staleness.find((s) => s.store_no === 14).status, "too_shallow");
  assert.equal(sd.staleness.find((s) => s.store_no === 47).status, "too_deep");
});
check("Method flags: chino → depth, campaign hoodie → push", () => {
  const m = Object.fromEntries(sd.methods.map((x) => [x.style_id, x]));
  assert.equal(m["CHINO-KHK"].recommended, "depth");
  assert.equal(m["PROMO-HOODIE"].recommended, "push");
  assert.equal(m["PARKA"].recommended, "push");
});

const eos = results["end-of-season"];
check("End of season: coat flushes, black chino holds, printed shirt goes off-price", () => {
  const a = Object.fromEntries(eos.items.map((i) => [i.style_id, i.best]));
  assert.equal(a["WOOL-COAT"], "flush");
  assert.equal(a["CHINO-BLK"], "hold");
  assert.equal(a["PRINT-SHIRT"], "off_price");
  const mix = eos.policies.find((p) => p.id === "agent_mix");
  assert.ok(eos.policies.every((p) => p.recovery <= mix.recovery), "a single rule beats the mix");
});

const bw = results["bullwhip"];
check("Bullwhip: store orders swing harder than shoppers, and the draft PO is trimmed", () => {
  assert.ok(bw.variability.store_orders > 2 * bw.variability.shoppers);
  assert.ok(bw.variability.dc_orders > bw.variability.store_orders);
  assert.ok(bw.po_check.delta < 0, "draft PO not trimmed");
});

const lt = results["lead-time"];
check("Lead time: Northline drifting with a 9–27 day spread; Baltic tight", () => {
  const v = Object.fromEntries(lt.vendors.map((x) => [x.vendor_id, x]));
  assert.equal(v.NORTHLINE.status, "drifting");
  assert.equal(v.NORTHLINE.min, 9);
  assert.equal(v.NORTHLINE.max, 27);
  assert.equal(v.BALTIC.status, "ok");
  assert.ok(v.NORTHLINE.buffer_days > v.BALTIC.buffer_days);
  assert.equal(lt.stockout_example.po_no, 4471);
});

const xd = results["cross-dock"];
check("Cross-dock: Sola's truck sends white tees and socks straight out, oxfords and polos to reserve", () => {
  const l = Object.fromEntries(xd.lines.map((x) => [x.style_id, x]));
  assert.equal(l["WHITE-TEE"].decision, "cross_dock");
  assert.equal(l["SOCKS-3PK"].decision, "cross_dock");
  assert.ok(["top_up", "put_away"].includes(l.OXFORD.decision));
  assert.ok(["top_up", "put_away"].includes(l["POLO-TEE"].decision));
});
check("…Store 14's socks land Oct 24 instead of Oct 31, and dock-to-store drops by 9+ days", () => {
  assert.equal(xd.hero.store_no, 14);
  assert.equal(xd.hero.style_id, "SOCKS-3PK");
  assert.equal(xd.hero.via_cross_dock, "2026-10-24");
  assert.equal(xd.hero.via_put_away, "2026-10-31");
  assert.ok(xd.totals.dock_to_store_put_away - xd.totals.dock_to_store_cross_dock >= 9);
});
check("Overview offers Monday's truck for Store 14's socks", () => {
  const s = ov.stockouts.find((x) => x.store_no === 14 && x.style_id === "SOCKS-3PK");
  assert.ok(s?.options.some((o) => o.includes("ASN 30418")), "no cross-dock option");
});

const pl = await runPlanner(source);
const tag = (id) => pl.articles.find((a) => a.article_id === id)?.action;
check("Planner: 56 articles, each with a tag, evidence and the rule that fired", () => {
  assert.equal(pl.articles.length, 56);
  assert.ok(pl.articles.every((a) => a.action && a.why && a.evidence.length && a.rule));
  assert.ok(pl.summary.need_action >= 30 && pl.summary.on_track >= 10, `${pl.summary.need_action} need action, ${pl.summary.on_track} on track`);
});
check("…the videos' cases land on their articles", () => {
  assert.equal(tag("WHITE-TEE-WHI"), "cross_dock");
  assert.equal(tag("HOODIE-CHA"), "trim_po");
  assert.equal(tag("CHINO-KHK-KHA"), "store_depth");
  assert.equal(tag("WOOL-COAT-CAM"), "flush");
  assert.equal(tag("CHINO-BLK-BLA"), "hold");
  assert.equal(tag("PRINT-SHIRT-PAI"), "off_price");
  assert.equal(tag("FAIRISLE-CRERED"), "avg_per_store");
  assert.equal(tag("PARKA-BLA"), "fixed_push");
  assert.equal(tag("CREW-TEE-NAV"), "transfer");
});
check("…and colors diverge: a rising color is chased, fading ones marked down", () => {
  assert.equal(tag("CREW-TEE-FOR"), "chase");
  assert.equal(tag("CREW-TEE-BLA"), "markdown");
  assert.equal(tag("POLO-TEE-COR"), "markdown");
  assert.notEqual(tag("POLO-TEE-WHI"), "markdown");
});

console.log(`\n${checks.join("\n")}`);
const failed = checks.filter((c) => c.startsWith("✗")).length;
console.log(`\n${checks.length - failed}/${checks.length} story checks pass`);
process.exitCode = failed ? 1 : 0;
