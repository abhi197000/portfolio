"use client";
import { useState } from "react";
import Link from "next/link";
import "../../schema-compare/schema-compare.css";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      style={{
        position: "absolute", top: 10, right: 10, padding: "4px 12px",
        borderRadius: 6, border: "1px solid var(--border)",
        background: copied ? "rgba(52,211,153,0.15)" : "var(--bg-card)",
        color: copied ? "#34d399" : "var(--text-muted)",
        fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
        transition: "all 0.15s", fontFamily: "inherit",
      }}
    >{copied ? "Copied!" : "Copy"}</button>
  );
}

function CodeBlock({ filename, code }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {filename && (
        <div style={{
          padding: "8px 16px", background: "rgba(255,255,255,0.05)",
          borderRadius: "8px 8px 0 0", border: "1px solid var(--border)",
          borderBottom: "none", fontSize: "0.8rem", fontWeight: 700,
          color: "var(--accent)", fontFamily: "monospace",
        }}>{filename}</div>
      )}
      <div style={{
        position: "relative", borderRadius: filename ? "0 0 8px 8px" : 8,
        border: "1px solid var(--border)", overflow: "hidden",
      }}>
        <CopyButton text={code} />
        <pre style={{
          padding: 16, paddingRight: 80, background: "var(--bg)",
          overflowX: "auto", margin: 0, fontSize: "0.82rem", lineHeight: 1.6,
          color: "var(--text-muted)",
          fontFamily: "'Consolas','Monaco','Courier New',monospace",
        }}><code>{code}</code></pre>
      </div>
    </div>
  );
}

function StepNumber({ n }) {
  return (
    <span style={{
      width: 28, height: 28, borderRadius: "50%",
      background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
      color: "#0a0e17", display: "flex", alignItems: "center",
      justifyContent: "center", fontWeight: 800, fontSize: "0.82rem", flexShrink: 0,
    }}>{n}</span>
  );
}

const codeStyle = {
  color: "var(--accent)", background: "rgba(255,255,255,0.05)",
  padding: "2px 6px", borderRadius: 4, fontSize: "0.85rem",
};

const REQUIREMENTS = `streamlit==1.41.0
google-cloud-bigquery==3.27.0
db-dtypes==1.3.1
pandas==2.2.3`;

