"use client";
import { useState } from "react";
import Link from "next/link";
import GuidedTour from "../../../components/GuidedTour";
import "../schema-compare/schema-compare.css";

/* ------------------------------------------------------------------ */
/*  Demo data                                                         */
/* ------------------------------------------------------------------ */
const DEMO_CONNECTION = {
  billingProject: "analytics-prod-2024",
  projectId: "analytics-prod-2024",
  datasetId: "retail_warehouse",
  tableName: "sales_transactions",
  location: "US",
};

const DEMO_COLUMNS = [
  "order_id", "line_item_id", "store_id", "product_sku", "quantity",
  "unit_price", "discount_pct", "total_amount", "transaction_date",
  "customer_id", "payment_method", "sales_channel",
];

const DEMO_GRAIN = ["order_id", "line_item_id", "store_id"];

const DEMO_RESULTS = {
  totalRows: 8,
  rows: [
    { order_id: "ORD-2024-88431", line_item_id: "LI-003", store_id: "STR-045", duplicate_count: "5" },
    { order_id: "ORD-2024-77219", line_item_id: "LI-001", store_id: "STR-012", duplicate_count: "4" },
    { order_id: "ORD-2024-65002", line_item_id: "LI-002", store_id: "STR-045", duplicate_count: "3" },
    { order_id: "ORD-2024-91107", line_item_id: "LI-001", store_id: "STR-023", duplicate_count: "3" },
    { order_id: "ORD-2024-54890", line_item_id: "LI-004", store_id: "STR-067", duplicate_count: "2" },
    { order_id: "ORD-2024-42311", line_item_id: "LI-001", store_id: "STR-089", duplicate_count: "2" },
    { order_id: "ORD-2024-33056", line_item_id: "LI-002", store_id: "STR-012", duplicate_count: "2" },
    { order_id: "ORD-2024-29844", line_item_id: "LI-001", store_id: "STR-045", duplicate_count: "2" },
  ],
};

const DEMO_CTE_SQL = `WITH raw_orders AS (
  SELECT order_id, line_item_id, store_id, product_sku, quantity, unit_price
  FROM \`analytics-prod-2024.retail_staging.raw_order_lines\`
  WHERE transaction_date >= '2024-01-01'
),
enriched_products AS (
  SELECT r.*, p.category, p.brand
  FROM raw_orders r
  LEFT JOIN \`analytics-prod-2024.retail_warehouse.product_dim\` p
    ON r.product_sku = p.sku_id
),
joined_inventory AS (
  SELECT e.*, i.warehouse_qty, i.reorder_point
  FROM enriched_products e
  LEFT JOIN \`analytics-prod-2024.retail_warehouse.inventory_snapshot\` i
    ON e.product_sku = i.sku_id AND e.store_id = i.store_id
),
final_aggregation AS (
  SELECT order_id, line_item_id, store_id, product_sku,
         quantity, unit_price, category, brand,
         warehouse_qty, reorder_point,
         quantity * unit_price AS total_amount
  FROM joined_inventory
)
SELECT * FROM final_aggregation`;

const DEMO_CTE_RESULTS = {
  cte_0: { status: "clean" },
  cte_1: { status: "clean" },
  cte_2: { status: "duplicates", dupGroups: 8, extraRows: 15 },
  cte_3: { status: "duplicates", dupGroups: 8, extraRows: 15 },
};

