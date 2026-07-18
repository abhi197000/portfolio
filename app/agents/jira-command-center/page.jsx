"use client";
import { useState } from "react";
import Link from "next/link";
import "../schema-compare/schema-compare.css";

/* ------------------------------------------------------------------ */
/*  Demo data                                                         */
/* ------------------------------------------------------------------ */
const DEMO_CONFIG = {
  jiraUrl: "https://acme-corp.atlassian.net",
  projectKey: "INV",
  username: "abhimanyu.s@acme-corp.com",
};

const DEMO_SPRINT_SUMMARY = {
  sprintName: "INVENTORY OMS-78",
  startDate: "2025-06-02",
  endDate: "2025-06-13",
  totals: {
    totalStories: 24,
    completed: 18,
    inProgress: 3,
    spillover: 3,
    totalPoints: 58,
    completedPoints: 42,
    completionPct: 72.4,
    bugCount: 7,
    bugsResolved: 5,
  },
  storyOverview: [
    { key: "INV-1201", summary: "Implement multi-warehouse stock sync", assignee: "Abhimanyu S.", points: 5, status: "Done" },
    { key: "INV-1202", summary: "Add real-time inventory threshold alerts", assignee: "Suhani S.", points: 3, status: "Done" },
    { key: "INV-1203", summary: "Build CSV bulk-upload for SKU catalog", assignee: "Sai R.", points: 5, status: "Done" },
    { key: "INV-1204", summary: "Order splitting logic for backorders", assignee: "Abhimanyu S.", points: 8, status: "Done" },
    { key: "INV-1205", summary: "Dashboard widget: stock-out risk heatmap", assignee: "Priya K.", points: 3, status: "In Progress" },
    { key: "INV-1206", summary: "Integrate Shopify webhook for order ingest", assignee: "Sai R.", points: 5, status: "Done" },
    { key: "INV-1207", summary: "Reorder-point calculation engine", assignee: "Suhani S.", points: 8, status: "Spillover" },
    { key: "INV-1208", summary: "API rate-limiter for vendor endpoints", assignee: "Abhimanyu S.", points: 3, status: "Done" },
    { key: "INV-1209", summary: "Fix negative-stock edge case on returns", assignee: "Priya K.", points: 2, status: "Done" },
    { key: "INV-1210", summary: "Warehouse transfer request workflow", assignee: "Sai R.", points: 5, status: "In Progress" },
    { key: "INV-1211", summary: "Add barcode scanning to receiving flow", assignee: "Suhani S.", points: 3, status: "Done" },
    { key: "INV-1212", summary: "Reporting: monthly inventory turnover", assignee: "Priya K.", points: 5, status: "Spillover" },
  ],
  assigneePerformance: [
    { name: "Abhimanyu S.", assigned: 7, completed: 6, points: 19, completedPoints: 16, score: 92 },
    { name: "Suhani S.", assigned: 6, completed: 4, points: 17, completedPoints: 9, score: 71 },
    { name: "Sai R.", assigned: 6, completed: 5, points: 18, completedPoints: 13, score: 85 },
    { name: "Priya K.", assigned: 5, completed: 3, points: 13, completedPoints: 7, score: 64 },
  ],
  bestPerformer: { name: "Abhimanyu S.", score: 92 },
  spilloverBuckets: [
    { bucket: "Carryover (prev sprint)", count: 1 },
    { bucket: "Scope creep (added mid-sprint)", count: 1 },
    { bucket: "Blocked by dependency", count: 1 },
  ],
};

