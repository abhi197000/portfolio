"use client";
import { useState } from "react";
import Link from "next/link";
import "../schema-compare/schema-compare.css";

const DEMO_RESULT = {
  industry: "Nutraceuticals",
  marketOverview:
    "The nutraceuticals industry encompasses dietary supplements, functional foods, and beverages with health benefits beyond basic nutrition. The market is driven by increasing health consciousness, aging populations, and preventive healthcare trends.",
  marketSize: "$382B globally (2024)",
  growthRate: "9.4% CAGR (2024-2030)",
  competitors: [
    {
      name: "Amway (Nutrilite)",
      marketShare: "~7%",
      strengths: ["Massive global distribution network", "Strong brand trust", "Vertically integrated farming"],
      weaknesses: ["MLM model perception issues", "Premium pricing limits mass adoption"],
      hq: "Ada, Michigan, USA",
    },
    {
      name: "Herbalife",
      marketShare: "~5%",
      strengths: ["Strong presence in 90+ countries", "Personalized nutrition programs", "Large distributor base"],
      weaknesses: ["Regulatory scrutiny", "Dependence on direct selling channel"],
      hq: "Los Angeles, California, USA",
    },
    {
      name: "Abbott (Ensure, PediaSure)",
      marketShare: "~6%",
      strengths: ["Clinical credibility", "Hospital channel dominance", "R&D budget > $2B/year"],
      weaknesses: ["Limited D2C presence", "Slow to adopt digital marketing"],
      hq: "Abbott Park, Illinois, USA",
    },
    {
      name: "Danone (Nutricia)",
      marketShare: "~4%",
      strengths: ["Strong medical nutrition portfolio", "European market leadership", "Sustainability positioning"],
      weaknesses: ["Complex product portfolio", "High dependency on few markets"],
      hq: "Paris, France",
    },
    {
      name: "Himalaya Wellness",
      marketShare: "~3%",
      strengths: ["Ayurveda heritage brand", "Affordable pricing", "Strong India/ME presence"],
      weaknesses: ["Limited presence in US/EU", "Perception as local brand"],
      hq: "Bengaluru, India",
    },
    {
      name: "GNC",
      marketShare: "~3%",
      strengths: ["Retail store network", "Brand recognition in sports nutrition", "Wide product range"],
      weaknesses: ["Post-bankruptcy restructuring", "Declining foot traffic"],
      hq: "Pittsburgh, Pennsylvania, USA",
    },
  ],
  positioning: [
    { strategy: "Science-backed clinical nutrition", leaders: ["Abbott", "Danone"] },
    { strategy: "Ayurveda / natural positioning", leaders: ["Himalaya", "Patanjali", "Organic India"] },
    { strategy: "Sports & fitness nutrition", leaders: ["GNC", "Optimum Nutrition", "MuscleBlaze"] },
    { strategy: "Direct-to-consumer digital brands", leaders: ["Athletic Greens", "Ritual", "Care/of"] },
    { strategy: "Mass market affordable supplements", leaders: ["Nature Made", "Centrum", "Swisse"] },
  ],
  trends: [
    "Personalized nutrition based on DNA/microbiome testing",
    "AI-driven formulation and recommendation engines",
    "Clean-label and plant-based supplements replacing synthetic vitamins",
    "Subscription-based D2C models disrupting retail",
    "Regulatory tightening (FDA, FSSAI) increasing barrier to entry",
  ],
  opportunities: [
    "Underserved markets in Tier 2/3 cities in India and Southeast Asia",
    "Integration of wearables data with supplement recommendations",
    "B2B white-label manufacturing for D2C brands",
    "Gut health and probiotics category growing 15%+ YoY",
    "Corporate wellness programs as a B2B2C channel",
  ],
  threats: [
    "Counterfeit products eroding consumer trust",
    "Amazon/Flipkart private labels compressing margins",
    "Regulatory changes requiring clinical trial evidence",
    "Consumer fatigue from overcrowded supplement market",
  ],
  recommendations: [
    "Start with a focused niche (e.g., gut health, women's wellness) rather than broad supplement range",
    "Build clinical credibility through third-party testing and published studies",
    "Invest in D2C channel with subscription model for recurring revenue",
    "Partner with health influencers and doctors for authentic marketing",
    "Leverage AI for personalized product recommendations to increase AOV and retention",
  ],
};

const INDUSTRIES = [
  "Nutraceuticals",
  "Healthcare & Pharma",
  "EdTech",
  "FinTech",
  "E-Commerce",
  "SaaS / B2B Software",
  "Renewable Energy",
  "Electric Vehicles",
  "Food & Beverage",
  "Logistics & Supply Chain",
  "Real Estate Tech",
  "Cybersecurity",
];

