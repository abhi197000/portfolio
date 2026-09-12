-- Run once in the Supabase dashboard's SQL Editor.

CREATE TABLE IF NOT EXISTS questions (
  id            SERIAL PRIMARY KEY,
  slug          VARCHAR(120) UNIQUE NOT NULL,
  title         VARCHAR(200) NOT NULL,
  category      VARCHAR(20) NOT NULL,      -- 'sql' | 'python'
  difficulty    VARCHAR(20) NOT NULL,      -- easy | medium | hard | very_hard
  topic_tags    JSONB NOT NULL DEFAULT '[]',

  story         TEXT,
  prompt        TEXT NOT NULL,

  -- SQLite-dialect DDL + seed rows, executed client-side in sql.js
  schema_sql    TEXT,
  seed_sql      TEXT,

  -- {table_name: [row_dict, ...]} loaded into pandas DataFrames via Pyodide
  seed_data     JSONB,

  expected_result JSONB NOT NULL DEFAULT '[]',
  order_matters   BOOLEAN NOT NULL DEFAULT FALSE,

  starter_code  TEXT,
  hints         JSONB NOT NULL DEFAULT '[]',
  solution_code TEXT,

  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submissions (
  id            SERIAL PRIMARY KEY,
  session_id    VARCHAR(64) NOT NULL,
  question_id   INTEGER NOT NULL REFERENCES questions(id),
  language      VARCHAR(20) NOT NULL,
  code          TEXT NOT NULL,
  passed        BOOLEAN NOT NULL,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submissions_session ON submissions(session_id);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);

-- The app talks to Supabase using the public anon/publishable key (safe to ship
-- to the browser), so RLS is what actually keeps this safe:
--  - anyone can READ questions (it's a public practice site)
--  - NOBODY can write questions via the anon key (only via the SQL Editor / a
--    service_role key you keep off the client) — so a visitor can't deface
--    the question bank through the API
--  - anyone can INSERT a submission (logging their own attempt) but can't
--    read, edit, or delete submissions through the API
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY questions_public_read ON questions
  FOR SELECT USING (true);

CREATE POLICY submissions_public_insert ON submissions
  FOR INSERT WITH CHECK (true);
