"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import "../../agents/schema-compare/schema-compare.css";
import { getSessionHistory, getSessionId, listQuestions } from "../../../lib/practiceApi";
import { getCompletedSlugs, getLastTestScore, getStreak } from "../../../lib/practiceProgress";

function Stat({ value, label }) {
  return (
    <div>
      <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
      <div className="sc-source-detail">{label}</div>
    </div>
  );
}

export default function MyStoryPage() {
  const [questions, setQuestions] = useState(null);
  const [completed, setCompleted] = useState(new Set());
  const [streak, setStreak] = useState(null);
  const [lastScore, setLastScore] = useState(null);
  const [history, setHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    setCompleted(getCompletedSlugs());
    setStreak(getStreak());
    setLastScore(getLastTestScore());
    listQuestions().then(setQuestions);
    getSessionHistory(getSessionId())
      .then(setHistory)
      .finally(() => setLoadingHistory(false));
  }, []);

  const total = questions?.length ?? 0;
  const completedCount = questions ? questions.filter((q) => completed.has(q.slug)).length : 0;

  return (
    <div className="sc-page">
      <nav className="sc-nav">
        <div className="sc-nav-inner">
          <Link href="/practice" className="sc-nav-back">&larr; Back to Practice</Link>
          <span className="sc-nav-title">My Story</span>
        </div>
      </nav>

      <div className="sc-hero">
        <h1>My <span>Story</span></h1>
        <p className="sc-hero-subtitle">Proof that showing up beats spraying applications.</p>
      </div>

      <main className="sc-main" style={{ display: "grid", gap: 24 }}>
        <div className="sc-card">
          <div className="sc-card-header"><h2>The Habit</h2></div>
          <div className="sc-card-body">
            <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
              <Stat value={`🔥 ${streak?.current ?? 0}`} label="current streak (days)" />
              <Stat value={streak?.longest ?? 0} label="longest streak" />
              <Stat value={streak?.todayCount ?? 0} label="attempts today" />
            </div>
          </div>
        </div>

        <div className="sc-card">
          <div className="sc-card-header">
            <h2>Cases Cleared</h2>
            <span className="sc-badge sc-badge-ok">{completedCount} / {total}</span>
          </div>
          <div className="sc-card-body">
            <div
              style={{ height: 8, borderRadius: 999, background: "var(--border, #1f2a40)", overflow: "hidden", marginBottom: 16 }}
            >
              <div style={{ height: "100%", width: `${total ? (completedCount / total) * 100 : 0}%`, background: "var(--accent, #38bdf8)" }} />
            </div>
            {lastScore ? (
              <p className="sc-source-detail">
                Last certification: {lastScore.correct}/{lastScore.total} correct ({lastScore.scorePct}%),
                taken {new Date(lastScore.takenAt).toLocaleDateString()}.
              </p>
            ) : (
              <p className="sc-source-detail">No certification test taken yet.</p>
            )}
          </div>
        </div>

        <div className="sc-card">
          <div className="sc-card-header"><h2>Attempt History</h2></div>
          <div className="sc-card-body">
            {loadingHistory && <p className="sc-source-detail">Loading your attempt history…</p>}
            {!loadingHistory && !history && (
              <p className="sc-source-detail">
                Detailed attempt history isn&apos;t enabled yet. Your streak and progress above are
                tracked in this browser regardless.
              </p>
            )}
            {history && (
              <>
                <div style={{ display: "flex", gap: 40, flexWrap: "wrap", marginBottom: 16 }}>
                  <Stat value={history.totalAttempts} label="total attempts" />
                  <Stat value={`${history.firstTryRate}%`} label="first-try pass rate" />
                  <Stat value={history.distinctSolved} label="questions solved" />
                </div>
                {history.struggles?.length > 0 && (
                  <>
                    <div className="sc-source-name" style={{ marginBottom: 8 }}>Took the most tries</div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {history.struggles.map((s) => (
                        <Link
                          key={s.slug}
                          href={`/practice/${s.slug}`}
                          className="sc-source-item"
                          style={{ display: "flex", justifyContent: "space-between", textDecoration: "none" }}
                        >
                          <span className="sc-source-name">{s.title}</span>
                          <span className={`sc-badge ${s.passed ? "sc-badge-ok" : "sc-badge-mismatch"}`}>
                            {s.attempts} tries{s.passed ? " · solved" : ""}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
