import { NextResponse } from "next/server";
import { getSupabase } from "../../../../lib/supabaseClient";

export async function GET(request) {
  const category = request.nextUrl.searchParams.get("category");

  try {
    const supabase = getSupabase();
    let q = supabase
      .from("questions")
      .select("id, slug, title, category, difficulty, topic_tags, chapter_number, chapter_title")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });

    if (category) q = q.eq("category", category);

    const { data, error } = await q;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/practice/questions failed:", err.message);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