const DEMO_NL_QUERIES = [
  {
    input: "Show me all open bugs assigned to Sai in the current sprint",
    jql: 'project = INV AND issuetype = Bug AND assignee = "Sai R." AND sprint in openSprints() AND status != Done',
    explanation: "Filters for bugs in the active sprint assigned to Sai R. that are not yet resolved.",
  },
  {
    input: "Find tickets updated in the last 3 days with more than 5 story points",
    jql: "project = INV AND updated >= -3d AND story_points > 5 ORDER BY updated DESC",
    explanation: "Returns recently touched high-effort tickets, sorted by last update.",
  },
  {
    input: "List all stories that spilled over from the previous sprint",
    jql: 'project = INV AND sprint in closedSprints() AND sprint in openSprints() AND issuetype = Story AND status != Done',
    explanation: "Identifies stories present in both a closed and open sprint, indicating spillover.",
  },
  {
    input: "What are the unresolved blockers for the OMS team?",
    jql: 'project = INV AND issuetype = Bug AND priority = Blocker AND status not in (Done, Closed) ORDER BY priority DESC',
    explanation: "Surfaces critical-priority bugs that are actively blocking the team.",
  },
  {
    input: "Give me the completed work this week grouped by assignee",
    jql: 'project = INV AND status changed to Done AFTER startOfWeek() ORDER BY assignee ASC',
    explanation: "Finds all tickets moved to Done this week, ordered by team member.",
  },
];

const DEMO_TEAM_SUMMARY = {
  statusBreakdown: [
    { status: "Done", count: 18, color: "#34d399" },
    { status: "In Progress", count: 3, color: "#38bdf8" },
    { status: "In Review", count: 2, color: "#a78bfa" },
    { status: "Spillover", count: 3, color: "#ef4444" },
    { status: "To Do", count: 4, color: "#6b7280" },
  ],
  ownerBreakdown: [
    { owner: "Abhimanyu S.", total: 7, done: 6, inProgress: 1 },
    { owner: "Suhani S.", total: 6, done: 4, inProgress: 1 },
    { owner: "Sai R.", total: 6, done: 5, inProgress: 1 },
    { owner: "Priya K.", total: 5, done: 3, inProgress: 0 },
    { owner: "Unassigned", total: 6, done: 0, inProgress: 0 },
  ],
  bugs: [
    { key: "INV-1220", summary: "Negative stock shown after return processing", priority: "High", status: "Done" },
    { key: "INV-1221", summary: "Webhook duplicate delivery on Shopify retry", priority: "Medium", status: "In Progress" },
    { key: "INV-1222", summary: "CSV upload fails for SKUs with special chars", priority: "High", status: "Done" },
    { key: "INV-1223", summary: "Dashboard widget timeout on large datasets", priority: "Low", status: "To Do" },
    { key: "INV-1224", summary: "Stock sync race condition across warehouses", priority: "Blocker", status: "Done" },
  ],
  features: [
    { key: "INV-1201", summary: "Multi-warehouse stock sync", points: 5, status: "Done" },
    { key: "INV-1203", summary: "CSV bulk-upload for SKU catalog", points: 5, status: "Done" },
    { key: "INV-1204", summary: "Order splitting for backorders", points: 8, status: "Done" },
    { key: "INV-1206", summary: "Shopify webhook order ingest", points: 5, status: "Done" },
    { key: "INV-1207", summary: "Reorder-point calculation engine", points: 8, status: "Spillover" },
    { key: "INV-1212", summary: "Monthly inventory turnover report", points: 5, status: "Spillover" },
  ],
};

