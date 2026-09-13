"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import "../career-theme.css";
import { createClient } from "../../lib/supabase/client";

function LoginInner() {
  const params = useSearchParams();
  const next = params.get("next") || "/app";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    setError("");
    const supabase = createClient();
    const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    });
    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="cc-auth-wrap">
      <div className="cc-auth-card">
        <div className="cc-brand" style={{ marginBottom: 6 }}>
          Career<span>Comfort</span>
        </div>
        <p className="cc-muted" style={{ marginTop: 0, marginBottom: 24, fontSize: 14 }}>
          Your daily practice, your living resume — in one place.
        </p>

        {status === "sent" ? (
          <div>
            <div className="cc-badge cc-badge-green" style={{ marginBottom: 12 }}>Check your email</div>
            <p style={{ fontSize: 14 }}>
              We sent a magic sign-in link to <strong>{email}</strong>. Open it on this device to
              continue.
            </p>
            <button
              className="cc-btn cc-btn-secondary cc-btn-block"
              style={{ marginTop: 16 }}
              onClick={() => setStatus("idle")}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="cc-label" htmlFor="email">Email address</label>
            <input
              id="email"
              className="cc-input"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p style={{ color: "#c62e60", fontSize: 13, marginTop: 8 }}>{error}</p>}
            <button
              className="cc-btn cc-btn-primary cc-btn-block"
              style={{ marginTop: 16 }}
              type="submit"
              disabled={status === "sending"}
            >
              {status === "sending" ? "Sending link…" : "Send me a magic link"}
            </button>
          </form>
        )}

        <p style={{ fontSize: 12, marginTop: 20, textAlign: "center" }}>
          <Link href="/practice" className="cc-nav-link">Just want to practice? Go to the free bank →</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="cc-auth-wrap"><div className="cc-auth-card">Loading…</div></div>}>
      <LoginInner />
    </Suspense>
  );
}
