import { NextResponse } from "next/server";
import { getSource } from "../../../lib/retail/source";
import { useCases } from "../../../lib/retail/engine";

// Catalog of the retail demo: who the (fictional) retailer is, where the data is
// coming from, and the use cases that can be run against it.
export async function GET() {
  try {
    const source = await getSource();
    const [meta, stores, products, vendors] = await Promise.all([source.meta(), source.get("stores"), source.get("products"), source.get("vendors")]);
    return NextResponse.json({
      retailer: meta,
      source: source.kind,
      counts: { stores: stores.length, products: products.length, vendors: vendors.length },
      use_cases: useCases(),
    });
  } catch (err) {
    console.error("GET /api/retail failed:", err.message);
    return NextResponse.json({ error: "Retail demo unavailable" }, { status: 503 });
  }
}
