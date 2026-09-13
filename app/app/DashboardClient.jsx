"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AgentOrb from "../_module/AgentOrb";
import { listQuestions } from "../../lib/practiceApi";
import { pickDailyTasks } from "../../lib/dailyTasks";
import { loadProgress } from "../../lib/module/progress";
import { countVersions } from "../../lib/resume/store";

function MissionRow({ q, done }) {
  return (
    <Link href={`/app/practice/${q.slug}`} className={`cc-task ${done ? "cc-task-done" : ""}`}>
      <span className={`cc-task-check ${done ? "on" : ""}`}>{done ? "✓" : ""}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="cc-task-title">{q.title}</span>
        <div className="cc-task-meta">{(q.topic_tags || []).slice(0, 3).join(" · ") || q.category}</div>
      </span>
      <span className={`cc-badge ${q.category === "sql" ? "cc-badge-blue" : "cc-badge-pink"}`}>{q.category.toUpperCase()}</span>
    </Link>
  );
}

const LAUNCH = [
  ["/app/practice", "Practice Sim", "Work the 15 case files with hints on."],
  ["/app/practice/test", "Certification", "No hints. One shot. A scorecard."],
  ["/app/story", "My Story", "Streaks, accuracy and what to revisit."],
  ["/app/resume", "Living Resume", "Log what you shipped; it rewrites itself."],
];

