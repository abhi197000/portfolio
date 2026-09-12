import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/supabaseClient";

// Per-session attempt history for the "My Story" view. The public anon key still
// has NO SELECT on `submissions` (see db/schema.sql) — this reads server-side
// with the service_role key, scoped to the one session_id in the path. If that
// key isn't configured yet, we return 501 and the UI falls back to local stats.
export async function GET(_request, { params }) {
  const { sessionId } = await params;
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session id" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Submission history is not enabled (SUPABASE_SERVICE_ROLE_KEY not set)" },
      { status: 501 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("submissions")
      .select("passed, mode, submitted_at, language, questions(slug, title, category)")
      .eq("session_id", sessionId)
      .order("submitted_at", { ascending: true });
    if (error) throw error;

    const rows = data || [];
    const totalAttempts = rows.length;
    const passedAttempts = rows.filter((r) => r.passed).length;

    // Per-question rollup keyed by slug (earliest attempt = first try).
    const byQuestion = new Map();
    for (const r of rows) {
      const q = r.questions || {};
      const slug = q.slug || "unknown";
      let entry = byQuestion.get(slug);
      if (!entry) {
        entry = {
          slug,
          title: q.title || slug,
          category: q.category || r.language,
          attempts: 0,
          passed: false,
          firstTryPassed: false,
          firstSeen: r.submitted_at,
        };
        byQuestion.set(slug, entry);
      }
      if (entry.attempts === 0) entry.firstTryPassed = !!r.passed;
      entry.attempts += 1;
      if (r.passed) entry.passed = true;
    }
    const questions = [...byQuestion.values()];
    const distinctAttempted = questions.length;
    const distinctSolved = questions.filter((q) => q.passed).length;
    const firstTryPasses = questions.filter((q) => q.firstTryPassed).length;

    // Daily attempt counts (for a simple activity view).
    const byDay = {};
    for (const r of rows) {
      const day = (r.submitted_at || "").slice(0, 10);
      if (day) byDay[day] = (byDay[day] || 0) + 1;
    }

    const struggles = questions
      .filter((q) => q.attempts > 1)
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 5);

    return NextResponse.json({
      totalAttempts,
      passedAttempts,
      distinctAttempted,
      distinctSolved,
      firstTryRate: distinctAttempted ? Math.round((firstTryPasses / distinctAttempted) * 100) : 0,
      byDay,
      struggles,
    });
  } catch (err) {
    console.error("GET /api/practice/submissions/[sessionId] failed:", err.message);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