export default function CompetitorAnalysisPage() {
  const [industry, setIndustry] = useState("");
  const [company, setCompany] = useState("");
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [demoMode, setDemoMode] = useState(false);

  function loadDemo() {
    setIndustry("Nutraceuticals");
    setCompany("");
    setRegion("Global");
    setResult(DEMO_RESULT);
    setDemoMode(true);
    setError("");
  }

  function exitDemo() {
    setIndustry("");
    setCompany("");
    setRegion("");
    setResult(null);
    setDemoMode(false);
    setError("");
  }

  async function runAnalysis() {
    if (!industry.trim()) {
      setError("Please enter or select an industry.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/competitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: industry.trim(),
          company: company.trim(),
          region: region.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Analysis failed.");
        return;
      }
      setResult(data.result);
    } catch (e) {
      setError("Network error: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  function exportJSON() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `competitor-analysis-${result.industry?.toLowerCase().replace(/\s+/g, "-") || "report"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="sc-page">
      <nav className="sc-nav">
        <div className="sc-nav-inner">
          <Link href="/" className="sc-nav-back">&larr; Back to Portfolio</Link>
          <span className="sc-nav-title">Competitor Analysis Agent</span>
        </div>
      </nav>

      <div className="sc-hero">
        <h1>Competitor Analysis <span>Agent</span></h1>
        <p className="sc-hero-subtitle">AI-Powered Market Intelligence</p>
        <p className="sc-hero-desc">
          Enter your industry type and get an instant competitive landscape report —
          top players, market positioning, trends, opportunities, and strategic
          recommendations powered by real-time AI analysis.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
          {!demoMode && (
            <button className="sc-btn sc-btn-primary" onClick={loadDemo}>Try Demo</button>
          )}
          <Link
            href="/agents/competitor-analysis/guide"
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
              Demo Mode &mdash; showing a sample analysis for the Nutraceuticals industry.
              Connect your API key for live analysis.
            </p>
            <button
              className="sc-btn sc-btn-secondary"
              style={{ fontSize: "0.78rem", padding: "6px 14px" }}
              onClick={exitDemo}
            >Exit Demo</button>
          </div>
        )}

        {/* Input Card */}
        <div className="sc-card">
          <div className="sc-card-header">
            <div>
              <h2>Industry & Market</h2>
              <p>Select or type your industry to analyze</p>
            </div>
          </div>
          <div className="sc-card-body">
            <div style={{ marginBottom: 16 }}>
              <label className="sc-label">Industry Type</label>
              <input
                className="sc-input"
                placeholder="e.g. Nutraceuticals, Healthcare, EdTech..."
                value={industry}
                onChange={(e) => { setIndustry(e.target.value); if (demoMode) setDemoMode(false); }}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind}
                    className={`sc-chip ${industry === ind ? "sc-chip-active" : "sc-chip-inactive"}`}
                    onClick={() => { setIndustry(ind); if (demoMode) { setDemoMode(false); setResult(null); } }}
                  >{ind}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label className="sc-label">Your Company (optional)</label>
                <input
                  className="sc-input"
                  placeholder="e.g. HealthKart, Nykaa..."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div>
                <label className="sc-label">Region Focus (optional)</label>
                <input
                  className="sc-input"
                  placeholder="e.g. India, Global, North America..."
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                className="sc-btn sc-btn-primary"
                onClick={runAnalysis}
                disabled={loading || demoMode || !industry.trim()}
              >
                {loading ? "Analyzing..." : "Run Analysis"}
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && <div className="sc-error">{error}</div>}

        {/* Loading */}
        {loading && (
          <div className="sc-loading">
            <div className="sc-spinner" />
            <p style={{ color: "var(--text-muted)", marginTop: 16 }}>
              Analyzing competitive landscape... This may take 15-30 seconds.
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700 }}>
                Analysis: {result.industry}
              </h2>
              <button className="sc-btn sc-btn-success" onClick={exportJSON}>Export JSON</button>
            </div>

            {/* Market Overview Stats */}
            <div className="sc-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              <div className="sc-stat">
                <div className="sc-stat-value" style={{ color: "var(--accent)", fontSize: "1.1rem" }}>
                  {result.marketSize}
                </div>
                <div className="sc-stat-label">Market Size</div>
              </div>
              <div className="sc-stat">
                <div className="sc-stat-value" style={{ color: "#34d399", fontSize: "1.1rem" }}>
                  {result.growthRate}
                </div>
                <div className="sc-stat-label">Growth Rate</div>
              </div>
              <div className="sc-stat">
                <div className="sc-stat-value" style={{ color: "#fbbf24", fontSize: "1.1rem" }}>
                  {result.competitors?.length || 0}
                </div>
                <div className="sc-stat-label">Competitors Mapped</div>
              </div>
            </div>

            {/* Market Overview */}
            <div className="sc-card">
              <div className="sc-card-header">
                <div>
                  <h2>Market Overview</h2>
                  <p>Industry landscape summary</p>
                </div>
              </div>
              <div className="sc-card-body">
                <p style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>{result.marketOverview}</p>
              </div>
            </div>

            {/* Competitors Table */}
            <div className="sc-card">
              <div className="sc-card-header">
                <div>
                  <h2>Top Competitors</h2>
                  <p>{result.competitors?.length} major players identified</p>
                </div>
              </div>
              <div className="sc-table-wrapper">
                <table className="sc-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Market Share</th>
                      <th>HQ</th>
                      <th>Strengths</th>
                      <th>Weaknesses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.competitors?.map((comp, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 700, color: "var(--text)" }}>{comp.name}</td>
                        <td style={{ color: "var(--accent)", fontWeight: 600 }}>{comp.marketShare}</td>
                        <td className="sc-col-type">{comp.hq}</td>
                        <td>
                          <ul style={{ margin: 0, paddingLeft: 16, fontSize: "0.82rem", color: "#34d399" }}>
                            {comp.strengths?.map((s, j) => <li key={j}>{s}</li>)}
                          </ul>
                        </td>
                        <td>
                          <ul style={{ margin: 0, paddingLeft: 16, fontSize: "0.82rem", color: "#fca5a5" }}>
                            {comp.weaknesses?.map((w, j) => <li key={j}>{w}</li>)}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Competitive Positioning */}
            <div className="sc-card">
              <div className="sc-card-header">
                <div>
                  <h2>Competitive Positioning</h2>
                  <p>How players differentiate themselves</p>
                </div>
              </div>
              <div className="sc-card-body">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {result.positioning?.map((pos, i) => (
                    <div key={i} style={{
                      padding: "12px 16px", borderRadius: 8,
                      background: "rgba(56,189,248,0.05)", border: "1px solid var(--border)",
                    }}>
                      <p style={{ fontWeight: 700, color: "var(--text)", marginBottom: 4, fontSize: "0.9rem" }}>
                        {pos.strategy}
                      </p>
                      <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                        Leaders: {pos.leaders?.join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Trends */}
            <div className="sc-card">
              <div className="sc-card-header">
                <div>
                  <h2>Market Trends</h2>
                  <p>Emerging forces shaping the industry</p>
                </div>
              </div>
              <div className="sc-card-body">
                <ul style={{ paddingLeft: 20, color: "var(--text-muted)", lineHeight: 2 }}>
                  {result.trends?.map((trend, i) => (
                    <li key={i}>{trend}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Opportunities & Threats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="sc-card">
                <div className="sc-card-header">
                  <div>
                    <h2 style={{ color: "#34d399" }}>Opportunities</h2>
                  </div>
                </div>
                <div className="sc-card-body">
                  <ul style={{ paddingLeft: 20, color: "var(--text-muted)", lineHeight: 1.9 }}>
                    {result.opportunities?.map((opp, i) => (
                      <li key={i}>{opp}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="sc-card">
                <div className="sc-card-header">
                  <div>
                    <h2 style={{ color: "#ef4444" }}>Threats</h2>
                  </div>
                </div>
                <div className="sc-card-body">
                  <ul style={{ paddingLeft: 20, color: "var(--text-muted)", lineHeight: 1.9 }}>
                    {result.threats?.map((threat, i) => (
                      <li key={i}>{threat}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="sc-card">
              <div className="sc-card-header">
                <div>
                  <h2>Strategic Recommendations</h2>
                  <p>Actionable steps for competitive advantage</p>
                </div>
              </div>
              <div className="sc-card-body">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {result.recommendations?.map((rec, i) => (
                    <div key={i} style={{
                      padding: "12px 16px", borderRadius: 8,
                      background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)",
                      display: "flex", gap: 12, alignItems: "flex-start",
                    }}>
                      <span style={{
                        width: 24, height: 24, borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                        color: "#0a0e17", display: "flex", alignItems: "center",
                        justifyContent: "center", fontWeight: 800, fontSize: "0.75rem", flexShrink: 0,
                      }}>{i + 1}</span>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="sc-footer">
        Competitor Analysis Agent &middot; Built by Abhimanyu Sheoran
      </footer>
    </div>
  );
}
