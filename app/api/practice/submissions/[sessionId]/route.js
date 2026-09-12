import { NextResponse } from "next/server";

// Intentionally disabled: `submissions` has no public SELECT policy (see
// db/schema.sql) — the anon/publishable key can log an attempt but can't read
// anyone's back, including their own. Re-enable by adding a scoped SELECT
// policy (or by using a service_role key server-side only) if per-session
// history becomes a real feature.
export async function GET() {
  return NextResponse.json(
    { error: "Submission history is not available yet" },
    { status: 501 }
  );
}
