"use client";
import { useState } from "react";
import Link from "next/link";
import "../schema-compare/schema-compare.css";

/* ------------------------------------------------------------------ */
/*  Demo data                                                         */
/* ------------------------------------------------------------------ */
const DEMO_CLIENTS = [
  { name: "Aurora", projectId: "aurora-retail-2025", dataset: "aurora-retail-2025.aurora_ingestion_prod", icon: "💎" },
  { name: "Meridian", projectId: "meridian-retail-2025", dataset: "meridian-retail-2025.meridian_ingestion_prod", icon: "👜" },
  { name: "Summit", projectId: "summit-retail-2025", dataset: "summit-retail-2025.summit_ingestion_prod", icon: "🏔" },
];

const DEMO_WEEK = {
  label: "Reporting Period",
  range: "Jun 30, 2025 - Jul 06, 2025",
  fiscalWeek: "FW01 FY2026",
};

const DEMO_SUMMARY = {
  recommended: { label: "Recommended Orders", num_of_orders: 5274, order_quantity: 236780, order_cost: 3597240.75 },
  edited:      { label: "Edited Orders",      num_of_orders: 1056, order_quantity: 48320,  order_cost: 734880.25 },
  manual:      { label: "Manual Orders",       num_of_orders: 389,  order_quantity: 15640,  order_cost: 241520.00 },
  approved:    { label: "Approved Orders",     num_of_orders: 4218, order_quantity: 187450, order_cost: 2841670.50 },
  reconciled:  { label: "Reconciled POs",      num_of_orders: 3910, order_quantity: 174200, order_cost: 2648300.00 },
};

const DEMO_BREAKDOWN = [
  { country: "Australia",  channel: "Retail",    brand: "Aurora",       sbu: "Jewellery",  department: "Earrings",   collection: "Summer 25",   rec_qty: 42150, approved_qty: 38920, reconciled_qty: 37100 },
  { country: "Australia",  channel: "Ecommerce", brand: "Aurora",       sbu: "Jewellery",  department: "Necklaces",  collection: "Summer 25",   rec_qty: 28300, approved_qty: 26810, reconciled_qty: 25600 },
  { country: "USA",        channel: "Retail",    brand: "Aurora",       sbu: "Jewellery",  department: "Rings",      collection: "Core Range",  rec_qty: 35200, approved_qty: 33400, reconciled_qty: 31850 },
  { country: "USA",        channel: "Wholesale", brand: "Aurora",       sbu: "Accessories", department: "Hair",      collection: "Core Range",  rec_qty: 18900, approved_qty: 17650, reconciled_qty: 16800 },
  { country: "UK",         channel: "Retail",    brand: "Aurora",       sbu: "Jewellery",  department: "Bracelets",  collection: "Winter 25",   rec_qty: 22400, approved_qty: 21100, reconciled_qty: 20300 },
  { country: "Singapore",  channel: "Ecommerce", brand: "Aurora",       sbu: "Jewellery",  department: "Earrings",   collection: "Festive 25",  rec_qty: 15800, approved_qty: 14900, reconciled_qty: 14200 },
  { country: "Malaysia",   channel: "Retail",    brand: "Aurora",       sbu: "Accessories", department: "Bags",      collection: "Summer 25",   rec_qty: 12400, approved_qty: 11800, reconciled_qty: 11350 },
  { country: "NZ",         channel: "Retail",    brand: "Aurora",       sbu: "Jewellery",  department: "Watches",    collection: "Core Range",  rec_qty: 8700,  approved_qty: 8200,  reconciled_qty: 7900  },
];

