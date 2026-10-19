import { NextResponse } from "next/server";
import { getSource } from "../../../../lib/retail/source";
import { runUseCase } from "../../../../lib/retail/engine";

// Query params override a use case's defaults, e.g.
//   /api/retail/size-curves?style=CREW-TEE&store=41
//   /api/retail/fixed-push?pushPct=0.5
//   /api/retail/avg-per-store?styles=FAIRISLE,HOODIE
function parseParams(searchParams) {
  const params = {};
  for (const [key, raw] of searchParams) {
    if (key === "styles" || key === "methodStyles") params[key] = raw.split(",").map((s) => s.trim()).filter(Boolean);
    else if (raw !== "" && !Number.isNaN(Number(raw))) params[key] = Number(raw);
    else params[key] = raw;
  }
  return params;
}

export async function GET(request, { params }) {
  const { useCase } = await params;
  try {
    const source = await getSource();
    const result = await runUseCase(useCase, source, parseParams(request.nextUrl.searchParams));
    if (!result) return NextResponse.json({ error: `Unknown use case: ${useCase}` }, { status: 404 });
    return NextResponse.json(result);
  } catch (err) {
    console.error(`GET /api/retail/${useCase} failed:`, err.message);
    const status = /^Unknown style|^No replenishment/.test(err.message) ? 400 : 503;
    return NextResponse.json({ error: status === 400 ? err.message : "Retail demo unavailable" }, { status });
  }
}
