// The module's single source of truth for practice progress. Everything is
// per-user in Supabase (RLS-scoped to auth.uid()), so streaks, cleared cases
// and certification results follow the user across devices.

import { createClient } from "../supabase/client";
import { computeStreak, utcDate } from "../dailyTasks";

async function ctx() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, userId: user.id };
}

export async function loadProgress() {
  const { supabase } = await ctx();
  const [daily, tests] = await Promise.all([
    supabase.from("daily_completions").select("question_slug, completed_on"),
    supabase
      .from("test_attempts")
      .select("id, total, correct, skipped, score_pct, answers, taken_at")
      .order("taken_at", { ascending: false }),
  ]);
  if (daily.error) throw daily.error;
  if (tests.error) throw tests.error;

  const rows = daily.data || [];
  const today = utcDate();
  const activityByDay = {};
  for (const r of rows) activityByDay[r.completed_on] = (activityByDay[r.completed_on] || 0) + 1;

  return {
    // Any day a slug was passed counts it as cleared for the journey.
    completedSlugs: new Set(rows.map((r) => r.question_slug)),
    todaySlugs: new Set(rows.filter((r) => r.completed_on === today).map((r) => r.question_slug)),
    streak: computeStreak(rows.map((r) => r.completed_on), today),
    activityByDay,
    tests: tests.data || [],
  };
}

export async function recordPass({ slug, category }) {
  const { supabase, userId } = await ctx();
  const { error } = await supabase
    .from("daily_completions")
    .upsert(
      { user_id: userId, question_slug: slug, category, completed_on: utcDate() },
      { onConflict: "user_id,question_slug,completed_on", ignoreDuplicates: true }
    );
  if (error) throw error;
}

// Best-effort attempt log — never blocks the UI.
export async function logAttempt({ slug, category, code, passed, mode = "practice" }) {
  try {
    const { supabase, userId } = await ctx();
    const { data: question } = await supabase.from("questions").select("id").eq("slug", slug).maybeSingle();
    if (!question) return; // bundled fixture question with no DB row
    const { error } = await supabase.from("submissions").insert({
      session_id: userId,
      user_id: userId,
      question_id: question.id,
      language: category,
      code,
      passed,
      mode,
    });
    if (error) throw error;
  } catch (err) {
    console.warn("Could not log attempt:", err.message || err);
  }
}

export async function saveTestAttempt({ total, correct, skipped, answers }) {
  const { supabase, userId } = await ctx();
  const { error } = await supabase.from("test_attempts").insert({
    user_id: userId,
    total,
    correct,
    skipped,
    score_pct: total ? Math.round((correct / total) * 100) : 0,
    answers,
  });
  if (error) throw error;
}

export function summarizeAttempts(rows) {
  const practice = rows.filter((r) => r.mode !== "test");
  const byQuestion = new Map();
  for (const r of practice) {
    const q = r.questions || {};
    const slug = q.slug || "unknown";
    let entry = byQuestion.get(slug);
    if (!entry) {
      entry = { slug, title: q.title || slug, category: q.category || r.language, attempts: 0, passed: false, firstTryPassed: !!r.passed };
      byQuestion.set(slug, entry);
    }
    entry.attempts += 1;
    if (r.passed) entry.passed = true;
  }
  const questions = [...byQuestion.values()];
  const attempted = questions.length;
  return {
    totalAttempts: practice.length,
    distinctSolved: questions.filter((q) => q.passed).length,
    firstTryRate: attempted ? Math.round((questions.filter((q) => q.firstTryPassed).length / attempted) * 100) : 0,
    struggles: questions.filter((q) => q.attempts > 1).sort((a, b) => b.attempts - a.attempts).slice(0, 5),
  };
}

export async function loadAttemptHistory() {
  const { supabase, userId } = await ctx();
  const { data, error } = await supabase
    .from("submissions")
    .select("passed, mode, submitted_at, language, questions(slug, title, category)")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: true });
  if (error) throw error;
  return summarizeAttempts(data || []);
}
