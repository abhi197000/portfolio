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

const REQUIREMENTS = `Flask
requests
atlassian-python-api
google-genai
google-cloud-secret-manager`;

const CONFIG_PY = `# config.py
import os

# -- Jira Cloud credentials --
JIRA_API_TOKEN = os.getenv("JIRA_API_TOKEN", "your-jira-api-token")
JIRA_USERNAME = "your-email@company.com"
JIRA_INSTANCE_URL = "https://your-org.atlassian.net"
JIRA_PROJECT_KEY = "PROJ"

# -- Google Cloud / Vertex AI --
GCP_PROJECT_ID = "your-gcp-project-id"
GCP_LOCATION = "us-central1"
LLM_MODEL = "gemini-2.0-flash"

# Secret Manager (stores LLM API key)
SECRET_NAME = "projects/your-gcp-project-id/secrets/llm-api-key/versions/latest"
# Or set LLM_API_KEY env var directly to skip Secret Manager:
# LLM_API_KEY = os.getenv("LLM_API_KEY", "")

# -- SMTP for daily report emails --
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = "your-email@gmail.com"
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "your-app-password")
REPORT_RECIPIENTS = ["team-lead@company.com", "pm@company.com"]

# -- Sprint settings --
BOARD_ID = 42  # Your Jira Agile board ID
SPRINT_PREFIX = "INVENTORY OMS"  # Prefix used for sprint naming`;

const APP_PY = `"""
Jira Command Center - Flask App

Usage:
  1. pip install -r requirements.txt
  2. Configure config.py with your Jira and GCP credentials
  3. python app.py
  4. Open http://127.0.0.1:5000
"""
from flask import Flask, render_template, request, jsonify, send_file
from atlassian import Jira
from google import genai
from google.cloud import secretmanager
import csv
import io
import os
import config

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Jira client
# ---------------------------------------------------------------------------
jira = Jira(
    url=config.JIRA_INSTANCE_URL,
    username=config.JIRA_USERNAME,
    password=config.JIRA_API_TOKEN,
)

# ---------------------------------------------------------------------------
# LLM client (Gemini via Vertex AI)
# ---------------------------------------------------------------------------
def get_llm_api_key():
    """Fetch API key from Secret Manager, or fall back to env var."""
    api_key = os.getenv("LLM_API_KEY")
    if api_key:
        return api_key
    client = secretmanager.SecretManagerServiceClient()
    response = client.access_secret_version(name=config.SECRET_NAME)
    return response.payload.data.decode("utf-8")

llm_client = genai.Client(api_key=get_llm_api_key())

def nl_to_jql(natural_language_query):
    """Convert natural language to JQL using Gemini."""
    prompt = f"""Convert this natural language query to Jira JQL.
Project key: {config.JIRA_PROJECT_KEY}
Query: {natural_language_query}
Return ONLY the JQL string, nothing else."""
    response = llm_client.models.generate_content(
        model=config.LLM_MODEL,
        contents=prompt,
    )
    return response.text.strip()

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/search", methods=["POST"])
def search():
    query = request.json.get("query", "")
    jql = nl_to_jql(query)
    issues = jira.jql(jql, limit=50)
    return jsonify({"jql": jql, "issues": issues.get("issues", [])})

@app.route("/api/sprint-summary")
def sprint_summary():
    # Fetch active sprint and compute analytics
    board_id = config.BOARD_ID
    sprints = jira.get_all_sprints_from_board(board_id)
    active = [s for s in sprints if s.get("state") == "active"]
    if not active:
        return jsonify({"error": "No active sprint found"}), 404
    sprint = active[0]
    issues = jira.get_sprint_issues(sprint["id"])
    # ... compute per-assignee scores, spillover, etc.
    return jsonify({"sprint": sprint, "issues": issues})

@app.route("/api/ticket", methods=["POST"])
def create_ticket():
    data = request.json
    result = jira.create_issue(
        project=config.JIRA_PROJECT_KEY,
        summary=data["summary"],
        issuetype={"name": data.get("type", "Story")},
        assignee={"name": data.get("assignee")},
    )
    return jsonify({"key": result["key"], "status": "created"})

@app.route("/api/ticket/<key>", methods=["PUT"])
def edit_ticket(key):
    data = request.json
    jira.update_issue_field(key, data.get("fields", {}))
    return jsonify({"key": key, "status": "updated"})

@app.route("/api/ticket/<key>/transition", methods=["POST"])
def transition_ticket(key):
    target_status = request.json.get("status")
    transitions = jira.get_issue_transitions(key)
    for t in transitions:
        if t["name"].lower() == target_status.lower():
            jira.set_issue_status(key, t["name"])
            return jsonify({"key": key, "status": target_status})
    return jsonify({"error": f"Transition to '{target_status}' not found"}), 400

@app.route("/api/export-csv")
def export_csv():
    jql = request.args.get("jql", f"project = {config.JIRA_PROJECT_KEY}")
    issues = jira.jql(jql, limit=500).get("issues", [])
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Key", "Summary", "Status", "Assignee", "Priority"])
    for issue in issues:
        fields = issue["fields"]
        writer.writerow([
            issue["key"],
            fields.get("summary", ""),
            fields.get("status", {}).get("name", ""),
            (fields.get("assignee") or {}).get("displayName", "Unassigned"),
            fields.get("priority", {}).get("name", ""),
        ])
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode()),
        mimetype="text/csv",
        as_attachment=True,
        download_name="jira_export.csv",
    )

if __name__ == "__main__":
    app.run(debug=True, port=5000)`;

