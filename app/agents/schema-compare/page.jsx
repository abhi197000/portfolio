"use client";
import { useState } from "react";
import Link from "next/link";
import GuidedTour from "../../../components/GuidedTour";
import "./schema-compare.css";

const DEMO_SOURCES = [
  { name: "Client Alpha", projectId: "alpha-prod-2024", datasetId: "alpha_ingestion" },
  { name: "Client Beta", projectId: "beta-prod-2024", datasetId: "beta_ingestion" },
  { name: "Client Gamma", projectId: "gamma-staging", datasetId: "gamma_ingestion" },
];

const DEMO_RESULTS = {
  results: [
    {
      tableName: "central_table",
      sources: ["Client Alpha", "Client Beta", "Client Gamma"],
      rows: [
        { column: "sku_id", "Client Alpha": "STRING", "Client Beta": "STRING", "Client Gamma": "STRING", isMismatch: false, details: [] },
        { column: "store_id", "Client Alpha": "INTEGER", "Client Beta": "INTEGER", "Client Gamma": "INTEGER", isMismatch: false, details: [] },
        { column: "demand_forecast", "Client Alpha": "FLOAT", "Client Beta": "FLOAT", "Client Gamma": "NUMERIC", isMismatch: true, details: [{ type: "type_diff", sources: ["Client Gamma"], expected: "FLOAT", actual: "NUMERIC" }] },
        { column: "safety_stock", "Client Alpha": "FLOAT", "Client Beta": "FLOAT", "Client Gamma": "FLOAT", isMismatch: false, details: [] },
        { column: "reorder_point", "Client Alpha": "INTEGER", "Client Beta": "INTEGER", "Client Gamma": "INTEGER", isMismatch: false, details: [] },
        { column: "lead_time_days", "Client Alpha": "INTEGER", "Client Beta": "FLOAT", "Client Gamma": "INTEGER", isMismatch: true, details: [{ type: "type_diff", sources: ["Client Beta"], expected: "INTEGER", actual: "FLOAT" }] },
        { column: "last_updated", "Client Alpha": "TIMESTAMP", "Client Beta": "TIMESTAMP", "Client Gamma": "DATE", isMismatch: true, details: [{ type: "type_diff", sources: ["Client Gamma"], expected: "TIMESTAMP", actual: "DATE" }] },
        { column: "vendor_code", "Client Alpha": "STRING", "Client Beta": "STRING", "Client Gamma": "—", isMismatch: true, details: [{ type: "missing", sources: ["Client Gamma"] }] },
        { column: "category", "Client Alpha": "STRING", "Client Beta": "STRING", "Client Gamma": "STRING", isMismatch: false, details: [] },
        { column: "is_active", "Client Alpha": "BOOLEAN", "Client Beta": "BOOLEAN", "Client Gamma": "BOOLEAN", isMismatch: false, details: [] },
      ],
      allColumns: ["sku_id", "store_id", "demand_forecast", "safety_stock", "reorder_point", "lead_time_days", "last_updated", "vendor_code", "category", "is_active"],
      errors: [],
      status: "ok",
    },
    {
      tableName: "order_policy",
      sources: ["Client Alpha", "Client Beta", "Client Gamma"],
      rows: [
        { column: "policy_id", "Client Alpha": "STRING", "Client Beta": "STRING", "Client Gamma": "STRING", isMismatch: false, details: [] },
        { column: "vendor_id", "Client Alpha": "STRING", "Client Beta": "STRING", "Client Gamma": "STRING", isMismatch: false, details: [] },
        { column: "min_order_qty", "Client Alpha": "INTEGER", "Client Beta": "INTEGER", "Client Gamma": "INTEGER", isMismatch: false, details: [] },
        { column: "max_order_qty", "Client Alpha": "INTEGER", "Client Beta": "INTEGER", "Client Gamma": "—", isMismatch: true, details: [{ type: "missing", sources: ["Client Gamma"] }] },
        { column: "order_multiple", "Client Alpha": "INTEGER", "Client Beta": "FLOAT", "Client Gamma": "INTEGER", isMismatch: true, details: [{ type: "type_diff", sources: ["Client Beta"], expected: "INTEGER", actual: "FLOAT" }] },
        { column: "effective_date", "Client Alpha": "DATE", "Client Beta": "DATE", "Client Gamma": "DATE", isMismatch: false, details: [] },
        { column: "expiry_date", "Client Alpha": "DATE", "Client Beta": "DATE", "Client Gamma": "DATE", isMismatch: false, details: [] },
        { column: "currency", "Client Alpha": "STRING", "Client Beta": "STRING", "Client Gamma": "STRING", isMismatch: false, details: [] },
      ],
      allColumns: ["policy_id", "vendor_id", "min_order_qty", "max_order_qty", "order_multiple", "effective_date", "expiry_date", "currency"],
      errors: [],
      status: "ok",
    },
  ],
};