const DEMO_GROWTH = {
  labels: ["Jan 25", "Feb 25", "Mar 25", "Apr 25", "May 25", "Jun 25"],
  metrics: {
    recommended: [4850, 5010, 5180, 5120, 5240, 5274],
    edited:      [980,  1010, 1045, 1020, 1038, 1056],
    manual:      [410,  395,  380,  392,  385,  389],
    approved:    [3820, 3950, 4100, 4050, 4180, 4218],
    reconciled:  [3540, 3660, 3800, 3750, 3870, 3910],
  },
  growth: {
    recommended: { pct: 5.2,  direction: "up" },
    edited:      { pct: 1.7,  direction: "up" },
    manual:      { pct: -3.1, direction: "down" },
    approved:    { pct: 4.8,  direction: "up" },
    reconciled:  { pct: 4.2,  direction: "up" },
  },
};

const DEMO_FUNNEL = {
  approved_total: 4218,
  directly_approved: 2773,
  directly_approved_pct: 65.7,
  edited_then_approved: 1056,
  edited_then_approved_pct: 25.0,
  manual_then_approved: 389,
  manual_then_approved_pct: 9.3,
  reconciled: 3910,
  reconciliation_rate: 92.7,
};

const DEMO_MODULE_ACTIONS = [
  {
    module: "Replenishment Status",
    total_actions: 12840,
    users: [
      { name: "sarah.chen@auroraretail.com",   views: 320, edits: 185, approvals: 142 },
      { name: "mike.patel@auroraretail.com",   views: 285, edits: 160, approvals: 128 },
      { name: "jane.wu@auroraretail.com",      views: 250, edits: 120, approvals: 98  },
    ],
  },
  {
    module: "Vendor DC Policy",
    total_actions: 8450,
    users: [
      { name: "sarah.chen@auroraretail.com",   views: 210, edits: 95,  approvals: 78  },
      { name: "alex.kumar@auroraretail.com",   views: 195, edits: 88,  approvals: 65  },
      { name: "lisa.nguyen@auroraretail.com",   views: 180, edits: 72,  approvals: 55  },
    ],
  },
  {
    module: "Target Inventory Levels",
    total_actions: 6720,
    users: [
      { name: "mike.patel@auroraretail.com",   views: 175, edits: 110, approvals: 85  },
      { name: "jane.wu@auroraretail.com",      views: 160, edits: 95,  approvals: 72  },
      { name: "alex.kumar@auroraretail.com",   views: 140, edits: 80,  approvals: 60  },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function fmt(n) {
  return n.toLocaleString("en-US");
}
function fmtDollar(n) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export default function ProductUsageDashboardPage() {
  const [demoMode, setDemoMode] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeSection, setActiveSection] = useState("overview");

  const [billingProject, setBillingProject] = useState("");

  /* ---------- Demo ---------- */
  function loadDemo() {
    setSelectedClient(DEMO_CLIENTS[0]);
    setDemoMode(true);
    setActiveSection("overview");
  }

  function exitDemo() {
    setSelectedClient(null);
    setDemoMode(false);
    setActiveSection("overview");
    setBillingProject("");
  }

  const sections = [
    { key: "overview",  label: "Overview" },
    { key: "growth",    label: "Growth & Funnel" },
    { key: "breakdown", label: "Category Breakdown" },
    { key: "modules",   label: "Module Actions" },
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
          <span className="sc-nav-title">Product Usage Dashboard</span>
        </div>
      </nav>

      {/* Hero */}
      <div className="sc-hero">
        <h1>Product Usage <span>Dashboard</span></h1>
        <p className="sc-hero-subtitle">Order Management Analytics &amp; Insights</p>
        <p className="sc-hero-desc">
          Connect to any client's BigQuery dataset and instantly view order summaries,
          category breakdowns, growth trends, funnel analysis, and per-user module
          activity. Built for retail OMS teams to monitor ordering health across
          clients.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
          {!demoMode && (
            <button className="sc-btn sc-btn-primary" onClick={loadDemo}>Try Demo</button>
          )}
          <Link
            href="/agents/product-usage-dashboard/guide"
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
              Demo Mode &mdash; showing sample OMS data for {selectedClient?.name || "Aurora"} (fictional dataset).
            </p>
            <button
              className="sc-btn sc-btn-secondary"
              style={{ fontSize: "0.78rem", padding: "6px 14px" }}
              onClick={exitDemo}
            >Exit Demo</button>
          </div>
        )}

        {/* Client Selector */}
        <div className="sc-card">
          <div className="sc-card-header">
            <div>
              <h2>Select Client</h2>
              <p>Choose a client to view their usage dashboard</p>
            </div>
            {selectedClient && (
              <span style={{ fontSize: "0.8rem", color: "var(--accent)", fontFamily: "monospace" }}>
                {selectedClient.dataset}
              </span>
            )}
          </div>
          <div className="sc-card-body">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {DEMO_CLIENTS.map((client) => {
                const isActive = selectedClient?.name === client.name;
                return (
                  <button
                    key={client.name}
                    onClick={() => {
                      setSelectedClient(client);
                      if (!demoMode) setDemoMode(true);
                      setActiveSection("overview");
                    }}
                    style={{
                      padding: "20px 16px", borderRadius: 10,
                      border: isActive ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background: isActive ? "rgba(56,189,248,0.08)" : "var(--bg)",
                      cursor: "pointer", textAlign: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontSize: "1.8rem", marginBottom: 8 }}>{client.icon}</div>
                    <div style={{ fontWeight: 700, color: isActive ? "var(--accent)" : "var(--text)", fontSize: "0.95rem" }}>
                      {client.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4, fontFamily: "monospace" }}>
                      {client.projectId}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Non-demo: Connection settings */}
        {!demoMode && (
          <div className="sc-card">
            <div className="sc-card-header">
              <div>
                <h2>BigQuery Connection</h2>
                <p>Configure your connection for live data</p>
              </div>
            </div>
            <div className="sc-card-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label className="sc-label">Billing Project</label>
                  <input
                    className="sc-input"
                    placeholder="e.g. retail-demo-data-scan"
                    value={billingProject}
                    onChange={(e) => setBillingProject(e.target.value)}
                  />
                </div>
                <div>
                  <label className="sc-label">Client Dataset</label>
                  <input
                    className="sc-input"
                    placeholder="Auto-filled from client selection"
                    value={selectedClient?.dataset || ""}
                    readOnly
                    style={{ opacity: 0.7 }}
                  />
                </div>
              </div>
              <div className="sc-instructions">
                <p>To connect to live BigQuery data, authenticate via gcloud:</p>
                <p style={{ margin: "8px 0" }}><code>gcloud auth application-default login</code></p>
                <p style={{ margin: "8px 0" }}><code>gcloud auth application-default set-quota-project retail-demo-data-scan</code></p>
                <p>Then run the Flask app locally with <code>python app.py</code>.</p>
              </div>
            </div>
          </div>
        )}

        {/* Section Tabs (only when client is selected) */}
        {selectedClient && demoMode && (
          <>
            {/* Reporting week */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 12,
            }}>
              <div>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                  {DEMO_WEEK.label}
                </span>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text)", marginTop: 2 }}>
                  {DEMO_WEEK.range}
                </div>
              </div>
              <span style={{
                padding: "6px 14px", borderRadius: 999, fontSize: "0.78rem", fontWeight: 700,
                background: "rgba(56,189,248,0.1)", color: "var(--accent)", border: "1px solid rgba(56,189,248,0.25)",
              }}>
                {DEMO_WEEK.fiscalWeek}
              </span>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {sections.map((s) => (
                <button
                  key={s.key}
                  className={`sc-chip ${activeSection === s.key ? "sc-chip-active" : "sc-chip-inactive"}`}
                  onClick={() => setActiveSection(s.key)}
                >{s.label}</button>
              ))}
            </div>

            {/* ======== OVERVIEW ======== */}
            {activeSection === "overview" && (
              <>
                {/* Metric tiles */}
                <div className="sc-stats" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
                  {Object.entries(DEMO_SUMMARY).map(([key, m]) => (
                    <div className="sc-stat" key={key}>
                      <div className="sc-stat-value" style={{ color: "var(--accent)", fontSize: "1.5rem" }}>
                        {fmt(m.num_of_orders)}
                      </div>
                      <div className="sc-stat-label">{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* Order summary table */}
                <div className="sc-card">
                  <div className="sc-card-header">
                    <div>
                      <h2>Order Summary</h2>
                      <p>Detailed breakdown by metric type</p>
                    </div>
                  </div>
                  <div className="sc-table-wrapper">
                    <table className="sc-table">
                      <thead>
                        <tr>
                          <th>Metric</th>
                          <th style={{ textAlign: "right" }}>Orders</th>
                          <th style={{ textAlign: "right" }}>Quantity</th>
                          <th style={{ textAlign: "right" }}>Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(DEMO_SUMMARY).map(([key, m]) => (
                          <tr key={key}>
                            <td className="sc-col-name">{m.label}</td>
                            <td style={{ textAlign: "right", fontFamily: "monospace" }}>{fmt(m.num_of_orders)}</td>
                            <td style={{ textAlign: "right", fontFamily: "monospace" }}>{fmt(m.order_quantity)}</td>
                            <td style={{ textAlign: "right", fontFamily: "monospace", color: "var(--accent)" }}>{fmtDollar(m.order_cost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* KPI cards */}
                <div className="sc-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                  <div className="sc-stat">
                    <div className="sc-stat-value" style={{ color: "#34d399" }}>
                      {((DEMO_SUMMARY.approved.num_of_orders / DEMO_SUMMARY.recommended.num_of_orders) * 100).toFixed(1)}%
                    </div>
                    <div className="sc-stat-label">Approval Rate</div>
                  </div>
                  <div className="sc-stat">
                    <div className="sc-stat-value" style={{ color: "#fbbf24" }}>
                      {((DEMO_SUMMARY.edited.num_of_orders / DEMO_SUMMARY.approved.num_of_orders) * 100).toFixed(1)}%
                    </div>
                    <div className="sc-stat-label">Edit Rate</div>
                  </div>
                  <div className="sc-stat">
                    <div className="sc-stat-value" style={{ color: "var(--accent)" }}>
                      {DEMO_FUNNEL.reconciliation_rate}%
                    </div>
                    <div className="sc-stat-label">Reconciliation Rate</div>
                  </div>
                </div>
              </>
            )}

            {/* ======== GROWTH & FUNNEL ======== */}
            {activeSection === "growth" && (
              <>
                {/* Growth table */}
                <div className="sc-card">
                  <div className="sc-card-header">
                    <div>
                      <h2>Period-over-Period Growth</h2>
                      <p>Monthly order counts with growth percentages</p>
                    </div>
                  </div>
                  <div className="sc-table-wrapper">
                    <table className="sc-table">
                      <thead>
                        <tr>
                          <th>Metric</th>
                          {DEMO_GROWTH.labels.map((l) => (
                            <th key={l} style={{ textAlign: "right" }}>{l}</th>
                          ))}
                          <th style={{ textAlign: "right" }}>Growth</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(DEMO_GROWTH.metrics).map(([key, vals]) => {
                          const g = DEMO_GROWTH.growth[key];
                          return (
                            <tr key={key}>
                              <td className="sc-col-name" style={{ textTransform: "capitalize" }}>{key}</td>
                              {vals.map((v, i) => (
                                <td key={i} style={{ textAlign: "right", fontFamily: "monospace" }}>{fmt(v)}</td>
                              ))}
                              <td style={{ textAlign: "right" }}>
                                <span className={`sc-badge ${g.direction === "up" ? "sc-badge-ok" : "sc-badge-error"}`}>
                                  {g.direction === "up" ? "+" : ""}{g.pct}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Funnel visualization */}
                <div className="sc-card">
                  <div className="sc-card-header">
                    <div>
                      <h2>Order Funnel</h2>
                      <p>How orders flow from recommendation to reconciliation</p>
                    </div>
                  </div>
                  <div className="sc-card-body">
                    {/* Funnel bars */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {/* Directly approved */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>Directly Approved</span>
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#34d399" }}>
                            {fmt(DEMO_FUNNEL.directly_approved)} ({DEMO_FUNNEL.directly_approved_pct}%)
                          </span>
                        </div>
                        <div style={{ height: 28, background: "var(--bg)", borderRadius: 6, overflow: "hidden", border: "1px solid var(--border)" }}>
                          <div style={{
                            height: "100%", width: `${DEMO_FUNNEL.directly_approved_pct}%`,
                            background: "linear-gradient(90deg, #34d399, #10b981)",
                            borderRadius: 6, transition: "width 0.5s",
                          }} />
                        </div>
                      </div>
                      {/* Edited then approved */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>Edited then Approved</span>
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fbbf24" }}>
                            {fmt(DEMO_FUNNEL.edited_then_approved)} ({DEMO_FUNNEL.edited_then_approved_pct}%)
                          </span>
                        </div>
                        <div style={{ height: 28, background: "var(--bg)", borderRadius: 6, overflow: "hidden", border: "1px solid var(--border)" }}>
                          <div style={{
                            height: "100%", width: `${DEMO_FUNNEL.edited_then_approved_pct}%`,
                            background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
                            borderRadius: 6, transition: "width 0.5s",
                          }} />
                        </div>
                      </div>
                      {/* Manual then approved */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>Manual Orders</span>
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ef4444" }}>
                            {fmt(DEMO_FUNNEL.manual_then_approved)} ({DEMO_FUNNEL.manual_then_approved_pct}%)
                          </span>
                        </div>
                        <div style={{ height: 28, background: "var(--bg)", borderRadius: 6, overflow: "hidden", border: "1px solid var(--border)" }}>
                          <div style={{
                            height: "100%", width: `${DEMO_FUNNEL.manual_then_approved_pct}%`,
                            background: "linear-gradient(90deg, #ef4444, #dc2626)",
                            borderRadius: 6, transition: "width 0.5s",
                          }} />
                        </div>
                      </div>
                    </div>

                    {/* Reconciliation rate bar */}
                    <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>Reconciliation Rate</span>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent)" }}>
                          {fmt(DEMO_FUNNEL.reconciled)} / {fmt(DEMO_FUNNEL.approved_total)} ({DEMO_FUNNEL.reconciliation_rate}%)
                        </span>
                      </div>
                      <div style={{ height: 28, background: "var(--bg)", borderRadius: 6, overflow: "hidden", border: "1px solid var(--border)" }}>
                        <div style={{
                          height: "100%", width: `${DEMO_FUNNEL.reconciliation_rate}%`,
                          background: "linear-gradient(90deg, var(--accent), var(--accent-2))",
                          borderRadius: 6, transition: "width 0.5s",
                        }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* KPI cards */}
                <div className="sc-stats" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                  <div className="sc-stat">
                    <div className="sc-stat-value" style={{ color: "#34d399", fontSize: "1.4rem" }}>
                      {DEMO_FUNNEL.directly_approved_pct}%
                    </div>
                    <div className="sc-stat-label">Direct Approval</div>
                  </div>
                  <div className="sc-stat">
                    <div className="sc-stat-value" style={{ color: "#fbbf24", fontSize: "1.4rem" }}>
                      {DEMO_FUNNEL.edited_then_approved_pct}%
                    </div>
                    <div className="sc-stat-label">Edited First</div>
                  </div>
                  <div className="sc-stat">
                    <div className="sc-stat-value" style={{ color: "#ef4444", fontSize: "1.4rem" }}>
                      {DEMO_FUNNEL.manual_then_approved_pct}%
                    </div>
                    <div className="sc-stat-label">Manual Orders</div>
                  </div>
                  <div className="sc-stat">
                    <div className="sc-stat-value" style={{ color: "var(--accent)", fontSize: "1.4rem" }}>
                      {DEMO_FUNNEL.reconciliation_rate}%
                    </div>
                    <div className="sc-stat-label">Reconciled</div>
                  </div>
                </div>
              </>
            )}

            {/* ======== CATEGORY BREAKDOWN ======== */}
            {activeSection === "breakdown" && (
              <div className="sc-card">
                <div className="sc-card-header">
                  <div>
                    <h2>Category Breakdown</h2>
                    <p>Order quantities by Country, Channel, Brand, SBU, Department, and Collection</p>
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {DEMO_BREAKDOWN.length} categories
                  </span>
                </div>
                <div className="sc-table-wrapper">
                  <table className="sc-table">
                    <thead>
                      <tr>
                        <th>Country</th>
                        <th>Channel</th>
                        <th>Brand</th>
                        <th>SBU</th>
                        <th>Department</th>
                        <th>Collection</th>
                        <th style={{ textAlign: "right" }}>Rec Qty</th>
                        <th style={{ textAlign: "right" }}>Approved Qty</th>
                        <th style={{ textAlign: "right" }}>Reconciled Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DEMO_BREAKDOWN.map((row, i) => {
                        const fillRate = ((row.reconciled_qty / row.rec_qty) * 100).toFixed(1);
                        return (
                          <tr key={i}>
                            <td className="sc-col-name">{row.country}</td>
                            <td className="sc-col-type">{row.channel}</td>
                            <td>{row.brand}</td>
                            <td className="sc-col-type">{row.sbu}</td>
                            <td>{row.department}</td>
                            <td className="sc-col-type">{row.collection}</td>
                            <td style={{ textAlign: "right", fontFamily: "monospace" }}>{fmt(row.rec_qty)}</td>
                            <td style={{ textAlign: "right", fontFamily: "monospace" }}>{fmt(row.approved_qty)}</td>
                            <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                              {fmt(row.reconciled_qty)}
                              <span style={{
                                marginLeft: 8, fontSize: "0.72rem", fontWeight: 600,
                                color: parseFloat(fillRate) >= 90 ? "#34d399" : "#fbbf24",
                              }}>
                                {fillRate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ======== MODULE ACTIONS ======== */}
            {activeSection === "modules" && (
              <>
                {/* Module summary tiles */}
                <div className="sc-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                  {DEMO_MODULE_ACTIONS.map((mod) => (
                    <div className="sc-stat" key={mod.module}>
                      <div className="sc-stat-value" style={{ color: "var(--accent)", fontSize: "1.4rem" }}>
                        {fmt(mod.total_actions)}
                      </div>
                      <div className="sc-stat-label">{mod.module}</div>
                    </div>
                  ))}
                </div>

                {/* Per-module user tables */}
                {DEMO_MODULE_ACTIONS.map((mod) => (
                  <div className="sc-card" key={mod.module}>
                    <div className="sc-card-header">
                      <div>
                        <h2>{mod.module}</h2>
                        <p>Per-user action breakdown &middot; {fmt(mod.total_actions)} total actions</p>
                      </div>
                    </div>
                    <div className="sc-table-wrapper">
                      <table className="sc-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th style={{ textAlign: "right" }}>Views</th>
                            <th style={{ textAlign: "right" }}>Edits</th>
                            <th style={{ textAlign: "right" }}>Approvals</th>
                            <th style={{ textAlign: "right" }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mod.users.map((u, i) => (
                            <tr key={i}>
                              <td className="sc-col-name" style={{ fontFamily: "monospace", fontSize: "0.82rem" }}>
                                {u.name}
                              </td>
                              <td style={{ textAlign: "right", fontFamily: "monospace" }}>{fmt(u.views)}</td>
                              <td style={{ textAlign: "right", fontFamily: "monospace", color: "#fbbf24" }}>{fmt(u.edits)}</td>
                              <td style={{ textAlign: "right", fontFamily: "monospace", color: "#34d399" }}>{fmt(u.approvals)}</td>
                              <td style={{ textAlign: "right", fontWeight: 700, color: "var(--accent)" }}>
                                {fmt(u.views + u.edits + u.approvals)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </main>

      <footer className="sc-footer">
        Product Usage Dashboard &middot; Built by Abhimanyu Sheoran
      </footer>
    </div>
  );
}
