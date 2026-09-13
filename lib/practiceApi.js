import { FIXTURE_QUESTIONS, getFixtureQuestion } from "./practiceFixtures";

// Same-origin Next.js API routes (app/api/practice/*), backed by Supabase Postgres.
async function request(path, options) {
  const res = await fetch(`/api/practice${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Practice API ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

// Falls back to the bundled fixture question bank whenever the DB/API isn't
// reachable (e.g. DATABASE_URL not configured yet), so the practice UI still
// works standalone.
export async function listQuestions(category) {
  try {
    const qs = category ? `?category=${encodeURIComponent(category)}` : "";
    return await request(`/questions${qs}`);
  } catch {
    return category ? FIXTURE_QUESTIONS.filter((q) => q.category === category) : FIXTURE_QUESTIONS;
  }
}

export async function getQuestion(slug) {
  try {
    return await request(`/questions/${encodeURIComponent(slug)}`);
  } catch {
    const fallback = getFixtureQuestion(slug);
    if (!fallback) throw new Error("Question not found");
    return fallback;
  }
}
