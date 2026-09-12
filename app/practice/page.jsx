"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import "../agents/schema-compare/schema-compare.css";
import { listQuestions } from "../../lib/practiceApi";
import { getCompletedSlugs, getLastTestScore } from "../../lib/practiceProgress";

const DIFFICULTY_COLOR = {
  easy: "sc-badge-ok",
  medium: "sc-badge-mismatch",
  hard: "sc-badge-mismatch",
  very_hard: "sc-badge-mismatch",
};

export default function PracticeIndexPage() {
  const [questions, setQuestions] = useState(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);
  const [completed, setCompleted] = useState(new Set());
  const [lastScore, setLastScore] = useState(null);

  useEffect(() => {
    listQuestions()
      .then(setQuestions)
      .catch((err) => setError(err.message));
    setCompleted(getCompletedSlugs());
    setLastScore(getLastTestScore());
  }, []);

  const filtered = questions
    ? questions.filter((q) => filter === "all" || q.category === filter)
    : null;

  const total = questions?.length ?? 0;
  const completedCount = questions ? questions.filter((q) => completed.has(q.slug)).length : 0;
  const journeyComplete = total > 0 && completedCount === total;

  return (
    <div className="sc-page">
      <nav className="sc-nav">
        <div className="sc-nav-inner">
          <Link href="/" className="sc-nav-back">&larr; Back to Portfolio</Link>
          <span className="sc-nav-title">SQL & Python Practice</span>
        </div>
      </nav>

      <div className="sc-hero">
        <h1>SQL &amp; Python <span>Interview Prep</span></h1>
        <p className="sc-hero-subtitle">Write real queries. Get instant, honest feedback.</p>
        <p className="sc-hero-desc">
          You're the newest analyst at Meridian Retail, working through Priya's onboarding
          cases — 15 real business questions, each solved in SQL and/or Python against an
          in-browser sandbox. Clear every case to unlock the certification test. Nothing you
          write ever leaves your browser.
        </p>
      </div>

      <main className="sc-main">
        {questions && (
          <div className="sc-card" style={{ marginBottom: 24 }}>
            <div className="sc-card-header">
              <h2>Your Journey</h2>
              <span className="sc-badge sc-badge-ok">{completedCount} / {total} cases cleared</span>
            </div>
            <div className="sc-card-body">
              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: "var(--border, #1f2a40)",
                  overflow: "hidden",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${total ? (completedCount / total) * 100 : 0}%`,
                    background: "var(--accent, #38bdf8)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>

              {lastScore && (
                <p className="sc-source-detail" style={{ marginBottom: 12 }}>
                  Last certification result: {lastScore.correct}/{lastScore.total} correct ({lastScore.scorePct}%),
                  taken {new Date(lastScore.takenAt).toLocaleDateString()}.
                </p>
              )}

              {journeyComplete ? (
                <Link href="/practice/test" className="sc-btn sc-btn-primary">
                  Start the Certification Test →
                </Link>
              ) : (
                <p className="sc-source-detail">
                  Clear every case in practice mode (hints and solutions allowed) to unlock a
                  no-hints certification test with a final scorecard.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="sc-card">
          <div className="sc-card-header">
            <h2>Question Bank</h2>
            <div style={{ display: "flex", gap: 8 }}>
              {["all", "sql", "python"].map((f) => (
                <button
                  key={f}
                  className={`sc-chip ${filter === f ? "sc-chip-active" : "sc-chip-inactive"}`}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "All" : f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="sc-card-body">
            {error && <p style={{ color: "#f87171" }}>Couldn&apos;t load questions: {error}</p>}
            {!questions && !error && <p>Loading questions…</p>}
            {filtered && filtered.length === 0 && <p>No questions in this category yet.</p>}
            {filtered && filtered.length > 0 && (
              <div style={{ display: "grid", gap: 12 }}>
                {filtered.map((q) => (
                  <Link
                    key={q.slug}
                    href={`/practice/${q.slug}`}
                    className="sc-source-item"
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none" }}
                  >
                    <div>
                      <div className="sc-source-name">
                        {completed.has(q.slug) && <span style={{ color: "var(--accent, #38bdf8)" }}>✓ </span>}
                        {q.title}
                      </div>
                      <div className="sc-source-detail">
                        {q.chapter_number ? `Case ${q.chapter_number} · ` : ""}
                        {q.category.toUpperCase()} · {(q.topic_tags || []).join(", ")}
                      </div>
                    </div>
                    <span className={`sc-badge ${DIFFICULTY_COLOR[q.difficulty] || "sc-badge-ok"}`}>
                      {q.difficulty.replace("_", " ")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
