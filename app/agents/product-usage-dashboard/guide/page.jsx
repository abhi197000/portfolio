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

const REQUIREMENTS = `Flask>=3.0
google-cloud-bigquery>=3.20
google-auth>=2.14
db-dtypes>=1.2`;

const APP_PY = `"""
Product Usage Dashboard - Local Setup
Connects to BigQuery to show order metrics, category breakdowns,
growth trends, funnel analysis, and per-user module activity.

Usage:
  1. pip install -r requirements.txt
  2. gcloud auth application-default login
  3. Edit CLIENTS mapping below
  4. python app.py  ->  http://127.0.0.1:5000
"""
from flask import Flask, render_template, request, jsonify
from google.cloud import bigquery
from google.auth import default
import json, os

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Client mapping - add your clients here
# ---------------------------------------------------------------------------
CLIENTS = {
    "Aurora": {
        "project_id": "aurora-retail-2025",
        "dataset": "aurora-retail-2025.aurora_ingestion_prod",
    },
    "Meridian": {
        "project_id": "meridian-retail-2025",
        "dataset": "meridian-retail-2025.meridian_ingestion_prod",
    },
    "Summit": {
        "project_id": "summit-retail-2025",
        "dataset": "summit-retail-2025.summit_ingestion_prod",
    },
}

BILLING_PROJECT = "retail-demo-data-scan"

# ---------------------------------------------------------------------------
# BigQuery helper
# ---------------------------------------------------------------------------
def get_bq_client():
    """Create a BigQuery client using application-default credentials."""
    credentials, project = default()
    return bigquery.Client(
        credentials=credentials,
        project=BILLING_PROJECT,
    )

def run_query(sql, params=None):
    """Run a parameterized query and return rows as list of dicts."""
    client = get_bq_client()
    job_config = bigquery.QueryJobConfig()
    if params:
        job_config.query_parameters = [
            bigquery.ScalarQueryParameter(k, "STRING", v)
            for k, v in params.items()
        ]
    job = client.query(sql, job_config=job_config)
    rows = job.result()
    return [dict(row) for row in rows]

# ---------------------------------------------------------------------------
# Load queries from JSON (parameterized SQL)
# ---------------------------------------------------------------------------
QUERIES = {}
queries_path = os.path.join(os.path.dirname(__file__), "usage_queries.json")
if os.path.exists(queries_path):
    with open(queries_path) as f:
        QUERIES = json.load(f)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html", clients=list(CLIENTS.keys()))

@app.route("/api/summary/<client_name>")
def get_summary(client_name):
    """Return order summary metrics for a client."""
    if client_name not in CLIENTS:
        return jsonify({"error": "Unknown client"}), 404
    cfg = CLIENTS[client_name]
    dataset = cfg["dataset"]

    sql = QUERIES.get("order_summary", "").replace("{{DATASET}}", dataset)
    if not sql:
        return jsonify({"error": "Query not configured"}), 500

    try:
        rows = run_query(sql)
        return jsonify({"summary": rows})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/breakdown/<client_name>")
def get_breakdown(client_name):
    """Return category breakdown for a client."""
    if client_name not in CLIENTS:
        return jsonify({"error": "Unknown client"}), 404
    cfg = CLIENTS[client_name]
    dataset = cfg["dataset"]

    sql = QUERIES.get("category_breakdown", "").replace("{{DATASET}}", dataset)
    if not sql:
        return jsonify({"error": "Query not configured"}), 500

    try:
        rows = run_query(sql)
        return jsonify({"breakdown": rows})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/growth/<client_name>")
def get_growth(client_name):
    """Return monthly growth data for a client."""
    if client_name not in CLIENTS:
        return jsonify({"error": "Unknown client"}), 404
    cfg = CLIENTS[client_name]
    dataset = cfg["dataset"]

    sql = QUERIES.get("monthly_growth", "").replace("{{DATASET}}", dataset)
    if not sql:
        return jsonify({"error": "Query not configured"}), 500

    try:
        rows = run_query(sql)
        return jsonify({"growth": rows})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/modules/<client_name>")
def get_modules(client_name):
    """Return module action data for a client."""
    if client_name not in CLIENTS:
        return jsonify({"error": "Unknown client"}), 404
    cfg = CLIENTS[client_name]
    dataset = cfg["dataset"]

    sql = QUERIES.get("module_actions", "").replace("{{DATASET}}", dataset)
    if not sql:
        return jsonify({"error": "Query not configured"}), 500

    try:
        rows = run_query(sql)
        return jsonify({"modules": rows})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)`;

