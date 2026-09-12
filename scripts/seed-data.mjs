// Question bank content for seeding Supabase Postgres.
// Kept in sync by hand with lib/practiceFixtures.js (the standalone fallback
// used when the DB/API isn't reachable) — same 4 questions, same shape.

function buildEventsSeed() {
  const rows = [];
  let eid = 1;
  for (const [productId, count] of [["A", 5], ["B", 4], ["C", 3], ["D", 2], ["E", 1]]) {
    for (let i = 0; i < count; i++) {
      rows.push([eid, 900 + eid, `2025-03-01 1${i}:00:00`, "view", "/product", productId, `s${eid}`, 0]);
      eid++;
    }
  }
  eid = 100;
  for (const [productId, count] of [["X", 6], ["Y", 5], ["Z", 4], ["W", 1]]) {
    for (let i = 0; i < count; i++) {
      rows.push([eid, 900 + eid, `2025-03-02 1${i}:00:00`, "view", "/product", productId, `s${eid}`, 0]);
      eid++;
    }
  }
  const values = rows
    .map((r) => `  (${r[0]}, ${r[1]}, '${r[2]}', '${r[3]}', '${r[4]}', '${r[5]}', '${r[6]}', ${r[7]})`)
    .join(",\n");
  return `INSERT INTO events (event_id, user_id, event_time, event_type, page, product_id, session_id, revenues_estimate) VALUES\n${values};`;
}

// ---------------------------------------------------------------------------
// Shared generators for the larger seed sets below
// ---------------------------------------------------------------------------

function sqlValues(rows) {
  const fmt = (v) => (v === null || v === undefined ? "NULL" : typeof v === "string" ? `'${v.replace(/'/g, "''")}'` : v);
  return rows.map((r) => `  (${r.map(fmt).join(", ")})`).join(",\n");
}

const INVENTORY_ROWS = [
  ["P1", "2025-09-01", 50, 1, "W1"],
  ["P1", "2025-09-02", -20, 0, "W1"],
  ["P1", "2025-09-03", -15, 0, "W1"],
  ["P1", "2025-09-04", -10, 0, "W1"],
  ["P1", "2025-09-05", -8, 0, "W1"],
  ["P1", "2025-09-06", 5, 0, "W1"],
  ["P1", "2025-09-07", -30, 0, "W1"],
  ["P1", "2025-09-08", 40, 1, "W1"],
  ["P2", "2025-09-01", 200, 1, "W1"],
  ["P2", "2025-09-02", -20, 0, "W1"],
  ["P2", "2025-09-03", -20, 0, "W1"],
  ["P2", "2025-09-04", -20, 0, "W1"],
  ["P2", "2025-09-05", -20, 0, "W1"],
  ["P2", "2025-09-06", -20, 0, "W1"],
  ["P2", "2025-09-07", -20, 0, "W1"],
  ["P2", "2025-09-08", -20, 0, "W1"],
];

const INVENTORY_SCHEMA_SQL =
  "CREATE TABLE inventory (\n  inventory_id INTEGER PRIMARY KEY,\n  product_id TEXT,\n  record_date TEXT,\n  delta_qty REAL,\n  is_restock INTEGER,\n  warehouse TEXT\n);";

const INVENTORY_SEED_SQL =
  "INSERT INTO inventory (inventory_id, product_id, record_date, delta_qty, is_restock, warehouse) VALUES\n" +
  sqlValues(INVENTORY_ROWS.map((r, i) => [i + 1, r[0], r[1], r[2], r[3], r[4]])) +
  ";";

const INVENTORY_SEED_DATA = {
  inventory: INVENTORY_ROWS.map(([product_id, record_date, delta_qty, is_restock, warehouse]) => ({
    product_id,
    record_date,
    delta_qty,
    is_restock,
    warehouse,
  })),
};

function buildDropoffEvents() {
  const rows = [];
  let eid = 1;
  const day = (date, searchCount, viewCount, prefix) => {
    for (let i = 0; i < searchCount; i++) rows.push([eid++, `${date} 09:00:00`, "search", `${prefix}${i}`]);
    for (let i = 0; i < viewCount; i++) rows.push([eid++, `${date} 09:05:00`, "view", `${prefix}${i}`]);
  };
  day("2025-08-01", 10, 7, "a"); // 30% drop
  day("2025-08-02", 10, 5, "b"); // 50% drop
  day("2025-08-03", 8, 6, "c"); // 25% drop
  return rows;
}

const DROPOFF_EVENT_ROWS = buildDropoffEvents();

const DROPOFF_SCHEMA_SQL =
  "CREATE TABLE events (\n  event_id INTEGER PRIMARY KEY,\n  event_time TEXT,\n  event_type TEXT,\n  session_id TEXT\n);";

const DROPOFF_SEED_SQL =
  "INSERT INTO events (event_id, event_time, event_type, session_id) VALUES\n" + sqlValues(DROPOFF_EVENT_ROWS) + ";";

const DROPOFF_SEED_DATA = {
  events: DROPOFF_EVENT_ROWS.map(([event_id, event_time, event_type, session_id]) => ({
    event_id,
    event_time,
    event_type,
    session_id,
  })),
};

const MOVING_AVG_DATES = [
  "2025-04-24", "2025-04-25", "2025-04-26", "2025-04-27", "2025-04-28", "2025-04-29", "2025-04-30",
  "2025-05-01", "2025-05-02", "2025-05-03", "2025-05-04", "2025-05-05", "2025-05-06", "2025-05-07",
  "2025-05-08", "2025-05-09", "2025-05-10",
];
const MOVING_AVG_VALUES = [100, 100, 100, 100, 100, 100, 100, 100, 260, 100, 100, 100, 100, 100, 100, 30, 100];

const MOVING_AVG_SCHEMA_SQL = "CREATE TABLE orders_net (category TEXT, order_date TEXT, net_revenue REAL);";
const MOVING_AVG_SEED_SQL =
  "INSERT INTO orders_net (category, order_date, net_revenue) VALUES\n" +
  sqlValues(MOVING_AVG_DATES.map((d, i) => ["A", d, MOVING_AVG_VALUES[i]])) +
  ";";
const MOVING_AVG_SEED_DATA = {
  orders_net: MOVING_AVG_DATES.map((order_date, i) => ({
    category: "A",
    order_date,
    net_revenue: MOVING_AVG_VALUES[i],
  })),
};

