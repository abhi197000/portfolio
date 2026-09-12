import { createClient } from "@supabase/supabase-js";

// Server-side only (used from app/api/practice/* route handlers). No auth/session
// handling needed — the question bank is public content, not per-user data.
// The publishable/anon key is safe here: RLS policies on `questions` (public
// SELECT) and `submissions` (public INSERT) define exactly what it can touch.
let client;

export function getSupabase() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set");
    }
    client = createClient(url, key);
  }
  return client;
}

// Server-only privileged client. SUPABASE_SERVICE_ROLE_KEY is NOT prefixed with
// NEXT_PUBLIC_, so it never ships to the browser. It bypasses RLS, which is how
// we read a session's own submission history WITHOUT granting the public anon
// key any SELECT on `submissions` — the insert-only security model is untouched.
// Returns null when the key isn't configured, so history is a graceful add-on.
let adminClient;

export function getSupabaseAdmin() {
  if (adminClient !== undefined && adminClient !== null) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  adminClient = createClient(url, key, { auth: { persistSession: false } });
  return adminClient;
}
