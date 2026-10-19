// Video: "Size curves". Compare every store's size mix with the chain's, decide which
// curve each store should be allocated on, reshape an allocation, and flag stores
// whose core sizes have already broken.
import { SCENARIOS } from "../reference.js";
import { sum, round, apportion } from "../stats.js";
import { byKey, openStores } from "./util.js";

export const meta = {
  id: "size-curves",
  title: "Store-level size curves",
  video: "linkedin_size_curve_video",
  question: "Which stores don't fit the chain's size curve, and what should they get instead?",
};

const MIN_UNITS = 40; // below this, a store's own mix is mostly noise
const SKEW = 0.1; // total-variation distance from the chain curve that counts as "different"

const normalize = (v) => {
  const s = sum(v);
  return s ? v.map((x) => x / s) : v.map(() => 0);
};

export async function run(src, params = {}) {
  const cfg = { ...SCENARIOS.sizeCurves, ...params };
  const products = byKey(await src.get("products"), "style_id");
  const p = products[cfg.style];
  if (!p) throw new Error(`Unknown style ${cfg.style}`);
  const [stores, sizeRows, inv] = await Promise.all([
    src.get("stores"),
    src.get("sizeSales", { styles: [cfg.style] }),
    src.get("storeInventory", { styles: [cfg.style] }),
  ]);
  const sizes = p.sizes;
  const live = openStores(stores);
  const mix = (store_no) => sizes.map((sz) => sizeRows.find((r) => r.store_no === store_no && r.size === sz)?.units_13w ?? 0);

  const chainUnits = sizes.map((sz) => sum(sizeRows.filter((r) => r.size === sz).map((r) => r.units_13w)));
  const chain = normalize(chainUnits);

  const rows = live.map((s) => {
    const units = mix(s.store_no);
    const total = sum(units);
    const curve = normalize(units);
    const distance = 0.5 * sum(curve.map((c, i) => Math.abs(c - chain[i])));
    const over = sizes.filter((_, i) => curve[i] - chain[i] >= 0.04);
    let method = "chain";
    let reason = "Matches the chain curve";
    if (total < MIN_UNITS) {
      method = "cluster";
      reason = `Too little history (${total} units in 13 weeks)`;
    } else if (distance > SKEW) {
      method = "own";
      reason = over.length ? `Skews to ${over.join(" and ")}` : "Own size mix";
    }
    return { store_no: s.store_no, name: s.name, region: s.region, total_13w: total, curve: curve.map((c) => round(c, 3)), distance: round(distance, 3), method, reason };
  });

  // stores without enough history borrow their region's curve
  const regionCurve = (region) => {
    const peers = rows.filter((r) => r.region === region && r.total_13w >= MIN_UNITS);
    return peers.length ? normalize(sizes.map((_, i) => sum(peers.map((r) => r.curve[i] * r.total_13w)))) : chain;
  };
  for (const r of rows) if (r.method === "cluster") r.cluster_curve = regionCurve(r.region).map((c) => round(c, 3));

  // reshape one allocation for the focus store
  const focus = rows.find((r) => r.store_no === Number(cfg.store)) ?? rows[0];
  const target = focus.method === "own" ? focus.curve : focus.method === "cluster" ? focus.cluster_curve : chain;
  const units = Number(cfg.allocateUnits);
  const chainSplit = apportion(units, chain);
  const storeSplit = apportion(units, target);
  const demandSplit = apportion(units, focus.total_13w >= MIN_UNITS ? focus.curve : target);

  // stores already broken: decent stock overall, but a core size at zero
  const core = sizes.slice(1, 3);
  const broken = inv
    .filter((r) => r.by_size && sum(Object.values(r.by_size)) >= 20 && core.some((sz) => r.by_size[sz] === 0))
    .map((r) => ({ store_no: r.store_no, name: live.find((s) => s.store_no === r.store_no)?.name, on_hand: sum(Object.values(r.by_size)), by_size: r.by_size, missing: core.filter((sz) => r.by_size[sz] === 0) }));

  return {
    focus: { style_id: p.style_id, name: p.name, sizes, store_no: focus.store_no, allocate_units: units },
    kpis: [
      { label: "Stores on the chain curve", value: rows.filter((r) => r.method === "chain").length },
      { label: "Need their own curve", value: rows.filter((r) => r.method === "own").length },
      { label: "Borrow a cluster curve", value: rows.filter((r) => r.method === "cluster").length },
      { label: "Broken sizes today", value: broken.length },
    ],
    chain_curve: chain.map((c) => round(c, 3)),
    stores: rows.sort((a, b) => b.distance - a.distance),
    reshape: {
      store_no: focus.store_no,
      name: focus.name,
      method: focus.method,
      by_size: sizes.map((sz, i) => ({ size: sz, chain_ratio: chainSplit[i], store_curve: storeSplit[i], demand: demandSplit[i], gap_if_chain: chainSplit[i] - demandSplit[i] })),
    },
    broken_sizes: broken,
  };
}
