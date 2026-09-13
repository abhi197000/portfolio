import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { computeStreak, utcDate } from "../../../../lib/dailyTasks";

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

// Today's completed slugs + streak for the logged-in user.
export async function GET() {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data, error } = await supabase
    .from("daily_completions")
    .select("question_slug, completed_on")
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const today = utcDate();
  const todaySlugs = (data || []).filter((r) => r.completed_on === today).map((r) => r.question_slug);
  const streak = computeStreak((data || []).map((r) => r.completed_on), today);

  return NextResponse.json({ today: todaySlugs, streak });
}

// Mark a question done for today (idempotent via the unique constraint).
export async function POST(request) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { question_slug, category } = await request.json();
  if (!question_slug || !category) {
    return NextResponse.json({ error: "Missing question_slug/category" }, { status: 400 });
  }

  const { error } = await supabase
    .from("daily_completions")
    .upsert(
      { user_id: user.id, question_slug, category, completed_on: utcDate() },
      { onConflict: "user_id,question_slug,completed_on", ignoreDuplicates: true }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