export default function DashboardClient({ greetingName }) {
  const [questions, setQuestions] = useState([]);
  const [progress, setProgress] = useState(null);
  const [versions, setVersions] = useState(0);
  const [error, setError] = useState("");
  // Locale-formatted on the client only: the server's locale differs from the
  // browser's, which would break hydration.
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    setDateLabel(new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" }));
    listQuestions().then(setQuestions);
    loadProgress().then(setProgress).catch((err) => setError(err.message || String(err)));
    countVersions().then(setVersions).catch(() => setVersions(0));
  }, []);

  const tasks = pickDailyTasks(questions);
  const missions = [...tasks.sql, ...tasks.python];
  const todaySlugs = progress?.todaySlugs || new Set();
  const doneToday = missions.filter((q) => todaySlugs.has(q.slug)).length;
  const remaining = missions.length - doneToday;
  const nextMission = missions.find((q) => !todaySlugs.has(q.slug));
  const cleared = questions.filter((q) => progress?.completedSlugs.has(q.slug)).length;
  const journeyDone = questions.length > 0 && cleared === questions.length;
  const streak = progress?.streak || { current: 0, longest: 0 };
  const lastTest = progress?.tests?.[0];

  return (
    <main className="cc-main">
      {error && (
        <div className="cc-card" style={{ marginBottom: 20, borderColor: "var(--v-red)" }}>
          <div className="cc-card-body">
            <strong>Couldn&apos;t load your progress.</strong>{" "}
            <span className="cc-muted">{error} — if you just updated, re-run <code>db/schema.sql</code> and <code>db/app-schema.sql</code> in Supabase.</span>
          </div>
        </div>
      )}

      <div className="cc-card cc-card-hot" style={{ marginBottom: 20 }}>
        <div className="cc-card-body" style={{ display: "flex", gap: 26, alignItems: "center", flexWrap: "wrap", padding: 28 }}>
          <AgentOrb size={84} state={progress ? "idle" : "thinking"} />
          <div style={{ flex: 1, minWidth: 260 }}>
            <p className="cc-eyebrow">Agent briefing{dateLabel ? ` · ${dateLabel}` : ""}</p>
            <h1 className="cc-hero-greeting">
              Welcome back, <span className="cc-neon" style={{ textTransform: "capitalize" }}>{greetingName}</span>.
            </h1>
            {progress ? (
              <p className="cc-briefing" style={{ margin: "10px 0 18px" }}>
                <b>{doneToday}/{missions.length}</b> missions cleared today{remaining ? ` — ${remaining} to go.` : " — all clear."}{" "}
                Streak at <b>{streak.current} day{streak.current === 1 ? "" : "s"}</b>
                {streak.longest > streak.current ? ` (best ${streak.longest})` : ""}.{" "}
                <b>{cleared}/{questions.length}</b> case files closed
                {journeyDone ? " — certification unlocked." : "."}{" "}
                Resume graph {versions ? <>synced at <b>v{versions}</b>.</> : "not set up yet."}
                <span className="cc-caret" />
              </p>
            ) : (
              <p className="cc-briefing cc-muted" style={{ margin: "10px 0 18px" }}>Compiling your briefing<span className="cc-caret" /></p>
            )}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {nextMission ? (
                <Link href={`/app/practice/${nextMission.slug}`} className="cc-btn cc-btn-primary">Start next mission →</Link>
              ) : (
                <Link href="/app/practice" className="cc-btn cc-btn-primary">Open practice sim →</Link>
              )}
              {!versions && <Link href="/app/resume" className="cc-btn cc-btn-secondary">Set up resume</Link>}
            </div>
          </div>
        </div>
      </div>

      <div className="cc-grid cc-grid-2" style={{ marginBottom: 20 }}>
        <div className="cc-card">
          <div className="cc-card-head">
            <h2>Today&apos;s missions</h2>
            <span className="cc-badge cc-badge-muted">{doneToday} / {missions.length || 6}</span>
          </div>
          <div className="cc-card-body">
            <div className="cc-progress" style={{ marginBottom: 20 }}>
              <div className="cc-progress-fill" style={{ width: `${missions.length ? (doneToday / missions.length) * 100 : 0}%` }} />
            </div>
            {missions.length === 0 ? (
              <p className="cc-muted" style={{ margin: 0 }}>Loading missions…</p>
            ) : (
              <div className="cc-grid" style={{ gap: 18 }}>
                {[["SQL", tasks.sql], ["Python", tasks.python]].map(([label, list]) => (
                  <div key={label}>
                    <p className="cc-eyebrow" style={{ color: "var(--v-muted)" }}>{label} · {list.length} missions</p>
                    <div className="cc-grid" style={{ gap: 8 }}>
                      {list.map((q) => <MissionRow key={q.slug} q={q} done={todaySlugs.has(q.slug)} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="cc-grid" style={{ alignContent: "start" }}>
          <div className="cc-card">
            <div className="cc-card-head"><h2>Streak</h2></div>
            <div className="cc-card-body" style={{ display: "flex", gap: 34 }}>
              <div>
                <div className="cc-stat-num"><span className="cc-streak-flame">🔥</span> {streak.current}</div>
                <div className="cc-stat-label">day streak</div>
              </div>
              <div>
                <div className="cc-stat-num">{streak.longest}</div>
                <div className="cc-stat-label">longest</div>
              </div>
            </div>
          </div>

          <div className="cc-card">
            <div className="cc-card-head">
              <h2>Case files</h2>
              <span className={`cc-badge ${journeyDone ? "cc-badge-green" : "cc-badge-muted"}`}>{cleared} / {questions.length}</span>
            </div>
            <div className="cc-card-body">
              <div className="cc-progress" style={{ marginBottom: 14 }}>
                <div className="cc-progress-fill" style={{ width: `${questions.length ? (cleared / questions.length) * 100 : 0}%` }} />
              </div>
              <p className="cc-muted" style={{ fontSize: 13, margin: "0 0 14px" }}>
                {lastTest
                  ? `Last certification: ${lastTest.correct}/${lastTest.total} (${lastTest.score_pct}%).`
                  : journeyDone
                  ? "Every case closed — the certification protocol is unlocked."
                  : "Close every case to unlock the certification protocol."}
              </p>
              <Link href={journeyDone ? "/app/practice/test" : "/app/practice"} className="cc-btn cc-btn-secondary cc-btn-block">
                {journeyDone ? "Enter certification" : "Continue the journey"}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="cc-grid cc-grid-halves" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        {LAUNCH.map(([href, title, desc]) => (
          <Link key={href} href={href} className="cc-launch">
            <span className="cc-launch-title">{title} →</span>
            <span className="cc-launch-desc">{desc}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