export default function GuidePage() {
  return (
    <div className="sc-page">
      <nav className="sc-nav">
        <div className="sc-nav-inner">
          <Link href="/agents/jira-command-center" className="sc-nav-back">
            &larr; Back to Agent
          </Link>
          <span className="sc-nav-title">Setup Guide</span>
        </div>
      </nav>

      <div className="sc-hero">
        <h1>Setup <span>Guide</span></h1>
        <p className="sc-hero-subtitle">Run the Jira Command Center locally</p>
        <p className="sc-hero-desc">
          Follow these steps to set up the Jira Command Center on your own
          machine. Uses Flask for the web interface, atlassian-python-api for
          Jira integration, and Gemini (Vertex AI) for natural language to JQL
          conversion.
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
                <strong style={{ color: "var(--text)" }}>Jira Cloud account</strong>{" "}
                with an API token &mdash;{" "}
                <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>Generate token</a>
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>GCP project</strong>{" "}
                with Vertex AI API enabled &mdash;{" "}
                <a href="https://console.cloud.google.com/apis/enableflow?apiid=aiplatform.googleapis.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>Enable API</a>
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Google Cloud Secret Manager</strong>{" "}
                (optional) &mdash; for secure API key storage. You can also set the{" "}
                <code style={codeStyle}>LLM_API_KEY</code> environment variable directly.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>SMTP credentials</strong>{" "}
                (optional) &mdash; only needed for the daily report email feature.
                Gmail with an{" "}
                <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>App Password</a>{" "}
                works well.
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
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Clone &amp; install dependencies</h3>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>
                Create a project folder and install the required Python packages.
              </p>
              <CodeBlock code={`mkdir jira-command-center\ncd jira-command-center\npip install -r requirements.txt`} />
            </div>

            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <StepNumber n={2} />
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Configure config.py</h3>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>
                Edit <code style={codeStyle}>config.py</code> with your Jira
                instance URL, username, API token, project key, and SMTP
                settings. See the Source Code section below for the full
                template.
              </p>
            </div>

            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <StepNumber n={3} />
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Set up the LLM API key</h3>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>
                Option A: Store your Gemini API key in GCP Secret Manager and
                update the <code style={codeStyle}>SECRET_NAME</code> in
                config.py.
              </p>
              <CodeBlock code={`# Create the secret\ngcloud secrets create llm-api-key --replication-policy="automatic"\n\n# Add a version with your key\necho -n "YOUR_API_KEY" | gcloud secrets versions add llm-api-key --data-file=-`} />
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>
                Option B: Set the <code style={codeStyle}>LLM_API_KEY</code>{" "}
                environment variable directly (simpler for local dev):
              </p>
              <CodeBlock code={`# Linux/macOS\nexport LLM_API_KEY="your-gemini-api-key"\n\n# Windows PowerShell\n$env:LLM_API_KEY = "your-gemini-api-key"`} />
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
            <CodeBlock filename="config.py" code={CONFIG_PY} />
            <CodeBlock filename="app.py" code={APP_PY} />
          </div>
        </div>

        {/* How It Works */}
        <div className="sc-card">
          <div className="sc-card-header">
            <div>
              <h2>How It Works</h2>
              <p>Understanding the architecture</p>
            </div>
          </div>
          <div className="sc-card-body" style={{ lineHeight: 1.8 }}>
            <ul style={{ paddingLeft: 20, color: "var(--text-muted)" }}>
              <li>
                <strong style={{ color: "var(--text)" }}>NL &rarr; JQL via Gemini:</strong>{" "}
                Natural language queries are sent to Gemini (Vertex AI) with a
                prompt that includes the project key. The LLM returns a JQL
                string that is executed against the Jira API.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Jira REST API for ticket ops:</strong>{" "}
                The <code style={codeStyle}>atlassian-python-api</code> library
                wraps the Jira Cloud REST API. Supports create, edit, clone
                (across projects), transition, and comment operations.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Sprint analytics via Agile API:</strong>{" "}
                Fetches sprint data from the Jira Agile board API, computes
                per-assignee performance scores based on completion rate and
                story points, and categorizes spillover into buckets (carryover,
                scope creep, blocked).
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>SMTP for daily reports:</strong>{" "}
                Generates an HTML email summarizing the sprint status and sends
                it to configured recipients via SMTP. Supports Gmail App
                Passwords for authentication.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>CSV export:</strong>{" "}
                Any JQL query result can be downloaded as a CSV file with key,
                summary, status, assignee, and priority fields.
              </li>
            </ul>
          </div>
        </div>

        {/* Configuration Tips */}
        <div className="sc-card">
          <div className="sc-card-header">
            <div>
              <h2>Configuration Tips</h2>
              <p>Getting the most out of the Command Center</p>
            </div>
          </div>
          <div className="sc-card-body" style={{ lineHeight: 1.8 }}>
            <ul style={{ paddingLeft: 20, color: "var(--text-muted)" }}>
              <li>
                <strong style={{ color: "var(--text)" }}>Board ID:</strong>{" "}
                Find your Jira Agile board ID by navigating to your board in
                Jira &mdash; the URL will contain{" "}
                <code style={codeStyle}>/board/42</code> where 42 is the board
                ID.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Multi-client cloning:</strong>{" "}
                The clone feature copies a ticket to multiple target projects.
                Make sure the target project keys exist in your Jira instance
                and you have create-issue permissions.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Performance scoring:</strong>{" "}
                The per-assignee score is computed as a weighted combination of
                completion rate (tickets done / assigned) and story points
                delivered. Adjust weights in the scoring function to match your
                team&rsquo;s priorities.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>API rate limits:</strong>{" "}
                Jira Cloud has rate limits (~10 requests/second). The app
                handles pagination but may slow down for very large result sets.
                Use specific JQL filters to keep queries focused.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>LLM model selection:</strong>{" "}
                The default model is <code style={codeStyle}>gemini-2.0-flash</code>.
                For higher-quality JQL generation on complex queries, switch to{" "}
                <code style={codeStyle}>gemini-2.5-pro</code> in config.py.
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
                <strong style={{ color: "var(--text)" }}>&ldquo;401 Unauthorized&rdquo; from Jira</strong>{" "}
                &mdash; Double-check your API token and username (must be the
                email address associated with your Atlassian account, not a
                display name). Regenerate the token if expired.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>&ldquo;Secret not found&rdquo;</strong>{" "}
                &mdash; Verify the <code style={codeStyle}>SECRET_NAME</code>{" "}
                path in config.py matches your GCP project. Alternatively, set
                the <code style={codeStyle}>LLM_API_KEY</code> env var to bypass
                Secret Manager.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>JQL parse errors</strong>{" "}
                &mdash; The LLM occasionally generates invalid JQL. The app
                shows the raw Jira error. Refine your natural language query to
                be more specific, or edit the generated JQL directly.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>SMTP authentication failure</strong>{" "}
                &mdash; If using Gmail, you need an{" "}
                <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>App Password</a>,
                not your regular Gmail password. Enable 2FA first, then generate
                an app-specific password.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Port 5000 already in use</strong>{" "}
                &mdash; Change the port in app.py:{" "}
                <code style={codeStyle}>app.run(port=5001)</code>
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Sprint data empty</strong>{" "}
                &mdash; Verify the <code style={codeStyle}>BOARD_ID</code> in
                config.py matches your Jira Agile board. The board must have an
                active sprint.
              </li>
            </ul>
          </div>
        </div>

        {/* Back link */}
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Link
            href="/agents/jira-command-center"
            className="sc-btn sc-btn-primary"
            style={{ textDecoration: "none" }}
          >&larr; Back to the Agent</Link>
        </div>
      </main>

      <footer className="sc-footer">
        Jira Command Center &middot; Built by Abhimanyu Sheoran
      </footer>
    </div>
  );
}
