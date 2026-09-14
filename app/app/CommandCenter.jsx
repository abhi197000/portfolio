"use client";
import { useState } from "react";
import Link from "next/link";
import AgentOrb from "../_module/AgentOrb";
import ActivityGrid from "../_module/ActivityGrid";
import SkillRadar from "../_module/SkillRadar";
import { pickDailyTasks } from "../../lib/dailyTasks";
import { SKILL_AXES, bestSkill, masteryByAxis } from "../../lib/module/skills";

function Tile({ label, value, sub, soon }) {
  return (
    <div className="cc-tile">
      <div className="cc-tile-label">
        {label}
        {soon && <span className="cc-badge cc-badge-muted cc-tile-soon">Soon</span>}
      </div>
      <div className="cc-tile-value">{value}</div>
      {sub && <div className="cc-tile-sub">{sub}</div>}
    </div>
  );
}

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
  ["/app/practice", "Practice Sim", "Work the case files with hints on."],
  ["/app/practice/test", "Certification", "No hints. One shot. A scorecard."],
  ["/app/story", "My Story", "Streaks, accuracy and what to revisit."],
  ["/app/resume", "Living Resume", "Log what you shipped; it rewrites itself."],
];

function bestDay(activityByDay) {
  const entries = Object.entries(activityByDay || {});
  if (!entries.length) return null;
  const [date, count] = entries.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? 1 : -1))[0];
  return { date, count };
}

