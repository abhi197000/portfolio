// Deterministic "today's tasks": the same 3 SQL + 3 Python for everyone on a
// given (UTC) day, rotating through the bank day over day. UTC keeps it in step
// with the daily_completions.completed_on default (also UTC).

export function utcDate(d = new Date()) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function dayIndex(dateStr) {
  return Math.floor(Date.parse(dateStr) / 86400000);
}

function takeWindow(pool, start, n) {
  if (!pool.length) return [];
  const count = Math.min(n, pool.length);
  return Array.from({ length: count }, (_, i) => pool[(start + i) % pool.length]);
}

export function pickDailyTasks(questions, { date = utcDate(), perCategory = 3 } = {}) {
  const sql = questions.filter((q) => q.category === "sql");
  const python = questions.filter((q) => q.category === "python");
  const idx = dayIndex(date);
  return {
    sql: takeWindow(sql, (idx * perCategory) % (sql.length || 1), perCategory),
    python: takeWindow(python, (idx * perCategory) % (python.length || 1), perCategory),
  };
}

// current/longest consecutive-day streak from a set of active-day strings.
export function computeStreak(activeDates, today = utcDate()) {
  const set = new Set(activeDates);
  const dayMs = 86400000;

  // current: walk back from today (or yesterday if today isn't done yet).
  let cursor = Date.parse(today);
  let current = 0;
  if (!set.has(today)) cursor -= dayMs; // grace: streak still alive if yesterday counts
  while (set.has(new Date(cursor).toISOString().slice(0, 10))) {
    current += 1;
    cursor -= dayMs;
  }

  // longest: sort and scan.
  const sorted = [...set].sort();
  let longest = 0;
  let run = 0;
  let prev = null;
  for (const d of sorted) {
    if (prev !== null && Date.parse(d) - Date.parse(prev) === dayMs) run += 1;
    else run = 1;
    longest = Math.max(longest, run);
    prev = d;
  }

  return { current, longest };
}