const APP_PY = `"""
BQ Duplicate Checker - Local Setup
Check any BigQuery table for duplicate rows and debug CTE-by-CTE.

Usage:
  1. pip install -r requirements.txt
  2. gcloud auth login
  3. Edit BILLING_PROJECT and LOCATION below
  4. streamlit run app.py
"""
import streamlit as st
import pandas as pd
import re
import subprocess
from google.cloud import bigquery
from google.oauth2.credentials import Credentials
from google.api_core.exceptions import GoogleAPIError

st.set_page_config(page_title="BQ Duplicate Checker", page_icon="\\U0001f50d", layout="wide")

st.markdown("""
<style>
.block-container { max-width: 960px; }
.stButton > button { border-radius: 0.5rem; }
div[data-testid="stMetric"] {
    background: #f8f9fa; border-radius: 0.5rem; padding: 0.75rem;
    border: 1px solid #dee2e6; text-align: center;
}
</style>
""", unsafe_allow_html=True)

st.title("\\U0001f50d BigQuery Duplicate Checker")
st.caption("Point at any table, pick your grain columns, find duplicates, and debug CTE-by-CTE.")

for key, default in {"dup_result": None, "dup_level": [], "full_table": "", "cte_results": {}}.items():
    if key not in st.session_state:
        st.session_state[key] = default

# ---------------------------------------------------------------------------
# Sidebar - connection inputs
# ---------------------------------------------------------------------------
with st.sidebar:
    st.header("\\U0001f517 Connection")
    billing_project = st.text_input(
        "Billing Project",
        value="your-billing-project",
        help="Project where queries will run (needs bigquery.jobs.create)",
    ).strip()
    project_id = st.text_input("Data Project ID", placeholder="e.g. my-data-project").strip()
    dataset_id = st.text_input("Dataset ID", placeholder="e.g. my_dataset").strip()
    table_name = st.text_input("Table Name", placeholder="e.g. sales_fact").strip()
    dataset_location = st.text_input("Dataset Location", value="US").strip()
    full_table = ""
    if project_id and dataset_id and table_name:
        full_table = f"\`{project_id}.{dataset_id}.{table_name}\`"
        st.code(full_table, language="sql")
    if billing_project:
        st.caption(f"\\U0001f4b3 Queries run in: \`{billing_project}\`")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_access_token():
    result = subprocess.run(
        "gcloud auth print-access-token",
        shell=True, capture_output=True, text=True, timeout=15,
    )
    if result.returncode != 0:
        raise RuntimeError(f"gcloud auth failed: {result.stderr.strip()}")
    return result.stdout.strip()

def _make_client(project):
    token = _get_access_token()
    credentials = Credentials(token=token)
    return bigquery.Client(credentials=credentials, project=project)

def run_bq_query(sql):
    client = _make_client(billing_project)
    job = client.query(sql, location=dataset_location)
    return job.to_dataframe()

@st.cache_data(ttl=300, show_spinner="Fetching table schema \\u2026")
def fetch_columns(project, dataset, table, billing=""):
    client = _make_client(billing or project)
    ref = client.get_table(f"{project}.{dataset}.{table}")
    return [field.name for field in ref.schema]

def parse_ctes(sql):
    cleaned = sql.strip()
    if not re.match(r"(?i)^\\s*WITH\\b", cleaned):
        return [{"name": "__final__", "body": cleaned}]
    ctes = []
    remainder = re.sub(r"(?i)^\\s*WITH\\s+", "", cleaned)
    while True:
        m = re.match(r"(\\w+)\\s+AS\\s*\\(", remainder, re.IGNORECASE)
        if not m:
            break
        cte_name = m.group(1)
        start = m.end() - 1
        depth, idx = 0, start
        for idx in range(start, len(remainder)):
            if remainder[idx] == "(": depth += 1
            elif remainder[idx] == ")":
                depth -= 1
                if depth == 0: break
        ctes.append({"name": cte_name, "body": remainder[start + 1:idx].strip()})
        remainder = remainder[idx + 1:].strip()
        if remainder.startswith(","): remainder = remainder[1:].strip()
    if remainder.strip():
        ctes.append({"name": "__final__", "body": remainder.strip()})
    return ctes

def build_cte_dup_query(ctes, target_idx, level_cols):
    col_list = ", ".join(level_cols)
    numbered = ", ".join(str(i + 1) for i in range(len(level_cols)))
    target = ctes[target_idx]
    if target["name"] == "__final__":
        preceding = ctes[:target_idx]
        if preceding:
            wc = "WITH " + ",\\n".join(f'{c["name"]} AS (\\n{c["body"]}\\n)' for c in preceding)
            return (f"{wc},\\n__final__ AS (\\n{target['body']}\\n)\\n"
                    f"SELECT {col_list}, COUNT(*) AS dup_count\\n"
                    f"FROM __final__\\nGROUP BY {numbered}\\n"
                    f"HAVING COUNT(*) <> 1\\nORDER BY dup_count DESC")
        return (f"WITH __final__ AS (\\n{target['body']}\\n)\\n"
                f"SELECT {col_list}, COUNT(*) AS dup_count\\n"
                f"FROM __final__\\nGROUP BY {numbered}\\n"
                f"HAVING COUNT(*) <> 1\\nORDER BY dup_count DESC")
    preceding = ctes[:target_idx + 1]
    wc = "WITH " + ",\\n".join(f'{c["name"]} AS (\\n{c["body"]}\\n)' for c in preceding)
    return (f"{wc}\\nSELECT {col_list}, COUNT(*) AS dup_count\\n"
            f"FROM {target['name']}\\nGROUP BY {numbered}\\n"
            f"HAVING COUNT(*) <> 1\\nORDER BY dup_count DESC")

def build_where_clause(row, level_cols):
    parts = []
    for col in level_cols:
        val = row[col]
        if pd.isna(val): parts.append(f"{col} IS NULL")
        elif isinstance(val, str): parts.append(f"{col} = '{val.replace(chr(39), chr(92)+chr(39))}'")
        else: parts.append(f"{col} = {val}")
    return " AND ".join(parts)

# ===================================================================
# Main flow
# ===================================================================
if not billing_project or not full_table:
    st.info("\\U0001f448 Fill in the sidebar fields to get started.")
    st.stop()

columns = []
try:
    columns = fetch_columns(project_id, dataset_id, table_name, billing_project)
except (GoogleAPIError, Exception) as e:
    st.error(f"Could not read table schema:\\n\\n\`\`\`\\n{e}\\n\`\`\`")
    st.stop()

if columns:
    st.subheader("\\U0001f4d0 Step 1 \\u2014 Define the Level (Grain)")
    st.markdown("Select the columns that together should form a **unique row**.")
    selected_columns = st.multiselect("Level columns", options=columns, default=None, placeholder="Pick one or more columns \\u2026")
    if not selected_columns:
        st.info("Select at least one column to define the level.")
        st.stop()

    col_list = ", ".join(selected_columns)
    numbered_groups = ", ".join(str(i + 1) for i in range(len(selected_columns)))
    dup_query = f"SELECT {col_list}, COUNT(*) AS duplicate_count\\nFROM {full_table}\\nGROUP BY {numbered_groups}\\nHAVING COUNT(*) <> 1\\nORDER BY duplicate_count DESC"

    with st.expander("\\U0001f4dd Generated SQL", expanded=False):
        st.code(dup_query, language="sql")

    if st.button("\\U0001f680 Check for Duplicates", type="primary", use_container_width=True):
        try:
            with st.spinner("Running duplicate check \\u2026"):
                df = run_bq_query(dup_query)
            st.session_state.dup_result = df
            st.session_state.dup_level = selected_columns
            st.session_state.full_table = full_table
            st.session_state.cte_results = {}
        except (GoogleAPIError, Exception) as e:
            st.error(f"BigQuery error:\\n\\n\`\`\`\\n{e}\\n\`\`\`")

    df = st.session_state.dup_result
    if df is not None:
        level = st.session_state.dup_level
        ft = st.session_state.full_table
        if df.empty:
            st.success("\\U0001f389 **All Clear!** No duplicates found.")
            st.balloons()
        else:
            st.divider()
            st.subheader("\\u26a0\\ufe0f Step 2 \\u2014 Duplicates Found")
            total_groups = len(df)
            extra = int(df["duplicate_count"].sum() - total_groups)
            st.error(f"**{total_groups:,}** duplicate group(s), **{extra:,}** extra row(s).")
            c1, c2, c3 = st.columns(3)
            c1.metric("Duplicate Groups", f"{total_groups:,}")
            c2.metric("Extra Rows", f"{extra:,}")
            c3.metric("Max Copies", f"{int(df['duplicate_count'].max()):,}")
            st.dataframe(df.head(200), use_container_width=True, hide_index=True)
            sample = df.iloc[0]
            where = build_where_clause(sample, level)
            debug_sql = f"SELECT *\\nFROM {ft}\\nWHERE {where}"
            st.markdown(f"**\\U0001f50e Debug query** ({int(sample['duplicate_count'])} copies):")
            st.code(debug_sql, language="sql")
            st.download_button("\\u2b07\\ufe0f Download CSV", df.to_csv(index=False), "duplicates.csv", "text/csv", use_container_width=True)

            st.divider()
            st.subheader("\\U0001f6e0\\ufe0f Step 3 \\u2014 CTE Debugger")
            st.markdown("Paste the SQL query that produces this table.")
            sql_input = st.text_area("Paste SQL here", height=250, placeholder="WITH cte1 AS (\\n  SELECT ...\\n)\\nSELECT ...", key="sql_input")
            if sql_input:
                ctes = parse_ctes(sql_input)
                if not ctes:
                    st.error("Could not parse any CTEs.")
                else:
                    cte_names = ["Final SELECT" if c["name"] == "__final__" else c["name"] for c in ctes]
                    st.markdown(f"Found **{len(ctes)}** CTE(s).")
                    cols_per_row = 4
                    for rs in range(0, len(ctes), cols_per_row):
                        row_ctes = list(range(rs, min(rs + cols_per_row, len(ctes))))
                        cols = st.columns(len(row_ctes))
                        for col, idx in zip(cols, row_ctes):
                            rk = f"cte_{idx}"
                            if rk in st.session_state.cte_results:
                                cdf = st.session_state.cte_results[rk]
                                icon = "\\U0001f534" if isinstance(cdf, pd.DataFrame) and not cdf.empty else "\\U0001f7e2" if isinstance(cdf, pd.DataFrame) else "\\u26a0\\ufe0f"
                            else:
                                icon = "\\u2b1c"
                            with col:
                                if st.button(f"{icon} {cte_names[idx]}", key=f"cte_btn_{idx}", use_container_width=True):
                                    try:
                                        with st.spinner(f"Checking {cte_names[idx]} \\u2026"):
                                            cdf = run_bq_query(build_cte_dup_query(ctes, idx, level))
                                        st.session_state.cte_results[rk] = cdf
                                    except Exception as e:
                                        st.session_state.cte_results[rk] = str(e)
                                    st.rerun()
                    for idx in range(len(ctes)):
                        rk = f"cte_{idx}"
                        if rk not in st.session_state.cte_results: continue
                        result = st.session_state.cte_results[rk]
                        name = cte_names[idx]
                        if isinstance(result, str): st.error(f"**{name}** \\u2014 {result}")
                        elif result.empty: st.success(f"**{name}** \\u2014 No duplicates \\u2705")
                        else:
                            dc = len(result)
                            ex = int(result["dup_count"].sum() - dc)
                            st.warning(f"**{name}** \\u2014 {dc:,} group(s), {ex:,} extra \\U0001f534")
                            with st.expander(f"View duplicates in {name}"):
                                st.dataframe(result.head(100), use_container_width=True, hide_index=True)
            st.divider()
            st.markdown("**Legend:** \\U0001f7e2 Clean  \\u00b7  \\U0001f534 Duplicates  \\u00b7  \\u2b1c Not checked  \\u00b7  \\u26a0\\ufe0f Error")
            st.markdown("**Tip:** Click CTEs top to bottom. First red = where duplicates start.")`;

