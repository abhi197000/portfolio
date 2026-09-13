import { createClient } from "@supabase/supabase-js";

// Server-side only (used by the app/api/practice/questions route handlers). No
// auth/session handling needed — the question bank is public content. The
// publishable key is safe here: RLS on `questions` allows public SELECT only.
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
