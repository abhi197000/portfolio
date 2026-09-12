"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import "../agents/schema-compare/schema-compare.css";
import { listQuestions } from "../../lib/practiceApi";

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

  useEffect(() => {
    listQuestions()
      .then(setQuestions)
      .catch((err) => setError(err.message));
  }, []);

  const filtered = questions
    ? questions.filter((q) => filter === "all" || q.category === filter)
    : null;

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
          Every problem here comes from real data-analyst interview patterns — write SQL against
          an in-browser SQLite sandbox, or pandas against a live DataFrame, and check your answer
          on the spot. Nothing you write ever leaves your browser.
        </p>
      </div>

      <main className="sc-main">
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
                      <div className="sc-source-name">{q.title}</div>
                      <div className="sc-source-detail">
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
