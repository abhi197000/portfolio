import Link from "next/link";
import "./wishlist-growth.css";
import StudioStory from "./StudioStory";

export const metadata = {
  title: "Wishlist Growth Studio — Abhimanyu Sheoran",
  description:
    "A four-tool PM discovery-to-delivery suite that lifts Myntra wishlist-to-purchase conversion without discounts: review scraper, AI discovery engine, user-research kit, and a deployed MVP — told as a 3D story you fly through.",
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
          One goal — lift 30-day wishlist&rarr;purchase <b style={{ color: "var(--text)" }}>without any discount</b>.
          Fly through the pipeline below: each stage is a live tool you can open and test.
        </p>
      </header>

      <StudioStory />

      <main className="wg-main">
        <div className="wg-deckbar" style={{ marginTop: 10 }}>
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
      </main>

      <footer className="wg-footer">Wishlist Growth Studio · a PM growth project · Built with Next.js</footer>
    </div>
  );
}