// Presentational Command Center. `cohort`: undefined while loading, null when
// the benchmark isn't available, otherwise the cohort_skill_benchmark payload.
export default function CommandCenter({ greetingName, dateLabel, questions = [], progress, history, cohort, versions = 0, error }) {
  const [tab, setTab] = useState("overview");

  const completed = progress?.completedSlugs || new Set();
  const todaySlugs = progress?.todaySlugs || new Set();
  const streak = progress?.streak || { current: 0, longest: 0 };
  const activity = progress?.activityByDay || {};
  const lastTest = progress?.tests?.[0];

  const tasks = pickDailyTasks(questions);
  const missions = [...tasks.sql, ...tasks.python];
  const doneToday = missions.filter((q) => todaySlugs.has(q.slug)).length;
  const nextMission = missions.find((q) => !todaySlugs.has(q.slug));
  const cleared = questions.filter((q) => completed.has(q.slug)).length;
  const journeyDone = questions.length > 0 && cleared === questions.length;

  const mine = masteryByAxis(questions, (slug) => (completed.has(slug) ? 1 : 0));
  const best = bestSkill(mine);
  const cohortReady = Boolean(cohort && cohort.cohort_size >= cohort.min_cohort);
  const theirs = cohortReady ? masteryByAxis(questions, (slug) => Number(cohort.rates?.[slug] || 0)) : null;

  const series = [{ id: "you", label: "You", values: mine.map((a) => a.value) }];
  if (theirs) series.push({ id: "others", label: "Other operators", values: theirs.map((a) => a.value) });

  const radarNote =
    cohort === undefined
      ? "Loading the comparison…"
      : cohort === null
      ? "Comparison with other operators isn't switched on yet."
      : !cohortReady
      ? `Comparison with other operators unlocks once ${cohort.min_cohort} others are active (${cohort.cohort_size} so far).`
      : null;

  const top = bestDay(activity);
  const footnote =
    cohortReady && cohort.beats_pct != null
      ? `You've solved more cases than ${cohort.beats_pct}% of other operators.`
      : top
      ? `Your best day so far: ${top.count} ${top.count === 1 ? "case" : "cases"} solved.`
      : "Solve a case to start lighting up the grid.";

  const languages = [["sql", "SQL"], ["python", "Python"]].map(([id, label]) => {
    const qs = questions.filter((q) => q.category === id);
    const solved = qs.filter((q) => completed.has(q.slug)).length;
    return { id, label, solved, total: qs.length, runs: history?.byLanguage?.[id]?.runs ?? 0, firstTry: history?.byLanguage?.[id]?.firstTryRate ?? 0 };
  });

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

      <header className="cc-hello">
        <AgentOrb size={36} state={progress ? "idle" : "thinking"} />
        <div className="cc-hello-text">
          <h1 className="cc-hello-title">
            What&apos;s up next, <span className="cc-hello-name">{greetingName}</span>?
          </h1>
          <p className="cc-hello-sub">
            {dateLabel ? `${dateLabel} · ` : ""}
            {progress ? `${doneToday} of ${missions.length} missions done today` : "Loading your day"}
            {lastTest ? ` · last certification ${lastTest.score_pct}%` : ""}
          </p>
        </div>
        <div className="cc-hello-actions">
          {nextMission ? (
            <Link href={`/app/practice/${nextMission.slug}`} className="cc-btn cc-btn-primary">Start next mission →</Link>
          ) : (
            <Link href="/app/practice" className="cc-btn cc-btn-primary">Open practice sim →</Link>
          )}
          {!versions && <Link href="/app/resume" className="cc-btn cc-btn-secondary">Set up resume</Link>}
        </div>
      </header>

      <div className="cc-cmd-grid">
        <section className="cc-card cc-overview" aria-label="Your stats">
          <div className="cc-overview-head">
            <div className="cc-seg" role="tablist" aria-label="Stats view">
              {[["overview", "Overview"], ["languages", "Languages"]].map(([id, label]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  className={`cc-seg-btn ${tab === id ? "is-on" : ""}`}
                  onClick={() => setTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="cc-overview-scope">All time</span>
          </div>

          {tab === "overview" ? (
            <div className="cc-overview-body">
              <div className="cc-tiles">
                <Tile label="Applications" value="—" sub="Tracker coming soon" soon />
                <Tile label="Cases solved" value={cleared} sub={`of ${questions.length || "—"}`} />
                <Tile label="Practice runs" value={history ? history.totalAttempts.toLocaleString() : "—"} />
                <Tile label="Active days" value={Object.keys(activity).length} />
                <Tile label="Current streak" value={`${streak.current}d`} />
                <Tile label="Longest streak" value={`${streak.longest}d`} />
                <Tile label="First-try pass" value={history ? `${history.firstTryRate}%` : "—"} />
                <Tile label="Best skill" value={best ? best.label : "—"} sub={best ? `${best.value}% of its cases solved` : "Solve a case to find out"} />
              </div>
              <ActivityGrid activityByDay={activity} weeks={26} />
              <p className="cc-overview-foot">{footnote}</p>
            </div>
          ) : (
            <div className="cc-overview-body">
              {languages.map((lang) => (
                <div key={lang.id} className="cc-lang">
                  <div className="cc-lang-head">
                    <span className="cc-lang-name">{lang.label}</span>
                    <span className="cc-lang-count">{lang.solved} of {lang.total} solved</span>
                  </div>
                  <div className="cc-meter" role="img" aria-label={`${lang.label}: ${lang.solved} of ${lang.total} cases solved`}>
                    <div className="cc-meter-fill" style={{ width: `${lang.total ? (lang.solved / lang.total) * 100 : 0}%` }} />
                  </div>
                  <div className="cc-lang-stats">
                    <span><strong>{lang.runs}</strong> practice runs</span>
                    <span><strong>{lang.firstTry}%</strong> first-try pass</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="cc-card cc-skillpanel" aria-label="Skill graph">
          <div className="cc-card-head">
            <h2>Skill graph</h2>
            <span className="cc-badge cc-badge-muted">{theirs ? `You vs ${cohort.cohort_size} others` : "You"}</span>
          </div>
          <div className="cc-card-body">
            <SkillRadar axes={SKILL_AXES} series={series} />
            {radarNote && <p className="cc-skill-note">{radarNote}</p>}
            <table className="cc-mini-table cc-skill-table">
              <thead>
                <tr><th>Skill</th><th>You</th>{theirs && <th>Others</th>}<th>Cases</th></tr>
              </thead>
              <tbody>
                {mine.map((axis, i) => (
                  <tr key={axis.id}>
                    <td><span className="cc-skill-code">{axis.code}</span>{axis.label}</td>
                    <td>{axis.value}%</td>
                    {theirs && <td>{theirs[i].value}%</td>}
                    <td>{axis.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </aside>
      </div>

      <div className="cc-grid cc-grid-2" style={{ marginTop: 20 }}>
        <div className="cc-card">
          <div className="cc-card-head">
            <h2>Today&apos;s missions</h2>
            <span className="cc-badge cc-badge-muted">{doneToday} / {missions.length || 6}</span>
          </div>
          <div className="cc-card-body">
            <div className="cc-progress" style={{ marginBottom: 18 }}>
              <div className="cc-progress-fill" style={{ width: `${missions.length ? (doneToday / missions.length) * 100 : 0}%` }} />
            </div>
            {missions.length === 0 ? (
              <p className="cc-muted" style={{ margin: 0 }}>Loading missions…</p>
            ) : (
              <div className="cc-grid" style={{ gap: 16 }}>
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
          <div className="cc-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {LAUNCH.map(([href, title, desc]) => (
              <Link key={href} href={href} className="cc-launch">
                <span className="cc-launch-title">{title} →</span>
                <span className="cc-launch-desc">{desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
