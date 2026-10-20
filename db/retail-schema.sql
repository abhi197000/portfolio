-- Retail demo: a fictional US apparel chain ("Cobalt Lane Apparel") whose data
-- backs /api/retail/* — one use case per LinkedIn video.
--
-- Paste this into the Supabase SQL Editor, then each db/retail-seed-*.sql file
-- in order. Safe to re-run in full. Independent of schema.sql / app-schema.sql.
--
-- Everything here is generated demo data, so it's public READ-ONLY: anyone can
-- SELECT (the site renders it without a login), nobody can write through the
-- anon/publishable key — the seed files go in through the SQL Editor.

CREATE TABLE IF NOT EXISTS retail_meta (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS retail_dcs (
  dc_id  TEXT PRIMARY KEY,
  name   TEXT NOT NULL,
  city   TEXT NOT NULL,
  state  TEXT NOT NULL,
  serves TEXT
);

CREATE TABLE IF NOT EXISTS retail_stores (
  store_no  INTEGER PRIMARY KEY,
  name      TEXT NOT NULL,
  site      TEXT,
  city      TEXT NOT NULL,
  state     TEXT NOT NULL,
  region    TEXT NOT NULL,
  climate   TEXT NOT NULL CHECK (climate IN ('cold', 'mild', 'warm')),
  grade     CHAR(1) NOT NULL CHECK (grade IN ('A', 'B', 'C')),
  format    TEXT,
  sqft      INTEGER,
  opened_on DATE NOT NULL,
  lat       DOUBLE PRECISION,
  lng       DOUBLE PRECISION,
  dc_id     TEXT NOT NULL REFERENCES retail_dcs(dc_id)
);

CREATE TABLE IF NOT EXISTS retail_vendors (
  vendor_id          TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  country            TEXT,
  ship_mode          TEXT,
  promised_lead_days INTEGER NOT NULL,
  moq                INTEGER,
  fill_rate          NUMERIC(4, 3),
  notes              TEXT
);

CREATE TABLE IF NOT EXISTS retail_products (
  style_id         TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  department       TEXT,
  category         TEXT NOT NULL,
  lifecycle        TEXT NOT NULL,      -- core | seasonal | fashion | launch | promo | limited
  season           TEXT NOT NULL,
  vendor_id        TEXT NOT NULL REFERENCES retail_vendors(vendor_id),
  unit_cost        NUMERIC(10, 2) NOT NULL,
  full_price       NUMERIC(10, 2) NOT NULL,
  launch_date      DATE NOT NULL,
  end_date         DATE,
  carryover        BOOLEAN NOT NULL DEFAULT FALSE,
  size_group       TEXT NOT NULL,
  sizes            TEXT[] NOT NULL,
  case_pack        INTEGER NOT NULL,
  presentation_min INTEGER NOT NULL,
  like_item        TEXT,               -- the style whose history stands in for a new one
  current_method   TEXT,               -- push | depth | demand: how it's allocated today
  min_qty          INTEGER,
  max_qty          INTEGER
);

CREATE TABLE IF NOT EXISTS retail_promotions (
  promo_id     TEXT PRIMARY KEY,
  style_id     TEXT NOT NULL REFERENCES retail_products(style_id),
  name         TEXT NOT NULL,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  discount_pct INTEGER NOT NULL DEFAULT 0,
  scope        TEXT
);

-- one row per store × style × week; stockout_days > 0 means sales were capped by stock
CREATE TABLE IF NOT EXISTS retail_sales_weekly (
  store_no      INTEGER NOT NULL REFERENCES retail_stores(store_no),
  style_id      TEXT NOT NULL REFERENCES retail_products(style_id),
  week_start    DATE NOT NULL,
  units         INTEGER NOT NULL,
  on_hand_end   INTEGER NOT NULL,
  stockout_days SMALLINT NOT NULL DEFAULT 0,
  markdown_pct  SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (store_no, style_id, week_start)
);
CREATE INDEX IF NOT EXISTS idx_retail_sales_weekly_style ON retail_sales_weekly(style_id, week_start);

-- launch-week sales, day by day (the fixed-push sell-through)
CREATE TABLE IF NOT EXISTS retail_sales_daily (
  store_no    INTEGER NOT NULL REFERENCES retail_stores(store_no),
  style_id    TEXT NOT NULL REFERENCES retail_products(style_id),
  day         DATE NOT NULL,
  units       INTEGER NOT NULL,
  on_hand_end INTEGER NOT NULL,
  PRIMARY KEY (store_no, style_id, day)
);

-- last 13 weeks of sales by size (size curves)
CREATE TABLE IF NOT EXISTS retail_size_sales (
  store_no  INTEGER NOT NULL REFERENCES retail_stores(store_no),
  style_id  TEXT NOT NULL REFERENCES retail_products(style_id),
  size      TEXT NOT NULL,
  units_13w INTEGER NOT NULL,
  PRIMARY KEY (store_no, style_id, size)
);

-- each store's position as of the demo's "today"
CREATE TABLE IF NOT EXISTS retail_store_inventory (
  store_no         INTEGER NOT NULL REFERENCES retail_stores(store_no),
  style_id         TEXT NOT NULL REFERENCES retail_products(style_id),
  on_hand          INTEGER NOT NULL,
  in_transit       INTEGER NOT NULL DEFAULT 0,
  next_delivery    DATE,
  depth_target     INTEGER,
  presentation_min INTEGER,
  min_qty          INTEGER,
  max_qty          INTEGER,
  last_alloc_qty   INTEGER,
  by_size          JSONB,
  PRIMARY KEY (store_no, style_id)
);

CREATE TABLE IF NOT EXISTS retail_dc_inventory (
  dc_id        TEXT NOT NULL REFERENCES retail_dcs(dc_id),
  style_id     TEXT NOT NULL REFERENCES retail_products(style_id),
  on_hand      INTEGER NOT NULL,
  on_order     INTEGER NOT NULL DEFAULT 0,
  next_receipt DATE,
  note         TEXT,
  PRIMARY KEY (dc_id, style_id)
);

CREATE TABLE IF NOT EXISTS retail_purchase_orders (
  po_no         INTEGER PRIMARY KEY,
  vendor_id     TEXT NOT NULL REFERENCES retail_vendors(vendor_id),
  style_id      TEXT NOT NULL REFERENCES retail_products(style_id),
  dc_id         TEXT NOT NULL REFERENCES retail_dcs(dc_id),
  qty_ordered   INTEGER NOT NULL,
  qty_received  INTEGER,
  order_date    DATE NOT NULL,
  promised_date DATE NOT NULL,
  received_date DATE,
  status        TEXT NOT NULL CHECK (status IN ('draft', 'open', 'received'))
);
CREATE INDEX IF NOT EXISTS idx_retail_po_vendor ON retail_purchase_orders(vendor_id, order_date);

-- advance ship notices: what's on each truck heading for a DC this week (cross-dock)
CREATE TABLE IF NOT EXISTS retail_asn_lines (
  asn_no     INTEGER NOT NULL,
  line_no    SMALLINT NOT NULL,
  vendor_id  TEXT NOT NULL REFERENCES retail_vendors(vendor_id),
  po_no      INTEGER NOT NULL REFERENCES retail_purchase_orders(po_no),
  style_id   TEXT NOT NULL REFERENCES retail_products(style_id),
  dc_id      TEXT NOT NULL REFERENCES retail_dcs(dc_id),
  units      INTEGER NOT NULL,
  cartons    INTEGER NOT NULL,
  shipped_on DATE NOT NULL,
  eta        DATE NOT NULL,
  carrier    TEXT,
  PRIMARY KEY (asn_no, line_no)
);

-- articles: the style-colors a planner allocates (the planner story). Each color splits
-- its style's numbers: sales by sales_mix (tilted toward warm stores by warm_tilt and
-- trending by trend a week), stock by stock_mix.
CREATE TABLE IF NOT EXISTS retail_articles (
  article_id TEXT PRIMARY KEY,
  style_id   TEXT NOT NULL REFERENCES retail_products(style_id),
  color      TEXT NOT NULL,
  hex        TEXT NOT NULL,
  sales_mix  NUMERIC(5, 3) NOT NULL,
  stock_mix  NUMERIC(5, 3) NOT NULL,
  trend      NUMERIC(5, 3) NOT NULL DEFAULT 0,
  warm_tilt  NUMERIC(5, 3) NOT NULL DEFAULT 0
);

-- chain-level flow per week: shopper sales vs store orders vs DC orders (bullwhip)
CREATE TABLE IF NOT EXISTS retail_replen_weekly (
  style_id          TEXT NOT NULL REFERENCES retail_products(style_id),
  week_start        DATE NOT NULL,
  pos_units         INTEGER NOT NULL,
  store_order_units INTEGER NOT NULL,
  dc_order_units    INTEGER NOT NULL,
  PRIMARY KEY (style_id, week_start)
);

-- Public read, no public writes, on every retail table. DROP + CREATE (Postgres
-- has no CREATE POLICY IF NOT EXISTS) keeps this file safe to re-run.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'retail_meta', 'retail_dcs', 'retail_stores', 'retail_vendors', 'retail_products',
    'retail_promotions', 'retail_sales_weekly', 'retail_sales_daily', 'retail_size_sales',
    'retail_store_inventory', 'retail_dc_inventory', 'retail_purchase_orders', 'retail_asn_lines', 'retail_articles', 'retail_replen_weekly'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_public_read', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT USING (true)', t || '_public_read', t);
  END LOOP;
END $$;
