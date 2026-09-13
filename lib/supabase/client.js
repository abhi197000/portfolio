import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client for the authenticated "/app" product (login,
// per-user reads/writes). Uses the publishable/anon key — RLS keyed to
// auth.uid() is what scopes each user to their own rows (see db/app-schema.sql).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}
