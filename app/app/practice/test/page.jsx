"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AgentOrb from "../../../_module/AgentOrb";
import ResultTable from "../../../_module/ResultTable";
import { getQuestion, listQuestions } from "../../../../lib/practiceApi";
import { compareResults } from "../../../../lib/compareResults";
import { runSqlQuery } from "../../../../lib/sqlRunner";
import { runPythonCode } from "../../../../lib/pyRunner";
import { loadProgress, logAttempt, saveTestAttempt } from "../../../../lib/module/progress";

// In-progress test survives a refresh (per tab); results are saved to Supabase.
const SESSION_KEY = "cc_cert_session_v1";

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}
function writeSession(state) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    // non-fatal: the test just won't survive a refresh
  }
}

export default function CertificationPage() {
  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [cleared, setCleared] = useState(0);

  const [phase, setPhase] = useState("intro"); // intro | running | scorecard
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [detail, setDetail] = useState(null);
  const [code, setCode] = useState("");
  const [grading, setGrading] = useState(false);
  const [gradeLabel, setGradeLabel] = useState("");
  const [saveWarning, setSaveWarning] = useState("");

  useEffect(() => {
    Promise.all([listQuestions(), loadProgress().catch(() => null)]).then(([all, progress]) => {
      setQuestions(all);
      const done = all.filter((q) => progress?.completedSlugs.has(q.slug)).length;
      setCleared(done);
      const ok = all.length > 0 && done === all.length;
      setUnlocked(ok);
      setChecking(false);

      const saved = readSession();
      if (ok && saved && saved.order === all.map((q) => q.slug).join(",")) {
        setPhase(saved.phase);
        setIndex(saved.index);
        setAnswers(saved.answers);
      }
    });
  }, []);

  useEffect(() => {
    if (phase !== "running" || !questions[index]) return;
    setDetail(null);
    getQuestion(questions[index].slug).then((q) => {
      setDetail(q);
      setCode(q.starter_code || "");
    });
  }, [phase, index, questions]);

  const order = questions.map((q) => q.slug).join(",");

  function begin() {
    setPhase("running");
    setIndex(0);
    setAnswers({});
    setSaveWarning("");
    writeSession({ phase: "running", index: 0, answers: {}, order });
  }

  async function finish(finalAnswers) {
    setPhase("scorecard");
    writeSession({ phase: "scorecard", index, answers: finalAnswers, order });
    const values = Object.values(finalAnswers);
    try {
      await saveTestAttempt({
        total: questions.length,
        correct: values.filter((a) => a.passed).length,
        skipped: values.filter((a) => a.skipped).length,
        answers: finalAnswers,
      });
    } catch (err) {
      setSaveWarning(`Scorecard shown, but it couldn't be saved to your history: ${err.message || err}`);
    }
  }

  function advance(entry) {
    const slug = detail.slug;
    const nextAnswers = { ...answers, [slug]: entry };
    setAnswers(nextAnswers);
    logAttempt({ slug, category: detail.category, code: entry.code, passed: entry.passed, mode: "test" });

    if (index + 1 >= questions.length) {
      finish(nextAnswers);
    } else {
      setIndex(index + 1);
      writeSession({ phase: "running", index: index + 1, answers: nextAnswers, order });
    }
  }

  async function submit() {
    if (!detail || grading) return;
    setGrading(true);
    let passed = false;
    try {
      let rows;
      if (detail.category === "sql") {
        setGradeLabel("Running SQL…");
        rows = (await runSqlQuery({ schemaSql: detail.schema_sql, seedSql: detail.seed_sql, query: code })).rows;
      } else {
        rows = await runPythonCode({ seedData: detail.seed_data, code, onStatus: setGradeLabel });
      }
      passed = compareResults(rows, detail.expected_result, { orderMatters: detail.order_matters }).passed;
    } catch {
      passed = false;
    } finally {
      setGrading(false);
      setGradeLabel("");
    }
    advance({ code, passed, skipped: false });
  }

  function retake() {
    sessionStorage.removeItem(SESSION_KEY);
    setPhase("intro");
    setIndex(0);
    setAnswers({});
    setSaveWarning("");
  }

  if (checking) {
    return <main className="cc-main"><p className="cc-muted cc-mono">Verifying clearance…</p></main>;
  }

  return (
    <main className="cc-main">
      <p className="cc-eyebrow">Train // Certification protocol</p>

      {!unlocked && (
        <div className="cc-card" style={{ maxWidth: 680 }}>
          <div className="cc-card-body" style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap", padding: 28 }}>
            <span style={{ fontSize: 42 }}>🔒</span>
            <div style={{ flex: 1, minWidth: 240 }}>
              <h1 className="cc-hero-greeting">Clearance required</h1>
              <p className="cc-muted" style={{ margin: "0 0 14px" }}>
                Close every case in the practice sim first — hints and solutions are fair game there.
                You&apos;ve cleared <b style={{ color: "var(--v-cyan)" }}>{cleared}/{questions.length}</b>.
              </p>
              <div className="cc-progress" style={{ marginBottom: 16 }}>
                <div className="cc-progress-fill" style={{ width: `${questions.length ? (cleared / questions.length) * 100 : 0}%` }} />
              </div>
              <Link href="/app/practice" className="cc-btn cc-btn-primary">Back to case files →</Link>
            </div>
          </div>
        </div>
      )}

      {unlocked && phase === "intro" && (
        <div className="cc-card cc-card-hot" style={{ maxWidth: 760 }}>
          <div className="cc-card-body" style={{ display: "flex", gap: 26, alignItems: "center", flexWrap: "wrap", padding: 30 }}>
            <AgentOrb size={90} />
            <div style={{ flex: 1, minWidth: 260 }}>
              <h1 className="cc-hero-greeting">Certification protocol</h1>
              <div className="cc-briefing" style={{ margin: "10px 0 20px" }}>
                &gt; <b>{questions.length}</b> questions, back to back<br />
                &gt; hints, briefings and solutions: <b>disabled</b><br />
                &gt; submit or skip — no going back<br />
                &gt; no per-question feedback. one scorecard at the end.<span className="cc-caret" />
              </div>
              <button className="cc-btn cc-btn-primary" onClick={begin}>Initiate test →</button>
            </div>
          </div>
        </div>
      )}

      {unlocked && phase === "running" && (
        <div className="cc-card">
          <div className="cc-card-head">
            <h2>Question {index + 1} / {questions.length}</h2>
            <span className={`cc-badge ${questions[index]?.category === "sql" ? "cc-badge-blue" : "cc-badge-pink"}`}>
              {questions[index]?.category?.toUpperCase()}
            </span>
          </div>
          <div className="cc-progress" style={{ borderRadius: 0 }}>
            <div className="cc-progress-fill" style={{ width: `${(index / questions.length) * 100}%` }} />
          </div>
          <div className="cc-card-body">
            {!detail ? (
              <p className="cc-muted cc-mono">Loading question…</p>
            ) : (
              <div className="cc-work">
                <div className="cc-grid" style={{ alignContent: "start", gap: 16 }}>
                  <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{detail.prompt}</p>
                  {detail.category === "sql" && detail.schema_sql && <pre className="cc-code">{detail.schema_sql}</pre>}
                  {detail.category === "python" && detail.seed_data &&
                    Object.entries(detail.seed_data).map(([name, data]) => (
                      <div key={name}>
                        <p className="cc-eyebrow">{name}</p>
                        <ResultTable rows={data} />
                      </div>
                    ))}
                </div>
                <div className="cc-grid" style={{ alignContent: "start", gap: 14 }}>
                  <textarea className="cc-editor" value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} aria-label="Your answer" />
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button className="cc-btn cc-btn-primary" onClick={submit} disabled={grading}>
                      {grading ? gradeLabel || "Grading…" : "Submit answer"}
                    </button>
                    <button className="cc-btn cc-btn-ghost" onClick={() => advance({ code, passed: false, skipped: true })} disabled={grading}>
                      Skip
                    </button>
                    {grading && <AgentOrb size={26} state="thinking" />}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {unlocked && phase === "scorecard" && (
        <Scorecard questions={questions} answers={answers} onRetake={retake} warning={saveWarning} />
      )}
    </main>
  );
}

function Scorecard({ questions, answers, onRetake, warning }) {
  const results = questions.map((q) => ({ ...q, ...(answers[q.slug] || { passed: false, skipped: true }) }));
  const total = results.length;
  const correct = results.filter((r) => r.passed).length;
  const skipped = results.filter((r) => r.skipped).length;
  const incorrect = total - correct - skipped;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const circumference = 2 * Math.PI * 70;
  const missed = results.filter((r) => !r.passed);
  const verdict = pct >= 85 ? "Certified — interview ready." : pct >= 60 ? "Close. Revisit the gaps below." : "Keep training. The sim is where it compounds.";

  return (
    <div className="cc-grid" style={{ gap: 20 }}>
      {warning && <div className="cc-card" style={{ borderColor: "var(--v-amber)" }}><div className="cc-card-body cc-mono" style={{ fontSize: 12 }}>{warning}</div></div>}

      <div className="cc-card cc-card-hot">
        <div className="cc-card-body" style={{ display: "flex", gap: 34, alignItems: "center", flexWrap: "wrap", padding: 30 }}>
          <div className="cc-ring-wrap">
            <svg className="cc-ring" viewBox="0 0 160 160">
              <defs>
                <linearGradient id="cc-ring-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#00f0ff" />
                  <stop offset="60%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ff3dbb" />
                </linearGradient>
              </defs>
              <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(110,170,255,0.14)" strokeWidth="10" />
              <circle
                cx="80" cy="80" r="70" fill="none" stroke="url(#cc-ring-grad)" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
              />
            </svg>
            <div className="cc-ring-label">
              <div className="cc-stat-num" style={{ fontSize: 38 }}>{pct}%</div>
              <div className="cc-stat-label">{correct}/{total} correct</div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <p className="cc-eyebrow">Scorecard</p>
            <h1 className="cc-hero-greeting">{verdict}</h1>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "12px 0 20px" }}>
              <span className="cc-badge cc-badge-green">{correct} correct</span>
              <span className="cc-badge cc-badge-red">{incorrect} incorrect</span>
              <span className="cc-badge cc-badge-muted">{skipped} skipped</span>
            </div>
            {["sql", "python"].map((cat) => {
              const inCat = results.filter((r) => r.category === cat);
              const ok = inCat.filter((r) => r.passed).length;
              return (
                <div className="cc-bar-row" key={cat}>
                  <span style={{ color: cat === "sql" ? "var(--v-cyan)" : "var(--v-magenta)" }}>{cat.toUpperCase()}</span>
                  <div className="cc-progress"><div className="cc-progress-fill" style={{ width: `${inCat.length ? (ok / inCat.length) * 100 : 0}%` }} /></div>
                  <span className="cc-muted">{ok}/{inCat.length}</span>
                </div>
              );
            })}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
              <button className="cc-btn cc-btn-secondary" onClick={onRetake}>Retake</button>
              <Link href="/app/story" className="cc-btn cc-btn-ghost">View my story</Link>
            </div>
          </div>
        </div>
      </div>

      {missed.length > 0 && (
        <div className="cc-card">
          <div className="cc-card-head"><h2>Worth revisiting</h2><span className="cc-badge cc-badge-muted">{missed.length}</span></div>
          <div className="cc-card-body cc-grid" style={{ gap: 8 }}>
            {missed.map((r) => (
              <Link key={r.slug} href={`/app/practice/${r.slug}`} className="cc-task">
                <span style={{ flex: 1 }}>
                  <span className="cc-task-title">{r.title}</span>
                  <div className="cc-task-meta">Case {r.chapter_number} · {r.category}</div>
                </span>
                <span className={`cc-badge ${r.skipped ? "cc-badge-muted" : "cc-badge-red"}`}>{r.skipped ? "SKIPPED" : "INCORRECT"}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
