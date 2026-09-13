"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listQuestions } from "../../../lib/practiceApi";
import { loadProgress } from "../../../lib/module/progress";

const DIFFICULTY_BADGE = { easy: "cc-badge-green", medium: "cc-badge-amber", hard: "cc-badge-red", very_hard: "cc-badge-red" };

export default function PracticeSimPage() {
  const [questions, setQuestions] = useState(null);
  const [progress, setProgress] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    listQuestions().then(setQuestions);
    loadProgress().then(setProgress).catch(() => setProgress(null));
  }, []);

  const completed = progress?.completedSlugs || new Set();
  const total = questions?.length || 0;
  const cleared = questions ? questions.filter((q) => completed.has(q.slug)).length : 0;
  const journeyDone = total > 0 && cleared === total;
  const lastTest = progress?.tests?.[0];
  const visible = (questions || []).filter((q) => filter === "all" || q.category === filter);

  return (
    <main className="cc-main">
      <p className="cc-eyebrow">Train // Practice sim</p>
      <h1 className="cc-hero-greeting">Case Files</h1>
      <p className="cc-hero-sub">
        You&apos;re the newest analyst at Meridian Retail, working Priya&apos;s onboarding cases — real
        business questions, solved in SQL and Python in a sandbox that runs entirely in your browser.
        Hints are on. Close every case to unlock certification.
      </p>

      <div className={`cc-card ${journeyDone ? "cc-card-hot" : ""}`} style={{ marginBottom: 22 }}>
        <div className="cc-card-head">
          <h2>Journey</h2>
          <span className={`cc-badge ${journeyDone ? "cc-badge-green" : "cc-badge-blue"}`}>{cleared} / {total} cleared</span>
        </div>
        <div className="cc-card-body" style={{ display: "grid", gap: 14 }}>
          <div className="cc-progress">
            <div className="cc-progress-fill" style={{ width: `${total ? (cleared / total) * 100 : 0}%` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span className="cc-muted" style={{ fontSize: 13 }}>
              {lastTest
                ? `Last certification: ${lastTest.correct}/${lastTest.total} correct (${lastTest.score_pct}%) on ${new Date(lastTest.taken_at).toLocaleDateString()}.`
                : journeyDone
                ? "All cases closed. The certification protocol is unlocked."
                : "Certification locked until every case is closed."}
            </span>
            {journeyDone ? (
              <Link href="/app/practice/test" className="cc-btn cc-btn-primary">Enter certification →</Link>
            ) : (
              <span className="cc-badge cc-badge-muted">🔒 CERTIFICATION LOCKED</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div className="cc-tabs">
          {[["all", "All"], ["sql", "SQL"], ["python", "Python"]].map(([id, label]) => (
            <button key={id} className={`cc-tab ${filter === id ? "cc-tab-active" : ""}`} onClick={() => setFilter(id)}>
              {label}
            </button>
          ))}
        </div>
        <span className="cc-mono cc-muted" style={{ fontSize: 12 }}>{visible.length} files</span>
      </div>

      {!questions ? (
        <p className="cc-muted">Decrypting case files…</p>
      ) : (
        <div className="cc-case-grid">
          {visible.map((q) => {
            const done = completed.has(q.slug);
            return (
              <Link key={q.slug} href={`/app/practice/${q.slug}`} className={`cc-case ${done ? "cc-case-done" : ""}`}>
                <div className="cc-case-top">
                  <span className="cc-case-num">
                    {done ? "✓ " : ""}CASE {String(q.chapter_number || 0).padStart(2, "0")}
                  </span>
                  <span className={`cc-badge ${q.category === "sql" ? "cc-badge-blue" : "cc-badge-pink"}`}>{q.category.toUpperCase()}</span>
                </div>
                <div className="cc-case-title">{q.title}</div>
                <div className="cc-case-meta" style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(q.topic_tags || []).join(" · ")}</span>
                  <span className={`cc-badge ${DIFFICULTY_BADGE[q.difficulty] || "cc-badge-muted"}`}>{q.difficulty.replace("_", " ")}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
