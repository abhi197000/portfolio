"use client";
import { useMemo, useRef, useState } from "react";

const DAY = 86400000;
const isoDay = (t) => new Date(t).toISOString().slice(0, 10);

function levelFor(count) {
  if (!count) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

function formatDay(date) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

// Contribution grid: one column per week, Sunday on top, cases solved per UTC
// day (matching daily_completions.completed_on). The table below is the
// accessible twin, so the hover tooltip never gates a value.
export default function ActivityGrid({ activityByDay = {}, weeks = 26 }) {
  const hostRef = useRef(null);
  const [tip, setTip] = useState(null);

  const cells = useMemo(() => {
    const today = Date.parse(isoDay(Date.now()));
    const start = today - new Date(today).getUTCDay() * DAY - (weeks - 1) * 7 * DAY;
    return Array.from({ length: weeks * 7 }, (_, i) => {
      const t = start + i * DAY;
      const date = isoDay(t);
      return { date, count: activityByDay[date] || 0, future: t > today };
    });
  }, [activityByDay, weeks]);

  const activeDays = cells.filter((c) => c.count > 0);
  const solved = activeDays.reduce((sum, c) => sum + c.count, 0);

  function show(event, cell) {
    const host = hostRef.current.getBoundingClientRect();
    const box = event.currentTarget.getBoundingClientRect();
    setTip({ ...cell, x: box.left - host.left + box.width / 2, y: box.top - host.top });
  }

  return (
    <div className="cc-activity" ref={hostRef}>
      <div
        className="cc-activity-grid"
        style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}
        role="img"
        aria-label={`${solved} cases solved across ${activeDays.length} active days in the last ${weeks} weeks`}
        onPointerLeave={() => setTip(null)}
      >
        {cells.map((cell) =>
          cell.future ? (
            <span key={cell.date} className="cc-activity-cell" data-future="" />
          ) : (
            <span
              key={cell.date}
              className="cc-activity-cell"
              data-level={levelFor(cell.count)}
              onPointerEnter={(e) => show(e, cell)}
            />
          )
        )}
      </div>

      {tip && (
        <div className="cc-tip" style={{ left: tip.x, top: tip.y }}>
          <strong>{tip.count} {tip.count === 1 ? "case" : "cases"} solved</strong>
          <span>{formatDay(tip.date)}</span>
        </div>
      )}

      <div className="cc-activity-foot">
        <details className="cc-table-view">
          <summary>View as table</summary>
          {activeDays.length === 0 ? (
            <p className="cc-muted" style={{ margin: "8px 0 0", fontSize: 12.5 }}>No active days yet.</p>
          ) : (
            <table className="cc-mini-table">
              <thead><tr><th>Day</th><th>Cases solved</th></tr></thead>
              <tbody>
                {[...activeDays].reverse().map((c) => (
                  <tr key={c.date}><td>{formatDay(c.date)}</td><td>{c.count}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </details>
        <div className="cc-activity-legend" aria-hidden="true">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((l) => <span key={l} className="cc-activity-cell" data-level={l} />)}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
