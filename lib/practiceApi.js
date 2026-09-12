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

export function submitAttempt({ sessionId, questionSlug, language, code, passed, mode = "practice" }) {
  return request(`/submissions`, {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      question_slug: questionSlug,
      language,
      code,
      passed,
      mode,
    }),
  }).catch((err) => {
    // Submission logging is best-effort — never block the practice UI on it.
    console.warn("Could not log submission:", err.message);
    return null;
  });
}

// Server-computed attempt history for "My Story". Returns null if the history
// endpoint isn't enabled (no service_role key) or is unreachable — callers then
// fall back to local (localStorage) stats.
export async function getSessionHistory(sessionId) {
  try {
    return await request(`/submissions/${encodeURIComponent(sessionId)}`);
  } catch {
    return null;
  }
}

export function getSessionId() {
  if (typeof window === "undefined") return "server";
  const KEY = "practice_session_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
