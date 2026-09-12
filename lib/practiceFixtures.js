// Local fallback copy of the question bank, mirroring backend/app/seed_data.py.
// Used only when the FastAPI practice API isn't reachable (e.g. it hasn't been
// deployed yet), so the practice UI still works standalone.

export const FIXTURE_QUESTIONS = [
  {
    id: 1,
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
  },
  {
    id: 2,
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
  },
  {
    id: 3,
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
  },
  {
    id: 4,
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
  },
];

function buildEventsSeed() {
  const rows = [];
  let eid = 1;
  for (const [productId, count] of [
    ["A", 5],
    ["B", 4],
    ["C", 3],
    ["D", 2],
    ["E", 1],
  ]) {
    for (let i = 0; i < count; i++) {
      rows.push([eid, 900 + eid, `2025-03-01 1${i}:00:00`, "view", "/product", productId, `s${eid}`, 0]);
      eid++;
    }
  }
  eid = 100;
  for (const [productId, count] of [
    ["X", 6],
    ["Y", 5],
    ["Z", 4],
    ["W", 1],
  ]) {
    for (let i = 0; i < count; i++) {
      rows.push([eid, 900 + eid, `2025-03-02 1${i}:00:00`, "view", "/product", productId, `s${eid}`, 0]);
      eid++;
    }
  }
  const values = rows
    .map(
      (r) =>
        `  (${r[0]}, ${r[1]}, '${r[2]}', '${r[3]}', '${r[4]}', '${r[5]}', '${r[6]}', ${r[7]})`
    )
    .join(",\n");
  return `INSERT INTO events (event_id, user_id, event_time, event_type, page, product_id, session_id, revenues_estimate) VALUES\n${values};`;
}

export function getFixtureQuestion(slug) {
  return FIXTURE_QUESTIONS.find((q) => q.slug === slug) || null;
}
