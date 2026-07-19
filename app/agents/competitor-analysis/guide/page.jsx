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

export default function GuidePage() {
  return (
    <div className="sc-page">
      <nav className="sc-nav">
        <div className="sc-nav-inner">
          <Link href="/agents/competitor-analysis" className="sc-nav-back">
            &larr; Back to Agent
          </Link>
          <span className="sc-nav-title">Setup Guide</span>
        </div>
      </nav>

      <div className="sc-hero">
        <h1>Setup <span>Guide</span></h1>
        <p className="sc-hero-subtitle">Configure the Competitor Analysis Agent</p>
        <p className="sc-hero-desc">
          Follow these steps to connect your AI API key and enable live
          competitor analysis. The agent uses Perplexity AI for real-time
          web-grounded intelligence, but can be adapted to OpenAI or Gemini.
        </p>
      </div>

      <main className="sc-main">
        {/* API Key Location */}
        <div className="sc-card" style={{ border: "1px solid rgba(251,191,36,0.3)" }}>
          <div className="sc-card-header">
            <div>
              <h2>Where to Add Your API Key</h2>
              <p>The key is stored as an environment variable — never in source code</p>
            </div>
          </div>
          <div className="sc-card-body" style={{ lineHeight: 1.8 }}>
            <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>
              The API key is read from the environment variable{" "}
              <code style={codeStyle}>COMPETITOR_ANALYSIS_API_KEY</code>.
            </p>

            <div style={{
              padding: "16px 20px", borderRadius: 8, marginBottom: 16,
              background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.15)",
            }}>
              <p style={{ fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                For Vercel (Production):
              </p>
              <ol style={{ paddingLeft: 20, color: "var(--text-muted)", lineHeight: 2 }}>
                <li>Go to <strong style={{ color: "var(--text)" }}>Vercel Dashboard</strong> → your project</li>
                <li>Navigate to <strong style={{ color: "var(--text)" }}>Settings → Environment Variables</strong></li>
                <li>Add a new variable:
                  <br />Key: <code style={codeStyle}>COMPETITOR_ANALYSIS_API_KEY</code>
                  <br />Value: <code style={codeStyle}>your-api-key-here</code>
                </li>
                <li>Select environments: <em>Production</em>, <em>Preview</em>, <em>Development</em></li>
                <li>Click <strong style={{ color: "var(--text)" }}>Save</strong> → Redeploy</li>
              </ol>
            </div>

            <div style={{
              padding: "16px 20px", borderRadius: 8,
              background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)",
            }}>
              <p style={{ fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                For Local Development:
              </p>
              <p style={{ color: "var(--text-muted)", marginBottom: 8 }}>
                Create a <code style={codeStyle}>.env.local</code> file in the project root:
              </p>
              <CodeBlock filename=".env.local" code={`COMPETITOR_ANALYSIS_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`} />
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", opacity: 0.7 }}>
                This file is gitignored by default and never committed to version control.
              </p>
            </div>
          </div>
        </div>

        {/* Supported API Providers */}
        <div className="sc-card">
          <div className="sc-card-header">
            <div>
              <h2>Supported API Providers</h2>
              <p>Choose one — Perplexity is recommended for best results</p>
            </div>
          </div>
          <div className="sc-card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{
                padding: "16px 20px", borderRadius: 8,
                background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.2)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)" }}>
                    Perplexity AI (Recommended)
                  </h3>
                  <span style={{
                    padding: "2px 10px", borderRadius: 12, fontSize: "0.75rem",
                    background: "rgba(52,211,153,0.15)", color: "#34d399", fontWeight: 600,
                  }}>Best for this use case</span>
                </div>
                <ul style={{ paddingLeft: 20, color: "var(--text-muted)", lineHeight: 1.8, fontSize: "0.9rem" }}>
                  <li>Real-time web search + AI analysis in one call</li>
                  <li>Returns current market data (not just training data)</li>
                  <li>Get key: <a href="https://www.perplexity.ai/settings/api" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>perplexity.ai/settings/api</a></li>
                  <li>Pricing: ~$0.005 per request (sonar model)</li>
                  <li>Key format: <code style={codeStyle}>pplx-xxxxxxxxx...</code></li>
                </ul>
              </div>

              <div style={{
                padding: "16px 20px", borderRadius: 8,
                background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
              }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                  OpenAI (GPT-4)
                </h3>
                <ul style={{ paddingLeft: 20, color: "var(--text-muted)", lineHeight: 1.8, fontSize: "0.9rem" }}>
                  <li>Uses training data (may not have latest market info)</li>
                  <li>Great analysis quality, but not web-grounded</li>
                  <li>Get key: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>platform.openai.com/api-keys</a></li>
                  <li>Requires code change in <code style={codeStyle}>app/api/competitor/route.js</code></li>
                </ul>
              </div>

              <div style={{
                padding: "16px 20px", borderRadius: 8,
                background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
              }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                  Google Gemini
                </h3>
                <ul style={{ paddingLeft: 20, color: "var(--text-muted)", lineHeight: 1.8, fontSize: "0.9rem" }}>
                  <li>Free tier available (generous limits)</li>
                  <li>Good for testing before committing to paid API</li>
                  <li>Get key: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>aistudio.google.com/app/apikey</a></li>
                  <li>Requires code change in <code style={codeStyle}>app/api/competitor/route.js</code></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="sc-card">
          <div className="sc-card-header">
            <div>
              <h2>Quick Start</h2>
              <p>Get the agent running in 3 steps</p>
            </div>
          </div>
          <div className="sc-card-body">
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <StepNumber n={1} />
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Get a Perplexity API key</h3>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>
                Sign up at{" "}
                <a href="https://www.perplexity.ai/settings/api" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
                  perplexity.ai/settings/api
                </a>{" "}
                and generate an API key. You get $5 free credit on signup.
              </p>
            </div>

            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <StepNumber n={2} />
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Add the environment variable</h3>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>
                For local development, create <code style={codeStyle}>.env.local</code> in the project root:
              </p>
              <CodeBlock code={`# .env.local\nCOMPETITOR_ANALYSIS_API_KEY=pplx-your-key-here`} />
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>
                For Vercel, add it via Dashboard → Settings → Environment Variables.
              </p>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <StepNumber n={3} />
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Run the dev server</h3>
              </div>
              <CodeBlock code={`npm run dev\n# Navigate to http://localhost:3000/agents/competitor-analysis`} />
            </div>
          </div>
        </div>

        {/* Architecture */}
        <div className="sc-card">
          <div className="sc-card-header">
            <div>
              <h2>How It Works</h2>
              <p>Architecture and data flow</p>
            </div>
          </div>
          <div className="sc-card-body" style={{ lineHeight: 1.8 }}>
            <ul style={{ paddingLeft: 20, color: "var(--text-muted)" }}>
              <li>
                <strong style={{ color: "var(--text)" }}>Step 1 — Input:</strong>{" "}
                User enters industry type, optional company name, and region focus.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Step 2 — API Call:</strong>{" "}
                The frontend sends the request to <code style={codeStyle}>/api/competitor</code> (Next.js API route).
                The API key never leaves the server.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Step 3 — AI Analysis:</strong>{" "}
                The server calls Perplexity&apos;s &ldquo;sonar&rdquo; model which performs real-time
                web search and generates a structured competitive analysis.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Step 4 — Structured Output:</strong>{" "}
                The LLM returns a JSON object with competitors, market data, trends,
                and recommendations. The frontend renders it as an interactive report.
              </li>
            </ul>
          </div>
        </div>

        {/* File Structure */}
        <div className="sc-card">
          <div className="sc-card-header">
            <div>
              <h2>File Structure</h2>
              <p>Where to find and modify the agent code</p>
            </div>
          </div>
          <div className="sc-card-body">
            <CodeBlock code={`portfolio/
├── app/
│   ├── api/
│   │   └── competitor/
│   │       └── route.js          ← API route (API key used here)
│   └── agents/
│       └── competitor-analysis/
│           ├── layout.jsx        ← Page metadata
│           ├── page.jsx          ← Main UI + demo data
│           └── guide/
│               ├── layout.jsx    ← Guide metadata
│               └── page.jsx      ← This setup guide
├── .env.local                    ← YOUR API KEY GOES HERE
└── data/
    └── profile.js                ← Agent listing entry`} />
          </div>
        </div>

        {/* Customization */}
        <div className="sc-card">
          <div className="sc-card-header">
            <div>
              <h2>Customization</h2>
              <p>Adapting the agent for different use cases</p>
            </div>
          </div>
          <div className="sc-card-body" style={{ lineHeight: 1.8 }}>
            <ul style={{ paddingLeft: 20, color: "var(--text-muted)" }}>
              <li>
                <strong style={{ color: "var(--text)" }}>Change the AI provider:</strong>{" "}
                Edit <code style={codeStyle}>app/api/competitor/route.js</code> — swap the
                fetch URL and request format (see comments in the file).
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Modify the analysis prompt:</strong>{" "}
                The <code style={codeStyle}>SYSTEM_PROMPT</code> constant in the route file
                controls what the AI generates. Add/remove sections as needed.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Add more industries:</strong>{" "}
                Edit the <code style={codeStyle}>INDUSTRIES</code> array in{" "}
                <code style={codeStyle}>page.jsx</code> to add quick-select chips.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Rate limiting:</strong>{" "}
                For production use, consider adding rate limiting middleware to prevent
                API cost spikes. Vercel&apos;s Edge Middleware or a simple in-memory counter works.
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
                <strong style={{ color: "var(--text)" }}>&ldquo;API key not configured&rdquo;</strong>{" "}
                &mdash; Make sure <code style={codeStyle}>COMPETITOR_ANALYSIS_API_KEY</code> is set
                in <code style={codeStyle}>.env.local</code> (local) or Vercel env vars (production).
                Restart the dev server after adding it.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>&ldquo;API request failed (401)&rdquo;</strong>{" "}
                &mdash; Your API key is invalid or expired. Generate a new one from the provider.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>&ldquo;API request failed (429)&rdquo;</strong>{" "}
                &mdash; Rate limit exceeded. Wait a minute and try again, or upgrade your API plan.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>&ldquo;Failed to parse analysis response&rdquo;</strong>{" "}
                &mdash; The AI returned malformed JSON. Try again — this occasionally happens
                with complex industries. The prompt enforces JSON output but LLMs aren&apos;t 100% reliable.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Slow responses (30s+)</strong>{" "}
                &mdash; Perplexity&apos;s sonar model performs web search before responding.
                This is normal for the first request. Subsequent requests are faster.
              </li>
            </ul>
          </div>
        </div>

        {/* Back link */}
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Link
            href="/agents/competitor-analysis"
            className="sc-btn sc-btn-primary"
            style={{ textDecoration: "none" }}
          >&larr; Back to the Agent</Link>
        </div>
      </main>

      <footer className="sc-footer">
        Competitor Analysis Agent &middot; Built by Abhimanyu Sheoran
      </footer>
    </div>
  );
}
