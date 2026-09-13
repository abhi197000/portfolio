"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listQuestions } from "../../lib/practiceApi";
import { pickDailyTasks } from "../../lib/dailyTasks";

function TaskRow({ q, done }) {
  return (
    <Link href={`/practice/${q.slug}`} className={`cc-task ${done ? "cc-task-done" : ""}`}>
      <span className={`cc-task-check ${done ? "on" : ""}`}>{done ? "✓" : ""}</span>
      <span style={{ flex: 1 }}>
        <span className="cc-task-title">{q.title}</span>
        <div className="cc-task-meta">{(q.topic_tags || []).slice(0, 3).join(", ") || q.category.toUpperCase()}</div>
      </span>
      <span className={`cc-badge ${q.category === "sql" ? "cc-badge-blue" : "cc-badge-pink"}`}>
        {q.category.toUpperCase()}
      </span>
    </Link>
  );
}

export default function DashboardClient({ greetingName }) {
  const [tasks, setTasks] = useState({ sql: [], python: [] });
  const [doneSlugs, setDoneSlugs] = useState(new Set());
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [questions, dailyRes] = await Promise.all([
        listQuestions(),
        fetch("/api/app/daily").then((r) => (r.ok ? r.json() : { today: [], streak: { current: 0, longest: 0 } })).catch(() => ({ today: [], streak: { current: 0, longest: 0 } })),
      ]);
      setTasks(pickDailyTasks(questions));
      setDoneSlugs(new Set(dailyRes.today || []));
      setStreak(dailyRes.streak || { current: 0, longest: 0 });
      setLoading(false);
    })();
  }, []);

  const allToday = [...tasks.sql, ...tasks.python];
  const doneCount = allToday.filter((q) => doneSlugs.has(q.slug)).length;
  const totalToday = allToday.length || 6;

  return (
    <main className="cc-main">
      <h1 className="cc-hero-greeting">
        Welcome back, <span style={{ textTransform: "capitalize" }}>{greetingName}</span> 👋
      </h1>
      <p className="cc-hero-sub">
        Ten focused questions beat a hundred cold applications. Here&apos;s today&apos;s set.
      </p>

      <div className="cc-grid cc-grid-2">
        <div className="cc-card">
          <div className="cc-card-head">
            <h2>Today&apos;s Practice</h2>
            <span className="cc-badge cc-badge-muted">{doneCount} / {totalToday} done</span>
          </div>
          <div className="cc-card-body">
            <div className="cc-progress" style={{ marginBottom: 18 }}>
              <div className="cc-progress-fill" style={{ width: `${(doneCount / totalToday) * 100}%` }} />
            </div>

            {loading ? (
              <p className="cc-muted">Loading today&apos;s tasks…</p>
            ) : (
              <div className="cc-grid" style={{ gap: 20 }}>
                <div>
                  <div className="cc-task-meta" style={{ marginBottom: 8, fontWeight: 600 }}>SQL · 3 questions</div>
                  <div className="cc-grid" style={{ gap: 8 }}>
                    {tasks.sql.map((q) => <TaskRow key={q.slug} q={q} done={doneSlugs.has(q.slug)} />)}
                  </div>
                </div>
                <div>
                  <div className="cc-task-meta" style={{ marginBottom: 8, fontWeight: 600 }}>Python · 3 questions</div>
                  <div className="cc-grid" style={{ gap: 8 }}>
                    {tasks.python.map((q) => <TaskRow key={q.slug} q={q} done={doneSlugs.has(q.slug)} />)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="cc-grid" style={{ alignContent: "start" }}>
          <div className="cc-card">
            <div className="cc-card-head"><h2>Your Streak</h2></div>
            <div className="cc-card-body">
              <div style={{ display: "flex", gap: 28 }}>
                <div>
                  <div className="cc-stat-num"><span className="cc-streak-flame">🔥</span> {streak.current}</div>
                  <div className="cc-stat-label">day streak</div>
                </div>
                <div>
                  <div className="cc-stat-num">{streak.longest}</div>
                  <div className="cc-stat-label">longest</div>
                </div>
              </div>
              <p className="cc-muted" style={{ fontSize: 13, marginTop: 14, marginBottom: 0 }}>
                Finish at least one question a day to keep it alive.
              </p>
            </div>
          </div>

          <div className="cc-card" id="resume">
            <div className="cc-card-head">
              <h2>Your Living Resume</h2>
              <span className="cc-badge cc-badge-pink">New</span>
            </div>
            <div className="cc-card-body">
              <p className="cc-muted" style={{ marginTop: 0, fontSize: 14 }}>
                Upload your resume once — we turn it into a knowledge graph you can update in a
                click whenever you ship something new.
              </p>
              <Link href="/app/resume" className="cc-btn cc-btn-primary cc-btn-block" style={{ marginTop: 8 }}>
                Set up my resume →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