const DEMO_TICKET_OPS = {
  create: {
    action: "CREATE",
    input: { summary: "Add purchase order approval workflow", type: "Story", assignee: "Suhani S.", points: 5 },
    result: { key: "INV-1230", status: "To Do", message: "Ticket created successfully." },
  },
  edit: {
    action: "EDIT",
    input: { key: "INV-1205", fields: { summary: "Dashboard widget: stock-out risk heatmap v2", story_points: 5 } },
    result: { key: "INV-1205", message: "Updated summary and story points." },
  },
  clone: {
    action: "CLONE (Multi-Client)",
    input: { sourceKey: "INV-1201", targetProjects: ["RETAIL", "WHOLESALE"], prefixSummary: true },
    result: {
      cloned: [
        { key: "RETAIL-401", summary: "[RETAIL] Implement multi-warehouse stock sync" },
        { key: "WHOLESALE-218", summary: "[WHOLESALE] Implement multi-warehouse stock sync" },
      ],
      message: "Cloned to 2 projects successfully.",
    },
  },
  transition: {
    action: "MOVE STATUS",
    input: { key: "INV-1210", from: "In Progress", to: "In Review" },
    result: { key: "INV-1210", message: "Status moved from In Progress to In Review." },
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export default function JiraCommandCenterPage() {
  const [demoMode, setDemoMode] = useState(false);
  const [activeTab, setActiveTab] = useState("sprint");

  const [config, setConfig] = useState({
    jiraUrl: "",
    projectKey: "",
    username: "",
    apiToken: "",
  });

  const [sprintData, setSprintData] = useState(null);
  const [nlQueries, setNlQueries] = useState([]);
  const [teamSummary, setTeamSummary] = useState(null);
  const [ticketOps, setTicketOps] = useState(null);
  const [nlInput, setNlInput] = useState("");
  const [nlResult, setNlResult] = useState(null);

  /* ---------- Demo ---------- */
  function loadDemo() {
    setConfig({ ...DEMO_CONFIG, apiToken: "demo-token" });
    setSprintData(DEMO_SPRINT_SUMMARY);
    setNlQueries(DEMO_NL_QUERIES);
    setTeamSummary(DEMO_TEAM_SUMMARY);
    setTicketOps(DEMO_TICKET_OPS);
    setDemoMode(true);
  }

  function exitDemo() {
    setConfig({ jiraUrl: "", projectKey: "", username: "", apiToken: "" });
    setSprintData(null);
    setNlQueries([]);
    setTeamSummary(null);
    setTicketOps(null);
    setNlInput("");
    setNlResult(null);
    setDemoMode(false);
  }

  function handleNlSubmit() {
    if (!nlInput.trim()) return;
    setNlResult({
      input: nlInput,
      jql: `project = ${config.projectKey || "INV"} AND summary ~ "${nlInput.split(" ").slice(0, 3).join(" ")}" ORDER BY updated DESC`,
      explanation: "Generated JQL based on your natural language query (demo mode).",
    });
  }

  const tabs = [
    { key: "sprint", label: "Sprint Analytics" },
    { key: "nlquery", label: "NL → JQL" },
    { key: "team", label: "Team Summary" },
    { key: "operations", label: "Operations" },
  ];

  const codeStyle = {
    color: "var(--accent)", background: "rgba(255,255,255,0.05)",
    padding: "2px 6px", borderRadius: 4, fontSize: "0.85rem",
  };

  /* ================================================================ */
  /*  Render                                                          */
  /* ================================================================ */
  return (
    <div className="sc-page">
      {/* Nav */}
      <nav className="sc-nav">
        <div className="sc-nav-inner">
          <Link href="/" className="sc-nav-back">&larr; Back to Portfolio</Link>
          <span className="sc-nav-title">Jira Command Center</span>
        </div>
      </nav>

      {/* Hero */}
      <div className="sc-hero">
        <h1>Jira Command <span>Center</span></h1>
        <p className="sc-hero-subtitle">AI-Powered Jira Operations Hub</p>
        <p className="sc-hero-desc">
          Translate natural language into JQL queries, run sprint analytics with
          per-assignee performance scoring, manage ticket operations (create,
          edit, clone, transition), and generate daily reports &mdash; all
          powered by Gemini LLM.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
          {!demoMode && (
            <button className="sc-btn sc-btn-primary" onClick={loadDemo}>Try Demo</button>
          )}
          <Link
            href="/agents/jira-command-center/guide"
            className="sc-btn sc-btn-secondary"
            style={{ textDecoration: "none" }}
          >
            Setup Guide &rarr;
          </Link>
        </div>
      </div>

      <main className="sc-main">
        {/* Demo Banner */}
        {demoMode && (
          <div className="sc-demo-banner" style={{
            padding: "12px 20px", background: "rgba(56,189,248,0.1)",
            border: "1px solid rgba(56,189,248,0.25)", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 12,
          }}>
            <p style={{ color: "var(--accent)", fontSize: "0.88rem", fontWeight: 600 }}>
              Demo Mode &mdash; showing sample Jira sprint data, NL-to-JQL
              conversions, and ticket operations for a fictional inventory
              management project.
            </p>
            <button
              className="sc-btn sc-btn-secondary"
              style={{ fontSize: "0.78rem", padding: "6px 14px" }}
              onClick={exitDemo}
            >Exit Demo</button>
          </div>
        )}

        {/* Connection Config (shown when NOT in demo) */}
        {!demoMode && (
          <div className="sc-card">
            <div className="sc-card-header">
              <div>
                <h2>Jira Connection</h2>
                <p>Configure your Jira Cloud instance</p>
              </div>
            </div>
            <div className="sc-card-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label className="sc-label">Jira Instance URL</label>
                  <input
                    className="sc-input"
                    placeholder="https://your-org.atlassian.net"
                    value={config.jiraUrl}
                    onChange={(e) => setConfig({ ...config, jiraUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label className="sc-label">Project Key</label>
                  <input
                    className="sc-input"
                    placeholder="e.g. INV"
                    value={config.projectKey}
                    onChange={(e) => setConfig({ ...config, projectKey: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="sc-label">Username (Email)</label>
                  <input
                    className="sc-input"
                    placeholder="you@company.com"
                    value={config.username}
                    onChange={(e) => setConfig({ ...config, username: e.target.value })}
                  />
                </div>
                <div>
                  <label className="sc-label">API Token</label>
                  <input
                    className="sc-input"
                    type="password"
                    placeholder="Your Jira API token"
                    value={config.apiToken}
                    onChange={(e) => setConfig({ ...config, apiToken: e.target.value })}
                  />
                </div>
              </div>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 12, opacity: 0.7 }}>
                This is a portfolio demo &mdash; no actual connection is made. Use the
                &ldquo;Try Demo&rdquo; button to see sample data.
              </p>
            </div>
          </div>
        )}

        {/* Tab Selector */}
        {demoMode && (
          <>
            <div style={{
              display: "flex", gap: 8, flexWrap: "wrap",
              padding: "4px", background: "var(--bg-card)",
              border: "1px solid var(--border)", borderRadius: 10,
            }}>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`sc-chip ${activeTab === tab.key ? "sc-chip-active" : "sc-chip-inactive"}`}
                  onClick={() => setActiveTab(tab.key)}
                  style={{ flex: 1, justifyContent: "center", minWidth: 120 }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ======================== Sprint Analytics Tab ======================== */}
            {activeTab === "sprint" && sprintData && (
              <>
                {/* Sprint header */}
                <div className="sc-card">
                  <div className="sc-card-header">
                    <div>
                      <h2>Sprint Overview</h2>
                      <p>{sprintData.sprintName} &middot; {sprintData.startDate} to {sprintData.endDate}</p>
                    </div>
                    <span className="sc-badge sc-badge-ok">Active Sprint</span>
                  </div>
                </div>

                {/* Stats cards */}
                <div className="sc-stats" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                  <div className="sc-stat">
                    <div className="sc-stat-value" style={{ color: "var(--accent)" }}>{sprintData.totals.totalStories}</div>
                    <div className="sc-stat-label">Total Stories</div>
                  </div>
                  <div className="sc-stat">
                    <div className="sc-stat-value" style={{ color: "#34d399" }}>{sprintData.totals.completionPct}%</div>
                    <div className="sc-stat-label">Completion</div>
                  </div>
                  <div className="sc-stat">
                    <div className="sc-stat-value" style={{ color: "#fbbf24" }}>{sprintData.totals.bugCount}</div>
                    <div className="sc-stat-label">Bugs</div>
                  </div>
                  <div className="sc-stat">
                    <div className="sc-stat-value" style={{ color: "#ef4444" }}>{sprintData.totals.spillover}</div>
                    <div className="sc-stat-label">Spillover</div>
                  </div>
                </div>

                {/* Story point breakdown */}
                <div className="sc-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                  <div className="sc-stat">
                    <div className="sc-stat-value" style={{ color: "var(--text)" }}>{sprintData.totals.totalPoints}</div>
                    <div className="sc-stat-label">Total Points</div>
                  </div>
                  <div className="sc-stat">
                    <div className="sc-stat-value" style={{ color: "#34d399" }}>{sprintData.totals.completedPoints}</div>
                    <div className="sc-stat-label">Completed Points</div>
                  </div>
                  <div className="sc-stat">
                    <div className="sc-stat-value" style={{ color: "#34d399" }}>{sprintData.totals.bugsResolved}/{sprintData.totals.bugCount}</div>
                    <div className="sc-stat-label">Bugs Resolved</div>
                  </div>
                </div>

                {/* Story overview table */}
                <div className="sc-card">
                  <div className="sc-card-header">
                    <div>
                      <h2>Story Overview</h2>
                      <p>All stories in this sprint</p>
                    </div>
                  </div>
                  <div className="sc-table-wrapper">
                    <table className="sc-table">
                      <thead>
                        <tr>
                          <th>Key</th>
                          <th>Summary</th>
                          <th>Assignee</th>
                          <th style={{ textAlign: "center" }}>Points</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sprintData.storyOverview.map((story) => (
                          <tr key={story.key} className={story.status === "Spillover" ? "sc-row-mismatch" : ""}>
                            <td className="sc-col-type">{story.key}</td>
                            <td>{story.summary}</td>
                            <td style={{ color: "var(--text-muted)" }}>{story.assignee}</td>
                            <td style={{ textAlign: "center", fontWeight: 700 }}>{story.points}</td>
                            <td>
                              <span className={`sc-badge ${
                                story.status === "Done" ? "sc-badge-ok" :
                                story.status === "In Progress" ? "sc-badge-warn" :
                                "sc-badge-error"
                              }`}>{story.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Per-assignee performance */}
                <div className="sc-card">
                  <div className="sc-card-header">
                    <div>
                      <h2>Assignee Performance</h2>
                      <p>Per-member scoring based on completion rate and story points</p>
                    </div>
                  </div>
                  <div className="sc-table-wrapper">
                    <table className="sc-table">
                      <thead>
                        <tr>
                          <th>Team Member</th>
                          <th style={{ textAlign: "center" }}>Assigned</th>
                          <th style={{ textAlign: "center" }}>Completed</th>
                          <th style={{ textAlign: "center" }}>Points</th>
                          <th style={{ textAlign: "center" }}>Completed Pts</th>
                          <th style={{ textAlign: "center" }}>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sprintData.assigneePerformance.map((p) => (
                          <tr key={p.name}>
                            <td style={{ fontWeight: 600 }}>
                              {p.name}
                              {p.name === sprintData.bestPerformer.name && (
                                <span className="sc-badge sc-badge-ok" style={{ marginLeft: 8, fontSize: "0.65rem" }}>
                                  Best Performer
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: "center" }}>{p.assigned}</td>
                            <td style={{ textAlign: "center" }}>{p.completed}</td>
                            <td style={{ textAlign: "center" }}>{p.points}</td>
                            <td style={{ textAlign: "center" }}>{p.completedPoints}</td>
                            <td style={{
                              textAlign: "center", fontWeight: 800,
                              color: p.score >= 85 ? "#34d399" : p.score >= 70 ? "#fbbf24" : "#ef4444",
                            }}>{p.score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Spillover breakdown */}
                <div className="sc-card">
                  <div className="sc-card-header">
                    <div>
                      <h2>Spillover Breakdown</h2>
                      <p>Why stories spilled over</p>
                    </div>
                  </div>
                  <div className="sc-card-body">
                    {sprintData.spilloverBuckets.map((b, i) => (
                      <div key={i} className="sc-source-item">
                        <span className="sc-source-name">{b.bucket}</span>
                        <span className="sc-badge sc-badge-error">{b.count} ticket{b.count !== 1 ? "s" : ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ======================== NL -> JQL Tab ======================== */}
            {activeTab === "nlquery" && (
              <>
                {/* Input area */}
                <div className="sc-card">
                  <div className="sc-card-header">
                    <div>
                      <h2>Natural Language Query</h2>
                      <p>Type a question and Gemini converts it to JQL</p>
                    </div>
                  </div>
                  <div className="sc-card-body">
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        className="sc-input"
                        placeholder="e.g. Show me all open bugs assigned to Sai"
                        value={nlInput}
                        onChange={(e) => setNlInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleNlSubmit(); }}
                      />
                      <button
                        className="sc-btn sc-btn-primary"
                        onClick={handleNlSubmit}
                        style={{ whiteSpace: "nowrap" }}
                      >Convert</button>
                    </div>
                    {nlResult && (
                      <div style={{ marginTop: 16 }}>
                        <label className="sc-label">Generated JQL</label>
                        <pre style={{
                          padding: 16, background: "var(--bg)", borderRadius: 8,
                          border: "1px solid var(--border)", overflowX: "auto",
                          fontSize: "0.82rem", lineHeight: 1.6, color: "#34d399",
                          fontFamily: "'Consolas','Monaco','Courier New',monospace",
                        }}>
                          <code>{nlResult.jql}</code>
                        </pre>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 8 }}>
                          {nlResult.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Example conversions */}
                <div className="sc-card">
                  <div className="sc-card-header">
                    <div>
                      <h2>Example Conversions</h2>
                      <p>Sample natural language to JQL translations</p>
                    </div>
                  </div>
                  <div className="sc-card-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {nlQueries.map((q, i) => (
                      <div key={i} style={{
                        padding: 16, background: "var(--bg)",
                        border: "1px solid var(--border)", borderRadius: 8,
                      }}>
                        <p style={{ fontWeight: 600, marginBottom: 8 }}>
                          <span style={{ color: "var(--accent)", marginRight: 8 }}>Q:</span>
                          {q.input}
                        </p>
                        <pre style={{
                          padding: 12, background: "rgba(0,0,0,0.3)", borderRadius: 6,
                          overflowX: "auto", fontSize: "0.82rem", lineHeight: 1.5,
                          color: "#34d399", margin: "8px 0",
                          fontFamily: "'Consolas','Monaco','Courier New',monospace",
                        }}>
                          <code>{q.jql}</code>
                        </pre>
                        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                          {q.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ======================== Team Summary Tab ======================== */}
            {activeTab === "team" && teamSummary && (
              <>
                {/* Status breakdown */}
                <div className="sc-card">
                  <div className="sc-card-header">
                    <div>
                      <h2>Status Breakdown</h2>
                      <p>Current ticket distribution by status</p>
                    </div>
                  </div>
                  <div className="sc-card-body">
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {teamSummary.statusBreakdown.map((s) => (
                        <div key={s.status} style={{
                          flex: 1, minWidth: 100, padding: "16px 12px",
                          background: "var(--bg)", border: "1px solid var(--border)",
                          borderRadius: 8, textAlign: "center",
                        }}>
                          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: s.color }}>{s.count}</div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4 }}>{s.status}</div>
                        </div>
                      ))}
                    </div>
                    {/* Status bar */}
                    <div style={{
                      marginTop: 16, height: 8, borderRadius: 4,
                      overflow: "hidden", display: "flex",
                      background: "var(--bg)",
                    }}>
                      {teamSummary.statusBreakdown.map((s) => {
                        const total = teamSummary.statusBreakdown.reduce((a, b) => a + b.count, 0);
                        return (
                          <div
                            key={s.status}
                            style={{
                              width: `${(s.count / total) * 100}%`,
                              background: s.color,
                              transition: "width 0.3s",
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Owner breakdown */}
                <div className="sc-card">
                  <div className="sc-card-header">
                    <div>
                      <h2>Owner Breakdown</h2>
                      <p>Tickets per team member</p>
                    </div>
                  </div>
                  <div className="sc-table-wrapper">
                    <table className="sc-table">
                      <thead>
                        <tr>
                          <th>Owner</th>
                          <th style={{ textAlign: "center" }}>Total</th>
                          <th style={{ textAlign: "center" }}>Done</th>
                          <th style={{ textAlign: "center" }}>In Progress</th>
                          <th style={{ textAlign: "center" }}>Remaining</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamSummary.ownerBreakdown.map((o) => (
                          <tr key={o.owner}>
                            <td style={{ fontWeight: 600 }}>{o.owner}</td>
                            <td style={{ textAlign: "center" }}>{o.total}</td>
                            <td style={{ textAlign: "center", color: "#34d399" }}>{o.done}</td>
                            <td style={{ textAlign: "center", color: "#38bdf8" }}>{o.inProgress}</td>
                            <td style={{ textAlign: "center", color: "#fbbf24" }}>{o.total - o.done - o.inProgress}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bugs list */}
                <div className="sc-card">
                  <div className="sc-card-header">
                    <div>
                      <h2>Bug Tracker</h2>
                      <p>{teamSummary.bugs.length} bugs in current sprint</p>
                    </div>
                  </div>
                  <div className="sc-table-wrapper">
                    <table className="sc-table">
                      <thead>
                        <tr>
                          <th>Key</th>
                          <th>Summary</th>
                          <th>Priority</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamSummary.bugs.map((bug) => (
                          <tr key={bug.key} className={bug.priority === "Blocker" ? "sc-row-mismatch" : ""}>
                            <td className="sc-col-type">{bug.key}</td>
                            <td>{bug.summary}</td>
                            <td>
                              <span className={`sc-badge ${
                                bug.priority === "Blocker" ? "sc-badge-error" :
                                bug.priority === "High" ? "sc-badge-warn" :
                                "sc-badge-ok"
                              }`}>{bug.priority}</span>
                            </td>
                            <td>
                              <span className={`sc-badge ${bug.status === "Done" ? "sc-badge-ok" : "sc-badge-warn"}`}>
                                {bug.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Features list */}
                <div className="sc-card">
                  <div className="sc-card-header">
                    <div>
                      <h2>Feature Delivery</h2>
                      <p>Key features this sprint</p>
                    </div>
                  </div>
                  <div className="sc-table-wrapper">
                    <table className="sc-table">
                      <thead>
                        <tr>
                          <th>Key</th>
                          <th>Summary</th>
                          <th style={{ textAlign: "center" }}>Points</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamSummary.features.map((f) => (
                          <tr key={f.key} className={f.status === "Spillover" ? "sc-row-mismatch" : ""}>
                            <td className="sc-col-type">{f.key}</td>
                            <td>{f.summary}</td>
                            <td style={{ textAlign: "center", fontWeight: 700 }}>{f.points}</td>
                            <td>
                              <span className={`sc-badge ${f.status === "Done" ? "sc-badge-ok" : "sc-badge-error"}`}>
                                {f.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ======================== Operations Tab ======================== */}
            {activeTab === "operations" && ticketOps && (
              <>
                <div className="sc-card">
                  <div className="sc-card-header">
                    <div>
                      <h2>Ticket Operations</h2>
                      <p>Create, edit, clone, and transition tickets</p>
                    </div>
                  </div>
                  <div className="sc-card-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {/* Create */}
                    <div style={{
                      padding: 16, background: "var(--bg)",
                      border: "1px solid var(--border)", borderRadius: 8,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span className="sc-badge sc-badge-ok">CREATE</span>
                        <span style={{ fontWeight: 600 }}>Create a new ticket</span>
                      </div>
                      <pre style={{
                        padding: 12, background: "rgba(0,0,0,0.3)", borderRadius: 6,
                        overflowX: "auto", fontSize: "0.82rem", lineHeight: 1.5,
                        color: "var(--text-muted)", margin: "8px 0",
                        fontFamily: "'Consolas','Monaco','Courier New',monospace",
                      }}>
                        <code>{`> create ticket
  Summary:  ${ticketOps.create.input.summary}
  Type:     ${ticketOps.create.input.type}
  Assignee: ${ticketOps.create.input.assignee}
  Points:   ${ticketOps.create.input.points}

[OK] ${ticketOps.create.result.key} created (${ticketOps.create.result.status})
${ticketOps.create.result.message}`}</code>
                      </pre>
                    </div>

                    {/* Edit */}
                    <div style={{
                      padding: 16, background: "var(--bg)",
                      border: "1px solid var(--border)", borderRadius: 8,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span className="sc-badge sc-badge-warn">EDIT</span>
                        <span style={{ fontWeight: 600 }}>Edit an existing ticket</span>
                      </div>
                      <pre style={{
                        padding: 12, background: "rgba(0,0,0,0.3)", borderRadius: 6,
                        overflowX: "auto", fontSize: "0.82rem", lineHeight: 1.5,
                        color: "var(--text-muted)", margin: "8px 0",
                        fontFamily: "'Consolas','Monaco','Courier New',monospace",
                      }}>
                        <code>{`> edit ${ticketOps.edit.input.key}
  summary:      "${ticketOps.edit.input.fields.summary}"
  story_points: ${ticketOps.edit.input.fields.story_points}

[OK] ${ticketOps.edit.result.key} updated
${ticketOps.edit.result.message}`}</code>
                      </pre>
                    </div>

                    {/* Clone */}
                    <div style={{
                      padding: 16, background: "var(--bg)",
                      border: "1px solid var(--border)", borderRadius: 8,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span className="sc-badge" style={{
                          background: "rgba(167,139,250,0.15)", color: "#a78bfa",
                        }}>CLONE</span>
                        <span style={{ fontWeight: 600 }}>Clone to multiple projects</span>
                      </div>
                      <pre style={{
                        padding: 12, background: "rgba(0,0,0,0.3)", borderRadius: 6,
                        overflowX: "auto", fontSize: "0.82rem", lineHeight: 1.5,
                        color: "var(--text-muted)", margin: "8px 0",
                        fontFamily: "'Consolas','Monaco','Courier New',monospace",
                      }}>
                        <code>{`> clone ${ticketOps.clone.input.sourceKey} -> [${ticketOps.clone.input.targetProjects.join(", ")}]
  Prefix summary: ${ticketOps.clone.input.prefixSummary ? "Yes" : "No"}

${ticketOps.clone.result.cloned.map((c) => `  [OK] ${c.key}: ${c.summary}`).join("\n")}

${ticketOps.clone.result.message}`}</code>
                      </pre>
                    </div>

                    {/* Transition */}
                    <div style={{
                      padding: 16, background: "var(--bg)",
                      border: "1px solid var(--border)", borderRadius: 8,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span className="sc-badge" style={{
                          background: "rgba(56,189,248,0.15)", color: "#38bdf8",
                        }}>TRANSITION</span>
                        <span style={{ fontWeight: 600 }}>Move ticket status</span>
                      </div>
                      <pre style={{
                        padding: 12, background: "rgba(0,0,0,0.3)", borderRadius: 6,
                        overflowX: "auto", fontSize: "0.82rem", lineHeight: 1.5,
                        color: "var(--text-muted)", margin: "8px 0",
                        fontFamily: "'Consolas','Monaco','Courier New',monospace",
                      }}>
                        <code>{`> move ${ticketOps.transition.input.key}
  From: ${ticketOps.transition.input.from}
  To:   ${ticketOps.transition.input.to}

[OK] ${ticketOps.transition.result.key}
${ticketOps.transition.result.message}`}</code>
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Additional capabilities */}
                <div className="sc-card">
                  <div className="sc-card-header">
                    <div>
                      <h2>Additional Capabilities</h2>
                      <p>More operations available in the full app</p>
                    </div>
                  </div>
                  <div className="sc-card-body" style={{ lineHeight: 1.8 }}>
                    <ul style={{ paddingLeft: 20, color: "var(--text-muted)" }}>
                      <li>
                        <strong style={{ color: "var(--text)" }}>Add Comment</strong> &mdash;{" "}
                        Post comments to any ticket programmatically
                      </li>
                      <li>
                        <strong style={{ color: "var(--text)" }}>Daily Report Email</strong> &mdash;{" "}
                        Generate and send sprint status emails via SMTP
                      </li>
                      <li>
                        <strong style={{ color: "var(--text)" }}>CSV Export</strong> &mdash;{" "}
                        Download filtered ticket data as CSV
                      </li>
                      <li>
                        <strong style={{ color: "var(--text)" }}>Bulk Operations</strong> &mdash;{" "}
                        Apply changes across multiple tickets at once
                      </li>
                    </ul>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>

      <footer className="sc-footer">
        Jira Command Center &middot; Built by Abhimanyu Sheoran
      </footer>
    </div>
  );
}
