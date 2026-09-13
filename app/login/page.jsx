"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AgentOrb from "../_module/AgentOrb";
import { MODULE_NAME, MODULE_TAGLINE } from "../_module/brand";
import { createClient } from "../../lib/supabase/client";

const BOOT = [
  ["initializing agent core", "ok"],
  ["mounting 26 case files", "ok"],
  ["calibrating certification protocol", "ok"],
  ["syncing living-resume graph", "ok"],
];

const FEATURES = [
  ["Daily missions", "3 SQL + 3 Python a day, with a streak that follows you."],
  ["Practice sim", "15 business cases, graded live in a browser sandbox."],
  ["Certification", "No hints, no reveals — just a scorecard."],
  ["Living resume", "Tell it what you shipped; it rewrites and versions itself."],
];

function Portal() {
  const params = useSearchParams();
  const next = params.get("next") || "/app";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState(params.get("error") ? "That sign-in link expired or was already used — request a new one." : "");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    setError("");
    const { error: authError } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (authError) {
      setError(authError.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <main className="cc-portal">
      <div>
        <p className="cc-eyebrow">Module // Agentic career training</p>
        <h1 className="cc-portal-title cc-neon">{MODULE_NAME.toUpperCase()}</h1>
        <p className="cc-portal-tagline">{MODULE_TAGLINE}</p>

        <div className="cc-boot">
          {BOOT.map(([label, result], i) => (
            <div key={label} className="cc-boot-line" style={{ animationDelay: `${250 + i * 320}ms` }}>
              &gt; {label} <span style={{ color: "var(--v-faint)" }}>{".".repeat(Math.max(3, 34 - label.length))}</span> <b>{result}</b>
            </div>
          ))}
          <div className="cc-boot-line" style={{ animationDelay: `${250 + BOOT.length * 320}ms` }}>
            &gt; awaiting operator identity<span className="cc-caret" />
          </div>
        </div>

        <div className="cc-feature-grid">
          {FEATURES.map(([title, desc]) => (
            <div className="cc-feature" key={title}>
              <strong>{title}</strong>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="cc-card cc-card-hot cc-auth-card">
        <div className="cc-card-body" style={{ padding: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
            <AgentOrb size={48} state={status === "sending" ? "thinking" : "idle"} />
            <div>
              <div className="cc-display" style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.14em" }}>AUTHENTICATE</div>
              <div className="cc-mono cc-muted" style={{ fontSize: 11 }}>passwordless · magic link</div>
            </div>
          </div>

          {status === "sent" ? (
            <div>
              <span className="cc-badge cc-badge-green">LINK DISPATCHED</span>
              <p style={{ fontSize: 14, margin: "14px 0 0" }}>
                Check <strong>{email}</strong> and open the link on this device to enter the module.
              </p>
              <button className="cc-btn cc-btn-ghost cc-btn-block" style={{ marginTop: 18 }} onClick={() => setStatus("idle")}>
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="cc-label" htmlFor="email">Operator email</label>
              <input
                id="email"
                className="cc-input"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {error && <p style={{ color: "var(--v-red)", fontSize: 13, margin: "10px 0 0" }}>{error}</p>}
              <button className="cc-btn cc-btn-primary cc-btn-block" style={{ marginTop: 18 }} type="submit" disabled={status === "sending"}>
                {status === "sending" ? "Transmitting…" : "Send magic link →"}
              </button>
            </form>
          )}

          <p style={{ margin: "22px 0 0", textAlign: "center", fontSize: 12 }}>
            <Link href="/" className="cc-mono">← back to portfolio</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <Portal />
    </Suspense>
  );
}
