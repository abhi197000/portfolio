-- Career Comfort — authenticated product schema.
-- Run in the Supabase SQL Editor (safe to re-run). Separate from db/schema.sql
-- (the public practice bank). Every table here is per-user and locked down by
-- RLS to the logged-in user (auth.uid()); the anon key can only ever touch a
-- row that belongs to the currently authenticated session.

-- 1. Daily task completions (drives the "3 SQL + 3 Python a day" + streak).
CREATE TABLE IF NOT EXISTS daily_completions (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  question_slug VARCHAR(120) NOT NULL,
  category      VARCHAR(20) NOT NULL,               -- 'sql' | 'python'
  completed_on  DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_slug, completed_on)
);
CREATE INDEX IF NOT EXISTS idx_daily_user_date ON daily_completions(user_id, completed_on);

-- 2. Resume knowledge graph — typed nodes + directed edges.
CREATE TABLE IF NOT EXISTS resume_nodes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type       VARCHAR(30) NOT NULL,                  -- experience | project | skill | education | achievement
  label      TEXT NOT NULL,
  data       JSONB NOT NULL DEFAULT '{}',           -- {company, role, start, end, bullets[], level, ...}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nodes_user ON resume_nodes(user_id, type);

CREATE TABLE IF NOT EXISTS resume_edges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  from_node  UUID NOT NULL REFERENCES resume_nodes(id) ON DELETE CASCADE,
  to_node    UUID NOT NULL REFERENCES resume_nodes(id) ON DELETE CASCADE,
  relation   VARCHAR(40) NOT NULL,                  -- uses | includes | at | earned
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_edges_user ON resume_edges(user_id);

-- 3. Generated resume snapshots (one row per version; the graph is the source
--    of truth, these are rendered outputs kept for history/download).
CREATE TABLE IF NOT EXISTS resume_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  content        JSONB NOT NULL DEFAULT '{}',        -- structured resume {summary, sections[...]}
  change_note    TEXT,                               -- e.g. "Added project: Realtime pricing"
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_versions_user ON resume_versions(user_id, version_number DESC);

-- ---- RLS: each user sees and writes only their own rows ----
ALTER TABLE daily_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_nodes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_edges      ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_versions   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS daily_own ON daily_completions;
CREATE POLICY daily_own ON daily_completions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS nodes_own ON resume_nodes;
CREATE POLICY nodes_own ON resume_nodes
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS edges_own ON resume_edges;
CREATE POLICY edges_own ON resume_edges
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS versions_own ON resume_versions;
CREATE POLICY versions_own ON resume_versions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
