import Link from "next/link";

export default function ResumePage() {
  return (
    <main className="cc-main">
      <h1 className="cc-hero-greeting">Your Living Resume</h1>
      <p className="cc-hero-sub">Coming together next — upload, guided form, and your knowledge graph.</p>

      <div className="cc-card" style={{ maxWidth: 640 }}>
        <div className="cc-card-head"><h2>Resume builder</h2></div>
        <div className="cc-card-body">
          <p className="cc-muted" style={{ marginTop: 0 }}>
            This is where you&apos;ll upload a resume to pre-fill, refine it in a guided form, and
            we&apos;ll build a knowledge graph you can update whenever you ship something new.
          </p>
          <Link href="/app" className="cc-btn cc-btn-secondary" style={{ marginTop: 8 }}>
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
