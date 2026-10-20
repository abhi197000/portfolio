import { NextResponse } from "next/server";
import { getSource } from "../../../../lib/retail/source";
import { plannerData } from "../../../../lib/retail/planner";

// One planner's Monday: every article (style-color) tagged with the action it needs
// most, the evidence behind the tag, and the rule that fired.
export async function GET() {
  try {
    return NextResponse.json(await plannerData(await getSource()));
  } catch (err) {
    console.error("GET /api/retail/planner failed:", err.message);
    return NextResponse.json({ error: "Retail demo unavailable" }, { status: 503 });
  }
}
