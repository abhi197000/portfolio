import Link from "next/link";
import "./wishlist-growth.css";

const TOOLS = [
  {
    num: "01 · Collect",
    href: "/wishlist/scraper.html",
    badge: "Live API",
    badgeClass: "api",
    title: "Wishlist Signal Scraper",
    desc: "Pulls real fashion-app reviews at scale from Google Play, the App Store and Reddit — no API keys. Backed by a serverless function on this site; change the app ID to target AJIO or Nykaa.",
    tags: ["Serverless", "Google Play", "App Store", "No keys"],
  },
  {
    num: "02 · Discover",
    href: "/wishlist/engine.html",
    badge: "Live",
    badgeClass: "live",
    title: "Wishlist Signal Engine",
    desc: "An AI-designed taxonomy tags every review, quantifies theme frequency and sentiment, and scores opportunities against the business metric — auto-excluding price by the no-money constraint.",
    tags: ["NLP taxonomy", "Opportunity scoring", "Sentiment"],
  },
  {
    num: "03 · Validate",
    href: "/wishlist/research-kit.html",
    badge: "Live",
    badgeClass: "live",
    title: "Wishlist Research Kit",
    desc: "Screener, recruitment, a 30-minute interview guide built around a live wishlist walk-through, and a synthesis template that outputs the problem definition.",
    tags: ["Screener", "Interview guide", "Synthesis"],
  },
  {
    num: "04 · Ship",
    href: "/wishlist/mvp.html",
    badge: "Live",
    badgeClass: "live",
    title: "Wishlist Confidence Assistant",
    desc: "The MVP prototype: resolves fit, quality and styling doubt in-app with a working fit-finder and a real-buyer verdict panel, driving add-to-bag with zero discount.",
    tags: ["Prototype", "Fit-finder", "In-app"],
  },
];

export const metadata = {
  title: "Wishlist Growth Studio — Abhimanyu Sheoran",
  description:
    "A four-tool PM discovery-to-delivery suite that lifts Myntra wishlist-to-purchase conversion without discounts: review scraper, AI discovery engine, user-research kit, and a deployed MVP.",
};

export default function WishlistGrowthPage() {
  return (
    <div className="wg-page">
      <nav className="wg-nav">
        <div className="wg-nav-inner">
          <Link href="/" className="wg-nav-back">&larr; Back to Portfolio</Link>
          <span className="wg-nav-title">Wishlist Growth Studio</span>
        </div>
      </nav>

      <header className="wg-hero">
        <p className="wg-eyebrow">Myntra · Growth · Product Management</p>
        <h1>Wishlist Growth <span>Studio</span></h1>
        <p className="wg-sub">
          A four-tool discovery-to-delivery suite for one goal: lift the share of users who buy a
          wishlisted item within 30 days — <b style={{ color: "var(--text)" }}>without any discount</b>.
          Every tool below is live and testable, including a real serverless review scraper.
        </p>
        <div className="wg-pipe">
          <span className="wg-step"><b>1</b> Scrape reviews</span>
          <span className="wg-step"><b>2</b> Discover opportunities</span>
          <span className="wg-step"><b>3</b> Validate with users</span>
          <span className="wg-step"><b>4</b> Ship the MVP</span>
        </div>
      </header>

      <main className="wg-main">
        <h2 className="wg-section-title">The pipeline — four working tools</h2>
        <p className="wg-section-sub">Each opens in a new tab. The scraper feeds the engine; the engine points to the opportunity; research validates it; the MVP solves it.</p>
        <div className="wg-cards">
          {TOOLS.map((t) => (
            <a key={t.title} className="wg-card" href={t.href} target="_blank" rel="noopener noreferrer">
              <div className="wg-card-top">
                <span className="wg-num">{t.num}</span>
                <span className={`wg-badge ${t.badgeClass}`}>{t.badge}</span>
              </div>
              <h3>{t.title}</h3>
              <p>{t.desc}</p>
              <div className="wg-tags">{t.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              <span className="wg-cta">Open the tool &rarr;</span>
            </a>
          ))}
        </div>

        <div className="wg-deckbar" style={{ marginTop: 28 }}>
          <p><b>Help the research</b> — a 2-minute anonymous survey that quantifies which doubt (fit / quality / styling / price) stalls people most. Open to all, no sign-in.</p>
          <a className="wg-btn" href="https://docs.google.com/forms/d/e/1FAIpQLSchB-vz62DCvYCx6eexT72Wgc4jPpVhGcqMnKFOKeohN4HhHg/viewform" target="_blank" rel="noopener noreferrer">Take the 2-min survey &rarr;</a>
        </div>

        <h2 className="wg-section-title">How the thinking evolved</h2>
        <p className="wg-section-sub">Business metric → product outcomes → AI discovery → primary research → problem → MVP.</p>
        <div className="wg-think">
          <div className="wg-card">
            <h4>Business metric</h4>
            <p>W2P₃₀ decomposes into Reach × Recall × Confidence × Intent × Checkout. Price is off-limits (no-money constraint) and checkout isn&apos;t wishlist-specific — leaving <b>confidence</b> as the only high-frequency lever.</p>
          </div>
          <div className="wg-card">
            <h4>AI discovery</h4>
            <p>Mining public reviews surfaces fit, quality and styling doubt as the solvable, in-scope blockers. Raw app reviews skew to post-purchase gripes — so pre-purchase confidence is validated in interviews.</p>
          </div>
          <div className="wg-card">
            <h4>The problem</h4>
            <p>High-intent saved items go cold because the app can&apos;t answer &ldquo;will it fit, is it good, will it suit me&rdquo; — so users leak out to Google, friends and other apps, and defer.</p>
          </div>
          <div className="wg-card">
            <h4>The solution</h4>
            <p>A Wishlist Confidence Assistant that resolves those three doubts in-app and tips &ldquo;saved&rdquo; into &ldquo;bought&rdquo; — margin-safe, with no coupon, and likely lowering returns too.</p>
          </div>
        </div>

        <div className="wg-deckbar">
          <p><b>Full case study</b> — 10-slide deck covering metric decomposition, discovery findings, problem definition, MVP, success metrics and risks.</p>
          <a className="wg-btn" href="/wishlist/NL-Myntra.pdf" target="_blank" rel="noopener noreferrer">Open the deck (PDF) &rarr;</a>
        </div>

        <p className="wg-note">
          Note: the three browser tools run entirely client-side (no data leaves your device). The scraper calls a serverless function on this site — Google Play and the App Store work from the server; Reddit is often rate-limited from datacentre IPs, so it degrades gracefully.
        </p>
      </main>

      <footer className="wg-footer">Wishlist Growth Studio · a PM growth project · Built with Next.js</footer>
    </div>
  );
}
