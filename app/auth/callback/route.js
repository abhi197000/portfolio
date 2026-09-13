import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

// Magic-link / OAuth landing. Exchanges the one-time code for a session cookie,
// then forwards to the originally requested page (defaults to /app).
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
