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
