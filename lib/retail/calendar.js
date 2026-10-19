// The demo world is frozen at one "today" so every page tells the same story.
export const AS_OF = "2026-10-19"; // a Monday; sales history runs through Sunday 2026-10-18
export const HISTORY_WEEKS = 26; // weekly history: 2026-04-20 .. 2026-10-12 (week starts)

const DAY = 86400000;
export const toDate = (isoDate) => new Date(`${isoDate}T00:00:00Z`);
export const iso = (d) => d.toISOString().slice(0, 10);
export const addDays = (isoDate, n) => iso(new Date(toDate(isoDate).getTime() + n * DAY));
export const daysBetween = (from, to) => Math.round((toDate(to) - toDate(from)) / DAY);
export const pretty = (isoDate) => toDate(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
export const weekday = (isoDate) => toDate(isoDate).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });

// Monday week starts, oldest first.
export const weekStarts = () =>
  Array.from({ length: HISTORY_WEEKS }, (_, i) => addDays(AS_OF, -7 * (HISTORY_WEEKS - i)));
