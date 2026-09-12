# Practice question bank — Supabase setup

Free Postgres backing the `/practice` question bank and submission logging.
Runs entirely through Next.js API routes (`app/api/practice/*`) calling
Supabase's REST API via `@supabase/supabase-js` — no separate server, no raw
DB connection string needed. (The earlier FastAPI/Docker prototype in
`backend/` at the repo root is unused but left in place.)

We deliberately do **not** use Supabase Auth/`@supabase/ssr` here — this is
public content with no logins, so the session/cookie/middleware plumbing
those packages provide doesn't apply.

## 1. Create a Supabase project

Free at [supabase.com](https://supabase.com) → **New project**.

## 2. Create the tables + RLS policies

Open **SQL Editor** in the dashboard, paste in [`schema.sql`](schema.sql),
run it. This also enables Row Level Security with two policies:

- `questions`: public **read**, no public write (so the anon key exposed to
  the browser can't be used to deface the question bank)
- `submissions`: public **insert** only, no read (anyone can log an attempt,
  nobody can read anyone's back through the API)

## 3. Seed the question bank

Also in the SQL Editor, paste in [`seed.sql`](seed.sql) and run it — it
upserts the 4 questions from `scripts/seed-data.mjs` by `slug`.

If you add/edit questions in `scripts/seed-data.mjs`, regenerate it:

```bash
cd portfolio/portfolio
node scripts/generate-seed-sql.mjs > db/seed.sql
```

then paste the new `db/seed.sql` into the SQL Editor again.

## 4. Env vars

Copy `.env.local.example` to `.env.local` and fill in from **Project
Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Both are safe to expose client-side — RLS is what actually restricts access,
not key secrecy.

## 5. Run locally / deploy

```bash
npm run dev
```

Visit `http://localhost:3000/practice` — it now reads from Supabase instead
of the bundled fixture fallback.

For Vercel: **Settings → Environment Variables** → add the same two vars,
redeploy.

## Adding a new question

Add an entry to `scripts/seed-data.mjs`, regenerate `db/seed.sql` (step 3),
paste-run it. Same field shapes as `db/schema.sql`:

- **SQL question:** `schema_sql` / `seed_sql` are **SQLite dialect** — they
  run client-side in the browser via sql.js, not against this Postgres DB.
- **Python question:** `seed_data` is `{table_name: [row_dict, ...]}`, loaded
  into pandas DataFrames client-side via Pyodide.
- `order_matters: false` lets the frontend compare rows as an unordered set.

## Fallback behavior

If the Supabase env vars are missing or the API call fails, the Next.js API
routes return 503 and `lib/practiceApi.js` transparently falls back to the
same 4 questions bundled in `lib/practiceFixtures.js` — the practice UI keeps
working, just without persisted submission logging.

## Not yet wired

`GET /api/practice/submissions/[sessionId]` (per-session submission history)
is stubbed to return 501 — `submissions` has no public SELECT policy by
design, so the anon key can log an attempt but can't read any back. Revisit
with a scoped policy (or a server-only `service_role` key) if that becomes a
real feature.
