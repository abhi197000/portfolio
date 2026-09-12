// Run with: node scripts/generate-seed-sql.mjs > db/seed.sql
//
// Generates a paste-into-the-Supabase-SQL-Editor script from
// scripts/seed-data.mjs. Seeding goes through the SQL Editor (which runs as
// the DB owner) rather than the app's anon/publishable key, because the RLS
// policies deliberately give that key no write access to `questions` — see
// db/schema.sql.
import { QUESTIONS } from "./seed-data.mjs";

function sqlLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return String(value);
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function jsonLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  return "'" + JSON.stringify(value).replace(/'/g, "''") + "'::jsonb";
}

const statements = QUESTIONS.map((q) => {
  const cols = [
    "slug", "title", "category", "difficulty", "topic_tags", "story", "prompt",
    "schema_sql", "seed_sql", "seed_data", "expected_result", "order_matters",
    "starter_code", "hints", "solution_code", "sort_order",
  ];
  const values = [
    sqlLiteral(q.slug), sqlLiteral(q.title), sqlLiteral(q.category), sqlLiteral(q.difficulty),
    jsonLiteral(q.topic_tags), sqlLiteral(q.story), sqlLiteral(q.prompt),
    sqlLiteral(q.schema_sql), sqlLiteral(q.seed_sql), jsonLiteral(q.seed_data),
    jsonLiteral(q.expected_result), sqlLiteral(q.order_matters),
    sqlLiteral(q.starter_code), jsonLiteral(q.hints), sqlLiteral(q.solution_code),
    sqlLiteral(q.sort_order),
  ];
  const updates = cols
    .filter((c) => c !== "slug")
    .map((c) => `${c} = EXCLUDED.${c}`)
    .join(",\n  ");

  return (
    `INSERT INTO questions (${cols.join(", ")})\nVALUES (${values.join(", ")})\n` +
    `ON CONFLICT (slug) DO UPDATE SET\n  ${updates};`
  );
});

console.log("-- Generated from scripts/seed-data.mjs — paste into the Supabase SQL Editor and run.\n");
console.log(statements.join("\n\n"));