export default function GuidePage() {
  return (
    <div className="sc-page">
      <nav className="sc-nav">
        <div className="sc-nav-inner">
          <Link href="/agents/product-usage-dashboard" className="sc-nav-back">
            &larr; Back to Agent
          </Link>
          <span className="sc-nav-title">Setup Guide</span>
        </div>
      </nav>

      <div className="sc-hero">
        <h1>Setup <span>Guide</span></h1>
        <p className="sc-hero-subtitle">Run the Product Usage Dashboard locally</p>
        <p className="sc-hero-desc">
          Follow these steps to deploy the dashboard on your own machine.
          It connects to BigQuery via application-default credentials and
          serves a Flask UI with Chart.js visualizations.
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
                <strong style={{ color: "var(--text)" }}>Python 3.10+</strong> &mdash;{" "}
                <a href="https://www.python.org/downloads/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>Download</a>
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Google Cloud SDK</strong>{" "}
                (for <code style={codeStyle}>gcloud</code> CLI) &mdash;{" "}
                <a href="https://cloud.google.com/sdk/docs/install" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>Install guide</a>
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>GCP project with BigQuery access</strong> &mdash;{" "}
                You need <em>BigQuery Data Viewer</em> on the data project and{" "}
                <em>BigQuery Job User</em> on the billing project
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Client datasets provisioned</strong> &mdash;{" "}
                Each client needs a BigQuery dataset with the expected ingestion tables
              </li>
            </ul>
          </div>
        </div>

        {/* Quick Start */}
        <div className="sc-card">
          <div className="sc-card-header">
            <div>
              <h2>Quick Start</h2>
              <p>4 steps to get running</p>
            </div>
          </div>
          <div className="sc-card-body">
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <StepNumber n={1} />
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Clone &amp; install</h3>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>
                Create a project folder and install the Python dependencies.
              </p>
              <CodeBlock code={`mkdir product-usage-dashboard\ncd product-usage-dashboard\npip install -r requirements.txt`} />
            </div>

            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <StepNumber n={2} />
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Authenticate with gcloud</h3>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>
                Set up application-default credentials and configure the billing quota project:
              </p>
              <CodeBlock code={`gcloud auth application-default login\ngcloud auth application-default set-quota-project retail-demo-data-scan`} />
            </div>

            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <StepNumber n={3} />
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Update client mapping</h3>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>
                Edit the <code style={codeStyle}>CLIENTS</code> dictionary in{" "}
                <code style={codeStyle}>app.py</code> to point to your BigQuery projects and datasets:
              </p>
              <CodeBlock code={`CLIENTS = {\n    "Aurora": {\n        "project_id": "aurora-retail-2025",\n        "dataset": "aurora-retail-2025.aurora_ingestion_prod",\n    },\n    "Meridian": {\n        "project_id": "meridian-retail-2025",\n        "dataset": "meridian-retail-2025.meridian_ingestion_prod",\n    },\n    # Add more clients here...\n}`} />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <StepNumber n={4} />
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Run the app</h3>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>
                Start the Flask development server:
              </p>
              <CodeBlock code={`python app.py\n# Opens http://127.0.0.1:5000 in your browser`} />
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
              <p>Understanding the dashboard architecture</p>
            </div>
          </div>
          <div className="sc-card-body" style={{ lineHeight: 1.8 }}>
            <ul style={{ paddingLeft: 20, color: "var(--text-muted)" }}>
              <li>
                <strong style={{ color: "var(--text)" }}>BigQuery REST queries:</strong>{" "}
                The app authenticates via <code style={codeStyle}>google-auth</code> application-default
                credentials and runs queries through the BigQuery Python client, billed to a
                shared quota project.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Fiscal date mapping:</strong>{" "}
                Periods are mapped to fiscal weeks and months using the client&apos;s calendar
                configuration, enabling period-over-period comparisons aligned to retail
                fiscal calendars.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Parameterized SQL from JSON:</strong>{" "}
                All queries live in <code style={codeStyle}>usage_queries.json</code>.
                Dataset placeholders (<code style={codeStyle}>{"{{DATASET}}"}</code>) are
                swapped at runtime based on the selected client.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Chart.js visualization:</strong>{" "}
                The frontend uses Chart.js to render time-series line charts for monthly
                order trends and bar charts for module action breakdowns.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Gmail SMTP for reports:</strong>{" "}
                The email report feature uses Flask-Mail with Gmail SMTP to send
                formatted HTML summaries with attached CSV data to stakeholders.
              </li>
            </ul>
          </div>
        </div>

        {/* Configuration Tips */}
        <div className="sc-card">
          <div className="sc-card-header">
            <div>
              <h2>Configuration Tips</h2>
              <p>Customizing the dashboard for your needs</p>
            </div>
          </div>
          <div className="sc-card-body" style={{ lineHeight: 1.8 }}>
            <ul style={{ paddingLeft: 20, color: "var(--text-muted)" }}>
              <li>
                <strong style={{ color: "var(--text)" }}>Adding new clients:</strong>{" "}
                Add a new entry to the <code style={codeStyle}>CLIENTS</code> dict with the
                client&apos;s BigQuery project ID and dataset path. The dashboard will
                automatically show a new client card.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Changing the billing project:</strong>{" "}
                Update the <code style={codeStyle}>BILLING_PROJECT</code> constant in{" "}
                <code style={codeStyle}>app.py</code>. All query costs are charged to this project.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Custom queries:</strong>{" "}
                Edit <code style={codeStyle}>usage_queries.json</code> to modify or add SQL
                queries. Use the <code style={codeStyle}>{"{{DATASET}}"}</code> placeholder for
                the client&apos;s dataset reference.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Granularity:</strong>{" "}
                Time-series charts support both monthly and weekly granularity.
                Toggle via the <code style={codeStyle}>granularity</code> query parameter
                on the growth API endpoint.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Period comparison:</strong>{" "}
                The period comparison feature lets users pick two date ranges and
                see the delta across all order metrics. Configure default periods in
                the frontend template.
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
                <strong style={{ color: "var(--text)" }}>&ldquo;Could not automatically determine credentials&rdquo;</strong>{" "}
                &mdash; Run <code style={codeStyle}>gcloud auth application-default login</code> to
                set up credentials. Ensure the Google Cloud SDK is installed and in your PATH.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>&ldquo;Access Denied: BigQuery&rdquo;</strong>{" "}
                &mdash; Verify you have <em>BigQuery Data Viewer</em> on the data project
                and <em>BigQuery Job User</em> on the billing project. Run{" "}
                <code style={codeStyle}>gcloud auth application-default set-quota-project PROJECT_ID</code>.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Port 5000 already in use</strong>{" "}
                &mdash; Change the port in <code style={codeStyle}>app.py</code>:{" "}
                <code style={codeStyle}>app.run(port=5001)</code>
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Empty dashboard / no data</strong>{" "}
                &mdash; Check that <code style={codeStyle}>usage_queries.json</code> exists
                and contains valid SQL. Verify the client dataset path matches your BigQuery
                project structure.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Email report not sending</strong>{" "}
                &mdash; Gmail SMTP requires an App Password if 2FA is enabled. Set the{" "}
                <code style={codeStyle}>MAIL_USERNAME</code> and{" "}
                <code style={codeStyle}>MAIL_PASSWORD</code> environment variables.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Slow queries</strong>{" "}
                &mdash; Large datasets may take time on the first run. BigQuery caches
                results for 24 hours. Consider adding date filters to narrow the scan.
              </li>
            </ul>
          </div>
        </div>

        {/* Back link */}
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Link
            href="/agents/product-usage-dashboard"
            className="sc-btn sc-btn-primary"
            style={{ textDecoration: "none" }}
          >&larr; Back to the Agent</Link>
        </div>
      </main>

      <footer className="sc-footer">
        Product Usage Dashboard &middot; Built by Abhimanyu Sheoran
      </footer>
    </div>
  );
}
