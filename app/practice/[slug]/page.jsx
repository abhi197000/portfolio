"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import "../../agents/schema-compare/schema-compare.css";
import { getQuestion, getSessionId, listQuestions, submitAttempt } from "../../../lib/practiceApi";
import { compareResults } from "../../../lib/compareResults";
import { runSqlQuery } from "../../../lib/sqlRunner";
import { runPythonCode } from "../../../lib/pyRunner";
import { getCompletedSlugs, isJourneyComplete, markCompleted, recordPracticeActivity } from "../../../lib/practiceProgress";

export default function PracticeWorkbenchPage() {
  const { slug } = useParams();
  const [question, setQuestion] = useState(null);
  const [error, setError] = useState(null);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle"); // idle | running | pass | fail | error
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState(null);
  const [showHints, setShowHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [runLabel, setRunLabel] = useState("Run");
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [nextSlug, setNextSlug] = useState(null);
  const [journeyReady, setJourneyReady] = useState(false);

  useEffect(() => {
    getQuestion(slug)
      .then((q) => {
        setQuestion(q);
        setCode(q.starter_code || "");
        setAlreadyCompleted(getCompletedSlugs().has(q.slug));
      })
      .catch((err) => setError(err.message));

    listQuestions().then((all) => {
      const idx = all.findIndex((q) => q.slug === slug);
      setNextSlug(idx >= 0 && idx < all.length - 1 ? all[idx + 1].slug : null);
    });
  }, [slug]);

  async function handleRun() {
    if (!question) return;
    setStatus("running");
    setMessage("");
    setRows(null);
    recordPracticeActivity();
    try {
      let result;
      if (question.category === "sql") {
        setRunLabel("Running SQL…");
        result = await runSqlQuery({
          schemaSql: question.schema_sql,
          seedSql: question.seed_sql,
          query: code,
        });
      } else {
        result = { rows: await runPythonCode({ seedData: question.seed_data, code, onStatus: setRunLabel }) };
      }

      setRows(result.rows);
      const verdict = compareResults(result.rows, question.expected_result, {
        orderMatters: question.order_matters,
      });
      setStatus(verdict.passed ? "pass" : "fail");
      setMessage(verdict.passed ? "Correct — matches the expected output." : verdict.reason);

      if (verdict.passed) {
        markCompleted(question.slug);
        setAlreadyCompleted(true);
        const all = await listQuestions();
        if (isJourneyComplete(all.map((q) => q.slug))) setJourneyReady(true);
      }

      submitAttempt({
        sessionId: getSessionId(),
        questionSlug: question.slug,
        language: question.category,
        code,
        passed: verdict.passed,
        mode: "practice",
      });
    } catch (err) {
      setStatus("error");
      setMessage(err.message || String(err));
    } finally {
      setRunLabel("Run");
    }
  }

  if (error) {
    return (
      <div className="sc-page">
        <main className="sc-main">
          <p style={{ color: "#f87171" }}>Couldn&apos;t load this question: {error}</p>
          <Link href="/practice" className="sc-nav-back">&larr; Back to Practice</Link>
        </main>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="sc-page">
        <main className="sc-main"><p>Loading question…</p></main>
      </div>
    );
  }

  return (
    <div className="sc-page">
      <nav className="sc-nav">
        <div className="sc-nav-inner">
          <Link href="/practice" className="sc-nav-back">&larr; Back to Practice</Link>
          <span className="sc-nav-title">{question.title}</span>
          {alreadyCompleted && <span className="sc-badge sc-badge-ok" style={{ marginLeft: 12 }}>✓ Completed</span>}
        </div>
      </nav>

      <main className="sc-main" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ display: "grid", gap: 24, alignContent: "start" }}>
          {question.chapter_number && (
            <p className="sc-source-detail" style={{ margin: 0 }}>
              Case {question.chapter_number} of 15 · {question.chapter_title}
            </p>
          )}

          {question.story && (
            <div className="sc-card">
              <div className="sc-card-header"><h2>The Scenario</h2></div>
              <div className="sc-card-body"><p>{question.story}</p></div>
            </div>
          )}

          <div className="sc-card">
            <div className="sc-card-header">
              <h2>Problem</h2>
              <span className="sc-badge sc-badge-ok">{question.difficulty.replace("_", " ")}</span>
            </div>
            <div className="sc-card-body">
              <p style={{ whiteSpace: "pre-wrap" }}>{question.prompt}</p>
            </div>
          </div>

          {question.category === "sql" && question.schema_sql && (
            <div className="sc-card">
              <div className="sc-card-header"><h2>Schema</h2></div>
              <div className="sc-card-body">
                <pre className="sc-textarea" style={{ margin: 0 }}>{question.schema_sql}</pre>
              </div>
            </div>
          )}

          {question.category === "python" && question.seed_data && (
            <div className="sc-card">
              <div className="sc-card-header"><h2>Preloaded DataFrames</h2></div>
              <div className="sc-card-body">
                {Object.entries(question.seed_data).map(([name, rows]) => (
                  <div key={name} style={{ marginBottom: 12 }}>
                    <div className="sc-source-name">{name}</div>
                    <ResultTable rows={rows} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="sc-card">
            <div className="sc-card-header">
              <h2>Hints</h2>
              <button className="sc-btn sc-btn-secondary" onClick={() => setShowHints((n) => Math.min(n + 1, question.hints.length))}>
                Reveal a hint
              </button>
            </div>
            <div className="sc-card-body">
              {showHints === 0 && <p className="sc-source-detail">Stuck? Reveal hints one at a time.</p>}
              <ol>
                {question.hints.slice(0, showHints).map((h, i) => <li key={i} style={{ marginBottom: 6 }}>{h}</li>)}
              </ol>
              {question.solution_code && (
                <>
                  <button className="sc-btn sc-btn-secondary" onClick={() => setShowSolution((s) => !s)}>
                    {showSolution ? "Hide solution" : "Reveal solution"}
                  </button>
                  {showSolution && (
                    <pre className="sc-textarea" style={{ marginTop: 12 }}>{question.solution_code}</pre>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 24, alignContent: "start" }}>
          <div className="sc-card">
            <div className="sc-card-header">
              <h2>{question.category === "sql" ? "Your SQL" : "Your Python"}</h2>
              <button className="sc-btn sc-btn-primary" onClick={handleRun} disabled={status === "running"}>
                {status === "running" ? runLabel : "Run"}
              </button>
            </div>
            <div className="sc-card-body">
              <textarea
                className="sc-textarea"
                style={{ width: "100%", minHeight: 260, fontFamily: "monospace", fontSize: 14 }}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
              />
            </div>
          </div>

          {status !== "idle" && status !== "running" && (
            <div className="sc-card">
              <div className="sc-card-header">
                <h2>Result</h2>
                <span className={`sc-badge ${status === "pass" ? "sc-badge-ok" : "sc-badge-mismatch"}`}>
                  {status === "pass" ? "PASS" : status === "fail" ? "FAIL" : "ERROR"}
                </span>
              </div>
              <div className="sc-card-body">
                <p>{message}</p>
                {rows && rows.length > 0 && (
                  <>
                    <div className="sc-source-name" style={{ marginTop: 12 }}>Your output</div>
                    <ResultTable rows={rows} />
                  </>
                )}

                {status === "pass" && journeyReady && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border, #1f2a40)" }}>
                    <p style={{ marginBottom: 8 }}>
                      🎉 That's every case cleared — the certification test is now unlocked.
                    </p>
                    <Link href="/practice/test" className="sc-btn sc-btn-primary">
                      Start the Certification Test →
                    </Link>
                  </div>
                )}
                {status === "pass" && !journeyReady && nextSlug && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border, #1f2a40)" }}>
                    <Link href={`/practice/${nextSlug}`} className="sc-btn sc-btn-secondary">
                      Next Case →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ResultTable({ rows }) {
  if (!rows || rows.length === 0) return <p className="sc-source-detail">No rows returned.</p>;
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
