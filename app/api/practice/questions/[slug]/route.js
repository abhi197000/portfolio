import { NextResponse } from "next/server";
import { getSupabase } from "../../../../../lib/supabaseClient";

export async function GET(request, { params }) {
  const { slug } = await params;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("questions")
      .select(
        "id, slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code"
      )
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error(`GET /api/practice/questions/${slug} failed:`, err.message);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
