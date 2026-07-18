"use client";
import { useState } from "react";
import Link from "next/link";
import "../schema-compare.css";

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
        position: "absolute",
        top: 10,
        right: 10,
        padding: "4px 12px",
        borderRadius: 6,
        border: "1px solid var(--border)",
        background: copied ? "rgba(52,211,153,0.15)" : "var(--bg-card)",
        color: copied ? "#34d399" : "var(--text-muted)",
        fontSize: "0.75rem",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s",
        fontFamily: "inherit",
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function CodeBlock({ filename, language, code }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {filename && (
        <div
          style={{
            padding: "8px 16px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "8px 8px 0 0",
            border: "1px solid var(--border)",
            borderBottom: "none",
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "var(--accent)",
            fontFamily: "monospace",
          }}
        >
          {filename}
        </div>
      )}
      <div
        style={{
          position: "relative",
          borderRadius: filename ? "0 0 8px 8px" : 8,
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        <CopyButton text={code} />
        <pre
          style={{
            padding: "16px",
            paddingRight: 80,
            background: "var(--bg)",
            overflowX: "auto",
            margin: 0,
            fontSize: "0.82rem",
            lineHeight: 1.6,
            color: "var(--text-muted)",
            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
          }}
        >
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

const REQUIREMENTS = `flask==3.1.0
google-cloud-bigquery==3.40.1`;

const APP_PY = `"""
Schema Comparison Agent - Local Setup
Compare BigQuery table schemas across GCP projects and datasets.

Usage:
  1. Edit SOURCES below with your GCP project/dataset pairs
  2. pip install -r requirements.txt
  3. python app.py
  4. Open http://localhost:5000
"""
import io
import csv
import subprocess
from flask import Flask, render_template, request, jsonify, Response
from google.cloud import bigquery
from google.oauth2.credentials import Credentials

app = Flask(__name__)


def _get_access_token():
    """Get a fresh gcloud access token."""
    result = subprocess.run(
        "gcloud auth print-access-token",
        shell=True, capture_output=True, text=True, timeout=15,
    )
    if result.returncode != 0:
        raise RuntimeError(f"gcloud auth failed: {result.stderr.strip()}")
    return result.stdout.strip()


def make_bq_client(project_id):
    token = _get_access_token()
    credentials = Credentials(token=token)
    return bigquery.Client(credentials=credentials, project=project_id)


# ----------------------------------------------------------------
# CONFIGURE YOUR SOURCES HERE
# Each entry is one GCP project + dataset pair you want to compare.
# ----------------------------------------------------------------
SOURCES = [
    {
        "client_name": "Source A",
        "project_id": "your-gcp-project-a",
        "dataset_id": "your_dataset_a",
    },
    {
        "client_name": "Source B",
        "project_id": "your-gcp-project-b",
        "dataset_id": "your_dataset_b",
    },
    # Add more sources as needed:
    # {
    #     "client_name": "Source C",
    #     "project_id": "your-gcp-project-c",
    #     "dataset_id": "your_dataset_c",
    # },
]

# Tables you frequently compare (shown as quick-select chips in the UI)
SUGGESTED_TABLES = [
    # "users_table",
    # "orders_table",
    # "inventory_table",
]
# ----------------------------------------------------------------


@app.route("/")
def index():
    return render_template(
        "index.html",
        clients=SOURCES,
        suggested_tables=SUGGESTED_TABLES,
    )


def _compare_single_table(selected_clients, table_name, configs):
    """Compare schemas for a single table across given sources."""
    client_schemas = {}
    errors = []

    for config in configs:
        bq_client = make_bq_client(config["project_id"])
        full_table_id = (
            f"{config['project_id']}.{config['dataset_id']}.{table_name}"
        )
        try:
            table = bq_client.get_table(full_table_id)
            client_schemas[config["client_name"]] = {
                field.name: field.field_type for field in table.schema
            }
        except Exception as e:
            errors.append(f"{config['client_name']}: {str(e)}")

    if not client_schemas:
        return {
            "table_name": table_name, "rows": [], "clients": [],
            "all_columns": [], "errors": errors, "status": "error",
        }

    all_columns = sorted(
        {col for schema in client_schemas.values() for col in schema}
    )

    rows = []
    for col in all_columns:
        row = {"column": col}
        types_found = set()
        type_to_clients = {}
        missing_clients = []

        for client_name in selected_clients:
            if client_name in client_schemas:
                dtype = client_schemas[client_name].get(col, "\\u2014")
                row[client_name] = dtype
                if dtype == "\\u2014":
                    missing_clients.append(client_name)
                else:
                    types_found.add(dtype)
                    type_to_clients.setdefault(dtype, []).append(client_name)
            else:
                row[client_name] = "N/A"

        row["is_mismatch"] = len(types_found) > 1 or len(missing_clients) > 0

        details = []
        if len(types_found) > 1:
            majority_type = max(
                type_to_clients, key=lambda t: len(type_to_clients[t])
            )
            for dtype, clients_list in type_to_clients.items():
                if dtype != majority_type:
                    details.append({
                        "type": "type_diff", "clients": clients_list,
                        "expected": majority_type, "actual": dtype,
                    })
        if missing_clients:
            details.append({"type": "missing", "clients": missing_clients})
        row["mismatch_details"] = details
        rows.append(row)

    active_clients = [c for c in selected_clients if c in client_schemas]
    return {
        "table_name": table_name, "rows": rows, "clients": active_clients,
        "all_columns": all_columns, "errors": errors, "status": "ok",
    }


@app.route("/api/compare", methods=["POST"])
def compare_schemas():
    data = request.get_json()
    selected = data.get("clients", [])
    table_name = data.get("table_name", "").strip()
    if not selected:
        return jsonify({"error": "Select at least one source."}), 400
    if not table_name:
        return jsonify({"error": "Enter a table name."}), 400
    configs = [c for c in SOURCES if c["client_name"] in selected]
    result = _compare_single_table(selected, table_name, configs)
    if result["status"] == "error" and not result["rows"]:
        return jsonify({"error": "Could not fetch schema.", "details": result["errors"]}), 500
    return jsonify(result)


@app.route("/api/compare_batch", methods=["POST"])
def compare_schemas_batch():
    data = request.get_json()
    selected = data.get("clients", [])
    table_names = data.get("table_names", [])
    if not selected:
        return jsonify({"error": "Select at least one source."}), 400
    if not table_names:
        return jsonify({"error": "Select at least one table."}), 400
    configs = [c for c in SOURCES if c["client_name"] in selected]
    results = []
    for tbl in table_names:
        tbl = tbl.strip()
        if tbl:
            results.append(_compare_single_table(selected, tbl, configs))
    return jsonify({"results": results})


@app.route("/api/export_csv", methods=["POST"])
def export_csv():
    data = request.get_json()
    rows, clients = data.get("rows", []), data.get("clients", [])
    table_name = data.get("table_name", "export")
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Column"] + clients + ["Mismatch", "Details"])
    for row in rows:
        csv_row = [row.get("column", "")]
        for c in clients:
            csv_row.append(row.get(c, "\\u2014"))
        csv_row.append("Yes" if row.get("is_mismatch") else "No")
        parts = []
        for d in row.get("mismatch_details", []):
            if d["type"] == "type_diff":
                parts.append(f"{'|'.join(d['clients'])} have {d['actual']} (expected {d['expected']})")
            elif d["type"] == "missing":
                parts.append(f"Missing in: {'|'.join(d['clients'])}")
        csv_row.append("; ".join(parts))
        writer.writerow(csv_row)
    output.seek(0)
    return Response(output.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": f"attachment; filename=schema_{table_name}.csv"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)`;

export default function GuidePage() {
  return (
    <div className="sc-page">
      <nav className="sc-nav">
        <div className="sc-nav-inner">
          <Link href="/agents/schema-compare" className="sc-nav-back">
            &larr; Back to Agent
          </Link>
          <span className="sc-nav-title">Setup Guide</span>
        </div>
      </nav>

      <div className="sc-hero">
        <h1>
          Setup <span>Guide</span>
        </h1>
        <p className="sc-hero-subtitle">Run the Schema Comparison Agent locally</p>
        <p className="sc-hero-desc">
          Follow these steps to set up and run the agent on your own machine
          with your GCP BigQuery data. No cloud deployment needed &mdash;
          everything runs locally.
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
                <strong style={{ color: "var(--text)" }}>Python 3.9+</strong>{" "}
                &mdash;{" "}
                <a href="https://www.python.org/downloads/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
                  Download
                </a>
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Google Cloud SDK</strong>{" "}
                (for <code style={{ color: "var(--accent)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4, fontSize: "0.85rem" }}>gcloud</code> CLI) &mdash;{" "}
                <a href="https://cloud.google.com/sdk/docs/install" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
                  Install guide
                </a>
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>BigQuery access</strong>{" "}
                &mdash; You need the <em>BigQuery Data Viewer</em> role on the
                GCP projects you want to query
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
            {/* Step 1 */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                  color: "#0a0e17", display: "flex", alignItems: "center",
                  justifyContent: "center", fontWeight: 800, fontSize: "0.82rem",
                  flexShrink: 0,
                }}>1</span>
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Create the project files</h3>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>
                Create a folder and add the files shown in the &ldquo;Source Code&rdquo; section below.
              </p>
              <CodeBlock code={`mkdir schema-agent\ncd schema-agent\nmkdir templates`} />
            </div>

            {/* Step 2 */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                  color: "#0a0e17", display: "flex", alignItems: "center",
                  justifyContent: "center", fontWeight: 800, fontSize: "0.82rem",
                  flexShrink: 0,
                }}>2</span>
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Install dependencies</h3>
              </div>
              <CodeBlock code={`pip install -r requirements.txt`} />
            </div>

            {/* Step 3 */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                  color: "#0a0e17", display: "flex", alignItems: "center",
                  justifyContent: "center", fontWeight: 800, fontSize: "0.82rem",
                  flexShrink: 0,
                }}>3</span>
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Authenticate with GCP</h3>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>
                Make sure you&apos;re logged into the right Google Cloud account:
              </p>
              <CodeBlock code={`gcloud auth login\ngcloud auth application-default login`} />
            </div>

            {/* Step 4 */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                  color: "#0a0e17", display: "flex", alignItems: "center",
                  justifyContent: "center", fontWeight: 800, fontSize: "0.82rem",
                  flexShrink: 0,
                }}>4</span>
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Configure &amp; run</h3>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>
                Edit the <code style={{ color: "var(--accent)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4, fontSize: "0.85rem" }}>SOURCES</code> list
                in <code style={{ color: "var(--accent)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4, fontSize: "0.85rem" }}>app.py</code> with
                your GCP project IDs and dataset IDs, then start the server:
              </p>
              <CodeBlock code={`python app.py\n# Open http://localhost:5000 in your browser`} />
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

        {/* Configuration Tips */}
        <div className="sc-card">
          <div className="sc-card-header">
            <div>
              <h2>Configuration Tips</h2>
              <p>Getting the most out of the agent</p>
            </div>
          </div>
          <div className="sc-card-body" style={{ lineHeight: 1.8 }}>
            <ul style={{ paddingLeft: 20, color: "var(--text-muted)" }}>
              <li>
                <strong style={{ color: "var(--text)" }}>Finding your Project ID:</strong>{" "}
                Run <code style={{ color: "var(--accent)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4, fontSize: "0.85rem" }}>gcloud projects list</code>{" "}
                to see all projects you have access to.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Finding Dataset IDs:</strong>{" "}
                Run <code style={{ color: "var(--accent)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4, fontSize: "0.85rem" }}>bq ls --project_id=YOUR_PROJECT</code>{" "}
                to list all datasets in a project.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Suggested Tables:</strong>{" "}
                Add table names you frequently compare to the{" "}
                <code style={{ color: "var(--accent)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4, fontSize: "0.85rem" }}>SUGGESTED_TABLES</code>{" "}
                list for one-click selection in the UI.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Multiple environments:</strong>{" "}
                This works great for comparing schemas across dev/staging/prod, or
                across client deployments that should share the same table structures.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Token expiry:</strong>{" "}
                The gcloud access token lasts ~60 minutes. The app automatically
                fetches a fresh token on each request.
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
                <strong style={{ color: "var(--text)" }}>
                  &ldquo;gcloud auth failed&rdquo;
                </strong>{" "}
                &mdash; Run <code style={{ color: "var(--accent)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4, fontSize: "0.85rem" }}>gcloud auth login</code>{" "}
                and make sure the Google Cloud SDK is installed and in your PATH.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>
                  &ldquo;Permission denied&rdquo;
                </strong>{" "}
                &mdash; Ask your GCP admin to grant you the{" "}
                <em>BigQuery Data Viewer</em> role on the target project.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>
                  Port 5000 already in use
                </strong>{" "}
                &mdash; Change the port in the last line of app.py:{" "}
                <code style={{ color: "var(--accent)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4, fontSize: "0.85rem" }}>app.run(port=5001)</code>
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>
                  Table not found
                </strong>{" "}
                &mdash; Double-check the table name spelling and that the table
                exists in that specific dataset. Table names are case-sensitive.
              </li>
            </ul>
          </div>
        </div>

        {/* Back link */}
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Link
            href="/agents/schema-compare"
            className="sc-btn sc-btn-primary"
            style={{ textDecoration: "none" }}
          >
            &larr; Back to the Agent
          </Link>
        </div>
      </main>

      <footer className="sc-footer">
        Schema Comparison Agent &middot; Built by Abhimanyu Sheoran
      </footer>
    </div>
  );
}