export default function GuidePage() {
  return (
    <div className="sc-page">
      <nav className="sc-nav">
        <div className="sc-nav-inner">
          <Link href="/agents/bq-duplicate-checker" className="sc-nav-back">
            &larr; Back to Agent
          </Link>
          <span className="sc-nav-title">Setup Guide</span>
        </div>
      </nav>

      <div className="sc-hero">
        <h1>Setup <span>Guide</span></h1>
        <p className="sc-hero-subtitle">Run the BQ Duplicate Checker locally</p>
        <p className="sc-hero-desc">
          Follow these steps to set up and run the duplicate checker on your own
          machine. Uses Streamlit for an interactive UI &mdash; no web
          framework configuration needed.
        </p>
      </div>

      <main className="sc-main">
        {/* Prerequisites */}
        <div className="sc-card">
          <div className="sc-card-header">
            <div>
              <h2>Prerequisites</h2>
              <p>What you need before starting</p>
            </div>
          </div>
          <div className="sc-card-body" style={{ lineHeight: 1.8 }}>
            <ul style={{ paddingLeft: 20, color: "var(--text-muted)" }}>
              <li>
                <strong style={{ color: "var(--text)" }}>Python 3.9+</strong> &mdash;{" "}
                <a href="https://www.python.org/downloads/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>Download</a>
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Google Cloud SDK</strong>{" "}
                (for <code style={codeStyle}>gcloud</code> CLI) &mdash;{" "}
                <a href="https://cloud.google.com/sdk/docs/install" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>Install guide</a>
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>BigQuery access</strong> &mdash;{" "}
                You need <em>BigQuery Data Viewer</em> and <em>bigquery.jobs.create</em> permission
                on the billing project
              </li>
            </ul>
          </div>
        </div>

        {/* Quick Start */}
        <div className="sc-card">
          <div className="sc-card-header">
            <div>
              <h2>Quick Start</h2>
              <p>3 steps to get running</p>
            </div>
          </div>
          <div className="sc-card-body">
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <StepNumber n={1} />
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Create the project files</h3>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>
                Create a folder and add the files shown in the &ldquo;Source Code&rdquo; section below.
              </p>
              <CodeBlock code={`mkdir bq-duplicate-checker\ncd bq-duplicate-checker`} />
            </div>

            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <StepNumber n={2} />
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Install dependencies</h3>
              </div>
              <CodeBlock code={`pip install -r requirements.txt`} />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <StepNumber n={3} />
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Authenticate &amp; run</h3>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>
                Log into GCP and launch the Streamlit app:
              </p>
              <CodeBlock code={`gcloud auth login\nstreamlit run app.py\n# Opens http://localhost:8501 in your browser`} />
            </div>
          </div>
        </div>

        {/* Source Code */}
        <div className="sc-card">
          <div className="sc-card-header">
            <div>
              <h2>Source Code</h2>
              <p>Copy these files into your project folder</p>
            </div>
          </div>
          <div className="sc-card-body">
            <CodeBlock filename="requirements.txt" code={REQUIREMENTS} />
            <CodeBlock filename="app.py" code={APP_PY} />
          </div>
        </div>

        {/* How It Works */}
        <div className="sc-card">
          <div className="sc-card-header">
            <div>
              <h2>How It Works</h2>
              <p>Understanding the duplicate check workflow</p>
            </div>
          </div>
          <div className="sc-card-body" style={{ lineHeight: 1.8 }}>
            <ul style={{ paddingLeft: 20, color: "var(--text-muted)" }}>
              <li>
                <strong style={{ color: "var(--text)" }}>Step 1 &mdash; Connect:</strong>{" "}
                Enter your billing project, data project, dataset, table name, and location
                in the sidebar.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Step 2 &mdash; Define the grain:</strong>{" "}
                The app fetches the table schema and shows all columns.
                Pick the columns that should form a unique row.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Step 3 &mdash; Check:</strong>{" "}
                The app runs a <code style={codeStyle}>GROUP BY ... HAVING COUNT(*) &lt;&gt; 1</code>{" "}
                query. If duplicates exist, you see metrics, a data preview, a debug query,
                and a CSV download.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Step 4 &mdash; CTE Debugger:</strong>{" "}
                Paste the SQL query that populates the table. The app parses each CTE
                and lets you check them one by one. The first CTE that turns red is where
                duplicates are introduced.
              </li>
            </ul>
          </div>
        </div>

        {/* Configuration Tips */}
        <div className="sc-card">
          <div className="sc-card-header">
            <div>
              <h2>Configuration Tips</h2>
              <p>Getting the most out of the checker</p>
            </div>
          </div>
          <div className="sc-card-body" style={{ lineHeight: 1.8 }}>
            <ul style={{ paddingLeft: 20, color: "var(--text-muted)" }}>
              <li>
                <strong style={{ color: "var(--text)" }}>Billing vs Data project:</strong>{" "}
                The billing project is where query costs are charged. It can differ from
                the project that holds the data.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Dataset location:</strong>{" "}
                Must match where the dataset was created (e.g.{" "}
                <code style={codeStyle}>US</code>, <code style={codeStyle}>EU</code>,{" "}
                <code style={codeStyle}>australia-southeast1</code>).
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Token expiry:</strong>{" "}
                The gcloud access token lasts ~60 minutes. The app automatically
                fetches a fresh token on each request.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Large tables:</strong>{" "}
                The duplicate check query runs on BigQuery, so it handles tables
                of any size. Results are capped at 200 rows in the UI.
              </li>
            </ul>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="sc-card">
          <div className="sc-card-header">
            <div>
              <h2>Troubleshooting</h2>
              <p>Common issues and fixes</p>
            </div>
          </div>
          <div className="sc-card-body" style={{ lineHeight: 1.8 }}>
            <ul style={{ paddingLeft: 20, color: "var(--text-muted)" }}>
              <li>
                <strong style={{ color: "var(--text)" }}>&ldquo;gcloud auth failed&rdquo;</strong>{" "}
                &mdash; Run <code style={codeStyle}>gcloud auth login</code> and make sure
                the Google Cloud SDK is installed and in your PATH.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>&ldquo;Permission denied&rdquo;</strong>{" "}
                &mdash; Ask your GCP admin to grant <em>BigQuery Data Viewer</em> and{" "}
                <em>BigQuery Job User</em> roles on the billing project.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Port 8501 already in use</strong>{" "}
                &mdash; Run with a custom port:{" "}
                <code style={codeStyle}>streamlit run app.py --server.port 8502</code>
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Table not found</strong>{" "}
                &mdash; Double-check project ID, dataset ID, and table name.
                Table names are case-sensitive.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>CTE parsing issues</strong>{" "}
                &mdash; The parser handles standard <code style={codeStyle}>WITH ... AS (...)</code>{" "}
                syntax. Non-standard CTEs or deeply nested sub-queries may not parse correctly.
              </li>
            </ul>
          </div>
        </div>

        {/* Back link */}
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Link
            href="/agents/bq-duplicate-checker"
            className="sc-btn sc-btn-primary"
            style={{ textDecoration: "none" }}
          >&larr; Back to the Agent</Link>
        </div>
      </main>

      <footer className="sc-footer">
        BQ Duplicate Checker &middot; Built by Abhimanyu Sheoran
      </footer>
    </div>
  );
}