export default function SchemaComparePage() {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [sources, setSources] = useState([]);
  const [newSource, setNewSource] = useState({
    name: "",
    projectId: "",
    datasetId: "",
  });
  const [selectedSources, setSelectedSources] = useState(new Set());
  const [tableInput, setTableInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [expandedTables, setExpandedTables] = useState(new Set());
  const [showInstructions, setShowInstructions] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  function loadDemo() {
    setSources(DEMO_SOURCES);
    setSelectedSources(new Set(DEMO_SOURCES.map((s) => s.name)));
    setTableInput("central_table, order_policy");
    setToken("demo-token");
    setResults(DEMO_RESULTS);
    setExpandedTables(new Set([0]));
    setDemoMode(true);
    setError("");
  }

  function exitDemo() {
    setSources([]);
    setSelectedSources(new Set());
    setTableInput("");
    setToken("");
    setResults(null);
    setExpandedTables(new Set());
    setDemoMode(false);
    setError("");
  }

  function addSource() {
    const { name, projectId, datasetId } = newSource;
    if (!name.trim() || !projectId.trim() || !datasetId.trim()) return;
    if (sources.some((s) => s.name === name.trim())) {
      setError("A source with this name already exists.");
      return;
    }
    const source = {
      name: name.trim(),
      projectId: projectId.trim(),
      datasetId: datasetId.trim(),
    };
    setSources((prev) => [...prev, source]);
    setSelectedSources((prev) => new Set([...prev, source.name]));
    setNewSource({ name: "", projectId: "", datasetId: "" });
    setError("");
  }

  function removeSource(name) {
    setSources((prev) => prev.filter((s) => s.name !== name));
    setSelectedSources((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  }

  function toggleSource(name) {
    setSelectedSources((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function selectAllSources() {
    setSelectedSources(new Set(sources.map((s) => s.name)));
  }

  function deselectAllSources() {
    setSelectedSources(new Set());
  }

  async function runComparison() {
    const selected = sources.filter((s) => selectedSources.has(s.name));
    const tables = tableInput
      .split(/[,\n]/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (!token.trim()) {
      setError("Please enter your GCP access token.");
      return;
    }
    if (selected.length < 2) {
      setError("Please select at least two sources to compare.");
      return;
    }
    if (!tables.length) {
      setError("Please enter at least one table name.");
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);
    setDemoMode(false);

    try {
      const res = await fetch("/api/schema/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          sources: selected,
          tables,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      setResults(data);
      if (data.results?.length) {
        setExpandedTables(new Set([0]));
      }
    } catch (e) {
      setError("Network error: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleTableExpand(index) {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function exportCSV() {
    if (!results?.results) return;
    let csv = "";
    for (const result of results.results) {
      if (!result.rows?.length) continue;
      csv += `\n=== ${result.tableName} ===\n`;
      const header = ["Column", ...result.sources, "Mismatch", "Details"];
      csv += header.map((h) => `"${h}"`).join(",") + "\n";
      for (const row of result.rows) {
        const cells = [row.column];
        for (const s of result.sources) cells.push(row[s] || "—");
        cells.push(row.isMismatch ? "Yes" : "No");
        const detailParts = (row.details || []).map((d) => {
          if (d.type === "type_diff")
            return `${d.sources.join("|")} have ${d.actual} (expected ${d.expected})`;
          if (d.type === "missing")
            return `Missing in: ${d.sources.join("|")}`;
          return "";
        });
        cells.push(detailParts.join("; "));
        csv +=
          cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",") +
          "\n";
      }
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schema_comparison.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const tourSteps = [
    {
      target: "[data-tour='sc-hero']",
      title: "Welcome",
      text: "Hi! I'm your demo guide. This agent compares BigQuery table schemas across multiple GCP projects and instantly spots mismatches. Let me walk you through a full run — sit back, I'll drive.",
      action: () => exitDemo(),
      wait: 3200,
    },
    {
      target: "[data-tour='sc-token']",
      title: "Authentication",
      text: "First, you'd paste a GCP access token here (from `gcloud auth print-access-token`). It's used only for the request, never stored. For this demo I'll use a sample token.",
      action: () => setToken("demo-token"),
      wait: 3000,
    },
    {
      target: "[data-tour='sc-sources']",
      title: "Data sources",
      text: "Next, you add the project + dataset pairs you want to compare. Watch — I'm adding three fictional client environments: Alpha, Beta, and Gamma.",
      action: () => {
        setSources(DEMO_SOURCES);
        setSelectedSources(new Set(DEMO_SOURCES.map((s) => s.name)));
      },
      wait: 3200,
    },
    {
      target: "[data-tour='sc-compare']",
      title: "Pick tables",
      text: "Now I type the table names to compare — central_table and order_policy. You can list as many tables as you like, comma-separated or one per line.",
      action: () => setTableInput("central_table, order_policy"),
      wait: 3000,
    },
    {
      target: "[data-tour='sc-run']",
      title: "Run comparison",
      text: "Time to hit Compare Schemas! The agent fetches every schema in parallel from the BigQuery API and lines the columns up side by side…",
      action: () => {
        setResults(DEMO_RESULTS);
        setExpandedTables(new Set([0]));
        setDemoMode(true);
        setError("");
      },
      wait: 2600,
    },
    {
      target: "[data-tour='sc-stats']",
      title: "Summary stats",
      text: "Done in seconds! The summary shows 2 tables and 18 columns scanned — 13 are consistent, but 5 mismatches need attention. Let's zoom into the details.",
      wait: 3200,
    },
    {
      target: "[data-tour='sc-result-0']",
      title: "Mismatch details",
      text: "Here's central_table. Notice demand_forecast is NUMERIC in Client Gamma but FLOAT elsewhere, and vendor_code is missing entirely in Gamma — exactly the drift that silently breaks pipelines.",
      wait: 4200,
    },
    {
      target: "[data-tour='sc-export']",
      title: "Export",
      text: "Finally, you can export the full comparison as CSV to share with your team. That's the whole flow — now try it yourself, or hit Exit Demo and connect your own GCP projects!",
      wait: 3800,
    },
  ];

  const stats = results?.results
    ? (() => {
        const tables = results.results.filter((r) => r.status === "ok").length;
        const totalCols = results.results.reduce(
          (a, r) => a + r.rows.length,
          0,
        );
        const mismatches = results.results.reduce(
          (a, r) => a + r.rows.filter((row) => row.isMismatch).length,
          0,
        );
        return {
          tables,
          totalCols,
          mismatches,
          consistent: totalCols - mismatches,
        };
      })()
    : null;

  function renderDetails(details) {
    if (!details?.length) {
      return (
        <span style={{ color: "#34d399", fontWeight: 600, fontSize: "0.82rem" }}>
          Consistent
        </span>
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {details.map((d, i) => {
          if (d.type === "type_diff") {
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {d.sources.map((s) => (
                  <span key={s} className="sc-detail-chip sc-detail-type-diff">
                    {s}
                  </span>
                ))}
                <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                  has
                </span>
                <code style={{ color: "#ef4444", fontWeight: 700, fontSize: "0.82rem" }}>
                  {d.actual}
                </code>
                <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                  (expected{" "}
                  <code style={{ color: "var(--text)", fontWeight: 600 }}>
                    {d.expected}
                  </code>
                  )
                </span>
              </div>
            );
          }
          if (d.type === "missing") {
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ color: "#fbbf24", fontSize: "0.78rem", fontWeight: 600 }}>
                  Missing in
                </span>
                {d.sources.map((s) => (
                  <span key={s} className="sc-detail-chip sc-detail-missing">
                    {s}
                  </span>
                ))}
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  }

  return (
    <div className="sc-page">
      <nav className="sc-nav">
        <div className="sc-nav-inner">
          <Link href="/" className="sc-nav-back">
            &larr; Back to Portfolio
          </Link>
          <span className="sc-nav-title">Schema Comparison Agent</span>
        </div>
      </nav>

      <GuidedTour steps={tourSteps} agentName="Schema Agent Guide" />

      <div className="sc-hero" data-tour="sc-hero">
        <h1>
          Schema <span>Comparison Agent</span>
        </h1>
        <p className="sc-hero-subtitle">BigQuery Schema Analyzer</p>
        <p className="sc-hero-desc">
          Compare table schemas across multiple GCP projects and datasets in
          seconds. Spot column mismatches, type differences, and missing fields
          &mdash; essential for teams maintaining schema consistency across
          client deployments, environments, or data pipelines.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
          {!demoMode && (
            <button className="sc-btn sc-btn-primary" onClick={loadDemo}>
              Try Demo
            </button>
          )}
          <Link
            href="/agents/schema-compare/guide"
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
          <div
            style={{
              padding: "12px 20px",
              background: "rgba(56, 189, 248, 0.1)",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <p style={{ color: "var(--accent)", fontSize: "0.88rem", fontWeight: 600 }}>
              Demo Mode &mdash; showing sample data from 3 fictional clients
              across 2 supply-chain tables.
            </p>
            <button
              className="sc-btn sc-btn-secondary"
              style={{ fontSize: "0.78rem", padding: "6px 14px" }}
              onClick={exitDemo}
            >
              Exit Demo
            </button>
          </div>
        )}

        {/* Access Token */}
        <div className="sc-card" data-tour="sc-token">
          <div className="sc-card-header">
            <div>
              <h2>Access Token</h2>
              <p>Your GCP access token for BigQuery API calls</p>
            </div>
            <button
              className="sc-btn sc-btn-secondary"
              style={{ fontSize: "0.78rem", padding: "6px 14px" }}
              onClick={() => setShowInstructions(!showInstructions)}
            >
              {showInstructions ? "Hide instructions" : "How to get a token"}
            </button>
          </div>
          <div className="sc-card-body">
            <div className="sc-token-group">
              <input
                type={showToken ? "text" : "password"}
                className="sc-input"
                placeholder="Paste your access token here"
                value={token}
                onChange={(e) => { setToken(e.target.value); if (demoMode) setDemoMode(false); }}
              />
              <button
                className="sc-btn sc-btn-secondary"
                onClick={() => setShowToken(!showToken)}
                style={{ whiteSpace: "nowrap" }}
              >
                {showToken ? "Hide" : "Show"}
              </button>
            </div>
            <p
              style={{
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                marginTop: 8,
                opacity: 0.7,
              }}
            >
              Your token is used only for the current request and is never
              stored.
            </p>
            {showInstructions && (
              <div className="sc-instructions">
                <p>
                  Run this command in your terminal to get a temporary access
                  token:
                </p>
                <p style={{ margin: "8px 0" }}>
                  <code>gcloud auth print-access-token</code>
                </p>
                <p>
                  This token is valid for ~60 minutes. Make sure you have the{" "}
                  <code>BigQuery Data Viewer</code> role on the projects you want
                  to query.
                </p>
                <p style={{ marginTop: 8 }}>
                  Need <code>gcloud</code>?{" "}
                  <a
                    href="https://cloud.google.com/sdk/docs/install"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--accent)" }}
                  >
                    Install the Google Cloud SDK
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Data Sources */}
        <div className="sc-card" data-tour="sc-sources">
          <div className="sc-card-header">
            <div>
              <h2>Data Sources</h2>
              <p>Add GCP project + dataset pairs to compare</p>
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {sources.length} source{sources.length !== 1 ? "s" : ""} added
            </span>
          </div>
          <div className="sc-card-body">
            {sources.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                {sources.map((s) => (
                  <div key={s.name} className="sc-source-item">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      <span className="sc-source-name">{s.name}</span>
                      <span className="sc-source-detail">
                        {s.projectId} / {s.datasetId}
                      </span>
                    </div>
                    <button
                      className="sc-btn sc-btn-danger"
                      onClick={() => removeSource(s.name)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="sc-add-form">
              <div>
                <label className="sc-label">Source Name</label>
                <input
                  className="sc-input"
                  placeholder="e.g. Client A"
                  value={newSource.name}
                  onChange={(e) =>
                    setNewSource({ ...newSource, name: e.target.value })
                  }
                  onKeyDown={(e) => e.key === "Enter" && addSource()}
                />
              </div>
              <div>
                <label className="sc-label">Project ID</label>
                <input
                  className="sc-input"
                  placeholder="e.g. my-gcp-project"
                  value={newSource.projectId}
                  onChange={(e) =>
                    setNewSource({ ...newSource, projectId: e.target.value })
                  }
                  onKeyDown={(e) => e.key === "Enter" && addSource()}
                />
              </div>
              <div>
                <label className="sc-label">Dataset ID</label>
                <input
                  className="sc-input"
                  placeholder="e.g. my_dataset"
                  value={newSource.datasetId}
                  onChange={(e) =>
                    setNewSource({ ...newSource, datasetId: e.target.value })
                  }
                  onKeyDown={(e) => e.key === "Enter" && addSource()}
                />
              </div>
              <button
                className="sc-btn sc-btn-primary"
                onClick={addSource}
                style={{ height: 42, marginTop: "auto" }}
              >
                + Add
              </button>
            </div>
          </div>
        </div>

        {/* Compare Section */}
        {sources.length > 0 && (
          <div className="sc-card" data-tour="sc-compare">
            <div className="sc-card-header">
              <div>
                <h2>Compare</h2>
                <p>Select sources and enter table names</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="sc-btn sc-btn-secondary"
                  style={{ fontSize: "0.78rem", padding: "6px 14px" }}
                  onClick={selectAllSources}
                >
                  Select All
                </button>
                <button
                  className="sc-btn sc-btn-secondary"
                  style={{ fontSize: "0.78rem", padding: "6px 14px" }}
                  onClick={deselectAllSources}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="sc-card-body">
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                {sources.map((s) => (
                  <button
                    key={s.name}
                    className={`sc-chip ${selectedSources.has(s.name) ? "sc-chip-active" : "sc-chip-inactive"}`}
                    onClick={() => toggleSource(s.name)}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
              <label className="sc-label">
                Table Names (one per line or comma-separated)
              </label>
              <textarea
                className="sc-input sc-textarea"
                placeholder={"e.g. users_table, orders_table\nor one table per line"}
                value={tableInput}
                onChange={(e) => setTableInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    runComparison();
                  }
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 16,
                }}
              >
                <button
                  className="sc-btn sc-btn-primary"
                  data-tour="sc-run"
                  onClick={runComparison}
                  disabled={loading}
                >
                  {loading ? "Comparing…" : "Compare Schemas"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && <div className="sc-error">{error}</div>}

        {/* Loading */}
        {loading && (
          <div className="sc-loading">
            <div className="sc-spinner" />
            <p style={{ color: "var(--text-muted)", marginTop: 16 }}>
              Fetching schemas from BigQuery&hellip;
            </p>
          </div>
        )}

        {/* Results */}
        {stats && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700 }}>Results</h2>
              <button className="sc-btn sc-btn-success" data-tour="sc-export" onClick={exportCSV}>
                Export CSV
              </button>
            </div>

            <div className="sc-stats" data-tour="sc-stats">
              <div className="sc-stat">
                <div className="sc-stat-value" style={{ color: "var(--text)" }}>
                  {stats.tables}
                </div>
                <div className="sc-stat-label">Tables</div>
              </div>
              <div className="sc-stat">
                <div className="sc-stat-value" style={{ color: "var(--accent)" }}>
                  {stats.totalCols}
                </div>
                <div className="sc-stat-label">Columns</div>
              </div>
              <div className="sc-stat">
                <div className="sc-stat-value" style={{ color: "#34d399" }}>
                  {stats.consistent}
                </div>
                <div className="sc-stat-label">Consistent</div>
              </div>
              <div className="sc-stat">
                <div className="sc-stat-value" style={{ color: "#ef4444" }}>
                  {stats.mismatches}
                </div>
                <div className="sc-stat-label">Mismatches</div>
              </div>
            </div>

            {results.results.map((result, idx) => {
              const mismatches = result.rows.filter((r) => r.isMismatch).length;
              const isExpanded = expandedTables.has(idx);
              const isError = result.status === "error" && !result.rows.length;

              return (
                <div key={idx} className="sc-card" data-tour={`sc-result-${idx}`}>
                  <div
                    className="sc-result-header"
                    onClick={() => toggleTableExpand(idx)}
                  >
                    <div className="sc-result-title">
                      <span
                        style={{
                          transition: "transform 0.2s",
                          display: "inline-block",
                          transform: isExpanded ? "rotate(90deg)" : "rotate(0)",
                          fontSize: "0.75rem",
                        }}
                      >
                        &#9654;
                      </span>
                      <strong>{result.tableName}</strong>
                      {isError ? (
                        <span className="sc-badge sc-badge-error">Error</span>
                      ) : mismatches > 0 ? (
                        <span className="sc-badge sc-badge-warn">
                          {mismatches} mismatch{mismatches > 1 ? "es" : ""}
                        </span>
                      ) : (
                        <span className="sc-badge sc-badge-ok">All consistent</span>
                      )}
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {result.rows.length} columns &middot; {result.sources.length} sources
                      </span>
                    </div>
                    <div className="sc-result-stats">
                      <span style={{ color: "var(--accent)" }}>{result.rows.length} cols</span>
                      <span style={{ color: "#34d399" }}>{result.rows.length - mismatches} ok</span>
                      <span style={{ color: "#ef4444" }}>{mismatches} diff</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ borderTop: "1px solid var(--border)" }}>
                      {result.errors?.length > 0 && (
                        <div className="sc-warnings">
                          {result.errors.map((e, i) => (
                            <li key={i}>{e}</li>
                          ))}
                        </div>
                      )}
                      {result.rows.length > 0 && (
                        <div className="sc-table-wrapper">
                          <table className="sc-table">
                            <thead>
                              <tr>
                                <th style={{ minWidth: 180 }}>Column</th>
                                {result.sources.map((s) => (
                                  <th key={s} style={{ minWidth: 140 }}>{s}</th>
                                ))}
                                <th style={{ minWidth: 240 }}>Details</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.rows.map((row) => (
                                <tr
                                  key={row.column}
                                  className={row.isMismatch ? "sc-row-mismatch" : ""}
                                >
                                  <td className="sc-col-name">
                                    {row.column}
                                    {row.isMismatch && (
                                      <span className="sc-badge-mismatch">mismatch</span>
                                    )}
                                  </td>
                                  {result.sources.map((s) => {
                                    const val = row[s] || "—";
                                    const blank = val === "—" || val === "N/A";
                                    return (
                                      <td
                                        key={s}
                                        className="sc-col-type"
                                        style={
                                          blank
                                            ? { color: "var(--text-muted)", opacity: 0.4, fontStyle: "italic" }
                                            : {}
                                        }
                                      >
                                        {val}
                                      </td>
                                    );
                                  })}
                                  <td>{renderDetails(row.details)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </main>

      <footer className="sc-footer">
        Schema Comparison Agent &middot; Built by Abhimanyu Sheoran
      </footer>
    </div>
  );
}
