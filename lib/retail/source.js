// Where the retail demo reads its data from.
//
// Supabase when the retail tables have been seeded (db/retail-schema.sql + the
// db/retail-seed-*.sql files), otherwise the same dataset generated in memory —
// the generator is deterministic, so both paths return identical numbers and the
// demo works before (or without) the database, like the practice bank's fixtures.
import { generateDataset } from "./generate.js";
import { getSupabase } from "../supabaseClient.js";

export const TABLES = {
  dcs: { table: "retail_dcs", order: ["dc_id"] },
  stores: { table: "retail_stores", order: ["store_no"] },
  vendors: { table: "retail_vendors", order: ["vendor_id"] },
  products: { table: "retail_products", order: ["style_id"] },
  promotions: { table: "retail_promotions", order: ["promo_id"] },
  salesWeekly: { table: "retail_sales_weekly", order: ["style_id", "store_no", "week_start"] },
  salesDaily: { table: "retail_sales_daily", order: ["style_id", "store_no", "day"] },
  sizeSales: { table: "retail_size_sales", order: ["style_id", "store_no", "size"] },
  storeInventory: { table: "retail_store_inventory", order: ["style_id", "store_no"] },
  dcInventory: { table: "retail_dc_inventory", order: ["style_id", "dc_id"] },
  purchaseOrders: { table: "retail_purchase_orders", order: ["po_no"] },
  asnLines: { table: "retail_asn_lines", order: ["asn_no", "line_no"] },
  replenWeekly: { table: "retail_replen_weekly", order: ["style_id", "week_start"] },
};

const applyFilter = (rows, { styles, vendors } = {}) =>
  rows.filter((r) => (!styles || styles.includes(r.style_id)) && (!vendors || vendors.includes(r.vendor_id)));

export function generatedSource() {
  const ds = generateDataset();
  return {
    kind: "generated",
    meta: async () => ds.meta,
    get: async (name, filter) => applyFilter(ds[name], filter),
  };
}

const PAGE = 1000; // PostgREST's default max rows per request

async function fetchAll(sb, name, { styles, vendors } = {}) {
  const { table, order } = TABLES[name];
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    let q = sb.from(table).select("*").range(from, from + PAGE - 1);
    for (const col of order) q = q.order(col, { ascending: true });
    if (styles) q = q.in("style_id", styles);
    if (vendors) q = q.in("vendor_id", vendors);
    const { data, error } = await q;
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
}

async function supabaseSource() {
  const sb = getSupabase();
  const { data, error } = await sb.from("retail_meta").select("value").eq("key", "retailer").maybeSingle();
  if (error || !data) return null; // tables missing or not seeded yet
  const cache = new Map(); // the demo data is static, so one read per instance is enough
  return {
    kind: "supabase",
    meta: async () => data.value,
    get: (name, filter = {}) => {
      const key = `${name}|${filter.styles ?? ""}|${filter.vendors ?? ""}`;
      if (!cache.has(key)) {
        cache.set(key, fetchAll(sb, name, filter).catch((err) => {
          cache.delete(key);
          throw err;
        }));
      }
      return cache.get(key);
    },
  };
}

// "v2" → 2; a seed from before versioning counts as 1
export async function dataVersion(source) {
  const meta = await source.meta();
  return Number(String(meta?.data_version ?? "v1").replace(/D/g, "")) || 1;
}

const TTL = 10 * 60 * 1000;
let current = null;

export async function getSource() {
  if (current && Date.now() - current.at < TTL) return current.source;
  let source = null;
  if (process.env.RETAIL_SOURCE !== "generated") {
    try {
      source = await supabaseSource();
    } catch {
      source = null; // env vars missing or Supabase unreachable
    }
  }
  source ||= generatedSource();
  current = { source, at: Date.now() };
  return source;
}
