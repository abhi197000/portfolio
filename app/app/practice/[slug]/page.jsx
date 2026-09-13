"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AgentOrb from "../../../_module/AgentOrb";
import ResultTable from "../../../_module/ResultTable";
import { getQuestion, listQuestions } from "../../../../lib/practiceApi";
import { compareResults } from "../../../../lib/compareResults";
import { runSqlQuery } from "../../../../lib/sqlRunner";
import { runPythonCode } from "../../../../lib/pyRunner";
import { loadProgress, logAttempt, recordPass } from "../../../../lib/module/progress";

export default function WorkbenchPage() {
  const { slug } = useParams();
  const [question, setQuestion] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [allQuestions, setAllQuestions] = useState([]);
  const [completed, setCompleted] = useState(new Set());

  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle"); // idle | running | pass | fail | error
  const [runLabel, setRunLabel] = useState("Execute");
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    setStatus("idle");
    setRows(null);
    setHintsShown(0);
    setShowSolution(false);
    getQuestion(slug)
      .then((q) => {
        setQuestion(q);
        setCode(q.starter_code || "");
      })
      .catch((err) => setLoadError(err.message));
    listQuestions().then(setAllQuestions);
    loadProgress().then((p) => setCompleted(p.completedSlugs)).catch(() => {});
  }, [slug]);

  const index = allQuestions.findIndex((q) => q.slug === slug);
  const nextSlug = index >= 0 && index < allQuestions.length - 1 ? allQuestions[index + 1].slug : null;
  const chapterCount = allQuestions.reduce((max, q) => Math.max(max, q.chapter_number || 0), 0);
  const isCleared = completed.has(slug);
  const journeyDone = allQuestions.length > 0 && allQuestions.every((q) => completed.has(q.slug));

  async function handleRun() {
    if (!question) return;
    setStatus("running");
    setMessage("");
    setRows(null);
    try {
      let output;
      if (question.category === "sql") {
        setRunLabel("Running SQL…");
        output = (await runSqlQuery({ schemaSql: question.schema_sql, seedSql: question.seed_sql, query: code })).rows;
      } else {
        output = await runPythonCode({ seedData: question.seed_data, code, onStatus: setRunLabel });
      }
      setRows(output);
      const verdict = compareResults(output, question.expected_result, { orderMatters: question.order_matters });
      setStatus(verdict.passed ? "pass" : "fail");
      setMessage(verdict.passed ? "Output matches the expected result." : verdict.reason);

      if (verdict.passed) {
        await recordPass({ slug: question.slug, category: question.category }).catch(() => {});
        setCompleted((prev) => new Set([...prev, question.slug]));
      }
      logAttempt({ slug: question.slug, category: question.category, code, passed: verdict.passed });
    } catch (err) {
      setStatus("error");
      setMessage(err.message || String(err));
      logAttempt({ slug: question.slug, category: question.category, code, passed: false });
    } finally {
      setRunLabel("Execute");
    }
  }

  if (loadError) {
    return (
      <main className="cc-main">
        <div className="cc-card"><div className="cc-card-body">
          <p style={{ marginTop: 0 }}>Couldn&apos;t load this case: {loadError}</p>
          <Link href="/app/practice" className="cc-btn cc-btn-secondary">← Case files</Link>
        </div></div>
      </main>
    );
  }

  if (!question) {
    return <main className="cc-main"><p className="cc-muted cc-mono">Loading case file…</p></main>;
  }

  const verdictClass = status === "pass" ? "cc-verdict-pass" : status === "fail" || status === "error" ? "cc-verdict-fail" : "";

  return (
    <main className="cc-main">
      <Link href="/app/practice" className="cc-mono" style={{ fontSize: 12 }}>← case files</Link>
      <p className="cc-eyebrow" style={{ marginTop: 16 }}>
        Case {question.chapter_number || "?"}{chapterCount ? ` of ${chapterCount}` : ""} · {question.chapter_title}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <h1 className="cc-hero-greeting" style={{ margin: 0 }}>{question.title}</h1>
        <span className={`cc-badge ${question.category === "sql" ? "cc-badge-blue" : "cc-badge-pink"}`}>{question.category.toUpperCase()}</span>
        <span className="cc-badge cc-badge-muted">{question.difficulty.replace("_", " ")}</span>
        {isCleared && <span className="cc-badge cc-badge-green">✓ CLEARED</span>}
      </div>

      <div className="cc-work">
        <div className="cc-grid" style={{ alignContent: "start" }}>
          {question.story && (
            <div className="cc-card">
              <div className="cc-card-head"><h2>Mission briefing</h2></div>
              <div className="cc-card-body"><p style={{ margin: 0 }}>{question.story}</p></div>
            </div>
          )}

          <div className="cc-card">
            <div className="cc-card-head"><h2>Objective</h2></div>
            <div className="cc-card-body"><p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{question.prompt}</p></div>
          </div>

          {question.category === "sql" && question.schema_sql && (
            <div className="cc-card">
              <div className="cc-card-head"><h2>Schema</h2></div>
              <div className="cc-card-body"><pre className="cc-code">{question.schema_sql}</pre></div>
            </div>
          )}

          {question.category === "python" && question.seed_data && (
            <div className="cc-card">
              <div className="cc-card-head"><h2>Preloaded DataFrames</h2></div>
              <div className="cc-card-body cc-grid" style={{ gap: 14 }}>
                {Object.entries(question.seed_data).map(([name, data]) => (
                  <div key={name}>
                    <p className="cc-eyebrow">{name}</p>
                    <ResultTable rows={data} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="cc-card">
            <div className="cc-card-head">
              <h2>Agent hints</h2>
              <button
                className="cc-btn cc-btn-secondary"
                style={{ padding: "8px 12px" }}
                disabled={hintsShown >= (question.hints || []).length}
                onClick={() => setHintsShown((n) => n + 1)}
              >
                Reveal hint ({hintsShown}/{(question.hints || []).length})
              </button>
            </div>
            <div className="cc-card-body">
              {hintsShown === 0 && <p className="cc-muted" style={{ margin: "0 0 12px", fontSize: 13 }}>Stuck? The agent will nudge you one step at a time.</p>}
              {(question.hints || []).slice(0, hintsShown).map((hint, i) => (
                <div className="cc-hint" key={i}><span className="cc-mono" style={{ color: "var(--v-violet)" }}>{String(i + 1).padStart(2, "0")} </span>{hint}</div>
              ))}
              {question.solution_code && (
                <>
                  <button className="cc-btn cc-btn-ghost" style={{ marginTop: 6 }} onClick={() => setShowSolution((s) => !s)}>
                    {showSolution ? "Hide solution" : "Reveal solution"}
                  </button>
                  {showSolution && <pre className="cc-code" style={{ marginTop: 12 }}>{question.solution_code}</pre>}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="cc-grid cc-work-sticky" style={{ alignContent: "start" }}>
          <div className="cc-card cc-card-hot">
            <div className="cc-card-head">
              <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <AgentOrb size={22} state={status === "running" ? "thinking" : "idle"} />
                {question.category === "sql" ? "SQL terminal" : "Python terminal"}
              </h2>
              <button className="cc-btn cc-btn-primary" onClick={handleRun} disabled={status === "running"}>
                {status === "running" ? runLabel : "Execute ▶"}
              </button>
            </div>
            <div className="cc-card-body">
              <textarea
                className="cc-editor"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                aria-label="Your code"
              />
            </div>
          </div>

          {status !== "idle" && status !== "running" && (
            <div className={`cc-card ${verdictClass}`}>
              <div className="cc-card-head">
                <h2>Result</h2>
                <span className={`cc-badge ${status === "pass" ? "cc-badge-green" : "cc-badge-red"}`}>
                  {status === "pass" ? "PASS" : status === "fail" ? "FAIL" : "ERROR"}
                </span>
              </div>
              <div className="cc-card-body cc-grid" style={{ gap: 14 }}>
                <p className="cc-mono" style={{ margin: 0, fontSize: 13 }}>{message}</p>
                {rows && rows.length > 0 && <ResultTable rows={rows} />}
                {status === "pass" && (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {journeyDone ? (
                      <Link href="/app/practice/test" className="cc-btn cc-btn-primary">Every case closed — enter certification →</Link>
                    ) : nextSlug ? (
                      <Link href={`/app/practice/${nextSlug}`} className="cc-btn cc-btn-primary">Next case →</Link>
                    ) : null}
                    <Link href="/app" className="cc-btn cc-btn-ghost">Command center</Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