export const QUESTIONS = [
  {
    slug: "revenue-gap-best-vs-worst-item",
    title: "Revenue Gap: Best vs. Worst Selling Item",
    category: "sql",
    difficulty: "easy",
    topic_tags: ["aggregation", "group by", "cte"],
    story:
      "You're the analyst on a retail client's inventory team. Leadership wants a single number for the weekly readout: how far apart is the best performer from the worst?",
    prompt:
      "Table `orders(order_id, user_id, order_date, item_id, category, quantity, price, discount_code)`.\n\nEach row is one order line. Revenue for an item = SUM(quantity * price) across its order lines.\n\nWrite a query that returns a single column `revenue_gap`: the difference between the highest-revenue item and the lowest-revenue item.",
    schema_sql:
      "CREATE TABLE orders (\n  order_id INTEGER PRIMARY KEY,\n  user_id INTEGER,\n  order_date TEXT,\n  item_id INTEGER,\n  category TEXT,\n  quantity INTEGER,\n  price REAL,\n  discount_code TEXT\n);",
    seed_sql:
      "INSERT INTO orders (order_id, user_id, order_date, item_id, category, quantity, price, discount_code) VALUES\n" +
      "  (1, 101, '2025-01-05', 1, 'Electronics', 2, 50.0, NULL),\n" +
      "  (2, 102, '2025-01-06', 2, 'Electronics', 1, 20.0, NULL),\n" +
      "  (3, 101, '2025-01-07', 1, 'Electronics', 1, 50.0, NULL),\n" +
      "  (4, 103, '2025-01-08', 3, 'Home', 5, 10.0, NULL),\n" +
      "  (5, 104, '2025-01-09', 2, 'Electronics', 3, 20.0, NULL),\n" +
      "  (6, 105, '2025-01-10', 4, 'Home', 1, 200.0, NULL);",
    seed_data: null,
    expected_result: [{ revenue_gap: 150.0 }],
    order_matters: false,
    starter_code: "-- items with the same shape as `orders` are already loaded.\nSELECT\n",
    hints: [
      "First aggregate to item-level revenue: SUM(quantity * price), GROUP BY item_id.",
      "Wrap that aggregation in a CTE (WITH item_revenue AS (...)) so you can reduce it again.",
      "The final SELECT is just MAX(revenue) - MIN(revenue) FROM item_revenue.",
    ],
    solution_code:
      "WITH item_revenue AS (\n    SELECT item_id, SUM(quantity * price) AS revenue\n    FROM orders\n    GROUP BY item_id\n)\nSELECT MAX(revenue) - MIN(revenue) AS revenue_gap\nFROM item_revenue;",
    sort_order: 1,
  },
  {
    slug: "qualifying-high-value-users",
    title: "Qualifying High-Value Users",
    category: "sql",
    difficulty: "medium",
    topic_tags: ["group by", "having", "aggregation"],
    story:
      "Marketing wants a shortlist for a loyalty pilot: repeat buyers who've already proven they'll spend, so the pilot budget isn't wasted on one-time shoppers.",
    prompt:
      "Table `orders(order_id, user_id, order_date, item_id, category, quantity, price, discount_code)`.\n\nBetween 2025-02-01 and 2025-02-28 (inclusive), find users with at least 2 distinct orders AND total spending (SUM(quantity * price)) greater than $500.\n\nReturn `user_id, order_count, total_spend`, ordered by `user_id` ascending.",
    schema_sql:
      "CREATE TABLE orders (\n  order_id INTEGER PRIMARY KEY,\n  user_id INTEGER,\n  order_date TEXT,\n  item_id INTEGER,\n  category TEXT,\n  quantity INTEGER,\n  price REAL,\n  discount_code TEXT\n);",
    seed_sql:
      "INSERT INTO orders (order_id, user_id, order_date, item_id, category, quantity, price, discount_code) VALUES\n" +
      "  (1, 201, '2025-02-02', 10, 'A', 2, 100.0, NULL),\n" +
      "  (2, 201, '2025-02-05', 11, 'A', 1, 150.0, NULL),\n" +
      "  (3, 201, '2025-02-10', 12, 'A', 1, 200.0, NULL),\n" +
      "  (4, 202, '2025-02-03', 13, 'B', 1, 100.0, NULL),\n" +
      "  (5, 202, '2025-02-07', 14, 'B', 1, 50.0, NULL),\n" +
      "  (6, 203, '2025-02-04', 15, 'C', 5, 300.0, NULL),\n" +
      "  (7, 204, '2025-02-06', 16, 'A', 2, 150.0, NULL),\n" +
      "  (8, 204, '2025-02-12', 17, 'A', 2, 150.0, NULL);",
    seed_data: null,
    expected_result: [
      { user_id: 201, order_count: 3, total_spend: 550.0 },
      { user_id: 204, order_count: 2, total_spend: 600.0 },
    ],
    order_matters: true,
    starter_code: "SELECT\n",
    hints: [
      "Filter WHERE order_date BETWEEN '2025-02-01' AND '2025-02-28' before aggregating.",
      "GROUP BY user_id, then use HAVING (not WHERE) to filter on the aggregates.",
      "COUNT(DISTINCT order_id) >= 2 AND SUM(quantity * price) > 500.",
    ],
    solution_code:
      "SELECT user_id,\n       COUNT(DISTINCT order_id) AS order_count,\n       SUM(quantity * price)    AS total_spend\nFROM orders\nWHERE order_date BETWEEN '2025-02-01' AND '2025-02-28'\nGROUP BY user_id\nHAVING COUNT(DISTINCT order_id) >= 2\n   AND SUM(quantity * price) > 500\nORDER BY user_id;",
    sort_order: 2,
  },
  {
    slug: "top-3-viewed-products-per-day",
    title: "Top 3 Most-Viewed Products Per Day",
    category: "sql",
    difficulty: "medium",
    topic_tags: ["window functions", "rank", "partition by"],
    story:
      "The merchandising team refreshes homepage placements daily and wants to feature whatever's trending — a fresh top-3-per-day feed, not a single all-time leaderboard.",
    prompt:
      "Table `events(event_id, user_id, event_time, event_type, page, product_id, session_id, revenues_estimate)`.\n\nUsing only rows where `event_type = 'view'`, find the top 3 most-viewed `product_id`s for each calendar day.\n\nReturn `event_date, product_id, views`, ordered by `event_date` then `views` descending.",
    schema_sql:
      "CREATE TABLE events (\n  event_id INTEGER PRIMARY KEY,\n  user_id INTEGER,\n  event_time TEXT,\n  event_type TEXT,\n  page TEXT,\n  product_id TEXT,\n  session_id TEXT,\n  revenues_estimate REAL\n);",
    seed_sql: buildEventsSeed(),
    seed_data: null,
    expected_result: [
      { event_date: "2025-03-01", product_id: "A", views: 5 },
      { event_date: "2025-03-01", product_id: "B", views: 4 },
      { event_date: "2025-03-01", product_id: "C", views: 3 },
      { event_date: "2025-03-02", product_id: "X", views: 6 },
      { event_date: "2025-03-02", product_id: "Y", views: 5 },
      { event_date: "2025-03-02", product_id: "Z", views: 4 },
    ],
    order_matters: true,
    starter_code:
      "WITH daily_views AS (\n  SELECT DATE(event_time) AS event_date, product_id, COUNT(*) AS views\n  FROM events\n  WHERE event_type = 'view'\n  GROUP BY DATE(event_time), product_id\n)\nSELECT\n",
    hints: [
      "First aggregate to (day, product_id) view counts — DATE(event_time), product_id, COUNT(*).",
      "Then rank within each day: RANK() OVER (PARTITION BY event_date ORDER BY views DESC).",
      "Filter the ranked result to rnk <= 3.",
    ],
    solution_code:
      "WITH daily_views AS (\n    SELECT DATE(event_time) AS event_date, product_id, COUNT(*) AS views\n    FROM events\n    WHERE event_type = 'view'\n    GROUP BY DATE(event_time), product_id\n),\nranked AS (\n    SELECT *, RANK() OVER (PARTITION BY event_date ORDER BY views DESC) AS rnk\n    FROM daily_views\n)\nSELECT event_date, product_id, views\nFROM ranked\nWHERE rnk <= 3\nORDER BY event_date, views DESC;",
    sort_order: 3,
  },
  {
    slug: "price-bucket-revenue-distribution",
    title: "Price-Bucket Revenue Distribution",
    category: "python",
    difficulty: "easy",
    topic_tags: ["pandas", "groupby", "merge"],
    story:
      "Finance wants to know whether revenue is concentrated in premium items or spread across the budget catalog, ahead of a pricing strategy review.",
    prompt:
      "You have two pandas DataFrames already loaded: `items(item_id, price)` and `orders(item_id, quantity, price)`.\n\nBucket each item by its `price` into low (<50), medium (50-100), high (>100).\n\nBuild a DataFrame named `result` with columns `price_bucket, revenue, pct_of_total`, where `revenue = SUM(quantity * price)` per bucket (using the order's own price, not the item's) and `pct_of_total` is that bucket's share of total revenue as a percentage rounded to 2 decimal places.",
    schema_sql: null,
    seed_sql: null,
    seed_data: {
      items: [
        { item_id: 1, price: 30 },
        { item_id: 2, price: 60 },
        { item_id: 3, price: 150 },
        { item_id: 4, price: 45 },
      ],
      orders: [
        { item_id: 1, quantity: 2, price: 30 },
        { item_id: 2, quantity: 1, price: 60 },
        { item_id: 3, quantity: 1, price: 150 },
        { item_id: 4, quantity: 3, price: 45 },
      ],
    },
    expected_result: [
      { price_bucket: "high", revenue: 150.0, pct_of_total: 37.04 },
      { price_bucket: "low", revenue: 195.0, pct_of_total: 48.15 },
      { price_bucket: "medium", revenue: 60.0, pct_of_total: 14.81 },
    ],
    order_matters: false,
    starter_code:
      "def bucket_price(p):\n    if p < 50:\n        return 'low'\n    elif p <= 100:\n        return 'medium'\n    return 'high'\n\n# your code here\nresult = None\n",
    hints: [
      "items['price_bucket'] = items['price'].apply(bucket_price)",
      "Merge orders with items[['item_id', 'price_bucket']] on item_id to tag every order line.",
      "Revenue per line is quantity * price (the order's own price column, post-merge).",
      "result['pct_of_total'] = (result['revenue'] / result['revenue'].sum() * 100).round(2)",
    ],
    solution_code:
      "def bucket_price(p):\n    if p < 50:\n        return 'low'\n    elif p <= 100:\n        return 'medium'\n    return 'high'\n\nitems['price_bucket'] = items['price'].apply(bucket_price)\n\nmerged = orders.merge(items[['item_id', 'price_bucket']], on='item_id')\nmerged['revenue'] = merged['quantity'] * merged['price']\n\nresult = merged.groupby('price_bucket')['revenue'].sum().reset_index()\nresult['pct_of_total'] = (result['revenue'] / result['revenue'].sum() * 100).round(2)\n",
    sort_order: 4,
  },

  // -------------------------------------------------------------------
  // Net revenue before/after discount, per category
  // -------------------------------------------------------------------
  {
    slug: "net-revenue-before-after-discount",
    title: "Net Revenue Before vs. After Discount",
    category: "sql",
    difficulty: "medium",
    topic_tags: ["left join", "coalesce", "aggregation"],
    story:
      "Finance is reconciling how much of gross revenue promotions are actually eating into, category by category, ahead of next quarter's discount budget.",
    prompt:
      "Tables `orders(order_id, category, quantity, price, discount_code)` and `discount_map(discount_code, discount_pct)`.\n\nNot every order has a discount code. For each category, compute `revenue_before` (gross = quantity * price), `revenue_after` (net, after applying the discount pct where one applies), and `diff` (before - after). Order by `diff` descending.",
    schema_sql:
      "CREATE TABLE orders (order_id INTEGER PRIMARY KEY, category TEXT, quantity INTEGER, price REAL, discount_code TEXT);\nCREATE TABLE discount_map (discount_code TEXT PRIMARY KEY, discount_pct REAL);",
    seed_sql:
      "INSERT INTO discount_map (discount_code, discount_pct) VALUES ('SAVE10', 10), ('SAVE20', 20);\n" +
      "INSERT INTO orders (order_id, category, quantity, price, discount_code) VALUES\n" +
      "  (1, 'Electronics', 2, 100, 'SAVE10'),\n" +
      "  (2, 'Electronics', 1, 50, NULL),\n" +
      "  (3, 'Home', 3, 30, 'SAVE20'),\n" +
      "  (4, 'Home', 2, 40, NULL),\n" +
      "  (5, 'Electronics', 1, 200, 'SAVE10');",
    seed_data: null,
    expected_result: [
      { category: "Electronics", revenue_before: 450, revenue_after: 410, diff: 40 },
      { category: "Home", revenue_before: 170, revenue_after: 152, diff: 18 },
    ],
    order_matters: true,
    starter_code: "WITH order_rev AS (\n  SELECT o.category,\n         o.quantity * o.price AS gross_revenue,\n         o.quantity * o.price * (1 - COALESCE(d.discount_pct, 0) / 100.0) AS net_revenue\n  FROM orders o\n  LEFT JOIN discount_map d ON o.discount_code = d.discount_code\n)\nSELECT\n",
    hints: [
      "LEFT JOIN orders to discount_map — some orders have no discount_code, so an INNER JOIN would silently drop them.",
      "COALESCE the joined discount_pct to 0 for orders with no discount.",
      "gross_revenue = quantity * price; net_revenue = gross_revenue * (1 - discount_pct/100). Aggregate both to category level, then diff = SUM(gross) - SUM(net).",
    ],
    solution_code:
      "WITH order_rev AS (\n    SELECT o.category,\n           o.quantity * o.price AS gross_revenue,\n           o.quantity * o.price * (1 - COALESCE(d.discount_pct, 0) / 100.0) AS net_revenue\n    FROM orders o\n    LEFT JOIN discount_map d ON o.discount_code = d.discount_code\n)\nSELECT category,\n       SUM(gross_revenue) AS revenue_before,\n       SUM(net_revenue) AS revenue_after,\n       SUM(gross_revenue) - SUM(net_revenue) AS diff\nFROM order_rev\nGROUP BY category\nORDER BY diff DESC;",
    sort_order: 5,
  },
  {
    slug: "net-revenue-before-after-discount-pandas",
    title: "Net Revenue Before vs. After Discount",
    category: "python",
    difficulty: "medium",
    topic_tags: ["pandas", "merge", "groupby"],
    story:
      "Finance is reconciling how much of gross revenue promotions are actually eating into, category by category, ahead of next quarter's discount budget.",
    prompt:
      "DataFrames `orders(order_id, category, quantity, price, discount_code)` and `discount_map(discount_code, discount_pct)`.\n\nNot every order has a discount code. Build `result` with columns `category, revenue_before, revenue_after, diff`, sorted by `diff` descending.",
    schema_sql: null,
    seed_sql: null,
    seed_data: {
      discount_map: [
        { discount_code: "SAVE10", discount_pct: 10 },
        { discount_code: "SAVE20", discount_pct: 20 },
      ],
      orders: [
        { order_id: 1, category: "Electronics", quantity: 2, price: 100, discount_code: "SAVE10" },
        { order_id: 2, category: "Electronics", quantity: 1, price: 50, discount_code: null },
        { order_id: 3, category: "Home", quantity: 3, price: 30, discount_code: "SAVE20" },
        { order_id: 4, category: "Home", quantity: 2, price: 40, discount_code: null },
        { order_id: 5, category: "Electronics", quantity: 1, price: 200, discount_code: "SAVE10" },
      ],
    },
    expected_result: [
      { category: "Electronics", revenue_before: 450, revenue_after: 410, diff: 40 },
      { category: "Home", revenue_before: 170, revenue_after: 152, diff: 18 },
    ],
    order_matters: true,
    starter_code:
      "orders_m = orders.merge(discount_map, on='discount_code', how='left')\norders_m['discount_pct'] = orders_m['discount_pct'].fillna(0)\n\n# your code here\nresult = None\n",
    hints: [
      "merge(..., how='left') — an inner merge would drop orders with no discount_code.",
      "fillna(0) the joined discount_pct for undiscounted orders.",
      "gross_revenue = quantity * price; net_revenue = gross_revenue * (1 - discount_pct/100). groupby('category').agg(...) both, then diff, then sort_values('diff', ascending=False).",
    ],
    solution_code:
      "orders_m = orders.merge(discount_map, on='discount_code', how='left')\norders_m['discount_pct'] = orders_m['discount_pct'].fillna(0)\n\norders_m['gross_revenue'] = orders_m['quantity'] * orders_m['price']\norders_m['net_revenue'] = orders_m['gross_revenue'] * (1 - orders_m['discount_pct'] / 100)\n\nresult = orders_m.groupby('category').agg(\n    revenue_before=('gross_revenue', 'sum'),\n    revenue_after=('net_revenue', 'sum')\n).reset_index()\nresult['diff'] = result['revenue_before'] - result['revenue_after']\nresult = result.sort_values('diff', ascending=False).reset_index(drop=True)\n",
    sort_order: 6,
  },

  // -------------------------------------------------------------------
  // Rolling 7-day revenue with missing dates filled
  // -------------------------------------------------------------------
  {
    slug: "rolling-7-day-revenue-with-gaps",
    title: "Rolling 7-Day Revenue (With Gaps)",
    category: "sql",
    difficulty: "medium",
    topic_tags: ["window functions", "gaps", "recursive cte"],
    story:
      "The exec dashboard shows a 7-day trailing revenue trend, but a few days had zero orders — and a naive rolling window silently skips them instead of counting them as zero, throwing off the trend line.",
    prompt:
      "Table `orders(order_id, customer_id, order_date, amount)`. Some calendar dates between the min and max order date have **no rows at all**.\n\nFill in every missing date with 0 revenue, then compute a 7-day trailing rolling sum (current day + 6 prior days). Return `order_date, amount, rolling_7d` ordered by date.",
    schema_sql: "CREATE TABLE orders (order_id INTEGER PRIMARY KEY, customer_id INTEGER, order_date TEXT, amount REAL);",
    seed_sql:
      "INSERT INTO orders (order_id, customer_id, order_date, amount) VALUES\n" +
      sqlValues([
        [1, 301, "2025-04-01", 100],
        [2, 301, "2025-04-02", 50],
        [3, 301, "2025-04-04", 80],
        [4, 301, "2025-04-05", 20],
        [5, 301, "2025-04-06", 60],
        [6, 301, "2025-04-08", 90],
        [7, 301, "2025-04-09", 40],
        [8, 301, "2025-04-10", 30],
      ]) +
      ";",
    seed_data: null,
    expected_result: [
      { order_date: "2025-04-01", amount: 100, rolling_7d: 100 },
      { order_date: "2025-04-02", amount: 50, rolling_7d: 150 },
      { order_date: "2025-04-03", amount: 0, rolling_7d: 150 },
      { order_date: "2025-04-04", amount: 80, rolling_7d: 230 },
      { order_date: "2025-04-05", amount: 20, rolling_7d: 250 },
      { order_date: "2025-04-06", amount: 60, rolling_7d: 310 },
      { order_date: "2025-04-07", amount: 0, rolling_7d: 310 },
      { order_date: "2025-04-08", amount: 90, rolling_7d: 300 },
      { order_date: "2025-04-09", amount: 40, rolling_7d: 290 },
      { order_date: "2025-04-10", amount: 30, rolling_7d: 320 },
    ],
    order_matters: true,
    starter_code:
      "WITH RECURSIVE calendar(d) AS (\n  SELECT MIN(order_date) FROM orders\n  UNION ALL\n  SELECT date(d, '+1 day') FROM calendar WHERE d < (SELECT MAX(order_date) FROM orders)\n),\ndaily AS (\n  SELECT c.d AS order_date, COALESCE(SUM(o.amount), 0) AS amount\n  FROM calendar c\n  LEFT JOIN orders o ON o.order_date = c.d\n  GROUP BY c.d\n)\nSELECT\n",
    hints: [
      "Build a full calendar of dates with a recursive CTE from MIN(order_date) to MAX(order_date).",
      "LEFT JOIN the calendar to orders (grouped by date) and COALESCE missing amounts to 0 — this is what fills the gaps.",
      "ROWS BETWEEN 6 PRECEDING AND CURRENT ROW gives a 7-row (7-day) trailing window.",
    ],
    solution_code:
      "WITH RECURSIVE calendar(d) AS (\n    SELECT MIN(order_date) FROM orders\n    UNION ALL\n    SELECT date(d, '+1 day') FROM calendar WHERE d < (SELECT MAX(order_date) FROM orders)\n),\ndaily AS (\n    SELECT c.d AS order_date, COALESCE(SUM(o.amount), 0) AS amount\n    FROM calendar c\n    LEFT JOIN orders o ON o.order_date = c.d\n    GROUP BY c.d\n)\nSELECT\n    order_date,\n    amount,\n    SUM(amount) OVER (\n        ORDER BY order_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW\n    ) AS rolling_7d\nFROM daily\nORDER BY order_date;",
    sort_order: 7,
  },
  {
    slug: "rolling-7-day-revenue-with-gaps-pandas",
    title: "Rolling 7-Day Revenue (With Gaps)",
    category: "python",
    difficulty: "medium",
    topic_tags: ["pandas", "resample", "rolling"],
    story:
      "The exec dashboard shows a 7-day trailing revenue trend, but a few days had zero orders — and a naive rolling window silently skips them instead of counting them as zero, throwing off the trend line.",
    prompt:
      "DataFrame `orders(order_id, customer_id, order_date, amount)`. Some calendar dates between the min and max order date have **no rows at all**.\n\nFill in every missing date with 0 revenue, then compute a 7-day trailing rolling sum (current day + up to 6 prior days). Build `result` with columns `order_date, amount, rolling_7d` (order_date as a plain 'YYYY-MM-DD' string), sorted by date.",
    schema_sql: null,
    seed_sql: null,
    seed_data: {
      orders: [
        { order_id: 1, customer_id: 301, order_date: "2025-04-01", amount: 100 },
        { order_id: 2, customer_id: 301, order_date: "2025-04-02", amount: 50 },
        { order_id: 3, customer_id: 301, order_date: "2025-04-04", amount: 80 },
        { order_id: 4, customer_id: 301, order_date: "2025-04-05", amount: 20 },
        { order_id: 5, customer_id: 301, order_date: "2025-04-06", amount: 60 },
        { order_id: 6, customer_id: 301, order_date: "2025-04-08", amount: 90 },
        { order_id: 7, customer_id: 301, order_date: "2025-04-09", amount: 40 },
        { order_id: 8, customer_id: 301, order_date: "2025-04-10", amount: 30 },
      ],
    },
    expected_result: [
      { order_date: "2025-04-01", amount: 100, rolling_7d: 100 },
      { order_date: "2025-04-02", amount: 50, rolling_7d: 150 },
      { order_date: "2025-04-03", amount: 0, rolling_7d: 150 },
      { order_date: "2025-04-04", amount: 80, rolling_7d: 230 },
      { order_date: "2025-04-05", amount: 20, rolling_7d: 250 },
      { order_date: "2025-04-06", amount: 60, rolling_7d: 310 },
      { order_date: "2025-04-07", amount: 0, rolling_7d: 310 },
      { order_date: "2025-04-08", amount: 90, rolling_7d: 300 },
      { order_date: "2025-04-09", amount: 40, rolling_7d: 290 },
      { order_date: "2025-04-10", amount: 30, rolling_7d: 320 },
    ],
    order_matters: true,
    starter_code:
      "daily = orders.groupby('order_date')['amount'].sum().reset_index()\ndaily['order_date'] = pd.to_datetime(daily['order_date'])\n\n# your code here: reindex over the full date range, fill_value=0, then rolling(7).sum()\nresult = None\n",
    hints: [
      "pd.date_range(daily['order_date'].min(), daily['order_date'].max(), freq='D') gives the full calendar.",
      "daily.set_index('order_date').reindex(full_range, fill_value=0) fills the gap days with 0.",
      ".rolling(7, min_periods=1).sum() — don't forget to format order_date back to a plain string with .dt.strftime('%Y-%m-%d') before assigning to result.",
    ],
    solution_code:
      "daily = orders.groupby('order_date')['amount'].sum().reset_index()\ndaily['order_date'] = pd.to_datetime(daily['order_date'])\n\nfull_range = pd.date_range(daily['order_date'].min(), daily['order_date'].max(), freq='D')\ndaily = (daily.set_index('order_date')\n              .reindex(full_range, fill_value=0)\n              .rename_axis('order_date')\n              .reset_index())\n\ndaily['rolling_7d'] = daily['amount'].rolling(7, min_periods=1).sum()\ndaily['order_date'] = daily['order_date'].dt.strftime('%Y-%m-%d')\nresult = daily\n",
    sort_order: 8,
  },

  // -------------------------------------------------------------------
  // Moving-average deviation days (spike/drop detection)
  // -------------------------------------------------------------------
  {
    slug: "moving-average-deviation-days",
    title: "Spike & Drop Days vs. 7-Day Moving Average",
    category: "sql",
    difficulty: "hard",
    topic_tags: ["window functions", "moving average", "anomaly detection"],
    story:
      "Ops wants an automated anomaly flag for the daily revenue report — any day that swings more than 50% away from its own recent trend, so a human only has to look at the days that actually matter.",
    prompt:
      "Table `orders_net(category, order_date, net_revenue)` (net revenue is already computed per line).\n\nFor each category, count the number of days **in May 2025** where daily net revenue deviates by more than ±50% from its own trailing 7-day moving average (the average of the 7 days *before* it, excluding the day itself).",
    schema_sql: "CREATE TABLE orders_net (category TEXT, order_date TEXT, net_revenue REAL);",
    seed_sql:
      "INSERT INTO orders_net (category, order_date, net_revenue) VALUES\n" +
      sqlValues(MOVING_AVG_DATES.map((d, i) => ["A", d, MOVING_AVG_VALUES[i]])) +
      ";",
    seed_data: null,
    expected_result: [{ category: "A", spike_or_drop_days: 2 }],
    order_matters: false,
    starter_code:
      "WITH daily_cat AS (\n  SELECT category, order_date, SUM(net_revenue) AS daily_revenue\n  FROM orders_net\n  GROUP BY category, order_date\n),\nwith_ma AS (\n  SELECT *,\n         AVG(daily_revenue) OVER (\n             PARTITION BY category\n             ORDER BY order_date\n             ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING\n         ) AS moving_avg_7d\n  FROM daily_cat\n)\nSELECT\n",
    hints: [
      "ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING gives a 7-day window that stops right before the current row — that's what excludes today from its own average.",
      "Early days in the dataset won't have a full 7-day history yet — moving_avg_7d IS NOT NULL filters those out.",
      "Filter to May 2025 dates, then WHERE ABS(daily_revenue - moving_avg_7d) > 0.5 * moving_avg_7d, GROUP BY category, COUNT(*).",
    ],
    solution_code:
      "WITH daily_cat AS (\n    SELECT category, order_date, SUM(net_revenue) AS daily_revenue\n    FROM orders_net\n    GROUP BY category, order_date\n),\nwith_ma AS (\n    SELECT *,\n           AVG(daily_revenue) OVER (\n               PARTITION BY category\n               ORDER BY order_date\n               ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING\n           ) AS moving_avg_7d\n    FROM daily_cat\n)\nSELECT category, COUNT(*) AS spike_or_drop_days\nFROM with_ma\nWHERE order_date BETWEEN '2025-05-01' AND '2025-05-31'\n  AND moving_avg_7d IS NOT NULL\n  AND ABS(daily_revenue - moving_avg_7d) > 0.5 * moving_avg_7d\nGROUP BY category;",
    sort_order: 9,
  },
  {
    slug: "moving-average-deviation-days-pandas",
    title: "Spike & Drop Days vs. 7-Day Moving Average",
    category: "python",
    difficulty: "hard",
    topic_tags: ["pandas", "shift", "rolling"],
    story:
      "Ops wants an automated anomaly flag for the daily revenue report — any day that swings more than 50% away from its own recent trend, so a human only has to look at the days that actually matter.",
    prompt:
      "DataFrame `orders_net(category, order_date, net_revenue)` (net revenue is already computed per line; order_date is a plain 'YYYY-MM-DD' string).\n\nFor each category, count the number of days **in May 2025** where daily net revenue deviates by more than ±50% from its own trailing 7-day moving average (the average of the 7 days *before* it, excluding the day itself). Build `result` with columns `category, spike_or_drop_days`.",
    schema_sql: null,
    seed_sql: null,
    seed_data: MOVING_AVG_SEED_DATA,
    expected_result: [{ category: "A", spike_or_drop_days: 2 }],
    order_matters: false,
    starter_code:
      "daily_cat = orders_net.groupby(['category', 'order_date'])['net_revenue'].sum().reset_index()\ndaily_cat = daily_cat.sort_values(['category', 'order_date'])\n\n# your code here\nresult = None\n",
    hints: [
      "s.shift(1).rolling(7).mean() — shift FIRST, then roll, so today isn't included in its own average.",
      "order_date is already a plain string, so 'YYYY-MM-DD' string comparisons for the May filter work fine — no need for pd.to_datetime here.",
      "Filter to May 2025 + non-null moving average, flag where the deviation exceeds 50%, then groupby('category').size().",
    ],
    solution_code:
      "daily_cat = orders_net.groupby(['category', 'order_date'])['net_revenue'].sum().reset_index()\ndaily_cat = daily_cat.sort_values(['category', 'order_date'])\n\ndaily_cat['moving_avg_7d'] = (\n    daily_cat.groupby('category')['net_revenue']\n             .transform(lambda s: s.shift(1).rolling(7).mean())\n)\n\nmay = daily_cat[(daily_cat['order_date'] >= '2025-05-01') & (daily_cat['order_date'] <= '2025-05-31')]\n\nflagged = may[\n    may['moving_avg_7d'].notna() &\n    ((may['net_revenue'] - may['moving_avg_7d']).abs() > 0.5 * may['moving_avg_7d'])\n]\n\nresult = flagged.groupby('category').size().reset_index(name='spike_or_drop_days')\n",
    sort_order: 10,
  },

  // -------------------------------------------------------------------
  // Consecutive order-day streaks per user (gaps and islands)
  // -------------------------------------------------------------------
  {
    slug: "consecutive-order-day-streaks",
    title: "Consecutive Order-Day Streaks",
    category: "sql",
    difficulty: "medium",
    topic_tags: ["gaps and islands", "window functions"],
    story:
      "The retention team wants to reward users who order on back-to-back days — but first they need every unbroken streak identified, not just whether a streak ever happened.",
    prompt:
      "Table `orders(order_id, user_id, order_date)`.\n\nFor each user, find every unbroken streak of consecutive order-days. Return `user_id, streak_start, streak_end, streak_length` for every streak, ordered by `user_id`, `streak_start`.",
    schema_sql: "CREATE TABLE orders (order_id INTEGER PRIMARY KEY, user_id INTEGER, order_date TEXT);",
    seed_sql:
      "INSERT INTO orders (order_id, user_id, order_date) VALUES\n" +
      sqlValues([
        [1, 401, "2025-06-01"],
        [2, 401, "2025-06-02"],
        [3, 401, "2025-06-03"],
        [4, 401, "2025-06-05"],
        [5, 402, "2025-06-01"],
        [6, 402, "2025-06-02"],
        [7, 402, "2025-06-04"],
      ]) +
      ";",
    seed_data: null,
    expected_result: [
      { user_id: 401, streak_start: "2025-06-01", streak_end: "2025-06-03", streak_length: 3 },
      { user_id: 401, streak_start: "2025-06-05", streak_end: "2025-06-05", streak_length: 1 },
      { user_id: 402, streak_start: "2025-06-01", streak_end: "2025-06-02", streak_length: 2 },
      { user_id: 402, streak_start: "2025-06-04", streak_end: "2025-06-04", streak_length: 1 },
    ],
    order_matters: true,
    starter_code:
      "WITH user_days AS (\n  SELECT DISTINCT user_id, order_date FROM orders\n),\ngrouped AS (\n  SELECT\n    user_id, order_date,\n    date(order_date, '-' || (ROW_NUMBER() OVER (\n        PARTITION BY user_id ORDER BY order_date\n    )) || ' days') AS grp\n  FROM user_days\n)\nSELECT\n",
    hints: [
      "This is the classic gaps-and-islands trick: subtract a per-user row number (in days) from the date. Every row in an unbroken streak lands on the same anchor date.",
      "date(order_date, '-' || ROW_NUMBER() || ' days') computes that anchor for each row.",
      "GROUP BY user_id, anchor — MIN/MAX(order_date) and COUNT(*) give you each streak's bounds and length.",
    ],
    solution_code:
      "WITH user_days AS (\n    SELECT DISTINCT user_id, order_date FROM orders\n),\ngrouped AS (\n    SELECT\n        user_id, order_date,\n        date(order_date, '-' || (ROW_NUMBER() OVER (\n            PARTITION BY user_id ORDER BY order_date\n        )) || ' days') AS grp\n    FROM user_days\n)\nSELECT user_id, MIN(order_date) AS streak_start, MAX(order_date) AS streak_end,\n       COUNT(*) AS streak_length\nFROM grouped\nGROUP BY user_id, grp\nORDER BY user_id, streak_start;",
    sort_order: 11,
  },
  {
    slug: "consecutive-order-day-streaks-pandas",
    title: "Consecutive Order-Day Streaks",
    category: "python",
    difficulty: "medium",
    topic_tags: ["pandas", "gaps and islands", "cumcount"],
    story:
      "The retention team wants to reward users who order on back-to-back days — but first they need every unbroken streak identified, not just whether a streak ever happened.",
    prompt:
      "DataFrame `orders(order_id, user_id, order_date)`.\n\nFor each user, find every unbroken streak of consecutive order-days. Build `result` with columns `user_id, streak_start, streak_end, streak_length` (dates as plain 'YYYY-MM-DD' strings), for every streak, ordered by `user_id`, `streak_start`.",
    schema_sql: null,
    seed_sql: null,
    seed_data: {
      orders: [
        { order_id: 1, user_id: 401, order_date: "2025-06-01" },
        { order_id: 2, user_id: 401, order_date: "2025-06-02" },
        { order_id: 3, user_id: 401, order_date: "2025-06-03" },
        { order_id: 4, user_id: 401, order_date: "2025-06-05" },
        { order_id: 5, user_id: 402, order_date: "2025-06-01" },
        { order_id: 6, user_id: 402, order_date: "2025-06-02" },
        { order_id: 7, user_id: 402, order_date: "2025-06-04" },
      ],
    },
    expected_result: [
      { user_id: 401, streak_start: "2025-06-01", streak_end: "2025-06-03", streak_length: 3 },
      { user_id: 401, streak_start: "2025-06-05", streak_end: "2025-06-05", streak_length: 1 },
      { user_id: 402, streak_start: "2025-06-01", streak_end: "2025-06-02", streak_length: 2 },
      { user_id: 402, streak_start: "2025-06-04", streak_end: "2025-06-04", streak_length: 1 },
    ],
    order_matters: true,
    starter_code:
      "df = orders.drop_duplicates(['user_id', 'order_date']).copy()\ndf['order_date'] = pd.to_datetime(df['order_date'])\ndf = df.sort_values(['user_id', 'order_date'])\n\n# your code here\nresult = None\n",
    hints: [
      "df.groupby('user_id').cumcount() gives a per-user row number; grp = order_date - pd.to_timedelta(row_number, unit='D') is the gaps-and-islands anchor.",
      "groupby(['user_id', 'grp']).agg(streak_start=('order_date','min'), streak_end=('order_date','max'), streak_length=('order_date','count'))",
      "Format streak_start/streak_end back to plain strings with .dt.strftime('%Y-%m-%d') before assigning to result.",
    ],
    solution_code:
      "df = orders.drop_duplicates(['user_id', 'order_date']).copy()\ndf['order_date'] = pd.to_datetime(df['order_date'])\ndf = df.sort_values(['user_id', 'order_date'])\n\ndf['day_num'] = df.groupby('user_id').cumcount()\ndf['grp'] = df['order_date'] - pd.to_timedelta(df['day_num'], unit='D')\n\nstreaks = (df.groupby(['user_id', 'grp'])\n             .agg(streak_start=('order_date', 'min'), streak_end=('order_date', 'max'), streak_length=('order_date', 'count'))\n             .reset_index()\n             .drop(columns='grp')\n             .sort_values(['user_id', 'streak_start']))\n\nstreaks['streak_start'] = streaks['streak_start'].dt.strftime('%Y-%m-%d')\nstreaks['streak_end'] = streaks['streak_end'].dt.strftime('%Y-%m-%d')\nresult = streaks.reset_index(drop=True)\n",
    sort_order: 12,
  },

  // -------------------------------------------------------------------
  // Average time to checkout after first view
  // -------------------------------------------------------------------
  {
    slug: "average-time-to-checkout",
    title: "Average Time to Checkout",
    category: "sql",
    difficulty: "medium",
    topic_tags: ["self join", "date math"],
    story:
      "UX wants to know how long shoppers linger between first laying eyes on a product and actually checking out, to judge whether a faster checkout flow is worth building.",
    prompt:
      "Table `events(event_id, user_id, event_time, event_type, session_id)`, `event_type` is `'view'` or `'checkout'`.\n\nFor each session, find the time (in seconds) between its first `view` and its first `checkout`. Return the single average across all sessions as `avg_seconds_to_checkout`.",
    schema_sql:
      "CREATE TABLE events (event_id INTEGER PRIMARY KEY, user_id INTEGER, event_time TEXT, event_type TEXT, session_id TEXT);",
    seed_sql:
      "INSERT INTO events (event_id, user_id, event_time, event_type, session_id) VALUES\n" +
      sqlValues([
        [1, 1, "2025-07-01 10:00:00", "view", "s1"],
        [2, 1, "2025-07-01 10:05:00", "checkout", "s1"],
        [3, 2, "2025-07-01 11:00:00", "view", "s2"],
        [4, 2, "2025-07-01 11:02:00", "checkout", "s2"],
        [5, 3, "2025-07-01 12:00:00", "view", "s3"],
        [6, 3, "2025-07-01 12:10:00", "checkout", "s3"],
      ]) +
      ";",
    seed_data: null,
    expected_result: [{ avg_seconds_to_checkout: 340 }],
    order_matters: false,
    starter_code:
      "WITH first_view AS (\n  SELECT user_id, session_id, MIN(event_time) AS first_view_time\n  FROM events WHERE event_type = 'view' GROUP BY user_id, session_id\n),\ncheckout AS (\n  SELECT user_id, session_id, MIN(event_time) AS checkout_time\n  FROM events WHERE event_type = 'checkout' GROUP BY user_id, session_id\n)\nSELECT\n",
    hints: [
      "Get each session's first view time and first checkout time separately (two grouped CTEs), then join them on user_id + session_id.",
      "julianday(checkout_time) - julianday(first_view_time) gives a difference in days — multiply by 24*60*60 to get seconds.",
      "AVG() the per-session seconds across the join.",
    ],
    solution_code:
      "WITH first_view AS (\n    SELECT user_id, session_id, MIN(event_time) AS first_view_time\n    FROM events WHERE event_type='view' GROUP BY user_id, session_id\n),\ncheckout AS (\n    SELECT user_id, session_id, MIN(event_time) AS checkout_time\n    FROM events WHERE event_type='checkout' GROUP BY user_id, session_id\n)\nSELECT AVG( (julianday(c.checkout_time)-julianday(f.first_view_time))*24*60*60 ) AS avg_seconds_to_checkout\nFROM first_view f JOIN checkout c ON f.user_id=c.user_id AND f.session_id=c.session_id;",
    sort_order: 13,
  },
  {
    slug: "average-time-to-checkout-pandas",
    title: "Average Time to Checkout",
    category: "python",
    difficulty: "medium",
    topic_tags: ["pandas", "merge", "timedelta"],
    story:
      "UX wants to know how long shoppers linger between first laying eyes on a product and actually checking out, to judge whether a faster checkout flow is worth building.",
    prompt:
      "DataFrame `events(event_id, user_id, event_time, event_type, session_id)`, `event_type` is `'view'` or `'checkout'`.\n\nFor each session, find the time (in seconds) between its first `view` and its first `checkout`. Build `result` as a one-row DataFrame with column `avg_seconds_to_checkout`.",
    schema_sql: null,
    seed_sql: null,
    seed_data: {
      events: [
        { event_id: 1, user_id: 1, event_time: "2025-07-01 10:00:00", event_type: "view", session_id: "s1" },
        { event_id: 2, user_id: 1, event_time: "2025-07-01 10:05:00", event_type: "checkout", session_id: "s1" },
        { event_id: 3, user_id: 2, event_time: "2025-07-01 11:00:00", event_type: "view", session_id: "s2" },
        { event_id: 4, user_id: 2, event_time: "2025-07-01 11:02:00", event_type: "checkout", session_id: "s2" },
        { event_id: 5, user_id: 3, event_time: "2025-07-01 12:00:00", event_type: "view", session_id: "s3" },
        { event_id: 6, user_id: 3, event_time: "2025-07-01 12:10:00", event_type: "checkout", session_id: "s3" },
      ],
    },
    expected_result: [{ avg_seconds_to_checkout: 340 }],
    order_matters: false,
    starter_code:
      "events['event_time'] = pd.to_datetime(events['event_time'])\n\n# your code here\nresult = None\n",
    hints: [
      "Group view rows and checkout rows separately by (user_id, session_id), taking the min event_time in each.",
      "merge the two on (user_id, session_id), then (checkout_time - first_view_time).dt.total_seconds().",
      "result = pd.DataFrame({'avg_seconds_to_checkout': [the_mean]})",
    ],
    solution_code:
      "events['event_time'] = pd.to_datetime(events['event_time'])\n\nfirst_view = (events[events['event_type']=='view']\n              .groupby(['user_id','session_id'])['event_time'].min()\n              .reset_index(name='first_view_time'))\ncheckout = (events[events['event_type']=='checkout']\n            .groupby(['user_id','session_id'])['event_time'].min()\n            .reset_index(name='checkout_time'))\n\nmerged = first_view.merge(checkout, on=['user_id','session_id'])\nmerged['time_to_checkout_sec'] = (merged['checkout_time'] - merged['first_view_time']).dt.total_seconds()\n\nresult = pd.DataFrame({'avg_seconds_to_checkout': [merged['time_to_checkout_sec'].mean()]})\n",
    sort_order: 14,
  },

  // -------------------------------------------------------------------
  // Session conversion rate
  // -------------------------------------------------------------------
  {
    slug: "session-conversion-rate",
    title: "Session Conversion Rate",
    category: "sql",
    difficulty: "easy",
    topic_tags: ["conditional aggregation", "distinct count"],
    story:
      "Growth wants one headline number for the weekly review: what fraction of visits actually convert.",
    prompt:
      "Table `events(event_id, event_type, session_id)`.\n\nDefine a converted session as one containing at least one `'checkout'` event. Return `session_conversion_rate`: the fraction of all distinct sessions that converted.",
    schema_sql: "CREATE TABLE events (event_id INTEGER PRIMARY KEY, event_type TEXT, session_id TEXT);",
    seed_sql:
      "INSERT INTO events (event_id, event_type, session_id) VALUES\n" +
      sqlValues([
        [1, "view", "s1"],
        [2, "checkout", "s1"],
        [3, "view", "s2"],
        [4, "checkout", "s2"],
        [5, "view", "s3"],
        [6, "view", "s4"],
        [7, "checkout", "s4"],
        [8, "view", "s5"],
      ]) +
      ";",
    seed_data: null,
    expected_result: [{ session_conversion_rate: 0.6 }],
    order_matters: false,
    starter_code: "SELECT\n",
    hints: [
      "COUNT(DISTINCT session_id) gives total sessions.",
      "A CASE expression inside COUNT(DISTINCT ...) lets you count only the sessions that had a checkout event.",
      "Divide the two, using 1.0 * or a float column so it doesn't do integer division.",
    ],
    solution_code:
      "SELECT COUNT(DISTINCT CASE WHEN event_type='checkout' THEN session_id END) * 1.0\n       / COUNT(DISTINCT session_id) AS session_conversion_rate\nFROM events;",
    sort_order: 15,
  },
  {
    slug: "session-conversion-rate-pandas",
    title: "Session Conversion Rate",
    category: "python",
    difficulty: "easy",
    topic_tags: ["pandas", "nunique"],
    story: "Growth wants one headline number for the weekly review: what fraction of visits actually convert.",
    prompt:
      "DataFrame `events(event_id, event_type, session_id)`.\n\nDefine a converted session as one containing at least one `'checkout'` event. Build `result` as a one-row DataFrame with column `session_conversion_rate`.",
    schema_sql: null,
    seed_sql: null,
    seed_data: {
      events: [
        { event_id: 1, event_type: "view", session_id: "s1" },
        { event_id: 2, event_type: "checkout", session_id: "s1" },
        { event_id: 3, event_type: "view", session_id: "s2" },
        { event_id: 4, event_type: "checkout", session_id: "s2" },
        { event_id: 5, event_type: "view", session_id: "s3" },
        { event_id: 6, event_type: "view", session_id: "s4" },
        { event_id: 7, event_type: "checkout", session_id: "s4" },
        { event_id: 8, event_type: "view", session_id: "s5" },
      ],
    },
    expected_result: [{ session_conversion_rate: 0.6 }],
    order_matters: false,
    starter_code: "# your code here\nresult = None\n",
    hints: [
      "events['session_id'].nunique() gives total sessions.",
      "Filter to event_type == 'checkout' first, then .nunique() on session_id for the converted count.",
      "result = pd.DataFrame({'session_conversion_rate': [converted / total]})",
    ],
    solution_code:
      "total_sessions = events['session_id'].nunique()\nconverted_sessions = events.loc[events['event_type']=='checkout', 'session_id'].nunique()\nresult = pd.DataFrame({'session_conversion_rate': [converted_sessions / total_sessions]})\n",
    sort_order: 16,
  },

  // -------------------------------------------------------------------
  // Search-to-view drop-off days
  // -------------------------------------------------------------------
  {
    slug: "search-to-view-dropoff-days",
    title: "Days Where Search-to-View Drop-off Exceeds 40%",
    category: "sql",
    difficulty: "hard",
    topic_tags: ["pivot", "funnel analysis"],
    story:
      "The search team suspects a recent results-page change is losing people between searching and actually viewing a product — they want the exact days it got bad enough to investigate.",
    prompt:
      "Table `events(event_id, event_time, event_type, session_id)`, `event_type` is `'search'` or `'view'`.\n\nFor each day, drop-off % = (distinct searching sessions - distinct viewing sessions) / distinct searching sessions * 100. Return every day where that exceeds 40%, with `event_date, searches, views, drop_off_pct`.",
    schema_sql: DROPOFF_SCHEMA_SQL,
    seed_sql: DROPOFF_SEED_SQL,
    seed_data: null,
    expected_result: [{ event_date: "2025-08-02", searches: 10, views: 5, drop_off_pct: 50 }],
    order_matters: false,
    starter_code:
      "WITH daily_search AS (\n  SELECT DATE(event_time) AS event_date, COUNT(DISTINCT session_id) AS searches\n  FROM events WHERE event_type = 'search'\n  GROUP BY DATE(event_time)\n),\ndaily_view AS (\n  SELECT DATE(event_time) AS event_date, COUNT(DISTINCT session_id) AS views\n  FROM events WHERE event_type = 'view'\n  GROUP BY DATE(event_time)\n)\nSELECT\n",
    hints: [
      "Aggregate search sessions and view sessions per day separately, then LEFT JOIN them (a day could have searches but zero views).",
      "COALESCE the joined views to 0 for days with no view events at all.",
      "drop_off_pct = (searches - views) * 100.0 / searches, filtered to > 40.",
    ],
    solution_code:
      "WITH daily_search AS (\n    SELECT DATE(event_time) AS event_date, COUNT(DISTINCT session_id) AS searches\n    FROM events WHERE event_type = 'search'\n    GROUP BY DATE(event_time)\n),\ndaily_view AS (\n    SELECT DATE(event_time) AS event_date, COUNT(DISTINCT session_id) AS views\n    FROM events WHERE event_type = 'view'\n    GROUP BY DATE(event_time)\n)\nSELECT\n    s.event_date, s.searches, COALESCE(v.views, 0) AS views,\n    (s.searches - COALESCE(v.views, 0)) * 100.0 / s.searches AS drop_off_pct\nFROM daily_search s\nLEFT JOIN daily_view v ON s.event_date = v.event_date\nWHERE (s.searches - COALESCE(v.views, 0)) * 100.0 / s.searches > 40;",
    sort_order: 17,
  },
  {
    slug: "search-to-view-dropoff-days-pandas",
    title: "Days Where Search-to-View Drop-off Exceeds 40%",
    category: "python",
    difficulty: "hard",
    topic_tags: ["pandas", "pivot_table"],
    story:
      "The search team suspects a recent results-page change is losing people between searching and actually viewing a product — they want the exact days it got bad enough to investigate.",
    prompt:
      "DataFrame `events(event_id, event_time, event_type, session_id)`, `event_type` is `'search'` or `'view'`.\n\nFor each day, drop-off % = (distinct searching sessions - distinct viewing sessions) / distinct searching sessions * 100. Build `result` with every day where that exceeds 40%: columns `event_date, searches, views, drop_off_pct`.",
    schema_sql: null,
    seed_sql: null,
    seed_data: DROPOFF_SEED_DATA,
    expected_result: [{ event_date: "2025-08-02", searches: 10, views: 5, drop_off_pct: 50 }],
    order_matters: false,
    starter_code:
      "events['event_date'] = pd.to_datetime(events['event_time']).dt.strftime('%Y-%m-%d')\n\n# your code here\nresult = None\n",
    hints: [
      "pivot_table(index='event_date', columns='event_type', values='session_id', aggfunc='nunique') gives searches/views side by side per day.",
      ".fillna(0) — a day might have searches but no views at all.",
      "Filter to drop_off_pct > 40, then reset_index() and rename the pivoted columns to searches/views.",
    ],
    solution_code:
      "daily_funnel = events.pivot_table(\n    index='event_date',\n    columns='event_type',\n    values='session_id',\n    aggfunc='nunique'\n).fillna(0)\n\ndaily_funnel['drop_off_pct'] = (\n    (daily_funnel['search'] - daily_funnel['view']) / daily_funnel['search'] * 100\n)\n\nresult = daily_funnel[daily_funnel['drop_off_pct'] > 40].reset_index()\nresult = result[['event_date', 'search', 'view', 'drop_off_pct']].rename(\n    columns={'search': 'searches', 'view': 'views'}\n)\n",
    sort_order: 18,
  },

  // -------------------------------------------------------------------
  // Cumulative stock levels
  // -------------------------------------------------------------------
  {
    slug: "cumulative-stock-levels",
    title: "Daily & Cumulative Stock Levels",
    category: "sql",
    difficulty: "easy",
    topic_tags: ["window functions", "running total"],
    story:
      "The warehouse team wants a daily closing-stock ledger per product/warehouse — the running total that everything else (reorder alerts, stockout detection) gets built on top of.",
    prompt:
      "Table `inventory(inventory_id, product_id, record_date, delta_qty, is_restock, warehouse)` — `delta_qty` is signed (positive for restocks, negative for sales/usage).\n\nFor each product/warehouse, compute the daily net change and the running cumulative stock. Return `product_id, warehouse, record_date, daily_change, cumulative_stock`, ordered by product, warehouse, date.",
    schema_sql: INVENTORY_SCHEMA_SQL,
    seed_sql: INVENTORY_SEED_SQL,
    seed_data: null,
    expected_result: [
      { product_id: "P1", warehouse: "W1", record_date: "2025-09-01", daily_change: 50, cumulative_stock: 50 },
      { product_id: "P1", warehouse: "W1", record_date: "2025-09-02", daily_change: -20, cumulative_stock: 30 },
      { product_id: "P1", warehouse: "W1", record_date: "2025-09-03", daily_change: -15, cumulative_stock: 15 },
      { product_id: "P1", warehouse: "W1", record_date: "2025-09-04", daily_change: -10, cumulative_stock: 5 },
      { product_id: "P1", warehouse: "W1", record_date: "2025-09-05", daily_change: -8, cumulative_stock: -3 },
      { product_id: "P1", warehouse: "W1", record_date: "2025-09-06", daily_change: 5, cumulative_stock: 2 },
      { product_id: "P1", warehouse: "W1", record_date: "2025-09-07", daily_change: -30, cumulative_stock: -28 },
      { product_id: "P1", warehouse: "W1", record_date: "2025-09-08", daily_change: 40, cumulative_stock: 12 },
      { product_id: "P2", warehouse: "W1", record_date: "2025-09-01", daily_change: 200, cumulative_stock: 200 },
      { product_id: "P2", warehouse: "W1", record_date: "2025-09-02", daily_change: -20, cumulative_stock: 180 },
      { product_id: "P2", warehouse: "W1", record_date: "2025-09-03", daily_change: -20, cumulative_stock: 160 },
      { product_id: "P2", warehouse: "W1", record_date: "2025-09-04", daily_change: -20, cumulative_stock: 140 },
      { product_id: "P2", warehouse: "W1", record_date: "2025-09-05", daily_change: -20, cumulative_stock: 120 },
      { product_id: "P2", warehouse: "W1", record_date: "2025-09-06", daily_change: -20, cumulative_stock: 100 },
      { product_id: "P2", warehouse: "W1", record_date: "2025-09-07", daily_change: -20, cumulative_stock: 80 },
      { product_id: "P2", warehouse: "W1", record_date: "2025-09-08", daily_change: -20, cumulative_stock: 60 },
    ],
    order_matters: true,
    starter_code:
      "WITH daily AS (\n  SELECT product_id, warehouse, record_date, SUM(delta_qty) AS daily_change\n  FROM inventory\n  GROUP BY product_id, warehouse, record_date\n)\nSELECT\n",
    hints: [
      "Aggregate to (product, warehouse, date) first — a day could have multiple inventory rows.",
      "SUM(daily_change) OVER (PARTITION BY product_id, warehouse ORDER BY record_date) is the running total.",
      "No ROWS BETWEEN needed here — the default frame for an ORDER BY window is already 'from the start through the current row'.",
    ],
    solution_code:
      "WITH daily AS (\n    SELECT product_id, warehouse, record_date, SUM(delta_qty) AS daily_change\n    FROM inventory\n    GROUP BY product_id, warehouse, record_date\n)\nSELECT *,\n       SUM(daily_change) OVER (\n           PARTITION BY product_id, warehouse\n           ORDER BY record_date\n       ) AS cumulative_stock\nFROM daily\nORDER BY product_id, warehouse, record_date;",
    sort_order: 19,
  },
  {
    slug: "cumulative-stock-levels-pandas",
    title: "Daily & Cumulative Stock Levels",
    category: "python",
    difficulty: "easy",
    topic_tags: ["pandas", "cumsum"],
    story:
      "The warehouse team wants a daily closing-stock ledger per product/warehouse — the running total that everything else (reorder alerts, stockout detection) gets built on top of.",
    prompt:
      "DataFrame `inventory(product_id, record_date, delta_qty, is_restock, warehouse)` — `delta_qty` is signed (positive for restocks, negative for sales/usage).\n\nFor each product/warehouse, compute the daily net change and the running cumulative stock. Build `result` with columns `product_id, warehouse, record_date, daily_change, cumulative_stock`, sorted by product, warehouse, date.",
    schema_sql: null,
    seed_sql: null,
    seed_data: INVENTORY_SEED_DATA,
    expected_result: [
      { product_id: "P1", warehouse: "W1", record_date: "2025-09-01", daily_change: 50, cumulative_stock: 50 },
      { product_id: "P1", warehouse: "W1", record_date: "2025-09-02", daily_change: -20, cumulative_stock: 30 },
      { product_id: "P1", warehouse: "W1", record_date: "2025-09-03", daily_change: -15, cumulative_stock: 15 },
      { product_id: "P1", warehouse: "W1", record_date: "2025-09-04", daily_change: -10, cumulative_stock: 5 },
      { product_id: "P1", warehouse: "W1", record_date: "2025-09-05", daily_change: -8, cumulative_stock: -3 },
      { product_id: "P1", warehouse: "W1", record_date: "2025-09-06", daily_change: 5, cumulative_stock: 2 },
      { product_id: "P1", warehouse: "W1", record_date: "2025-09-07", daily_change: -30, cumulative_stock: -28 },
      { product_id: "P1", warehouse: "W1", record_date: "2025-09-08", daily_change: 40, cumulative_stock: 12 },
      { product_id: "P2", warehouse: "W1", record_date: "2025-09-01", daily_change: 200, cumulative_stock: 200 },
      { product_id: "P2", warehouse: "W1", record_date: "2025-09-02", daily_change: -20, cumulative_stock: 180 },
      { product_id: "P2", warehouse: "W1", record_date: "2025-09-03", daily_change: -20, cumulative_stock: 160 },
      { product_id: "P2", warehouse: "W1", record_date: "2025-09-04", daily_change: -20, cumulative_stock: 140 },
      { product_id: "P2", warehouse: "W1", record_date: "2025-09-05", daily_change: -20, cumulative_stock: 120 },
      { product_id: "P2", warehouse: "W1", record_date: "2025-09-06", daily_change: -20, cumulative_stock: 100 },
      { product_id: "P2", warehouse: "W1", record_date: "2025-09-07", daily_change: -20, cumulative_stock: 80 },
      { product_id: "P2", warehouse: "W1", record_date: "2025-09-08", daily_change: -20, cumulative_stock: 60 },
    ],
    order_matters: true,
    starter_code:
      "daily = inventory.groupby(['product_id', 'warehouse', 'record_date'])['delta_qty'].sum().reset_index()\ndaily = daily.sort_values(['product_id', 'warehouse', 'record_date'])\n\n# your code here\nresult = None\n",
    hints: [
      "groupby(['product_id','warehouse'])['delta_qty'].cumsum() gives the running total per group, aligned back to every row.",
      "Rename the summed delta_qty column to daily_change for the final output.",
    ],
    solution_code:
      "daily = inventory.groupby(['product_id', 'warehouse', 'record_date'])['delta_qty'].sum().reset_index()\ndaily = daily.sort_values(['product_id', 'warehouse', 'record_date'])\n\ndaily['cumulative_stock'] = daily.groupby(['product_id', 'warehouse'])['delta_qty'].cumsum()\nresult = daily.rename(columns={'delta_qty': 'daily_change'})\n",
    sort_order: 20,
  },

  // -------------------------------------------------------------------
  // Out-of-stock streaks
  // -------------------------------------------------------------------
  {
    slug: "out-of-stock-streaks",
    title: "Out-of-Stock Streaks",
    category: "sql",
    difficulty: "hard",
    topic_tags: ["gaps and islands", "window functions"],
    story:
      "Supply chain wants every stretch of consecutive days a product sat at zero or negative stock — not just whether it ever happened — to prioritize which SKUs need safety-stock fixes first.",
    prompt:
      "Table `inventory(inventory_id, product_id, record_date, delta_qty, is_restock, warehouse)`.\n\nFor each product/warehouse, find every unbroken streak of consecutive days where the closing stock was ≤ 0. Return `product_id, warehouse, streak_start, streak_end, consecutive_oos_days`.",
    schema_sql: INVENTORY_SCHEMA_SQL,
    seed_sql: INVENTORY_SEED_SQL,
    seed_data: null,
    expected_result: [
      { product_id: "P1", warehouse: "W1", streak_start: "2025-09-05", streak_end: "2025-09-05", consecutive_oos_days: 1 },
      { product_id: "P1", warehouse: "W1", streak_start: "2025-09-07", streak_end: "2025-09-07", consecutive_oos_days: 1 },
    ],
    order_matters: true,
    starter_code:
      "WITH daily_stock AS (\n  SELECT *,\n         SUM(daily_change) OVER (\n             PARTITION BY product_id, warehouse ORDER BY record_date\n         ) AS closing_stock\n  FROM (\n    SELECT product_id, warehouse, record_date, SUM(delta_qty) AS daily_change\n    FROM inventory\n    GROUP BY product_id, warehouse, record_date\n  ) d\n)\nSELECT\n",
    hints: [
      "First compute the cumulative closing_stock (same as the cumulative-stock question), then flag is_oos = closing_stock <= 0.",
      "Gaps-and-islands, but partitioned by (product_id, warehouse, is_oos) so in-stock and out-of-stock runs get separate row-number sequences.",
      "Filter to is_oos = 1 before grouping by the anchor — you only want the out-of-stock islands, not the in-stock ones.",
    ],
    solution_code:
      "WITH daily_stock AS (\n    SELECT *,\n           SUM(daily_change) OVER (\n               PARTITION BY product_id, warehouse ORDER BY record_date\n           ) AS closing_stock\n    FROM (\n        SELECT product_id, warehouse, record_date, SUM(delta_qty) AS daily_change\n        FROM inventory\n        GROUP BY product_id, warehouse, record_date\n    ) d\n),\nflagged AS (\n    SELECT *,\n           CASE WHEN closing_stock <= 0 THEN 1 ELSE 0 END AS is_oos,\n           date(\n               record_date,\n               '-' || (ROW_NUMBER() OVER (\n                   PARTITION BY product_id, warehouse,\n                                CASE WHEN closing_stock <= 0 THEN 1 ELSE 0 END\n                   ORDER BY record_date\n               )) || ' days'\n           ) AS grp\n    FROM daily_stock\n)\nSELECT product_id, warehouse,\n       MIN(record_date) AS streak_start,\n       MAX(record_date) AS streak_end,\n       COUNT(*)         AS consecutive_oos_days\nFROM flagged\nWHERE is_oos = 1\nGROUP BY product_id, warehouse, grp\nORDER BY product_id, warehouse, streak_start;",
    sort_order: 21,
  },
  {
    slug: "out-of-stock-streaks-pandas",
    title: "Out-of-Stock Streaks",
    category: "python",
    difficulty: "hard",
    topic_tags: ["pandas", "gaps and islands"],
    story:
      "Supply chain wants every stretch of consecutive days a product sat at zero or negative stock — not just whether it ever happened — to prioritize which SKUs need safety-stock fixes first.",
    prompt:
      "DataFrame `inventory(product_id, record_date, delta_qty, is_restock, warehouse)`.\n\nFor each product/warehouse, find every unbroken streak of consecutive days where the closing stock was ≤ 0. Build `result` with columns `product_id, warehouse, streak_start, streak_end, consecutive_oos_days` (dates as plain strings).",
    schema_sql: null,
    seed_sql: null,
    seed_data: INVENTORY_SEED_DATA,
    expected_result: [
      { product_id: "P1", warehouse: "W1", streak_start: "2025-09-05", streak_end: "2025-09-05", consecutive_oos_days: 1 },
      { product_id: "P1", warehouse: "W1", streak_start: "2025-09-07", streak_end: "2025-09-07", consecutive_oos_days: 1 },
    ],
    order_matters: true,
    starter_code:
      "daily = inventory.groupby(['product_id', 'warehouse', 'record_date'])['delta_qty'].sum().reset_index()\ndaily = daily.sort_values(['product_id', 'warehouse', 'record_date'])\ndaily['closing_stock'] = daily.groupby(['product_id', 'warehouse'])['delta_qty'].cumsum()\n\n# your code here\nresult = None\n",
    hints: [
      "is_oos = (closing_stock <= 0).astype(int); groupby(['product_id','warehouse','is_oos']).cumcount() gives the per-run row number.",
      "grp = record_date - pd.to_timedelta(row_number, unit='D') — same anchor trick, computed only within is_oos runs.",
      "Filter to is_oos == 1 before the final groupby(['product_id','warehouse','grp']).",
    ],
    solution_code:
      "daily = inventory.groupby(['product_id', 'warehouse', 'record_date'])['delta_qty'].sum().reset_index()\ndaily = daily.sort_values(['product_id', 'warehouse', 'record_date'])\ndaily['closing_stock'] = daily.groupby(['product_id', 'warehouse'])['delta_qty'].cumsum()\n\ndaily['is_oos'] = (daily['closing_stock'] <= 0).astype(int)\ndaily['row_num'] = daily.groupby(['product_id', 'warehouse', 'is_oos']).cumcount() + 1\ndaily['record_date'] = pd.to_datetime(daily['record_date'])\ndaily['grp'] = daily['record_date'] - pd.to_timedelta(daily['row_num'], unit='D')\n\nstreaks = (\n    daily[daily['is_oos'] == 1]\n    .groupby(['product_id', 'warehouse', 'grp'])\n    .agg(streak_start=('record_date', 'min'), streak_end=('record_date', 'max'), consecutive_oos_days=('record_date', 'count'))\n    .reset_index()\n    .drop(columns='grp')\n    .sort_values(['product_id', 'warehouse', 'streak_start'])\n)\nstreaks['streak_start'] = streaks['streak_start'].dt.strftime('%Y-%m-%d')\nstreaks['streak_end'] = streaks['streak_end'].dt.strftime('%Y-%m-%d')\nresult = streaks.reset_index(drop=True)\n",
    sort_order: 22,
  },

  // -------------------------------------------------------------------
  // Reorder trigger date
  // -------------------------------------------------------------------
  {
    slug: "reorder-trigger-date",
    title: "Reorder Trigger Date",
    category: "sql",
    difficulty: "medium",
    topic_tags: ["left join", "running total"],
    story: "Purchasing wants an automated alert the moment any product/warehouse first crosses the 10-unit reorder threshold.",
    prompt:
      "Table `inventory(inventory_id, product_id, record_date, delta_qty, is_restock, warehouse)`. Reorder threshold is 10 units.\n\nFor every product/warehouse combo, find the earliest date its closing stock dropped to ≤ 10 — `reorder_trigger_date`. If it never happened, show `NULL` rather than omitting the combo.",
    schema_sql: INVENTORY_SCHEMA_SQL,
    seed_sql: INVENTORY_SEED_SQL,
    seed_data: null,
    expected_result: [
      { product_id: "P1", warehouse: "W1", reorder_trigger_date: "2025-09-04" },
      { product_id: "P2", warehouse: "W1", reorder_trigger_date: null },
    ],
    order_matters: true,
    starter_code:
      "WITH daily AS (\n  SELECT product_id, warehouse, record_date, SUM(delta_qty) AS daily_change\n  FROM inventory\n  GROUP BY product_id, warehouse, record_date\n),\nrunning AS (\n  SELECT *,\n         SUM(daily_change) OVER (\n             PARTITION BY product_id, warehouse ORDER BY record_date\n         ) AS closing_stock\n  FROM daily\n)\nSELECT\n",
    hints: [
      "MIN(record_date) WHERE closing_stock <= 10, grouped by product/warehouse, gives the trigger date for combos that ever crossed it.",
      "That alone would silently drop combos that never crossed 10 — LEFT JOIN it onto the full DISTINCT list of product/warehouse combos.",
      "A combo with no match in the trigger CTE naturally comes through as NULL from the LEFT JOIN.",
    ],
    solution_code:
      "WITH daily AS (\n    SELECT product_id, warehouse, record_date, SUM(delta_qty) AS daily_change\n    FROM inventory\n    GROUP BY product_id, warehouse, record_date\n),\nrunning AS (\n    SELECT *,\n           SUM(daily_change) OVER (\n               PARTITION BY product_id, warehouse ORDER BY record_date\n           ) AS closing_stock\n    FROM daily\n),\ntriggered AS (\n    SELECT product_id, warehouse, MIN(record_date) AS reorder_trigger_date\n    FROM running\n    WHERE closing_stock <= 10\n    GROUP BY product_id, warehouse\n),\nall_combos AS (\n    SELECT DISTINCT product_id, warehouse FROM inventory\n)\nSELECT ac.product_id, ac.warehouse, t.reorder_trigger_date\nFROM all_combos ac\nLEFT JOIN triggered t\n  ON ac.product_id = t.product_id AND ac.warehouse = t.warehouse\nORDER BY ac.product_id;",
    sort_order: 23,
  },
  {
    slug: "reorder-trigger-date-pandas",
    title: "Reorder Trigger Date",
    category: "python",
    difficulty: "medium",
    topic_tags: ["pandas", "merge", "cumsum"],
    story: "Purchasing wants an automated alert the moment any product/warehouse first crosses the 10-unit reorder threshold.",
    prompt:
      "DataFrame `inventory(product_id, record_date, delta_qty, is_restock, warehouse)`. Reorder threshold is 10 units.\n\nFor every product/warehouse combo, find the earliest date its closing stock dropped to ≤ 10 — `reorder_trigger_date`. If it never happened, show a missing value rather than omitting the combo. Build `result` with columns `product_id, warehouse, reorder_trigger_date`.",
    schema_sql: null,
    seed_sql: null,
    seed_data: INVENTORY_SEED_DATA,
    expected_result: [
      { product_id: "P1", warehouse: "W1", reorder_trigger_date: "2025-09-04" },
      { product_id: "P2", warehouse: "W1", reorder_trigger_date: null },
    ],
    order_matters: true,
    starter_code:
      "daily = inventory.groupby(['product_id', 'warehouse', 'record_date'])['delta_qty'].sum().reset_index()\ndaily = daily.sort_values(['product_id', 'warehouse', 'record_date'])\ndaily['closing_stock'] = daily.groupby(['product_id', 'warehouse'])['delta_qty'].cumsum()\n\n# your code here\nresult = None\n",
    hints: [
      "Filter to closing_stock <= 10, then groupby(['product_id','warehouse'])['record_date'].min() for the combos that ever crossed it.",
      "merge(..., how='left') the full distinct (product_id, warehouse) list onto that — a plain/inner merge would drop combos that never triggered.",
      "record_date is already a plain string here, so no datetime formatting needed on the way out.",
    ],
    solution_code:
      "daily = inventory.groupby(['product_id', 'warehouse', 'record_date'])['delta_qty'].sum().reset_index()\ndaily = daily.sort_values(['product_id', 'warehouse', 'record_date'])\ndaily['closing_stock'] = daily.groupby(['product_id', 'warehouse'])['delta_qty'].cumsum()\n\nbelow = daily[daily['closing_stock'] <= 10]\nfirst_trigger = below.groupby(['product_id', 'warehouse'])['record_date'].min().reset_index(name='reorder_trigger_date')\n\nall_pairs = daily[['product_id', 'warehouse']].drop_duplicates()\nresult = all_pairs.merge(first_trigger, on=['product_id', 'warehouse'], how='left').sort_values('product_id').reset_index(drop=True)\n",
    sort_order: 24,
  },

  // -------------------------------------------------------------------
  // Restock scenario modeling
  // -------------------------------------------------------------------
  {
    slug: "restock-scenario-modeling",
    title: "Restock Scenario Modeling (+10%)",
    category: "sql",
    difficulty: "very_hard",
    topic_tags: ["window functions", "what-if analysis"],
    story:
      "Supply chain is proposing a blanket +10% restock buffer to cut stockouts, and wants to see exactly how that would have changed closing stock day by day for product P1 before committing budget to it.",
    prompt:
      "Table `inventory(inventory_id, product_id, record_date, delta_qty, is_restock, warehouse)`.\n\nModel a scenario where every restock event (`is_restock = 1`) is increased by 10%. For product `P1` / warehouse `W1`, return `record_date, closing_stock_actual, closing_stock_scenario, stock_diff` — the actual vs. scenario running stock and their difference, ordered by date.",
    schema_sql: INVENTORY_SCHEMA_SQL,
    seed_sql: INVENTORY_SEED_SQL,
    seed_data: null,
    expected_result: [
      { record_date: "2025-09-01", closing_stock_actual: 50, closing_stock_scenario: 55, stock_diff: 5 },
      { record_date: "2025-09-02", closing_stock_actual: 30, closing_stock_scenario: 35, stock_diff: 5 },
      { record_date: "2025-09-03", closing_stock_actual: 15, closing_stock_scenario: 20, stock_diff: 5 },
      { record_date: "2025-09-04", closing_stock_actual: 5, closing_stock_scenario: 10, stock_diff: 5 },
      { record_date: "2025-09-05", closing_stock_actual: -3, closing_stock_scenario: 2, stock_diff: 5 },
      { record_date: "2025-09-06", closing_stock_actual: 2, closing_stock_scenario: 7, stock_diff: 5 },
      { record_date: "2025-09-07", closing_stock_actual: -28, closing_stock_scenario: -23, stock_diff: 5 },
      { record_date: "2025-09-08", closing_stock_actual: 12, closing_stock_scenario: 21, stock_diff: 9 },
    ],
    order_matters: true,
    starter_code:
      "WITH scenario_source AS (\n  SELECT\n    product_id, warehouse, record_date,\n    CASE WHEN is_restock = 1 THEN delta_qty * 1.1 ELSE delta_qty END AS delta_qty\n  FROM inventory\n)\nSELECT\n",
    hints: [
      "Build a scenario_source CTE that bumps only the restock rows by 10%, leaving everything else untouched.",
      "Compute cumulative closing stock (same running-total pattern) for both the actual and scenario data independently, then join them on (product_id, warehouse, record_date).",
      "Filter the final SELECT to product_id = 'P1' — the computation itself still runs correctly across every product because the window functions are partitioned.",
    ],
    solution_code:
      "WITH scenario_source AS (\n    SELECT\n        product_id, warehouse, record_date,\n        CASE WHEN is_restock = 1 THEN delta_qty * 1.1 ELSE delta_qty END AS delta_qty\n    FROM inventory\n),\nactual_daily AS (\n    SELECT product_id, warehouse, record_date, SUM(delta_qty) AS daily_change\n    FROM inventory\n    GROUP BY product_id, warehouse, record_date\n),\nactual_closing AS (\n    SELECT *,\n           SUM(daily_change) OVER (\n               PARTITION BY product_id, warehouse ORDER BY record_date\n           ) AS closing_stock_actual\n    FROM actual_daily\n),\nscenario_daily AS (\n    SELECT product_id, warehouse, record_date, SUM(delta_qty) AS daily_change\n    FROM scenario_source\n    GROUP BY product_id, warehouse, record_date\n),\nscenario_closing AS (\n    SELECT *,\n           SUM(daily_change) OVER (\n               PARTITION BY product_id, warehouse ORDER BY record_date\n           ) AS closing_stock_scenario\n    FROM scenario_daily\n)\nSELECT\n    a.record_date,\n    a.closing_stock_actual,\n    s.closing_stock_scenario,\n    s.closing_stock_scenario - a.closing_stock_actual AS stock_diff\nFROM actual_closing a\nJOIN scenario_closing s\n  ON a.product_id = s.product_id\n AND a.warehouse = s.warehouse\n AND a.record_date = s.record_date\nWHERE a.product_id = 'P1'\nORDER BY a.record_date;",
    sort_order: 25,
  },
  {
    slug: "restock-scenario-modeling-pandas",
    title: "Restock Scenario Modeling (+10%)",
    category: "python",
    difficulty: "very_hard",
    topic_tags: ["pandas", "what-if analysis", "cumsum"],
    story:
      "Supply chain is proposing a blanket +10% restock buffer to cut stockouts, and wants to see exactly how that would have changed closing stock day by day for product P1 before committing budget to it.",
    prompt:
      "DataFrame `inventory(product_id, record_date, delta_qty, is_restock, warehouse)`.\n\nModel a scenario where every restock event (`is_restock == 1`) is increased by 10%. For product `P1` / warehouse `W1`, build `result` with `record_date, closing_stock_actual, closing_stock_scenario, stock_diff`, sorted by date.",
    schema_sql: null,
    seed_sql: null,
    seed_data: INVENTORY_SEED_DATA,
    expected_result: [
      { record_date: "2025-09-01", closing_stock_actual: 50, closing_stock_scenario: 55, stock_diff: 5 },
      { record_date: "2025-09-02", closing_stock_actual: 30, closing_stock_scenario: 35, stock_diff: 5 },
      { record_date: "2025-09-03", closing_stock_actual: 15, closing_stock_scenario: 20, stock_diff: 5 },
      { record_date: "2025-09-04", closing_stock_actual: 5, closing_stock_scenario: 10, stock_diff: 5 },
      { record_date: "2025-09-05", closing_stock_actual: -3, closing_stock_scenario: 2, stock_diff: 5 },
      { record_date: "2025-09-06", closing_stock_actual: 2, closing_stock_scenario: 7, stock_diff: 5 },
      { record_date: "2025-09-07", closing_stock_actual: -28, closing_stock_scenario: -23, stock_diff: 5 },
      { record_date: "2025-09-08", closing_stock_actual: 12, closing_stock_scenario: 21, stock_diff: 9 },
    ],
    order_matters: true,
    starter_code:
      "scenario = inventory.copy()\nscenario['delta_qty'] = np.where(scenario['is_restock'] == 1, scenario['delta_qty'] * 1.1, scenario['delta_qty'])\n\n# your code here\nresult = None\n",
    hints: [
      "np.where(is_restock == 1, delta_qty * 1.1, delta_qty) bumps only restock rows.",
      "Write a small daily_closing(df) helper (groupby + cumsum) and call it once on `inventory` and once on `scenario` — same pattern as the earlier cumulative-stock question.",
      "merge the two closings on (product_id, warehouse, record_date), take the diff, then filter to product_id == 'P1' for the final result.",
    ],
    solution_code:
      "scenario = inventory.copy()\nscenario['delta_qty'] = np.where(scenario['is_restock'] == 1, scenario['delta_qty'] * 1.1, scenario['delta_qty'])\n\ndef daily_closing(df):\n    d = df.groupby(['product_id', 'warehouse', 'record_date'])['delta_qty'].sum().reset_index()\n    d = d.sort_values(['product_id', 'warehouse', 'record_date'])\n    d['closing_stock'] = d.groupby(['product_id', 'warehouse'])['delta_qty'].cumsum()\n    return d\n\nactual_daily = daily_closing(inventory).rename(columns={'closing_stock': 'closing_stock_actual'})\nscenario_daily = daily_closing(scenario).rename(columns={'closing_stock': 'closing_stock_scenario'})\n\ncomparison = actual_daily.merge(\n    scenario_daily[['product_id', 'warehouse', 'record_date', 'closing_stock_scenario']],\n    on=['product_id', 'warehouse', 'record_date']\n)\ncomparison['stock_diff'] = comparison['closing_stock_scenario'] - comparison['closing_stock_actual']\n\nresult = comparison[comparison['product_id'] == 'P1'][\n    ['record_date', 'closing_stock_actual', 'closing_stock_scenario', 'stock_diff']\n].reset_index(drop=True)\n",
    sort_order: 26,
  },
];
