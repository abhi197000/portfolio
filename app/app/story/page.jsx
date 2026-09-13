"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listQuestions } from "../../../lib/practiceApi";
import { loadAttemptHistory, loadProgress } from "../../../lib/module/progress";

function Stat({ value, label }) {
  return (
    <div>
      <div className="cc-stat-num">{value}</div>
      <div className="cc-stat-label">{label}</div>
    </div>
  );
}

function heatLevel(count) {
  if (!count) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

export default function MyStoryPage() {
  const [questions, setQuestions] = useState([]);
  const [progress, setProgress] = useState(null);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    listQuestions().then(setQuestions);
    loadProgress().then(setProgress).catch((err) => setError(err.message || String(err)));
    loadAttemptHistory().then(setHistory).catch(() => setHistory(null));
  }, []);

  const completed = progress?.completedSlugs || new Set();
  const streak = progress?.streak || { current: 0, longest: 0 };
  const days = Array.from({ length: 30 }, (_, i) => new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10));
  const activeDays = days.filter((d) => progress?.activityByDay?.[d]).length;
  const tests = progress?.tests || [];

  return (
    <main className="cc-main">
      <p className="cc-eyebrow">Profile // Operator log</p>
      <h1 className="cc-hero-greeting">My <span className="cc-neon">Story</span></h1>
      <p className="cc-hero-sub">Proof that showing up beats spraying applications.</p>

      {error && (
        <div className="cc-card" style={{ marginBottom: 20, borderColor: "var(--v-red)" }}>
          <div className="cc-card-body cc-muted">{error}</div>
        </div>
      )}

      <div className="cc-grid cc-grid-halves" style={{ marginBottom: 20 }}>
        <div className="cc-card">
          <div className="cc-card-head"><h2>The habit</h2></div>
          <div className="cc-card-body" style={{ display: "flex", gap: 36, flexWrap: "wrap" }}>
            <Stat value={<><span className="cc-streak-flame">🔥</span> {streak.current}</>} label="current streak" />
            <Stat value={streak.longest} label="longest streak" />
            <Stat value={activeDays} label="active days / 30" />
          </div>
        </div>

        <div className="cc-card">
          <div className="cc-card-head">
            <h2>Case files</h2>
            <span className="cc-badge cc-badge-blue">{questions.filter((q) => completed.has(q.slug)).length} / {questions.length}</span>
          </div>
          <div className="cc-card-body">
            {["sql", "python"].map((cat) => {
              const inCat = questions.filter((q) => q.category === cat);
              const done = inCat.filter((q) => completed.has(q.slug)).length;
              return (
                <div className="cc-bar-row" key={cat}>
                  <span style={{ color: cat === "sql" ? "var(--v-cyan)" : "var(--v-magenta)" }}>{cat.toUpperCase()}</span>
                  <div className="cc-progress"><div className="cc-progress-fill" style={{ width: `${inCat.length ? (done / inCat.length) * 100 : 0}%` }} /></div>
                  <span className="cc-muted">{done}/{inCat.length}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="cc-card" style={{ marginBottom: 20 }}>
        <div className="cc-card-head">
          <h2>Last 30 days</h2>
          <span className="cc-mono cc-muted" style={{ fontSize: 11 }}>cases cleared per day</span>
        </div>
        <div className="cc-card-body">
          <div className="cc-heat">
            {days.map((d) => {
              const count = progress?.activityByDay?.[d] || 0;
              return <div key={d} className="cc-heat-cell" data-level={heatLevel(count)} title={`${d}: ${count} cleared`} />;
            })}
          </div>
          <div className="cc-mono cc-muted" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 8 }}>
            <span>{days[0]}</span><span>today</span>
          </div>
        </div>
      </div>

      <div className="cc-grid cc-grid-halves">
        <div className="cc-card">
          <div className="cc-card-head"><h2>Attempt analytics</h2></div>
          <div className="cc-card-body">
            {!history ? (
              <p className="cc-muted" style={{ margin: 0 }}>No attempts logged yet — run a case in the practice sim.</p>
            ) : (
              <>
                <div style={{ display: "flex", gap: 36, flexWrap: "wrap", marginBottom: 18 }}>
                  <Stat value={history.totalAttempts} label="practice runs" />
                  <Stat value={`${history.firstTryRate}%`} label="first-try pass" />
                  <Stat value={history.distinctSolved} label="solved" />
                </div>
                {history.struggles.length > 0 && (
                  <>
                    <p className="cc-eyebrow" style={{ color: "var(--v-muted)" }}>Took the most tries</p>
                    <div className="cc-grid" style={{ gap: 8 }}>
                      {history.struggles.map((s) => (
                        <Link key={s.slug} href={`/app/practice/${s.slug}`} className="cc-task">
                          <span style={{ flex: 1 }} className="cc-task-title">{s.title}</span>
                          <span className={`cc-badge ${s.passed ? "cc-badge-green" : "cc-badge-red"}`}>{s.attempts} tries{s.passed ? " · solved" : ""}</span>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div className="cc-card">
          <div className="cc-card-head"><h2>Certification log</h2><span className="cc-badge cc-badge-muted">{tests.length}</span></div>
          <div className="cc-card-body">
            {tests.length === 0 ? (
              <p className="cc-muted" style={{ margin: 0 }}>No certification runs yet.</p>
            ) : (
              <div className="cc-grid" style={{ gap: 8 }}>
                {tests.map((t) => (
                  <div className="cc-task" key={t.id}>
                    <span style={{ flex: 1 }}>
                      <span className="cc-task-title">{t.correct}/{t.total} correct</span>
                      <div className="cc-task-meta">{new Date(t.taken_at).toLocaleString()} · {t.skipped} skipped</div>
                    </span>
                    <span className={`cc-badge ${t.score_pct >= 85 ? "cc-badge-green" : t.score_pct >= 60 ? "cc-badge-amber" : "cc-badge-red"}`}>{t.score_pct}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
