// Client-only progress tracking for the practice journey. Per-browser via
// localStorage — there's no login, so "your progress" means "this browser's
// progress." Good enough for a self-paced practice tool.

const COMPLETED_KEY = "practice_completed_v1";
const TEST_SCORE_KEY = "practice_last_test_score_v1";
const ACTIVITY_KEY = "practice_activity_v1";

function localDate(d = new Date()) {
  // YYYY-MM-DD in the browser's own timezone (a "day" should mean the user's day).
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

function readSet(key) {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function getCompletedSlugs() {
  return readSet(COMPLETED_KEY);
}

export function markCompleted(slug) {
  if (typeof window === "undefined") return;
  const set = getCompletedSlugs();
  set.add(slug);
  try {
    localStorage.setItem(COMPLETED_KEY, JSON.stringify([...set]));
  } catch {
    // localStorage can throw in private-browsing contexts — non-fatal, progress just won't persist.
  }
}

export function isJourneyComplete(allSlugs) {
  if (!allSlugs.length) return false;
  const completed = getCompletedSlugs();
  return allSlugs.every((slug) => completed.has(slug));
}

export function getLastTestScore() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TEST_SCORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLastTestScore(summary) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TEST_SCORE_KEY, JSON.stringify(summary));
  } catch {
    // non-fatal
  }
}

// ---- Daily practice streak ("practice 10 a day", not "apply to 100 jobs a day") ----

function readActivity() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Call on every attempt (run in practice mode). Rolls the streak forward on a
// new day, resets it if a day was skipped, and counts today's attempts.
export function recordPracticeActivity() {
  if (typeof window === "undefined") return;
  const today = localDate();
  const state = readActivity() || { lastDate: null, current: 0, longest: 0, days: {} };

  if (state.lastDate === today) {
    // already active today — just bump today's count
  } else if (state.lastDate && daysBetween(state.lastDate, today) === 1) {
    state.current += 1; // consecutive day
  } else {
    state.current = 1; // first ever, or a gap broke the streak
  }
  state.lastDate = today;
  state.longest = Math.max(state.longest || 0, state.current);
  state.days = state.days || {};
  state.days[today] = (state.days[today] || 0) + 1;

  // keep the activity map bounded (last ~120 days)
  const keys = Object.keys(state.days).sort();
  if (keys.length > 120) {
    for (const k of keys.slice(0, keys.length - 120)) delete state.days[k];
  }

  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(state));
  } catch {
    // non-fatal
  }
}

export function getStreak() {
  const state = readActivity();
  if (!state) return { current: 0, longest: 0, todayCount: 0, lastDate: null, days: {} };
  const today = localDate();
  // The stored `current` is only still "alive" if the last active day was today
  // or yesterday; otherwise the streak has lapsed (longest is preserved).
  const gap = state.lastDate ? daysBetween(state.lastDate, today) : Infinity;
  const current = gap <= 1 ? state.current : 0;
  return {
    current,
    longest: state.longest || 0,
    todayCount: state.lastDate === today ? state.days?.[today] || 0 : 0,
    lastDate: state.lastDate,
    days: state.days || {},
  };
}

// A small, stable-per-day rotation of questions: unfinished cases first (that's
// where progress lives), then already-cleared ones for review — up to `n`.
export function getTodaySet(allQuestions, n = 10) {
  if (!allQuestions?.length) return [];
  const completed = getCompletedSlugs();
  const pending = allQuestions.filter((q) => !completed.has(q.slug));
  const review = allQuestions.filter((q) => completed.has(q.slug));

  // rotate the review pool by day so a fully-cleared bank still varies daily
  const dayIndex = Math.floor(Date.parse(localDate()) / 86400000);
  const rotatedReview = review.map((_, i) => review[(i + dayIndex) % review.length]);

  return [...pending, ...rotatedReview].slice(0, n);
}
