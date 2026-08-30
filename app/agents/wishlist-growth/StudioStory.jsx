"use client";
import { useState, useEffect, useCallback } from "react";

const BEATS = [
  {
    kind: "goal", tag: "The mission", disc: "₹0", discSub: "discount",
    title: "Turn saved items into purchases",
    body: "Lift the share of users who buy a wishlisted item within 30 days — using confidence, not coupons.",
    cta: { label: "Enter the pipeline →", next: true },
  },
  {
    kind: "tool", disc: "1", tag: "Step 1 · Collect", title: "Signal Scraper",
    body: "Pull real fashion-app reviews at scale from Google Play, App Store & Reddit — no API keys. A live serverless function.",
    href: "/wishlist/scraper.html", cta: { label: "Open the scraper →" },
  },
  {
    kind: "tool", disc: "2", tag: "Step 2 · Discover", title: "Signal Engine",
    body: "An AI taxonomy tags every review, quantifies theme frequency & sentiment, and ranks opportunities — auto-excluding price.",
    href: "/wishlist/engine.html", cta: { label: "Open the engine →" },
  },
  {
    kind: "tool", disc: "3", tag: "Step 3 · Validate", title: "Research Kit",
    body: "Screener, interview guide and a live 2-minute survey to confirm which doubt — fit, quality or styling — stalls people most.",
    href: "/wishlist/research-kit.html", cta: { label: "Open the kit →" },
  },
  {
    kind: "tool", disc: "4", tag: "Step 4 · Ship", title: "Confidence MVP",
    body: "The prototype resolves fit, quality & styling in-app with a working fit-finder — tipping ‘saved’ into ‘bought’, no discount.",
    href: "/wishlist/mvp.html", cta: { label: "Open the MVP →" },
  },
  {
    kind: "deck", disc: "★", tag: "The whole story", title: "The case study",
    body: "Ten slides: metric decomposition, discovery findings, the problem, the solution, success metrics and risks.",
    href: "/wishlist/NL-Myntra.pdf", cta: { label: "Open the deck →" },
  },
];

export default function StudioStory() {
  const [active, setActive] = useState(0);
  const n = BEATS.length;
  const clamp = (i) => Math.max(0, Math.min(n - 1, i));
  const go = useCallback((i) => setActive(clamp(i)), [n]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") setActive((a) => clamp(a + 1));
      else if (e.key === "ArrowLeft") setActive((a) => clamp(a - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [n]);

  function styleFor(i) {
    const off = i - active;
    const abs = Math.abs(off);
    if (abs > 2) {
      return { opacity: 0, pointerEvents: "none", zIndex: 0,
        transform: `translate(-50%,-50%) translateX(${off > 0 ? 150 : -150}%) translateZ(-800px)` };
    }
    const x = off * 62;
    const z = -abs * 250;
    const ry = off * -34;
    const scale = 1 - abs * 0.16;
    const op = abs === 0 ? 1 : abs === 1 ? 0.55 : 0.2;
    return {
      transform: `translate(-50%,-50%) translateX(${x}%) translateZ(${z}px) rotateY(${ry}deg) scale(${scale})`,
      opacity: op,
      filter: abs === 0 ? "none" : `blur(${abs * 1.1}px)`,
      zIndex: 20 - abs * 2,
      pointerEvents: "auto",
    };
  }

  return (
    <section className="story" aria-roledescription="carousel">
      <p className="story-hint">Click a card, use the arrows, or press ← / → to fly through the pipeline</p>
      <div className="story-stage">
        <div className="story-thread"><i /></div>
        <div className="story-deck">
          {BEATS.map((b, i) => {
            const isActive = i === active;
            return (
              <article
                key={i}
                className={"story-card k-" + b.kind + (isActive ? " is-active" : "")}
                style={styleFor(i)}
                onClick={() => !isActive && go(i)}
                aria-hidden={!isActive}
              >
                <div className="story-disc"><b>{b.disc}</b>{b.discSub && <em>{b.discSub}</em>}</div>
                <div className="story-tag">{b.tag}</div>
                <h3>{b.title}</h3>
                <p>{b.body}</p>
                <div className="story-cta">
                  {isActive ? (
                    b.cta.next ? (
                      <button onClick={(e) => { e.stopPropagation(); go(active + 1); }}>{b.cta.label}</button>
                    ) : (
                      <a href={b.href} target="_blank" rel="noopener noreferrer">{b.cta.label}</a>
                    )
                  ) : (
                    <span className="story-peekcta">fly here</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <div className="story-controls">
        <button className="story-nav" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous">&#8249;</button>
        <div className="story-dots">
          {BEATS.map((b, i) => (
            <button key={i} className={"story-dot" + (i === active ? " on" : "")} onClick={() => go(i)} aria-label={`Go to ${b.title}`} />
          ))}
        </div>
        <button className="story-nav" onClick={() => go(active + 1)} disabled={active === n - 1} aria-label="Next">&#8250;</button>
      </div>
    </section>
  );
}
