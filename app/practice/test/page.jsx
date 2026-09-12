"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import "../../agents/schema-compare/schema-compare.css";
import { getQuestion, getSessionId, listQuestions, submitAttempt } from "../../../lib/practiceApi";
import { compareResults } from "../../../lib/compareResults";
import { runSqlQuery } from "../../../lib/sqlRunner";
import { runPythonCode } from "../../../lib/pyRunner";
import { isJourneyComplete, setLastTestScore } from "../../../lib/practiceProgress";

const SESSION_KEY = "practice_test_session_v1";

function loadSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(state) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    // non-fatal
  }
}

function clearSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}

export default function CertificationTestPage() {
  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [allQuestions, setAllQuestions] = useState([]);

  const [phase, setPhase] = useState("intro"); // intro | running | scorecard
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // slug -> { code, passed, skipped }
  const [detail, setDetail] = useState(null);
  const [code, setCode] = useState("");
  const [grading, setGrading] = useState(false);
  const [gradeLabel, setGradeLabel] = useState("Submit Answer");

  // Gate + restore any in-progress session
  useEffect(() => {
    listQuestions().then((all) => {
      setAllQuestions(all);
      const ok = isJourneyComplete(all.map((q) => q.slug));
      setUnlocked(ok);
      setChecking(false);

      if (ok) {
        const saved = loadSession();
        if (saved && saved.orderedSlugs?.length === all.length) {
          setPhase(saved.phase);
          setCurrentIndex(saved.currentIndex);
          setAnswers(saved.answers);
        }
      }
    });
  }, []);

  // Load full detail for the current question whenever we enter/advance in running phase
  useEffect(() => {
    if (phase !== "running" || allQuestions.length === 0) return;
    const slug = allQuestions[currentIndex]?.slug;
    if (!slug) return;
    setDetail(null);
    getQuestion(slug).then((q) => {
      setDetail(q);
      setCode(q.starter_code || "");
    });
  }, [phase, currentIndex, allQuestions]);

  function persist(next) {
    saveSession({
      phase: next.phase ?? phase,
      currentIndex: next.currentIndex ?? currentIndex,
      answers: next.answers ?? answers,
      orderedSlugs: allQuestions.map((q) => q.slug),
    });
  }

  function beginTest() {
    const fresh = { phase: "running", currentIndex: 0, answers: {} };
    setPhase("running");
    setCurrentIndex(0);
    setAnswers({});
    persist(fresh);
  }

  async function advance(slug, entry) {
    const nextAnswers = { ...answers, [slug]: entry };
    setAnswers(nextAnswers);

    submitAttempt({
      sessionId: getSessionId(),
      questionSlug: slug,
      language: detail?.category,
      code: entry.code,
      passed: entry.passed,
      mode: "test",
    });

    if (currentIndex + 1 >= allQuestions.length) {
      finishTest(nextAnswers);
    } else {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      persist({ phase: "running", currentIndex: nextIndex, answers: nextAnswers });
    }
  }

  function finishTest(finalAnswers) {
    setPhase("scorecard");
    persist({ phase: "scorecard", currentIndex, answers: finalAnswers });

    const total = allQuestions.length;
    const correct = Object.values(finalAnswers).filter((a) => a.passed).length;
    setLastTestScore({
      total,
      correct,
      scorePct: Math.round((correct / total) * 100),
      takenAt: Date.now(),
    });
  }

  async function handleSubmit() {
    if (!detail) return;
    setGrading(true);
    let passed = false;
    try {
      let rows;
      if (detail.category === "sql") {
        setGradeLabel("Running SQL…");
        const result = await runSqlQuery({ schemaSql: detail.schema_sql, seedSql: detail.seed_sql, query: code });
        rows = result.rows;
      } else {
        rows = await runPythonCode({ seedData: detail.seed_data, code, onStatus: setGradeLabel });
      }
      const verdict = compareResults(rows, detail.expected_result, { orderMatters: detail.order_matters });
      passed = verdict.passed;
    } catch {
      passed = false;
    } finally {
      setGrading(false);
      setGradeLabel("Submit Answer");
    }
    advance(detail.slug, { code, passed, skipped: false });
  }

  function handleSkip() {
    if (!detail) return;
    advance(detail.slug, { code, passed: false, skipped: true });
  }

  function retakeTest() {
    clearSession();
    setPhase("intro");
    setCurrentIndex(0);
    setAnswers({});
  }

  if (checking) {
    return (
      <div className="sc-page">
        <main className="sc-main"><p>Checking your progress…</p></main>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="sc-page">
        <nav className="sc-nav">
          <div className="sc-nav-inner">
            <Link href="/practice" className="sc-nav-back">&larr; Back to Practice</Link>
            <span className="sc-nav-title">Certification Test</span>
          </div>
        </nav>
        <main className="sc-main">
          <div className="sc-card">
            <div className="sc-card-header"><h2>Not unlocked yet</h2></div>
            <div className="sc-card-body">
              <p>Clear every case in practice mode first — hints and solutions are fair game there.</p>
              <Link href="/practice" className="sc-btn sc-btn-primary" style={{ marginTop: 12, display: "inline-block" }}>
                Back to the Question Bank
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="sc-page">
      <nav className="sc-nav">
        <div className="sc-nav-inner">
          <Link href="/practice" className="sc-nav-back">&larr; Back to Practice</Link>
          <span className="sc-nav-title">Certification Test</span>
        </div>
      </nav>

      <main className="sc-main">
        {phase === "intro" && (
          <div className="sc-card">
            <div className="sc-card-header"><h2>Certification Test</h2></div>
            <div className="sc-card-body">
              <p>You've cleared every case — this is the real thing.</p>
              <ul style={{ marginTop: 12, marginBottom: 12, paddingLeft: 20 }}>
                <li>{allQuestions.length} questions, no hints, no solution reveal.</li>
                <li>Submit an answer or skip — there's no going back once you submit.</li>
                <li>You won't see pass/fail per question — only the final scorecard.</li>
              </ul>
              <button className="sc-btn sc-btn-primary" onClick={beginTest}>Begin Test →</button>
            </div>
          </div>
        )}

        {phase === "running" && (
          <div className="sc-card">
            <div className="sc-card-header">
              <h2>Question {currentIndex + 1} of {allQuestions.length}</h2>
              <span className="sc-badge sc-badge-ok">{allQuestions[currentIndex]?.category?.toUpperCase()}</span>
            </div>
            <div className="sc-card-body">
              {!detail ? (
                <p>Loading question…</p>
              ) : (
                <>
                  <p style={{ whiteSpace: "pre-wrap", marginBottom: 16 }}>{detail.prompt}</p>

                  {detail.category === "sql" && detail.schema_sql && (
                    <>
                      <div className="sc-source-name">Schema</div>
                      <pre className="sc-textarea" style={{ marginBottom: 16 }}>{detail.schema_sql}</pre>
                    </>
                  )}
                  {detail.category === "python" && detail.seed_data && (
                    <>
                      <div className="sc-source-name">Preloaded DataFrames</div>
                      {Object.entries(detail.seed_data).map(([name, rows]) => (
                        <div key={name} style={{ marginBottom: 12 }}>
                          <div className="sc-source-detail">{name}</div>
                          <TestTable rows={rows} />
                        </div>
                      ))}
                    </>
                  )}

                  <textarea
                    className="sc-textarea"
                    style={{ width: "100%", minHeight: 220, fontFamily: "monospace", fontSize: 14, marginTop: 8 }}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    spellCheck={false}
                  />

                  <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                    <button className="sc-btn sc-btn-primary" onClick={handleSubmit} disabled={grading}>
                      {grading ? gradeLabel : "Submit Answer"}
                    </button>
                    <button className="sc-btn sc-btn-secondary" onClick={handleSkip} disabled={grading}>
                      Skip
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {phase === "scorecard" && (
          <Scorecard allQuestions={allQuestions} answers={answers} onRetake={retakeTest} />
        )}
      </main>
    </div>
  );
}

function Scorecard({ allQuestions, answers, onRetake }) {
  const total = allQuestions.length;
  const results = allQuestions.map((q) => ({ ...q, ...(answers[q.slug] || { passed: false, skipped: true }) }));
  const correct = results.filter((r) => r.passed).length;
  const skipped = results.filter((r) => r.skipped).length;
  const incorrect = total - correct - skipped;
  const scorePct = total ? Math.round((correct / total) * 100) : 0;

  const byCategory = ["sql", "python"].map((cat) => {
    const inCat = results.filter((r) => r.category === cat);
    return { cat, correct: inCat.filter((r) => r.passed).length, total: inCat.length };
  });

  const missed = results.filter((r) => !r.passed);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div className="sc-card">
        <div className="sc-card-header"><h2>Your Scorecard</h2></div>
        <div className="sc-card-body">
          <div style={{ display: "flex", gap: 32, alignItems: "baseline", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 40, fontWeight: 700 }}>{scorePct}%</div>
              <div className="sc-source-detail">{correct} / {total} correct</div>
            </div>
            <div className="sc-source-detail">
              {incorrect} incorrect · {skipped} skipped
            </div>
          </div>
          {byCategory.map(({ cat, correct: c, total: t }) => (
            <p key={cat} className="sc-source-detail" style={{ margin: "4px 0" }}>
              {cat.toUpperCase()}: {c} / {t}
            </p>
          ))}
          <button className="sc-btn sc-btn-secondary" onClick={onRetake} style={{ marginTop: 16 }}>
            Retake Test
          </button>
        </div>
      </div>

      {missed.length > 0 && (
        <div className="sc-card">
          <div className="sc-card-header"><h2>Worth Revisiting</h2></div>
          <div className="sc-card-body">
            <div style={{ display: "grid", gap: 8 }}>
              {missed.map((r) => (
                <Link
                  key={r.slug}
                  href={`/practice/${r.slug}`}
                  className="sc-source-item"
                  style={{ display: "flex", justifyContent: "space-between", textDecoration: "none" }}
                >
                  <span className="sc-source-name">{r.title}</span>
                  <span className="sc-badge sc-badge-mismatch">{r.skipped ? "SKIPPED" : "INCORRECT"}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TestTable({ rows }) {
  if (!rows || rows.length === 0) return null;
  const columns = Object.keys(rows[0]);
  return (
    <div className="sc-table-wrapper">
      <table className="sc-table">
        <thead>
          <tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>{columns.map((c) => <td key={c}>{String(row[c])}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
