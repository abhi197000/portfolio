import { NextResponse } from "next/server";
import { getSupabase } from "../../../../lib/supabaseClient";

export async function POST(request) {
  const body = await request.json();
  const { session_id, question_slug, language, code, passed, mode } = body;

  if (!session_id || !question_slug || !language || typeof passed !== "boolean") {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const supabase = getSupabase();

    const { data: question, error: qError } = await supabase
      .from("questions")
      .select("id")
      .eq("slug", question_slug)
      .maybeSingle();
    if (qError) throw qError;
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // No .select() here: submissions has no public SELECT policy (nobody's
    // attempt code is readable back through the anon key), so PostgREST
    // couldn't return the inserted row anyway. Insert-only, fire-and-forget.
    const { error } = await supabase.from("submissions").insert({
      session_id,
      question_id: question.id,
      language,
      code,
      passed,
      mode: mode === "test" ? "test" : "practice",
    });
    if (error) throw error;

    return NextResponse.json({ question_id: question.id, language, passed });
  } catch (err) {
    console.error("POST /api/practice/submissions failed:", err.message);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