/* ------------------------------------------------------------------ */
/*  CTE parser (mirrors the Python version)                           */
/* ------------------------------------------------------------------ */
function parseCTEs(sql) {
  const cleaned = sql.trim();
  if (!/^\s*WITH\b/i.test(cleaned)) {
    return [{ name: "__final__", body: cleaned }];
  }
  const ctes = [];
  let remainder = cleaned.replace(/^\s*WITH\s+/i, "");
  while (true) {
    const m = remainder.match(/^(\w+)\s+AS\s*\(/i);
    if (!m) break;
    const cteName = m[1];
    const start = m[0].length - 1;
    let depth = 0;
    let idx = start;
    for (idx = start; idx < remainder.length; idx++) {
      if (remainder[idx] === "(") depth++;
      else if (remainder[idx] === ")") {
        depth--;
        if (depth === 0) break;
      }
    }
    ctes.push({ name: cteName, body: remainder.substring(start + 1, idx).trim() });
    remainder = remainder.substring(idx + 1).trim();
    if (remainder.startsWith(",")) remainder = remainder.substring(1).trim();
  }
  if (remainder.trim()) ctes.push({ name: "__final__", body: remainder.trim() });
  return ctes;
}

function buildCteDupQuery(ctes, targetIdx, levelCols, fullTable) {
  const colList = levelCols.join(", ");
  const numbered = levelCols.map((_, i) => i + 1).join(", ");
  const target = ctes[targetIdx];
  if (target.name === "__final__") {
    const preceding = ctes.slice(0, targetIdx);
    const withClause = preceding.length
      ? "WITH " + preceding.map((c) => `${c.name} AS (\n${c.body}\n)`).join(",\n") + ","
      : "WITH";
    return `${withClause}\n__final__ AS (\n${target.body}\n)\nSELECT ${colList}, COUNT(*) AS dup_count\nFROM __final__\nGROUP BY ${numbered}\nHAVING COUNT(*) <> 1\nORDER BY dup_count DESC`;
  }
  const preceding = ctes.slice(0, targetIdx + 1);
  const wc = "WITH " + preceding.map((c) => `${c.name} AS (\n${c.body}\n)`).join(",\n");
  return `${wc}\nSELECT ${colList}, COUNT(*) AS dup_count\nFROM ${target.name}\nGROUP BY ${numbered}\nHAVING COUNT(*) <> 1\nORDER BY dup_count DESC`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export default function DuplicateCheckerPage() {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const [conn, setConn] = useState({
    billingProject: "",
    projectId: "",
    datasetId: "",
    tableName: "",
    location: "US",
  });

  const [columns, setColumns] = useState([]);
  const [selectedCols, setSelectedCols] = useState([]);
  const [fetchingSchema, setFetchingSchema] = useState(false);

  const [results, setResults] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const [demoMode, setDemoMode] = useState(false);

  const [sqlInput, setSqlInput] = useState("");
  const [parsedCTEs, setParsedCTEs] = useState([]);
  const [cteResults, setCteResults] = useState({});
  const [checkingCTE, setCheckingCTE] = useState(null);

  /* ---------- Demo ---------- */
  function loadDemo() {
    setConn(DEMO_CONNECTION);
    setToken("demo-token");
    setColumns(DEMO_COLUMNS);
    setSelectedCols(DEMO_GRAIN);
    setResults(DEMO_RESULTS);
    setSqlInput(DEMO_CTE_SQL);
    setParsedCTEs(parseCTEs(DEMO_CTE_SQL));
    setCteResults(DEMO_CTE_RESULTS);
    setDemoMode(true);
    setError("");
  }

  function exitDemo() {
    setConn({ billingProject: "", projectId: "", datasetId: "", tableName: "", location: "US" });
    setToken("");
    setColumns([]);
    setSelectedCols([]);
    setResults(null);
    setSqlInput("");
    setParsedCTEs([]);
    setCteResults({});
    setDemoMode(false);
    setError("");
  }

  /* ---------- Fetch schema ---------- */
  async function fetchSchema() {
    if (!token.trim()) { setError("Please enter your GCP access token."); return; }
    if (!conn.projectId.trim() || !conn.datasetId.trim() || !conn.tableName.trim()) {
      setError("Please fill in Project ID, Dataset ID, and Table Name.");
      return;
    }
    setFetchingSchema(true);
    setError("");
    setColumns([]);
    setSelectedCols([]);
    setResults(null);
    setCteResults({});
    setParsedCTEs([]);
    try {
      const res = await fetch("/api/duplicate/schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          projectId: conn.projectId.trim(),
          datasetId: conn.datasetId.trim(),
          tableName: conn.tableName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to fetch schema."); return; }
      setColumns(data.columns.map((c) => c.name));
    } catch (e) {
      setError("Network error: " + e.message);
    } finally {
      setFetchingSchema(false);
    }
  }

  /* ---------- Column selection ---------- */
  function toggleColumn(col) {
    setSelectedCols((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col],
    );
  }

  /* ---------- Check duplicates ---------- */
  async function checkDuplicates() {
    if (!token.trim()) { setError("Please enter your GCP access token."); return; }
    if (selectedCols.length === 0) { setError("Please select at least one grain column."); return; }

    const billing = conn.billingProject.trim() || conn.projectId.trim();
    const fullTable = `\`${conn.projectId.trim()}.${conn.datasetId.trim()}.${conn.tableName.trim()}\``;
    const colList = selectedCols.join(", ");
    const numbered = selectedCols.map((_, i) => i + 1).join(", ");
    const query = `SELECT ${colList}, COUNT(*) AS duplicate_count\nFROM ${fullTable}\nGROUP BY ${numbered}\nHAVING COUNT(*) <> 1\nORDER BY duplicate_count DESC`;

    setChecking(true);
    setError("");
    setResults(null);
    setCteResults({});
    setParsedCTEs([]);
    setSqlInput("");
    try {
      const res = await fetch("/api/duplicate/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          billingProject: billing,
          query,
          location: conn.location.trim() || "US",
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Query failed."); return; }
      setResults(data);
    } catch (e) {
      setError("Network error: " + e.message);
    } finally {
      setChecking(false);
    }
  }

  /* ---------- CTE debugger ---------- */
  function handleParseCTEs() {
    if (!sqlInput.trim()) return;
    const ctes = parseCTEs(sqlInput);
    setParsedCTEs(ctes);
    setCteResults({});
  }

  async function checkCTE(idx) {
    if (demoMode) return;
    if (!token.trim() || selectedCols.length === 0) return;

    const billing = conn.billingProject.trim() || conn.projectId.trim();
    const fullTable = `\`${conn.projectId.trim()}.${conn.datasetId.trim()}.${conn.tableName.trim()}\``;
    const query = buildCteDupQuery(parsedCTEs, idx, selectedCols, fullTable);

    setCheckingCTE(idx);
    try {
      const res = await fetch("/api/duplicate/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          billingProject: billing,
          query,
          location: conn.location.trim() || "US",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCteResults((prev) => ({ ...prev, [`cte_${idx}`]: { status: "error", error: data.error } }));
      } else if (data.rows.length === 0) {
        setCteResults((prev) => ({ ...prev, [`cte_${idx}`]: { status: "clean" } }));
      } else {
        const dupGroups = data.rows.length;
        const extraRows = data.rows.reduce((a, r) => a + (parseInt(r.dup_count || "0", 10) - 1), 0);
        setCteResults((prev) => ({ ...prev, [`cte_${idx}`]: { status: "duplicates", dupGroups, extraRows } }));
      }
    } catch (e) {
      setCteResults((prev) => ({ ...prev, [`cte_${idx}`]: { status: "error", error: e.message } }));
    } finally {
      setCheckingCTE(null);
    }
  }

  /* ---------- Export CSV ---------- */
  function exportCSV() {
    if (!results?.rows?.length) return;
    const allCols = [...selectedCols, "duplicate_count"];
    let csv = allCols.map((c) => `"${c}"`).join(",") + "\n";
    for (const row of results.rows) {
      csv += allCols.map((c) => `"${String(row[c] ?? "").replace(/"/g, '""')}"`).join(",") + "\n";
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "duplicates.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /* ---------- Computed stats ---------- */
  const stats = results?.rows
    ? (() => {
        const groups = results.rows.length;
        const extraRows = results.rows.reduce(
          (a, r) => a + (parseInt(r.duplicate_count || "0", 10) - 1), 0,
        );
        const maxCopies = results.rows.reduce(
          (a, r) => Math.max(a, parseInt(r.duplicate_count || "0", 10)), 0,
        );
        return { groups, extraRows, maxCopies };
      })()
    : null;

  const fullTableRef = conn.projectId && conn.datasetId && conn.tableName
    ? `\`${conn.projectId}.${conn.datasetId}.${conn.tableName}\``
    : "";

  /* ---------- Debug query for worst offender ---------- */
  const debugQuery = results?.rows?.length
    ? (() => {
        const worst = results.rows[0];
        const parts = selectedCols.map((col) => {
          const val = worst[col];
          if (val == null) return `${col} IS NULL`;
          return `${col} = '${String(val).replace(/'/g, "\\'")}'`;
        });
        return `SELECT *\nFROM ${fullTableRef}\nWHERE ${parts.join("\n  AND ")}`;
      })()
    : "";

  const tourSteps = [
    {
      target: "[data-tour='dup-hero']",
      title: "Welcome",
      text: "Hi! I'm your demo guide. This agent finds duplicate rows in any BigQuery table, then debugs your SQL CTE-by-CTE to pinpoint exactly where the duplicates creep in. Let me show you a full run.",
      action: () => exitDemo(),
      wait: 3400,
    },
    {
      target: "[data-tour='dup-token']",
      title: "Authentication",
      text: "You start with a GCP access token — one gcloud command gets you a temporary one. It's only used for the request, never stored. I'll drop in a demo token.",
      action: () => setToken("demo-token"),
      wait: 3000,
    },
    {
      target: "[data-tour='dup-conn']",
      title: "Point at a table",
      text: "Next, point the agent at a table. I'm filling in a fictional retail warehouse: analytics-prod-2024.retail_warehouse.sales_transactions.",
      action: () => setConn(DEMO_CONNECTION),
      wait: 3200,
    },
    {
      target: "[data-tour='dup-grain']",
      title: "Define the grain",
      text: "After fetching the schema, you pick the columns that should make a row unique — the 'grain'. I've selected order_id + line_item_id + store_id from the 12 available columns.",
      action: () => {
        setColumns(DEMO_COLUMNS);
        setSelectedCols(DEMO_GRAIN);
      },
      wait: 3600,
    },
    {
      target: "[data-tour='dup-stats']",
      title: "Run the check",
      text: "Running the duplicate check… and we have findings! 8 duplicate groups, 15 extra rows, and one combination appearing 5 times. The GROUP BY + HAVING query did all the work.",
      action: () => {
        setResults(DEMO_RESULTS);
        setDemoMode(true);
        setError("");
      },
      wait: 3600,
    },
    {
      target: "[data-tour='dup-rows']",
      title: "The offenders",
      text: "Here's every duplicate combination sorted worst-first. ORD-2024-88431 at store STR-045 appears 5 times — a clear data-quality incident.",
      wait: 3200,
    },
    {
      target: "[data-tour='dup-cte']",
      title: "CTE debugger",
      text: "Now the best part: paste the SQL that builds this table and the agent tests each CTE separately. See the traffic lights? raw_orders and enriched_products are clean, but joined_inventory turns red — the inventory join is fanning out rows!",
      action: () => {
        setSqlInput(DEMO_CTE_SQL);
        setParsedCTEs(parseCTEs(DEMO_CTE_SQL));
        setCteResults(DEMO_CTE_RESULTS);
      },
      wait: 4600,
    },
    {
      target: "[data-tour='dup-cte']",
      title: "Your turn",
      text: "That's how you go from 'we have duplicates' to 'this exact JOIN causes them' in minutes. Try it on your own tables — the Setup Guide has everything you need!",
      wait: 3600,
    },
  ];

  /* ================================================================ */
  /*  Render                                                          */
  /* ================================================================ */
  return (
    <div className="sc-page">
      {/* Nav */}
      <nav className="sc-nav">
        <div className="sc-nav-inner">
          <Link href="/" className="sc-nav-back">&larr; Back to Portfolio</Link>
          <span className="sc-nav-title">BQ Duplicate Checker</span>
        </div>
      </nav>

      <GuidedTour steps={tourSteps} agentName="Duplicate Checker Guide" />

      {/* Hero */}
      <div className="sc-hero" data-tour="dup-hero">
        <h1>BQ Duplicate <span>Checker</span></h1>
        <p className="sc-hero-subtitle">BigQuery Duplicate Row Detector</p>
        <p className="sc-hero-desc">
          Point at any BigQuery table, pick the columns that define a unique row,
          and instantly find duplicates. Then paste your SQL to debug
          CTE-by-CTE and pinpoint exactly where duplicates are introduced.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
          {!demoMode && (
            <button className="sc-btn sc-btn-primary" onClick={loadDemo}>Try Demo</button>
          )}
          <Link
            href="/agents/bq-duplicate-checker/guide"
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
          <div style={{
            padding: "12px 20px", background: "rgba(56,189,248,0.1)",
            border: "1px solid rgba(56,189,248,0.25)", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 12,
          }}>
            <p style={{ color: "var(--accent)", fontSize: "0.88rem", fontWeight: 600 }}>
              Demo Mode &mdash; showing sample duplicate check on a fictional retail
              sales table with CTE-by-CTE debugging.
            </p>
            <button
              className="sc-btn sc-btn-secondary"
              style={{ fontSize: "0.78rem", padding: "6px 14px" }}
              onClick={exitDemo}
            >Exit Demo</button>
          </div>
        )}

        {/* Access Token */}
        <div className="sc-card" data-tour="dup-token">
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
              >{showToken ? "Hide" : "Show"}</button>
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 8, opacity: 0.7 }}>
              Your token is used only for the current request and is never stored.
            </p>
            {showInstructions && (
              <div className="sc-instructions">
                <p>Run this command in your terminal to get a temporary access token:</p>
                <p style={{ margin: "8px 0" }}><code>gcloud auth print-access-token</code></p>
                <p>This token is valid for ~60 minutes. Make sure you have the{" "}
                  <code>BigQuery Data Viewer</code> role and <code>bigquery.jobs.create</code> permission
                  on the billing project.</p>
                <p style={{ marginTop: 8 }}>
                  Need <code>gcloud</code>?{" "}
                  <a href="https://cloud.google.com/sdk/docs/install" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
                    Install the Google Cloud SDK
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Connection */}
        <div className="sc-card" data-tour="dup-conn">
          <div className="sc-card-header">
            <div>
              <h2>Table Connection</h2>
              <p>Specify the BigQuery table to check for duplicates</p>
            </div>
            {fullTableRef && (
              <span style={{ fontSize: "0.8rem", color: "var(--accent)", fontFamily: "monospace" }}>
                {fullTableRef}
              </span>
            )}
          </div>
          <div className="sc-card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label className="sc-label">Billing Project</label>
                <input
                  className="sc-input"
                  placeholder="e.g. my-billing-project (defaults to Data Project)"
                  value={conn.billingProject}
                  onChange={(e) => setConn({ ...conn, billingProject: e.target.value })}
                />
              </div>
              <div>
                <label className="sc-label">Data Project ID</label>
                <input
                  className="sc-input"
                  placeholder="e.g. my-gcp-project"
                  value={conn.projectId}
                  onChange={(e) => setConn({ ...conn, projectId: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label className="sc-label">Dataset ID</label>
                <input
                  className="sc-input"
                  placeholder="e.g. my_dataset"
                  value={conn.datasetId}
                  onChange={(e) => setConn({ ...conn, datasetId: e.target.value })}
                />
              </div>
              <div>
                <label className="sc-label">Table Name</label>
                <input
                  className="sc-input"
                  placeholder="e.g. sales_fact"
                  value={conn.tableName}
                  onChange={(e) => setConn({ ...conn, tableName: e.target.value })}
                />
              </div>
              <div>
                <label className="sc-label">Location</label>
                <input
                  className="sc-input"
                  placeholder="e.g. US"
                  value={conn.location}
                  onChange={(e) => setConn({ ...conn, location: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <button
                className="sc-btn sc-btn-primary"
                onClick={fetchSchema}
                disabled={fetchingSchema || demoMode}
              >
                {fetchingSchema ? "Fetching…" : "Fetch Schema"}
              </button>
            </div>
          </div>
        </div>

        {/* Grain Selection */}
        {columns.length > 0 && (
          <div className="sc-card" data-tour="dup-grain">
            <div className="sc-card-header">
              <div>
                <h2>Define the Grain</h2>
                <p>Select columns that should form a unique row</p>
              </div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {selectedCols.length} of {columns.length} selected
              </span>
            </div>
            <div className="sc-card-body">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {columns.map((col) => (
                  <button
                    key={col}
                    className={`sc-chip ${selectedCols.includes(col) ? "sc-chip-active" : "sc-chip-inactive"}`}
                    onClick={() => toggleColumn(col)}
                  >{col}</button>
                ))}
              </div>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 16 }}>
                The app will <code style={{ color: "var(--accent)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4 }}>
                GROUP BY</code> these columns and look for rows that appear more than once.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="sc-btn sc-btn-primary"
                  onClick={checkDuplicates}
                  disabled={checking || selectedCols.length === 0 || demoMode}
                >
                  {checking ? "Checking…" : "Check for Duplicates"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && <div className="sc-error">{error}</div>}

        {/* Loading */}
        {(checking || fetchingSchema) && (
          <div className="sc-loading">
            <div className="sc-spinner" />
            <p style={{ color: "var(--text-muted)", marginTop: 16 }}>
              {fetchingSchema ? "Fetching table schema…" : "Running duplicate check on BigQuery…"}
            </p>
          </div>
        )}

        {/* Results */}
        {stats && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700 }}>Results</h2>
              {results.rows.length > 0 && (
                <button className="sc-btn sc-btn-success" onClick={exportCSV}>Export CSV</button>
              )}
            </div>

            {results.rows.length === 0 ? (
              <div className="sc-card">
                <div className="sc-card-body" style={{ textAlign: "center", padding: "40px 24px" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>&#10003;</div>
                  <h3 style={{ color: "#34d399", fontSize: "1.2rem", fontWeight: 700, marginBottom: 8 }}>
                    All Clear!
                  </h3>
                  <p style={{ color: "var(--text-muted)" }}>
                    No duplicates found at the selected grain level.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="sc-stats" data-tour="dup-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                  <div className="sc-stat">
                    <div className="sc-stat-value" style={{ color: "#ef4444" }}>{stats.groups}</div>
                    <div className="sc-stat-label">Duplicate Groups</div>
                  </div>
                  <div className="sc-stat">
                    <div className="sc-stat-value" style={{ color: "#fbbf24" }}>{stats.extraRows}</div>
                    <div className="sc-stat-label">Extra Rows</div>
                  </div>
                  <div className="sc-stat">
                    <div className="sc-stat-value" style={{ color: "var(--accent)" }}>{stats.maxCopies}</div>
                    <div className="sc-stat-label">Max Copies</div>
                  </div>
                </div>

                {/* Duplicate rows table */}
                <div className="sc-card" data-tour="dup-rows">
                  <div className="sc-card-header">
                    <div>
                      <h2>Duplicate Rows</h2>
                      <p>Showing {results.rows.length} duplicate combination{results.rows.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="sc-table-wrapper">
                    <table className="sc-table">
                      <thead>
                        <tr>
                          {selectedCols.map((col) => (
                            <th key={col}>{col}</th>
                          ))}
                          <th style={{ textAlign: "right" }}>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.rows.map((row, i) => (
                          <tr key={i} className="sc-row-mismatch">
                            {selectedCols.map((col) => (
                              <td key={col} className="sc-col-type">{row[col] ?? "NULL"}</td>
                            ))}
                            <td style={{ textAlign: "right", fontWeight: 700, color: "#ef4444" }}>
                              {row.duplicate_count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Debug query */}
                {debugQuery && (
                  <div className="sc-card">
                    <div className="sc-card-header">
                      <div>
                        <h2>Debug Query</h2>
                        <p>
                          Fetch all rows for the worst offender ({results.rows[0].duplicate_count} copies)
                        </p>
                      </div>
                    </div>
                    <div className="sc-card-body">
                      <pre style={{
                        padding: 16, background: "var(--bg)", borderRadius: 8,
                        border: "1px solid var(--border)", overflowX: "auto",
                        fontSize: "0.82rem", lineHeight: 1.6, color: "var(--text-muted)",
                        fontFamily: "'Consolas','Monaco','Courier New',monospace",
                      }}>
                        <code>{debugQuery}</code>
                      </pre>
                    </div>
                  </div>
                )}

                {/* CTE Debugger */}
                <div className="sc-card" data-tour="dup-cte">
                  <div className="sc-card-header">
                    <div>
                      <h2>CTE Debugger</h2>
                      <p>Paste the SQL that produces this table to find where duplicates are introduced</p>
                    </div>
                  </div>
                  <div className="sc-card-body">
                    <label className="sc-label">Your SQL Query</label>
                    <textarea
                      className="sc-input sc-textarea"
                      style={{ minHeight: 160, fontFamily: "'Consolas','Monaco','Courier New',monospace", fontSize: "0.82rem" }}
                      placeholder={"WITH cte1 AS (\n  SELECT ...\n),\ncte2 AS (\n  SELECT ...\n)\nSELECT ..."}
                      value={sqlInput}
                      onChange={(e) => { setSqlInput(e.target.value); if (!demoMode) setParsedCTEs([]); }}
                    />
                    {!demoMode && (
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                        <button
                          className="sc-btn sc-btn-primary"
                          onClick={handleParseCTEs}
                          disabled={!sqlInput.trim()}
                        >Parse CTEs</button>
                      </div>
                    )}

                    {parsedCTEs.length > 0 && (
                      <div style={{ marginTop: 24 }}>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 16 }}>
                          Found <strong style={{ color: "var(--text)" }}>{parsedCTEs.length}</strong> CTE(s).
                          Click each to check for duplicates at grain:{" "}
                          <code style={{ color: "var(--accent)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4, fontSize: "0.82rem" }}>
                            {selectedCols.join(", ")}
                          </code>
                        </p>

                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                          gap: 10,
                        }}>
                          {parsedCTEs.map((cte, idx) => {
                            const key = `cte_${idx}`;
                            const result = cteResults[key];
                            const name = cte.name === "__final__" ? "Final SELECT" : cte.name;
                            let icon = "⬜";
                            let borderColor = "var(--border)";
                            if (result) {
                              if (result.status === "clean") { icon = "🟢"; borderColor = "#34d399"; }
                              else if (result.status === "duplicates") { icon = "🔴"; borderColor = "#ef4444"; }
                              else if (result.status === "error") { icon = "⚠️"; borderColor = "#fbbf24"; }
                            }
                            const isChecking = checkingCTE === idx;

                            return (
                              <button
                                key={idx}
                                className="sc-btn sc-btn-secondary"
                                style={{
                                  justifyContent: "center", borderColor,
                                  opacity: isChecking ? 0.6 : 1,
                                  fontSize: "0.82rem", padding: "10px 14px",
                                }}
                                onClick={() => checkCTE(idx)}
                                disabled={isChecking || demoMode}
                              >
                                {isChecking ? "…" : icon} {name}
                              </button>
                            );
                          })}
                        </div>

                        {/* CTE results summary */}
                        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                          {parsedCTEs.map((cte, idx) => {
                            const key = `cte_${idx}`;
                            const result = cteResults[key];
                            if (!result) return null;
                            const name = cte.name === "__final__" ? "Final SELECT" : cte.name;

                            if (result.status === "clean") {
                              return (
                                <div key={idx} style={{
                                  padding: "10px 16px", borderRadius: 8,
                                  background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)",
                                  fontSize: "0.85rem", color: "#34d399", fontWeight: 600,
                                }}>
                                  {name} &mdash; No duplicates found
                                </div>
                              );
                            }
                            if (result.status === "duplicates") {
                              return (
                                <div key={idx} style={{
                                  padding: "10px 16px", borderRadius: 8,
                                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                                  fontSize: "0.85rem", color: "#fca5a5", fontWeight: 600,
                                }}>
                                  {name} &mdash; <span style={{ color: "#ef4444" }}>{result.dupGroups}</span> duplicate group(s),{" "}
                                  <span style={{ color: "#ef4444" }}>{result.extraRows}</span> extra row(s)
                                </div>
                              );
                            }
                            if (result.status === "error") {
                              return (
                                <div key={idx} className="sc-error">
                                  {name} &mdash; {result.error}
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>

                        {/* Legend */}
                        <div style={{
                          marginTop: 20, paddingTop: 16,
                          borderTop: "1px solid var(--border)",
                          fontSize: "0.78rem", color: "var(--text-muted)",
                        }}>
                          <strong>Legend:</strong>{" "}
                          &#x1F7E2; No duplicates &nbsp;&middot;&nbsp;
                          &#x1F534; Duplicates found &nbsp;&middot;&nbsp;
                          &#x2B1C; Not checked &nbsp;&middot;&nbsp;
                          &#x26A0;&#xFE0F; Error
                          <br />
                          <strong>Tip:</strong> Click CTEs from top to bottom.
                          The first CTE that turns red is where duplicates are introduced.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>

      <footer className="sc-footer">
        BQ Duplicate Checker &middot; Built by Abhimanyu Sheoran
      </footer>
    </div>
  );
}
