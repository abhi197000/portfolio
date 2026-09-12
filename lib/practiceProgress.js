// Client-only progress tracking for the practice journey. Per-browser via
// localStorage — there's no login, so "your progress" means "this browser's
// progress." Good enough for a self-paced practice tool.

const COMPLETED_KEY = "practice_completed_v1";
const TEST_SCORE_KEY = "practice_last_test_score_v1";

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
