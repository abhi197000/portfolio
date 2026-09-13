-- Run once in the Supabase dashboard's SQL Editor.

CREATE TABLE IF NOT EXISTS questions (
  id            SERIAL PRIMARY KEY,
  slug          VARCHAR(120) UNIQUE NOT NULL,
  title         VARCHAR(200) NOT NULL,
  category      VARCHAR(20) NOT NULL,      -- 'sql' | 'python'
  difficulty    VARCHAR(20) NOT NULL,      -- easy | medium | hard | very_hard
  topic_tags    JSONB NOT NULL DEFAULT '[]',

  chapter_number INTEGER,
  chapter_title  VARCHAR(120),
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
  mode          VARCHAR(20) NOT NULL DEFAULT 'practice', -- 'practice' | 'test'
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submissions_session ON submissions(session_id);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);

-- Safe to re-run against an existing database (e.g. after the first
-- schema.sql run predates these columns being added).
ALTER TABLE questions ADD COLUMN IF NOT EXISTS chapter_number INTEGER;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS chapter_title VARCHAR(120);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS mode VARCHAR(20) NOT NULL DEFAULT 'practice';
-- Practice now runs inside the logged-in module, so attempts belong to a user.
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);

-- The app talks to Supabase using the public anon/publishable key (safe to ship
-- to the browser), so RLS is what actually keeps this safe:
--  - anyone can READ questions (it's a public practice site)
--  - NOBODY can write questions via the anon key (only via the SQL Editor / a
--    service_role key you keep off the client) — so a visitor can't deface
--    the question bank through the API
--  - a submission can only be inserted as yourself (user_id = your auth.uid(),
--    or NULL for an anonymous attempt) — nobody can log attempts into another
--    person's history
--  - a signed-in user can read back ONLY their own submissions. There is still
--    no public SELECT: anonymous callers have auth.uid() = NULL, which never
--    matches, so the anon key reads nothing.
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- DROP + CREATE (not CREATE POLICY IF NOT EXISTS, which Postgres doesn't
-- support) so this whole file stays safe to paste and re-run in full.
DROP POLICY IF EXISTS questions_public_read ON questions;
CREATE POLICY questions_public_read ON questions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS submissions_public_insert ON submissions;
CREATE POLICY submissions_public_insert ON submissions
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS submissions_own_read ON submissions;
CREATE POLICY submissions_own_read ON submissions
  FOR SELECT USING (user_id IS NOT NULL AND user_id = auth.uid());
