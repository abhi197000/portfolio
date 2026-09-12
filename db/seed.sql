-- Generated from scripts/seed-data.mjs — paste into the Supabase SQL Editor and run.

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('revenue-gap-best-vs-worst-item', 'Revenue Gap: Best vs. Worst Selling Item', 'sql', 'easy', '["aggregation","group by","cte"]'::jsonb, 'You''re the analyst on a retail client''s inventory team. Leadership wants a single number for the weekly readout: how far apart is the best performer from the worst?', 'Table `orders(order_id, user_id, order_date, item_id, category, quantity, price, discount_code)`.

Each row is one order line. Revenue for an item = SUM(quantity * price) across its order lines.

Write a query that returns a single column `revenue_gap`: the difference between the highest-revenue item and the lowest-revenue item.', 'CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  user_id INTEGER,
  order_date TEXT,
  item_id INTEGER,
  category TEXT,
  quantity INTEGER,
  price REAL,
  discount_code TEXT
);', 'INSERT INTO orders (order_id, user_id, order_date, item_id, category, quantity, price, discount_code) VALUES
  (1, 101, ''2025-01-05'', 1, ''Electronics'', 2, 50.0, NULL),
  (2, 102, ''2025-01-06'', 2, ''Electronics'', 1, 20.0, NULL),
  (3, 101, ''2025-01-07'', 1, ''Electronics'', 1, 50.0, NULL),
  (4, 103, ''2025-01-08'', 3, ''Home'', 5, 10.0, NULL),
  (5, 104, ''2025-01-09'', 2, ''Electronics'', 3, 20.0, NULL),
  (6, 105, ''2025-01-10'', 4, ''Home'', 1, 200.0, NULL);', NULL, '[{"revenue_gap":150}]'::jsonb, FALSE, '-- items with the same shape as `orders` are already loaded.
SELECT
', '["First aggregate to item-level revenue: SUM(quantity * price), GROUP BY item_id.","Wrap that aggregation in a CTE (WITH item_revenue AS (...)) so you can reduce it again.","The final SELECT is just MAX(revenue) - MIN(revenue) FROM item_revenue."]'::jsonb, 'WITH item_revenue AS (
    SELECT item_id, SUM(quantity * price) AS revenue
    FROM orders
    GROUP BY item_id
)
SELECT MAX(revenue) - MIN(revenue) AS revenue_gap
FROM item_revenue;', 1)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('qualifying-high-value-users', 'Qualifying High-Value Users', 'sql', 'medium', '["group by","having","aggregation"]'::jsonb, 'Marketing wants a shortlist for a loyalty pilot: repeat buyers who''ve already proven they''ll spend, so the pilot budget isn''t wasted on one-time shoppers.', 'Table `orders(order_id, user_id, order_date, item_id, category, quantity, price, discount_code)`.

Between 2025-02-01 and 2025-02-28 (inclusive), find users with at least 2 distinct orders AND total spending (SUM(quantity * price)) greater than $500.

Return `user_id, order_count, total_spend`, ordered by `user_id` ascending.', 'CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  user_id INTEGER,
  order_date TEXT,
  item_id INTEGER,
  category TEXT,
  quantity INTEGER,
  price REAL,
  discount_code TEXT
);', 'INSERT INTO orders (order_id, user_id, order_date, item_id, category, quantity, price, discount_code) VALUES
  (1, 201, ''2025-02-02'', 10, ''A'', 2, 100.0, NULL),
  (2, 201, ''2025-02-05'', 11, ''A'', 1, 150.0, NULL),
  (3, 201, ''2025-02-10'', 12, ''A'', 1, 200.0, NULL),
  (4, 202, ''2025-02-03'', 13, ''B'', 1, 100.0, NULL),
  (5, 202, ''2025-02-07'', 14, ''B'', 1, 50.0, NULL),
  (6, 203, ''2025-02-04'', 15, ''C'', 5, 300.0, NULL),
  (7, 204, ''2025-02-06'', 16, ''A'', 2, 150.0, NULL),
  (8, 204, ''2025-02-12'', 17, ''A'', 2, 150.0, NULL);', NULL, '[{"user_id":201,"order_count":3,"total_spend":550},{"user_id":204,"order_count":2,"total_spend":600}]'::jsonb, TRUE, 'SELECT
', '["Filter WHERE order_date BETWEEN ''2025-02-01'' AND ''2025-02-28'' before aggregating.","GROUP BY user_id, then use HAVING (not WHERE) to filter on the aggregates.","COUNT(DISTINCT order_id) >= 2 AND SUM(quantity * price) > 500."]'::jsonb, 'SELECT user_id,
       COUNT(DISTINCT order_id) AS order_count,
       SUM(quantity * price)    AS total_spend
FROM orders
WHERE order_date BETWEEN ''2025-02-01'' AND ''2025-02-28''
GROUP BY user_id
HAVING COUNT(DISTINCT order_id) >= 2
   AND SUM(quantity * price) > 500
ORDER BY user_id;', 2)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('top-3-viewed-products-per-day', 'Top 3 Most-Viewed Products Per Day', 'sql', 'medium', '["window functions","rank","partition by"]'::jsonb, 'The merchandising team refreshes homepage placements daily and wants to feature whatever''s trending — a fresh top-3-per-day feed, not a single all-time leaderboard.', 'Table `events(event_id, user_id, event_time, event_type, page, product_id, session_id, revenues_estimate)`.

Using only rows where `event_type = ''view''`, find the top 3 most-viewed `product_id`s for each calendar day.

Return `event_date, product_id, views`, ordered by `event_date` then `views` descending.', 'CREATE TABLE events (
  event_id INTEGER PRIMARY KEY,
  user_id INTEGER,
  event_time TEXT,
  event_type TEXT,
  page TEXT,
  product_id TEXT,
  session_id TEXT,
  revenues_estimate REAL
);', 'INSERT INTO events (event_id, user_id, event_time, event_type, page, product_id, session_id, revenues_estimate) VALUES
  (1, 901, ''2025-03-01 10:00:00'', ''view'', ''/product'', ''A'', ''s1'', 0),
  (2, 902, ''2025-03-01 11:00:00'', ''view'', ''/product'', ''A'', ''s2'', 0),
  (3, 903, ''2025-03-01 12:00:00'', ''view'', ''/product'', ''A'', ''s3'', 0),
  (4, 904, ''2025-03-01 13:00:00'', ''view'', ''/product'', ''A'', ''s4'', 0),
  (5, 905, ''2025-03-01 14:00:00'', ''view'', ''/product'', ''A'', ''s5'', 0),
  (6, 906, ''2025-03-01 10:00:00'', ''view'', ''/product'', ''B'', ''s6'', 0),
  (7, 907, ''2025-03-01 11:00:00'', ''view'', ''/product'', ''B'', ''s7'', 0),
  (8, 908, ''2025-03-01 12:00:00'', ''view'', ''/product'', ''B'', ''s8'', 0),
  (9, 909, ''2025-03-01 13:00:00'', ''view'', ''/product'', ''B'', ''s9'', 0),
  (10, 910, ''2025-03-01 10:00:00'', ''view'', ''/product'', ''C'', ''s10'', 0),
  (11, 911, ''2025-03-01 11:00:00'', ''view'', ''/product'', ''C'', ''s11'', 0),
  (12, 912, ''2025-03-01 12:00:00'', ''view'', ''/product'', ''C'', ''s12'', 0),
  (13, 913, ''2025-03-01 10:00:00'', ''view'', ''/product'', ''D'', ''s13'', 0),
  (14, 914, ''2025-03-01 11:00:00'', ''view'', ''/product'', ''D'', ''s14'', 0),
  (15, 915, ''2025-03-01 10:00:00'', ''view'', ''/product'', ''E'', ''s15'', 0),
  (100, 1000, ''2025-03-02 10:00:00'', ''view'', ''/product'', ''X'', ''s100'', 0),
  (101, 1001, ''2025-03-02 11:00:00'', ''view'', ''/product'', ''X'', ''s101'', 0),
  (102, 1002, ''2025-03-02 12:00:00'', ''view'', ''/product'', ''X'', ''s102'', 0),
  (103, 1003, ''2025-03-02 13:00:00'', ''view'', ''/product'', ''X'', ''s103'', 0),
  (104, 1004, ''2025-03-02 14:00:00'', ''view'', ''/product'', ''X'', ''s104'', 0),
  (105, 1005, ''2025-03-02 15:00:00'', ''view'', ''/product'', ''X'', ''s105'', 0),
  (106, 1006, ''2025-03-02 10:00:00'', ''view'', ''/product'', ''Y'', ''s106'', 0),
  (107, 1007, ''2025-03-02 11:00:00'', ''view'', ''/product'', ''Y'', ''s107'', 0),
  (108, 1008, ''2025-03-02 12:00:00'', ''view'', ''/product'', ''Y'', ''s108'', 0),
  (109, 1009, ''2025-03-02 13:00:00'', ''view'', ''/product'', ''Y'', ''s109'', 0),
  (110, 1010, ''2025-03-02 14:00:00'', ''view'', ''/product'', ''Y'', ''s110'', 0),
  (111, 1011, ''2025-03-02 10:00:00'', ''view'', ''/product'', ''Z'', ''s111'', 0),
  (112, 1012, ''2025-03-02 11:00:00'', ''view'', ''/product'', ''Z'', ''s112'', 0),
  (113, 1013, ''2025-03-02 12:00:00'', ''view'', ''/product'', ''Z'', ''s113'', 0),
  (114, 1014, ''2025-03-02 13:00:00'', ''view'', ''/product'', ''Z'', ''s114'', 0),
  (115, 1015, ''2025-03-02 10:00:00'', ''view'', ''/product'', ''W'', ''s115'', 0);', NULL, '[{"event_date":"2025-03-01","product_id":"A","views":5},{"event_date":"2025-03-01","product_id":"B","views":4},{"event_date":"2025-03-01","product_id":"C","views":3},{"event_date":"2025-03-02","product_id":"X","views":6},{"event_date":"2025-03-02","product_id":"Y","views":5},{"event_date":"2025-03-02","product_id":"Z","views":4}]'::jsonb, TRUE, 'WITH daily_views AS (
  SELECT DATE(event_time) AS event_date, product_id, COUNT(*) AS views
  FROM events
  WHERE event_type = ''view''
  GROUP BY DATE(event_time), product_id
)
SELECT
', '["First aggregate to (day, product_id) view counts — DATE(event_time), product_id, COUNT(*).","Then rank within each day: RANK() OVER (PARTITION BY event_date ORDER BY views DESC).","Filter the ranked result to rnk <= 3."]'::jsonb, 'WITH daily_views AS (
    SELECT DATE(event_time) AS event_date, product_id, COUNT(*) AS views
    FROM events
    WHERE event_type = ''view''
    GROUP BY DATE(event_time), product_id
),
ranked AS (
    SELECT *, RANK() OVER (PARTITION BY event_date ORDER BY views DESC) AS rnk
    FROM daily_views
)
SELECT event_date, product_id, views
FROM ranked
WHERE rnk <= 3
ORDER BY event_date, views DESC;', 3)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('price-bucket-revenue-distribution', 'Price-Bucket Revenue Distribution', 'python', 'easy', '["pandas","groupby","merge"]'::jsonb, 'Finance wants to know whether revenue is concentrated in premium items or spread across the budget catalog, ahead of a pricing strategy review.', 'You have two pandas DataFrames already loaded: `items(item_id, price)` and `orders(item_id, quantity, price)`.

Bucket each item by its `price` into low (<50), medium (50-100), high (>100).

Build a DataFrame named `result` with columns `price_bucket, revenue, pct_of_total`, where `revenue = SUM(quantity * price)` per bucket (using the order''s own price, not the item''s) and `pct_of_total` is that bucket''s share of total revenue as a percentage rounded to 2 decimal places.', NULL, NULL, '{"items":[{"item_id":1,"price":30},{"item_id":2,"price":60},{"item_id":3,"price":150},{"item_id":4,"price":45}],"orders":[{"item_id":1,"quantity":2,"price":30},{"item_id":2,"quantity":1,"price":60},{"item_id":3,"quantity":1,"price":150},{"item_id":4,"quantity":3,"price":45}]}'::jsonb, '[{"price_bucket":"high","revenue":150,"pct_of_total":37.04},{"price_bucket":"low","revenue":195,"pct_of_total":48.15},{"price_bucket":"medium","revenue":60,"pct_of_total":14.81}]'::jsonb, FALSE, 'def bucket_price(p):
    if p < 50:
        return ''low''
    elif p <= 100:
        return ''medium''
    return ''high''

# your code here
result = None
', '["items[''price_bucket''] = items[''price''].apply(bucket_price)","Merge orders with items[[''item_id'', ''price_bucket'']] on item_id to tag every order line.","Revenue per line is quantity * price (the order''s own price column, post-merge).","result[''pct_of_total''] = (result[''revenue''] / result[''revenue''].sum() * 100).round(2)"]'::jsonb, 'def bucket_price(p):
    if p < 50:
        return ''low''
    elif p <= 100:
        return ''medium''
    return ''high''

items[''price_bucket''] = items[''price''].apply(bucket_price)

merged = orders.merge(items[[''item_id'', ''price_bucket'']], on=''item_id'')
merged[''revenue''] = merged[''quantity''] * merged[''price'']

result = merged.groupby(''price_bucket'')[''revenue''].sum().reset_index()
result[''pct_of_total''] = (result[''revenue''] / result[''revenue''].sum() * 100).round(2)
', 4)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('net-revenue-before-after-discount', 'Net Revenue Before vs. After Discount', 'sql', 'medium', '["left join","coalesce","aggregation"]'::jsonb, 'Finance is reconciling how much of gross revenue promotions are actually eating into, category by category, ahead of next quarter''s discount budget.', 'Tables `orders(order_id, category, quantity, price, discount_code)` and `discount_map(discount_code, discount_pct)`.

Not every order has a discount code. For each category, compute `revenue_before` (gross = quantity * price), `revenue_after` (net, after applying the discount pct where one applies), and `diff` (before - after). Order by `diff` descending.', 'CREATE TABLE orders (order_id INTEGER PRIMARY KEY, category TEXT, quantity INTEGER, price REAL, discount_code TEXT);
CREATE TABLE discount_map (discount_code TEXT PRIMARY KEY, discount_pct REAL);', 'INSERT INTO discount_map (discount_code, discount_pct) VALUES (''SAVE10'', 10), (''SAVE20'', 20);
INSERT INTO orders (order_id, category, quantity, price, discount_code) VALUES
  (1, ''Electronics'', 2, 100, ''SAVE10''),
  (2, ''Electronics'', 1, 50, NULL),
  (3, ''Home'', 3, 30, ''SAVE20''),
  (4, ''Home'', 2, 40, NULL),
  (5, ''Electronics'', 1, 200, ''SAVE10'');', NULL, '[{"category":"Electronics","revenue_before":450,"revenue_after":410,"diff":40},{"category":"Home","revenue_before":170,"revenue_after":152,"diff":18}]'::jsonb, TRUE, 'WITH order_rev AS (
  SELECT o.category,
         o.quantity * o.price AS gross_revenue,
         o.quantity * o.price * (1 - COALESCE(d.discount_pct, 0) / 100.0) AS net_revenue
  FROM orders o
  LEFT JOIN discount_map d ON o.discount_code = d.discount_code
)
SELECT
', '["LEFT JOIN orders to discount_map — some orders have no discount_code, so an INNER JOIN would silently drop them.","COALESCE the joined discount_pct to 0 for orders with no discount.","gross_revenue = quantity * price; net_revenue = gross_revenue * (1 - discount_pct/100). Aggregate both to category level, then diff = SUM(gross) - SUM(net)."]'::jsonb, 'WITH order_rev AS (
    SELECT o.category,
           o.quantity * o.price AS gross_revenue,
           o.quantity * o.price * (1 - COALESCE(d.discount_pct, 0) / 100.0) AS net_revenue
    FROM orders o
    LEFT JOIN discount_map d ON o.discount_code = d.discount_code
)
SELECT category,
       SUM(gross_revenue) AS revenue_before,
       SUM(net_revenue) AS revenue_after,
       SUM(gross_revenue) - SUM(net_revenue) AS diff
FROM order_rev
GROUP BY category
ORDER BY diff DESC;', 5)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('net-revenue-before-after-discount-pandas', 'Net Revenue Before vs. After Discount', 'python', 'medium', '["pandas","merge","groupby"]'::jsonb, 'Finance is reconciling how much of gross revenue promotions are actually eating into, category by category, ahead of next quarter''s discount budget.', 'DataFrames `orders(order_id, category, quantity, price, discount_code)` and `discount_map(discount_code, discount_pct)`.

Not every order has a discount code. Build `result` with columns `category, revenue_before, revenue_after, diff`, sorted by `diff` descending.', NULL, NULL, '{"discount_map":[{"discount_code":"SAVE10","discount_pct":10},{"discount_code":"SAVE20","discount_pct":20}],"orders":[{"order_id":1,"category":"Electronics","quantity":2,"price":100,"discount_code":"SAVE10"},{"order_id":2,"category":"Electronics","quantity":1,"price":50,"discount_code":null},{"order_id":3,"category":"Home","quantity":3,"price":30,"discount_code":"SAVE20"},{"order_id":4,"category":"Home","quantity":2,"price":40,"discount_code":null},{"order_id":5,"category":"Electronics","quantity":1,"price":200,"discount_code":"SAVE10"}]}'::jsonb, '[{"category":"Electronics","revenue_before":450,"revenue_after":410,"diff":40},{"category":"Home","revenue_before":170,"revenue_after":152,"diff":18}]'::jsonb, TRUE, 'orders_m = orders.merge(discount_map, on=''discount_code'', how=''left'')
orders_m[''discount_pct''] = orders_m[''discount_pct''].fillna(0)

# your code here
result = None
', '["merge(..., how=''left'') — an inner merge would drop orders with no discount_code.","fillna(0) the joined discount_pct for undiscounted orders.","gross_revenue = quantity * price; net_revenue = gross_revenue * (1 - discount_pct/100). groupby(''category'').agg(...) both, then diff, then sort_values(''diff'', ascending=False)."]'::jsonb, 'orders_m = orders.merge(discount_map, on=''discount_code'', how=''left'')
orders_m[''discount_pct''] = orders_m[''discount_pct''].fillna(0)

orders_m[''gross_revenue''] = orders_m[''quantity''] * orders_m[''price'']
orders_m[''net_revenue''] = orders_m[''gross_revenue''] * (1 - orders_m[''discount_pct''] / 100)

result = orders_m.groupby(''category'').agg(
    revenue_before=(''gross_revenue'', ''sum''),
    revenue_after=(''net_revenue'', ''sum'')
).reset_index()
result[''diff''] = result[''revenue_before''] - result[''revenue_after'']
result = result.sort_values(''diff'', ascending=False).reset_index(drop=True)
', 6)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('rolling-7-day-revenue-with-gaps', 'Rolling 7-Day Revenue (With Gaps)', 'sql', 'medium', '["window functions","gaps","recursive cte"]'::jsonb, 'The exec dashboard shows a 7-day trailing revenue trend, but a few days had zero orders — and a naive rolling window silently skips them instead of counting them as zero, throwing off the trend line.', 'Table `orders(order_id, customer_id, order_date, amount)`. Some calendar dates between the min and max order date have **no rows at all**.

Fill in every missing date with 0 revenue, then compute a 7-day trailing rolling sum (current day + 6 prior days). Return `order_date, amount, rolling_7d` ordered by date.', 'CREATE TABLE orders (order_id INTEGER PRIMARY KEY, customer_id INTEGER, order_date TEXT, amount REAL);', 'INSERT INTO orders (order_id, customer_id, order_date, amount) VALUES
  (1, 301, ''2025-04-01'', 100),
  (2, 301, ''2025-04-02'', 50),
  (3, 301, ''2025-04-04'', 80),
  (4, 301, ''2025-04-05'', 20),
  (5, 301, ''2025-04-06'', 60),
  (6, 301, ''2025-04-08'', 90),
  (7, 301, ''2025-04-09'', 40),
  (8, 301, ''2025-04-10'', 30);', NULL, '[{"order_date":"2025-04-01","amount":100,"rolling_7d":100},{"order_date":"2025-04-02","amount":50,"rolling_7d":150},{"order_date":"2025-04-03","amount":0,"rolling_7d":150},{"order_date":"2025-04-04","amount":80,"rolling_7d":230},{"order_date":"2025-04-05","amount":20,"rolling_7d":250},{"order_date":"2025-04-06","amount":60,"rolling_7d":310},{"order_date":"2025-04-07","amount":0,"rolling_7d":310},{"order_date":"2025-04-08","amount":90,"rolling_7d":300},{"order_date":"2025-04-09","amount":40,"rolling_7d":290},{"order_date":"2025-04-10","amount":30,"rolling_7d":320}]'::jsonb, TRUE, 'WITH RECURSIVE calendar(d) AS (
  SELECT MIN(order_date) FROM orders
  UNION ALL
  SELECT date(d, ''+1 day'') FROM calendar WHERE d < (SELECT MAX(order_date) FROM orders)
),
daily AS (
  SELECT c.d AS order_date, COALESCE(SUM(o.amount), 0) AS amount
  FROM calendar c
  LEFT JOIN orders o ON o.order_date = c.d
  GROUP BY c.d
)
SELECT
', '["Build a full calendar of dates with a recursive CTE from MIN(order_date) to MAX(order_date).","LEFT JOIN the calendar to orders (grouped by date) and COALESCE missing amounts to 0 — this is what fills the gaps.","ROWS BETWEEN 6 PRECEDING AND CURRENT ROW gives a 7-row (7-day) trailing window."]'::jsonb, 'WITH RECURSIVE calendar(d) AS (
    SELECT MIN(order_date) FROM orders
    UNION ALL
    SELECT date(d, ''+1 day'') FROM calendar WHERE d < (SELECT MAX(order_date) FROM orders)
),
daily AS (
    SELECT c.d AS order_date, COALESCE(SUM(o.amount), 0) AS amount
    FROM calendar c
    LEFT JOIN orders o ON o.order_date = c.d
    GROUP BY c.d
)
SELECT
    order_date,
    amount,
    SUM(amount) OVER (
        ORDER BY order_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS rolling_7d
FROM daily
ORDER BY order_date;', 7)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('rolling-7-day-revenue-with-gaps-pandas', 'Rolling 7-Day Revenue (With Gaps)', 'python', 'medium', '["pandas","resample","rolling"]'::jsonb, 'The exec dashboard shows a 7-day trailing revenue trend, but a few days had zero orders — and a naive rolling window silently skips them instead of counting them as zero, throwing off the trend line.', 'DataFrame `orders(order_id, customer_id, order_date, amount)`. Some calendar dates between the min and max order date have **no rows at all**.

Fill in every missing date with 0 revenue, then compute a 7-day trailing rolling sum (current day + up to 6 prior days). Build `result` with columns `order_date, amount, rolling_7d` (order_date as a plain ''YYYY-MM-DD'' string), sorted by date.', NULL, NULL, '{"orders":[{"order_id":1,"customer_id":301,"order_date":"2025-04-01","amount":100},{"order_id":2,"customer_id":301,"order_date":"2025-04-02","amount":50},{"order_id":3,"customer_id":301,"order_date":"2025-04-04","amount":80},{"order_id":4,"customer_id":301,"order_date":"2025-04-05","amount":20},{"order_id":5,"customer_id":301,"order_date":"2025-04-06","amount":60},{"order_id":6,"customer_id":301,"order_date":"2025-04-08","amount":90},{"order_id":7,"customer_id":301,"order_date":"2025-04-09","amount":40},{"order_id":8,"customer_id":301,"order_date":"2025-04-10","amount":30}]}'::jsonb, '[{"order_date":"2025-04-01","amount":100,"rolling_7d":100},{"order_date":"2025-04-02","amount":50,"rolling_7d":150},{"order_date":"2025-04-03","amount":0,"rolling_7d":150},{"order_date":"2025-04-04","amount":80,"rolling_7d":230},{"order_date":"2025-04-05","amount":20,"rolling_7d":250},{"order_date":"2025-04-06","amount":60,"rolling_7d":310},{"order_date":"2025-04-07","amount":0,"rolling_7d":310},{"order_date":"2025-04-08","amount":90,"rolling_7d":300},{"order_date":"2025-04-09","amount":40,"rolling_7d":290},{"order_date":"2025-04-10","amount":30,"rolling_7d":320}]'::jsonb, TRUE, 'daily = orders.groupby(''order_date'')[''amount''].sum().reset_index()
daily[''order_date''] = pd.to_datetime(daily[''order_date''])

# your code here: reindex over the full date range, fill_value=0, then rolling(7).sum()
result = None
', '["pd.date_range(daily[''order_date''].min(), daily[''order_date''].max(), freq=''D'') gives the full calendar.","daily.set_index(''order_date'').reindex(full_range, fill_value=0) fills the gap days with 0.",".rolling(7, min_periods=1).sum() — don''t forget to format order_date back to a plain string with .dt.strftime(''%Y-%m-%d'') before assigning to result."]'::jsonb, 'daily = orders.groupby(''order_date'')[''amount''].sum().reset_index()
daily[''order_date''] = pd.to_datetime(daily[''order_date''])

full_range = pd.date_range(daily[''order_date''].min(), daily[''order_date''].max(), freq=''D'')
daily = (daily.set_index(''order_date'')
              .reindex(full_range, fill_value=0)
              .rename_axis(''order_date'')
              .reset_index())

daily[''rolling_7d''] = daily[''amount''].rolling(7, min_periods=1).sum()
daily[''order_date''] = daily[''order_date''].dt.strftime(''%Y-%m-%d'')
result = daily
', 8)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('moving-average-deviation-days', 'Spike & Drop Days vs. 7-Day Moving Average', 'sql', 'hard', '["window functions","moving average","anomaly detection"]'::jsonb, 'Ops wants an automated anomaly flag for the daily revenue report — any day that swings more than 50% away from its own recent trend, so a human only has to look at the days that actually matter.', 'Table `orders_net(category, order_date, net_revenue)` (net revenue is already computed per line).

For each category, count the number of days **in May 2025** where daily net revenue deviates by more than ±50% from its own trailing 7-day moving average (the average of the 7 days *before* it, excluding the day itself).', 'CREATE TABLE orders_net (category TEXT, order_date TEXT, net_revenue REAL);', 'INSERT INTO orders_net (category, order_date, net_revenue) VALUES
  (''A'', ''2025-04-24'', 100),
  (''A'', ''2025-04-25'', 100),
  (''A'', ''2025-04-26'', 100),
  (''A'', ''2025-04-27'', 100),
  (''A'', ''2025-04-28'', 100),
  (''A'', ''2025-04-29'', 100),
  (''A'', ''2025-04-30'', 100),
  (''A'', ''2025-05-01'', 100),
  (''A'', ''2025-05-02'', 260),
  (''A'', ''2025-05-03'', 100),
  (''A'', ''2025-05-04'', 100),
  (''A'', ''2025-05-05'', 100),
  (''A'', ''2025-05-06'', 100),
  (''A'', ''2025-05-07'', 100),
  (''A'', ''2025-05-08'', 100),
  (''A'', ''2025-05-09'', 30),
  (''A'', ''2025-05-10'', 100);', NULL, '[{"category":"A","spike_or_drop_days":2}]'::jsonb, FALSE, 'WITH daily_cat AS (
  SELECT category, order_date, SUM(net_revenue) AS daily_revenue
  FROM orders_net
  GROUP BY category, order_date
),
with_ma AS (
  SELECT *,
         AVG(daily_revenue) OVER (
             PARTITION BY category
             ORDER BY order_date
             ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING
         ) AS moving_avg_7d
  FROM daily_cat
)
SELECT
', '["ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING gives a 7-day window that stops right before the current row — that''s what excludes today from its own average.","Early days in the dataset won''t have a full 7-day history yet — moving_avg_7d IS NOT NULL filters those out.","Filter to May 2025 dates, then WHERE ABS(daily_revenue - moving_avg_7d) > 0.5 * moving_avg_7d, GROUP BY category, COUNT(*)."]'::jsonb, 'WITH daily_cat AS (
    SELECT category, order_date, SUM(net_revenue) AS daily_revenue
    FROM orders_net
    GROUP BY category, order_date
),
with_ma AS (
    SELECT *,
           AVG(daily_revenue) OVER (
               PARTITION BY category
               ORDER BY order_date
               ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING
           ) AS moving_avg_7d
    FROM daily_cat
)
SELECT category, COUNT(*) AS spike_or_drop_days
FROM with_ma
WHERE order_date BETWEEN ''2025-05-01'' AND ''2025-05-31''
  AND moving_avg_7d IS NOT NULL
  AND ABS(daily_revenue - moving_avg_7d) > 0.5 * moving_avg_7d
GROUP BY category;', 9)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('moving-average-deviation-days-pandas', 'Spike & Drop Days vs. 7-Day Moving Average', 'python', 'hard', '["pandas","shift","rolling"]'::jsonb, 'Ops wants an automated anomaly flag for the daily revenue report — any day that swings more than 50% away from its own recent trend, so a human only has to look at the days that actually matter.', 'DataFrame `orders_net(category, order_date, net_revenue)` (net revenue is already computed per line; order_date is a plain ''YYYY-MM-DD'' string).

For each category, count the number of days **in May 2025** where daily net revenue deviates by more than ±50% from its own trailing 7-day moving average (the average of the 7 days *before* it, excluding the day itself). Build `result` with columns `category, spike_or_drop_days`.', NULL, NULL, '{"orders_net":[{"category":"A","order_date":"2025-04-24","net_revenue":100},{"category":"A","order_date":"2025-04-25","net_revenue":100},{"category":"A","order_date":"2025-04-26","net_revenue":100},{"category":"A","order_date":"2025-04-27","net_revenue":100},{"category":"A","order_date":"2025-04-28","net_revenue":100},{"category":"A","order_date":"2025-04-29","net_revenue":100},{"category":"A","order_date":"2025-04-30","net_revenue":100},{"category":"A","order_date":"2025-05-01","net_revenue":100},{"category":"A","order_date":"2025-05-02","net_revenue":260},{"category":"A","order_date":"2025-05-03","net_revenue":100},{"category":"A","order_date":"2025-05-04","net_revenue":100},{"category":"A","order_date":"2025-05-05","net_revenue":100},{"category":"A","order_date":"2025-05-06","net_revenue":100},{"category":"A","order_date":"2025-05-07","net_revenue":100},{"category":"A","order_date":"2025-05-08","net_revenue":100},{"category":"A","order_date":"2025-05-09","net_revenue":30},{"category":"A","order_date":"2025-05-10","net_revenue":100}]}'::jsonb, '[{"category":"A","spike_or_drop_days":2}]'::jsonb, FALSE, 'daily_cat = orders_net.groupby([''category'', ''order_date''])[''net_revenue''].sum().reset_index()
daily_cat = daily_cat.sort_values([''category'', ''order_date''])

# your code here
result = None
', '["s.shift(1).rolling(7).mean() — shift FIRST, then roll, so today isn''t included in its own average.","order_date is already a plain string, so ''YYYY-MM-DD'' string comparisons for the May filter work fine — no need for pd.to_datetime here.","Filter to May 2025 + non-null moving average, flag where the deviation exceeds 50%, then groupby(''category'').size()."]'::jsonb, 'daily_cat = orders_net.groupby([''category'', ''order_date''])[''net_revenue''].sum().reset_index()
daily_cat = daily_cat.sort_values([''category'', ''order_date''])

daily_cat[''moving_avg_7d''] = (
    daily_cat.groupby(''category'')[''net_revenue'']
             .transform(lambda s: s.shift(1).rolling(7).mean())
)

may = daily_cat[(daily_cat[''order_date''] >= ''2025-05-01'') & (daily_cat[''order_date''] <= ''2025-05-31'')]

flagged = may[
    may[''moving_avg_7d''].notna() &
    ((may[''net_revenue''] - may[''moving_avg_7d'']).abs() > 0.5 * may[''moving_avg_7d''])
]

result = flagged.groupby(''category'').size().reset_index(name=''spike_or_drop_days'')
', 10)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('consecutive-order-day-streaks', 'Consecutive Order-Day Streaks', 'sql', 'medium', '["gaps and islands","window functions"]'::jsonb, 'The retention team wants to reward users who order on back-to-back days — but first they need every unbroken streak identified, not just whether a streak ever happened.', 'Table `orders(order_id, user_id, order_date)`.

For each user, find every unbroken streak of consecutive order-days. Return `user_id, streak_start, streak_end, streak_length` for every streak, ordered by `user_id`, `streak_start`.', 'CREATE TABLE orders (order_id INTEGER PRIMARY KEY, user_id INTEGER, order_date TEXT);', 'INSERT INTO orders (order_id, user_id, order_date) VALUES
  (1, 401, ''2025-06-01''),
  (2, 401, ''2025-06-02''),
  (3, 401, ''2025-06-03''),
  (4, 401, ''2025-06-05''),
  (5, 402, ''2025-06-01''),
  (6, 402, ''2025-06-02''),
  (7, 402, ''2025-06-04'');', NULL, '[{"user_id":401,"streak_start":"2025-06-01","streak_end":"2025-06-03","streak_length":3},{"user_id":401,"streak_start":"2025-06-05","streak_end":"2025-06-05","streak_length":1},{"user_id":402,"streak_start":"2025-06-01","streak_end":"2025-06-02","streak_length":2},{"user_id":402,"streak_start":"2025-06-04","streak_end":"2025-06-04","streak_length":1}]'::jsonb, TRUE, 'WITH user_days AS (
  SELECT DISTINCT user_id, order_date FROM orders
),
grouped AS (
  SELECT
    user_id, order_date,
    date(order_date, ''-'' || (ROW_NUMBER() OVER (
        PARTITION BY user_id ORDER BY order_date
    )) || '' days'') AS grp
  FROM user_days
)
SELECT
', '["This is the classic gaps-and-islands trick: subtract a per-user row number (in days) from the date. Every row in an unbroken streak lands on the same anchor date.","date(order_date, ''-'' || ROW_NUMBER() || '' days'') computes that anchor for each row.","GROUP BY user_id, anchor — MIN/MAX(order_date) and COUNT(*) give you each streak''s bounds and length."]'::jsonb, 'WITH user_days AS (
    SELECT DISTINCT user_id, order_date FROM orders
),
grouped AS (
    SELECT
        user_id, order_date,
        date(order_date, ''-'' || (ROW_NUMBER() OVER (
            PARTITION BY user_id ORDER BY order_date
        )) || '' days'') AS grp
    FROM user_days
)
SELECT user_id, MIN(order_date) AS streak_start, MAX(order_date) AS streak_end,
       COUNT(*) AS streak_length
FROM grouped
GROUP BY user_id, grp
ORDER BY user_id, streak_start;', 11)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('consecutive-order-day-streaks-pandas', 'Consecutive Order-Day Streaks', 'python', 'medium', '["pandas","gaps and islands","cumcount"]'::jsonb, 'The retention team wants to reward users who order on back-to-back days — but first they need every unbroken streak identified, not just whether a streak ever happened.', 'DataFrame `orders(order_id, user_id, order_date)`.

For each user, find every unbroken streak of consecutive order-days. Build `result` with columns `user_id, streak_start, streak_end, streak_length` (dates as plain ''YYYY-MM-DD'' strings), for every streak, ordered by `user_id`, `streak_start`.', NULL, NULL, '{"orders":[{"order_id":1,"user_id":401,"order_date":"2025-06-01"},{"order_id":2,"user_id":401,"order_date":"2025-06-02"},{"order_id":3,"user_id":401,"order_date":"2025-06-03"},{"order_id":4,"user_id":401,"order_date":"2025-06-05"},{"order_id":5,"user_id":402,"order_date":"2025-06-01"},{"order_id":6,"user_id":402,"order_date":"2025-06-02"},{"order_id":7,"user_id":402,"order_date":"2025-06-04"}]}'::jsonb, '[{"user_id":401,"streak_start":"2025-06-01","streak_end":"2025-06-03","streak_length":3},{"user_id":401,"streak_start":"2025-06-05","streak_end":"2025-06-05","streak_length":1},{"user_id":402,"streak_start":"2025-06-01","streak_end":"2025-06-02","streak_length":2},{"user_id":402,"streak_start":"2025-06-04","streak_end":"2025-06-04","streak_length":1}]'::jsonb, TRUE, 'df = orders.drop_duplicates([''user_id'', ''order_date'']).copy()
df[''order_date''] = pd.to_datetime(df[''order_date''])
df = df.sort_values([''user_id'', ''order_date''])

# your code here
result = None
', '["df.groupby(''user_id'').cumcount() gives a per-user row number; grp = order_date - pd.to_timedelta(row_number, unit=''D'') is the gaps-and-islands anchor.","groupby([''user_id'', ''grp'']).agg(streak_start=(''order_date'',''min''), streak_end=(''order_date'',''max''), streak_length=(''order_date'',''count''))","Format streak_start/streak_end back to plain strings with .dt.strftime(''%Y-%m-%d'') before assigning to result."]'::jsonb, 'df = orders.drop_duplicates([''user_id'', ''order_date'']).copy()
df[''order_date''] = pd.to_datetime(df[''order_date''])
df = df.sort_values([''user_id'', ''order_date''])

df[''day_num''] = df.groupby(''user_id'').cumcount()
df[''grp''] = df[''order_date''] - pd.to_timedelta(df[''day_num''], unit=''D'')

streaks = (df.groupby([''user_id'', ''grp''])
             .agg(streak_start=(''order_date'', ''min''), streak_end=(''order_date'', ''max''), streak_length=(''order_date'', ''count''))
             .reset_index()
             .drop(columns=''grp'')
             .sort_values([''user_id'', ''streak_start'']))

streaks[''streak_start''] = streaks[''streak_start''].dt.strftime(''%Y-%m-%d'')
streaks[''streak_end''] = streaks[''streak_end''].dt.strftime(''%Y-%m-%d'')
result = streaks.reset_index(drop=True)
', 12)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('average-time-to-checkout', 'Average Time to Checkout', 'sql', 'medium', '["self join","date math"]'::jsonb, 'UX wants to know how long shoppers linger between first laying eyes on a product and actually checking out, to judge whether a faster checkout flow is worth building.', 'Table `events(event_id, user_id, event_time, event_type, session_id)`, `event_type` is `''view''` or `''checkout''`.

For each session, find the time (in seconds) between its first `view` and its first `checkout`. Return the single average across all sessions as `avg_seconds_to_checkout`.', 'CREATE TABLE events (event_id INTEGER PRIMARY KEY, user_id INTEGER, event_time TEXT, event_type TEXT, session_id TEXT);', 'INSERT INTO events (event_id, user_id, event_time, event_type, session_id) VALUES
  (1, 1, ''2025-07-01 10:00:00'', ''view'', ''s1''),
  (2, 1, ''2025-07-01 10:05:00'', ''checkout'', ''s1''),
  (3, 2, ''2025-07-01 11:00:00'', ''view'', ''s2''),
  (4, 2, ''2025-07-01 11:02:00'', ''checkout'', ''s2''),
  (5, 3, ''2025-07-01 12:00:00'', ''view'', ''s3''),
  (6, 3, ''2025-07-01 12:10:00'', ''checkout'', ''s3'');', NULL, '[{"avg_seconds_to_checkout":340}]'::jsonb, FALSE, 'WITH first_view AS (
  SELECT user_id, session_id, MIN(event_time) AS first_view_time
  FROM events WHERE event_type = ''view'' GROUP BY user_id, session_id
),
checkout AS (
  SELECT user_id, session_id, MIN(event_time) AS checkout_time
  FROM events WHERE event_type = ''checkout'' GROUP BY user_id, session_id
)
SELECT
', '["Get each session''s first view time and first checkout time separately (two grouped CTEs), then join them on user_id + session_id.","julianday(checkout_time) - julianday(first_view_time) gives a difference in days — multiply by 24*60*60 to get seconds.","AVG() the per-session seconds across the join."]'::jsonb, 'WITH first_view AS (
    SELECT user_id, session_id, MIN(event_time) AS first_view_time
    FROM events WHERE event_type=''view'' GROUP BY user_id, session_id
),
checkout AS (
    SELECT user_id, session_id, MIN(event_time) AS checkout_time
    FROM events WHERE event_type=''checkout'' GROUP BY user_id, session_id
)
SELECT AVG( (julianday(c.checkout_time)-julianday(f.first_view_time))*24*60*60 ) AS avg_seconds_to_checkout
FROM first_view f JOIN checkout c ON f.user_id=c.user_id AND f.session_id=c.session_id;', 13)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('average-time-to-checkout-pandas', 'Average Time to Checkout', 'python', 'medium', '["pandas","merge","timedelta"]'::jsonb, 'UX wants to know how long shoppers linger between first laying eyes on a product and actually checking out, to judge whether a faster checkout flow is worth building.', 'DataFrame `events(event_id, user_id, event_time, event_type, session_id)`, `event_type` is `''view''` or `''checkout''`.

For each session, find the time (in seconds) between its first `view` and its first `checkout`. Build `result` as a one-row DataFrame with column `avg_seconds_to_checkout`.', NULL, NULL, '{"events":[{"event_id":1,"user_id":1,"event_time":"2025-07-01 10:00:00","event_type":"view","session_id":"s1"},{"event_id":2,"user_id":1,"event_time":"2025-07-01 10:05:00","event_type":"checkout","session_id":"s1"},{"event_id":3,"user_id":2,"event_time":"2025-07-01 11:00:00","event_type":"view","session_id":"s2"},{"event_id":4,"user_id":2,"event_time":"2025-07-01 11:02:00","event_type":"checkout","session_id":"s2"},{"event_id":5,"user_id":3,"event_time":"2025-07-01 12:00:00","event_type":"view","session_id":"s3"},{"event_id":6,"user_id":3,"event_time":"2025-07-01 12:10:00","event_type":"checkout","session_id":"s3"}]}'::jsonb, '[{"avg_seconds_to_checkout":340}]'::jsonb, FALSE, 'events[''event_time''] = pd.to_datetime(events[''event_time''])

# your code here
result = None
', '["Group view rows and checkout rows separately by (user_id, session_id), taking the min event_time in each.","merge the two on (user_id, session_id), then (checkout_time - first_view_time).dt.total_seconds().","result = pd.DataFrame({''avg_seconds_to_checkout'': [the_mean]})"]'::jsonb, 'events[''event_time''] = pd.to_datetime(events[''event_time''])

first_view = (events[events[''event_type'']==''view'']
              .groupby([''user_id'',''session_id''])[''event_time''].min()
              .reset_index(name=''first_view_time''))
checkout = (events[events[''event_type'']==''checkout'']
            .groupby([''user_id'',''session_id''])[''event_time''].min()
            .reset_index(name=''checkout_time''))

merged = first_view.merge(checkout, on=[''user_id'',''session_id''])
merged[''time_to_checkout_sec''] = (merged[''checkout_time''] - merged[''first_view_time'']).dt.total_seconds()

result = pd.DataFrame({''avg_seconds_to_checkout'': [merged[''time_to_checkout_sec''].mean()]})
', 14)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('session-conversion-rate', 'Session Conversion Rate', 'sql', 'easy', '["conditional aggregation","distinct count"]'::jsonb, 'Growth wants one headline number for the weekly review: what fraction of visits actually convert.', 'Table `events(event_id, event_type, session_id)`.

Define a converted session as one containing at least one `''checkout''` event. Return `session_conversion_rate`: the fraction of all distinct sessions that converted.', 'CREATE TABLE events (event_id INTEGER PRIMARY KEY, event_type TEXT, session_id TEXT);', 'INSERT INTO events (event_id, event_type, session_id) VALUES
  (1, ''view'', ''s1''),
  (2, ''checkout'', ''s1''),
  (3, ''view'', ''s2''),
  (4, ''checkout'', ''s2''),
  (5, ''view'', ''s3''),
  (6, ''view'', ''s4''),
  (7, ''checkout'', ''s4''),
  (8, ''view'', ''s5'');', NULL, '[{"session_conversion_rate":0.6}]'::jsonb, FALSE, 'SELECT
', '["COUNT(DISTINCT session_id) gives total sessions.","A CASE expression inside COUNT(DISTINCT ...) lets you count only the sessions that had a checkout event.","Divide the two, using 1.0 * or a float column so it doesn''t do integer division."]'::jsonb, 'SELECT COUNT(DISTINCT CASE WHEN event_type=''checkout'' THEN session_id END) * 1.0
       / COUNT(DISTINCT session_id) AS session_conversion_rate
FROM events;', 15)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('session-conversion-rate-pandas', 'Session Conversion Rate', 'python', 'easy', '["pandas","nunique"]'::jsonb, 'Growth wants one headline number for the weekly review: what fraction of visits actually convert.', 'DataFrame `events(event_id, event_type, session_id)`.

Define a converted session as one containing at least one `''checkout''` event. Build `result` as a one-row DataFrame with column `session_conversion_rate`.', NULL, NULL, '{"events":[{"event_id":1,"event_type":"view","session_id":"s1"},{"event_id":2,"event_type":"checkout","session_id":"s1"},{"event_id":3,"event_type":"view","session_id":"s2"},{"event_id":4,"event_type":"checkout","session_id":"s2"},{"event_id":5,"event_type":"view","session_id":"s3"},{"event_id":6,"event_type":"view","session_id":"s4"},{"event_id":7,"event_type":"checkout","session_id":"s4"},{"event_id":8,"event_type":"view","session_id":"s5"}]}'::jsonb, '[{"session_conversion_rate":0.6}]'::jsonb, FALSE, '# your code here
result = None
', '["events[''session_id''].nunique() gives total sessions.","Filter to event_type == ''checkout'' first, then .nunique() on session_id for the converted count.","result = pd.DataFrame({''session_conversion_rate'': [converted / total]})"]'::jsonb, 'total_sessions = events[''session_id''].nunique()
converted_sessions = events.loc[events[''event_type'']==''checkout'', ''session_id''].nunique()
result = pd.DataFrame({''session_conversion_rate'': [converted_sessions / total_sessions]})
', 16)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('search-to-view-dropoff-days', 'Days Where Search-to-View Drop-off Exceeds 40%', 'sql', 'hard', '["pivot","funnel analysis"]'::jsonb, 'The search team suspects a recent results-page change is losing people between searching and actually viewing a product — they want the exact days it got bad enough to investigate.', 'Table `events(event_id, event_time, event_type, session_id)`, `event_type` is `''search''` or `''view''`.

For each day, drop-off % = (distinct searching sessions - distinct viewing sessions) / distinct searching sessions * 100. Return every day where that exceeds 40%, with `event_date, searches, views, drop_off_pct`.', 'CREATE TABLE events (
  event_id INTEGER PRIMARY KEY,
  event_time TEXT,
  event_type TEXT,
  session_id TEXT
);', 'INSERT INTO events (event_id, event_time, event_type, session_id) VALUES
  (1, ''2025-08-01 09:00:00'', ''search'', ''a0''),
  (2, ''2025-08-01 09:00:00'', ''search'', ''a1''),
  (3, ''2025-08-01 09:00:00'', ''search'', ''a2''),
  (4, ''2025-08-01 09:00:00'', ''search'', ''a3''),
  (5, ''2025-08-01 09:00:00'', ''search'', ''a4''),
  (6, ''2025-08-01 09:00:00'', ''search'', ''a5''),
  (7, ''2025-08-01 09:00:00'', ''search'', ''a6''),
  (8, ''2025-08-01 09:00:00'', ''search'', ''a7''),
  (9, ''2025-08-01 09:00:00'', ''search'', ''a8''),
  (10, ''2025-08-01 09:00:00'', ''search'', ''a9''),
  (11, ''2025-08-01 09:05:00'', ''view'', ''a0''),
  (12, ''2025-08-01 09:05:00'', ''view'', ''a1''),
  (13, ''2025-08-01 09:05:00'', ''view'', ''a2''),
  (14, ''2025-08-01 09:05:00'', ''view'', ''a3''),
  (15, ''2025-08-01 09:05:00'', ''view'', ''a4''),
  (16, ''2025-08-01 09:05:00'', ''view'', ''a5''),
  (17, ''2025-08-01 09:05:00'', ''view'', ''a6''),
  (18, ''2025-08-02 09:00:00'', ''search'', ''b0''),
  (19, ''2025-08-02 09:00:00'', ''search'', ''b1''),
  (20, ''2025-08-02 09:00:00'', ''search'', ''b2''),
  (21, ''2025-08-02 09:00:00'', ''search'', ''b3''),
  (22, ''2025-08-02 09:00:00'', ''search'', ''b4''),
  (23, ''2025-08-02 09:00:00'', ''search'', ''b5''),
  (24, ''2025-08-02 09:00:00'', ''search'', ''b6''),
  (25, ''2025-08-02 09:00:00'', ''search'', ''b7''),
  (26, ''2025-08-02 09:00:00'', ''search'', ''b8''),
  (27, ''2025-08-02 09:00:00'', ''search'', ''b9''),
  (28, ''2025-08-02 09:05:00'', ''view'', ''b0''),
  (29, ''2025-08-02 09:05:00'', ''view'', ''b1''),
  (30, ''2025-08-02 09:05:00'', ''view'', ''b2''),
  (31, ''2025-08-02 09:05:00'', ''view'', ''b3''),
  (32, ''2025-08-02 09:05:00'', ''view'', ''b4''),
  (33, ''2025-08-03 09:00:00'', ''search'', ''c0''),
  (34, ''2025-08-03 09:00:00'', ''search'', ''c1''),
  (35, ''2025-08-03 09:00:00'', ''search'', ''c2''),
  (36, ''2025-08-03 09:00:00'', ''search'', ''c3''),
  (37, ''2025-08-03 09:00:00'', ''search'', ''c4''),
  (38, ''2025-08-03 09:00:00'', ''search'', ''c5''),
  (39, ''2025-08-03 09:00:00'', ''search'', ''c6''),
  (40, ''2025-08-03 09:00:00'', ''search'', ''c7''),
  (41, ''2025-08-03 09:05:00'', ''view'', ''c0''),
  (42, ''2025-08-03 09:05:00'', ''view'', ''c1''),
  (43, ''2025-08-03 09:05:00'', ''view'', ''c2''),
  (44, ''2025-08-03 09:05:00'', ''view'', ''c3''),
  (45, ''2025-08-03 09:05:00'', ''view'', ''c4''),
  (46, ''2025-08-03 09:05:00'', ''view'', ''c5'');', NULL, '[{"event_date":"2025-08-02","searches":10,"views":5,"drop_off_pct":50}]'::jsonb, FALSE, 'WITH daily_search AS (
  SELECT DATE(event_time) AS event_date, COUNT(DISTINCT session_id) AS searches
  FROM events WHERE event_type = ''search''
  GROUP BY DATE(event_time)
),
daily_view AS (
  SELECT DATE(event_time) AS event_date, COUNT(DISTINCT session_id) AS views
  FROM events WHERE event_type = ''view''
  GROUP BY DATE(event_time)
)
SELECT
', '["Aggregate search sessions and view sessions per day separately, then LEFT JOIN them (a day could have searches but zero views).","COALESCE the joined views to 0 for days with no view events at all.","drop_off_pct = (searches - views) * 100.0 / searches, filtered to > 40."]'::jsonb, 'WITH daily_search AS (
    SELECT DATE(event_time) AS event_date, COUNT(DISTINCT session_id) AS searches
    FROM events WHERE event_type = ''search''
    GROUP BY DATE(event_time)
),
daily_view AS (
    SELECT DATE(event_time) AS event_date, COUNT(DISTINCT session_id) AS views
    FROM events WHERE event_type = ''view''
    GROUP BY DATE(event_time)
)
SELECT
    s.event_date, s.searches, COALESCE(v.views, 0) AS views,
    (s.searches - COALESCE(v.views, 0)) * 100.0 / s.searches AS drop_off_pct
FROM daily_search s
LEFT JOIN daily_view v ON s.event_date = v.event_date
WHERE (s.searches - COALESCE(v.views, 0)) * 100.0 / s.searches > 40;', 17)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('search-to-view-dropoff-days-pandas', 'Days Where Search-to-View Drop-off Exceeds 40%', 'python', 'hard', '["pandas","pivot_table"]'::jsonb, 'The search team suspects a recent results-page change is losing people between searching and actually viewing a product — they want the exact days it got bad enough to investigate.', 'DataFrame `events(event_id, event_time, event_type, session_id)`, `event_type` is `''search''` or `''view''`.

For each day, drop-off % = (distinct searching sessions - distinct viewing sessions) / distinct searching sessions * 100. Build `result` with every day where that exceeds 40%: columns `event_date, searches, views, drop_off_pct`.', NULL, NULL, '{"events":[{"event_id":1,"event_time":"2025-08-01 09:00:00","event_type":"search","session_id":"a0"},{"event_id":2,"event_time":"2025-08-01 09:00:00","event_type":"search","session_id":"a1"},{"event_id":3,"event_time":"2025-08-01 09:00:00","event_type":"search","session_id":"a2"},{"event_id":4,"event_time":"2025-08-01 09:00:00","event_type":"search","session_id":"a3"},{"event_id":5,"event_time":"2025-08-01 09:00:00","event_type":"search","session_id":"a4"},{"event_id":6,"event_time":"2025-08-01 09:00:00","event_type":"search","session_id":"a5"},{"event_id":7,"event_time":"2025-08-01 09:00:00","event_type":"search","session_id":"a6"},{"event_id":8,"event_time":"2025-08-01 09:00:00","event_type":"search","session_id":"a7"},{"event_id":9,"event_time":"2025-08-01 09:00:00","event_type":"search","session_id":"a8"},{"event_id":10,"event_time":"2025-08-01 09:00:00","event_type":"search","session_id":"a9"},{"event_id":11,"event_time":"2025-08-01 09:05:00","event_type":"view","session_id":"a0"},{"event_id":12,"event_time":"2025-08-01 09:05:00","event_type":"view","session_id":"a1"},{"event_id":13,"event_time":"2025-08-01 09:05:00","event_type":"view","session_id":"a2"},{"event_id":14,"event_time":"2025-08-01 09:05:00","event_type":"view","session_id":"a3"},{"event_id":15,"event_time":"2025-08-01 09:05:00","event_type":"view","session_id":"a4"},{"event_id":16,"event_time":"2025-08-01 09:05:00","event_type":"view","session_id":"a5"},{"event_id":17,"event_time":"2025-08-01 09:05:00","event_type":"view","session_id":"a6"},{"event_id":18,"event_time":"2025-08-02 09:00:00","event_type":"search","session_id":"b0"},{"event_id":19,"event_time":"2025-08-02 09:00:00","event_type":"search","session_id":"b1"},{"event_id":20,"event_time":"2025-08-02 09:00:00","event_type":"search","session_id":"b2"},{"event_id":21,"event_time":"2025-08-02 09:00:00","event_type":"search","session_id":"b3"},{"event_id":22,"event_time":"2025-08-02 09:00:00","event_type":"search","session_id":"b4"},{"event_id":23,"event_time":"2025-08-02 09:00:00","event_type":"search","session_id":"b5"},{"event_id":24,"event_time":"2025-08-02 09:00:00","event_type":"search","session_id":"b6"},{"event_id":25,"event_time":"2025-08-02 09:00:00","event_type":"search","session_id":"b7"},{"event_id":26,"event_time":"2025-08-02 09:00:00","event_type":"search","session_id":"b8"},{"event_id":27,"event_time":"2025-08-02 09:00:00","event_type":"search","session_id":"b9"},{"event_id":28,"event_time":"2025-08-02 09:05:00","event_type":"view","session_id":"b0"},{"event_id":29,"event_time":"2025-08-02 09:05:00","event_type":"view","session_id":"b1"},{"event_id":30,"event_time":"2025-08-02 09:05:00","event_type":"view","session_id":"b2"},{"event_id":31,"event_time":"2025-08-02 09:05:00","event_type":"view","session_id":"b3"},{"event_id":32,"event_time":"2025-08-02 09:05:00","event_type":"view","session_id":"b4"},{"event_id":33,"event_time":"2025-08-03 09:00:00","event_type":"search","session_id":"c0"},{"event_id":34,"event_time":"2025-08-03 09:00:00","event_type":"search","session_id":"c1"},{"event_id":35,"event_time":"2025-08-03 09:00:00","event_type":"search","session_id":"c2"},{"event_id":36,"event_time":"2025-08-03 09:00:00","event_type":"search","session_id":"c3"},{"event_id":37,"event_time":"2025-08-03 09:00:00","event_type":"search","session_id":"c4"},{"event_id":38,"event_time":"2025-08-03 09:00:00","event_type":"search","session_id":"c5"},{"event_id":39,"event_time":"2025-08-03 09:00:00","event_type":"search","session_id":"c6"},{"event_id":40,"event_time":"2025-08-03 09:00:00","event_type":"search","session_id":"c7"},{"event_id":41,"event_time":"2025-08-03 09:05:00","event_type":"view","session_id":"c0"},{"event_id":42,"event_time":"2025-08-03 09:05:00","event_type":"view","session_id":"c1"},{"event_id":43,"event_time":"2025-08-03 09:05:00","event_type":"view","session_id":"c2"},{"event_id":44,"event_time":"2025-08-03 09:05:00","event_type":"view","session_id":"c3"},{"event_id":45,"event_time":"2025-08-03 09:05:00","event_type":"view","session_id":"c4"},{"event_id":46,"event_time":"2025-08-03 09:05:00","event_type":"view","session_id":"c5"}]}'::jsonb, '[{"event_date":"2025-08-02","searches":10,"views":5,"drop_off_pct":50}]'::jsonb, FALSE, 'events[''event_date''] = pd.to_datetime(events[''event_time'']).dt.strftime(''%Y-%m-%d'')

# your code here
result = None
', '["pivot_table(index=''event_date'', columns=''event_type'', values=''session_id'', aggfunc=''nunique'') gives searches/views side by side per day.",".fillna(0) — a day might have searches but no views at all.","Filter to drop_off_pct > 40, then reset_index() and rename the pivoted columns to searches/views."]'::jsonb, 'daily_funnel = events.pivot_table(
    index=''event_date'',
    columns=''event_type'',
    values=''session_id'',
    aggfunc=''nunique''
).fillna(0)

daily_funnel[''drop_off_pct''] = (
    (daily_funnel[''search''] - daily_funnel[''view'']) / daily_funnel[''search''] * 100
)

result = daily_funnel[daily_funnel[''drop_off_pct''] > 40].reset_index()
result = result[[''event_date'', ''search'', ''view'', ''drop_off_pct'']].rename(
    columns={''search'': ''searches'', ''view'': ''views''}
)
', 18)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('cumulative-stock-levels', 'Daily & Cumulative Stock Levels', 'sql', 'easy', '["window functions","running total"]'::jsonb, 'The warehouse team wants a daily closing-stock ledger per product/warehouse — the running total that everything else (reorder alerts, stockout detection) gets built on top of.', 'Table `inventory(inventory_id, product_id, record_date, delta_qty, is_restock, warehouse)` — `delta_qty` is signed (positive for restocks, negative for sales/usage).

For each product/warehouse, compute the daily net change and the running cumulative stock. Return `product_id, warehouse, record_date, daily_change, cumulative_stock`, ordered by product, warehouse, date.', 'CREATE TABLE inventory (
  inventory_id INTEGER PRIMARY KEY,
  product_id TEXT,
  record_date TEXT,
  delta_qty REAL,
  is_restock INTEGER,
  warehouse TEXT
);', 'INSERT INTO inventory (inventory_id, product_id, record_date, delta_qty, is_restock, warehouse) VALUES
  (1, ''P1'', ''2025-09-01'', 50, 1, ''W1''),
  (2, ''P1'', ''2025-09-02'', -20, 0, ''W1''),
  (3, ''P1'', ''2025-09-03'', -15, 0, ''W1''),
  (4, ''P1'', ''2025-09-04'', -10, 0, ''W1''),
  (5, ''P1'', ''2025-09-05'', -8, 0, ''W1''),
  (6, ''P1'', ''2025-09-06'', 5, 0, ''W1''),
  (7, ''P1'', ''2025-09-07'', -30, 0, ''W1''),
  (8, ''P1'', ''2025-09-08'', 40, 1, ''W1''),
  (9, ''P2'', ''2025-09-01'', 200, 1, ''W1''),
  (10, ''P2'', ''2025-09-02'', -20, 0, ''W1''),
  (11, ''P2'', ''2025-09-03'', -20, 0, ''W1''),
  (12, ''P2'', ''2025-09-04'', -20, 0, ''W1''),
  (13, ''P2'', ''2025-09-05'', -20, 0, ''W1''),
  (14, ''P2'', ''2025-09-06'', -20, 0, ''W1''),
  (15, ''P2'', ''2025-09-07'', -20, 0, ''W1''),
  (16, ''P2'', ''2025-09-08'', -20, 0, ''W1'');', NULL, '[{"product_id":"P1","warehouse":"W1","record_date":"2025-09-01","daily_change":50,"cumulative_stock":50},{"product_id":"P1","warehouse":"W1","record_date":"2025-09-02","daily_change":-20,"cumulative_stock":30},{"product_id":"P1","warehouse":"W1","record_date":"2025-09-03","daily_change":-15,"cumulative_stock":15},{"product_id":"P1","warehouse":"W1","record_date":"2025-09-04","daily_change":-10,"cumulative_stock":5},{"product_id":"P1","warehouse":"W1","record_date":"2025-09-05","daily_change":-8,"cumulative_stock":-3},{"product_id":"P1","warehouse":"W1","record_date":"2025-09-06","daily_change":5,"cumulative_stock":2},{"product_id":"P1","warehouse":"W1","record_date":"2025-09-07","daily_change":-30,"cumulative_stock":-28},{"product_id":"P1","warehouse":"W1","record_date":"2025-09-08","daily_change":40,"cumulative_stock":12},{"product_id":"P2","warehouse":"W1","record_date":"2025-09-01","daily_change":200,"cumulative_stock":200},{"product_id":"P2","warehouse":"W1","record_date":"2025-09-02","daily_change":-20,"cumulative_stock":180},{"product_id":"P2","warehouse":"W1","record_date":"2025-09-03","daily_change":-20,"cumulative_stock":160},{"product_id":"P2","warehouse":"W1","record_date":"2025-09-04","daily_change":-20,"cumulative_stock":140},{"product_id":"P2","warehouse":"W1","record_date":"2025-09-05","daily_change":-20,"cumulative_stock":120},{"product_id":"P2","warehouse":"W1","record_date":"2025-09-06","daily_change":-20,"cumulative_stock":100},{"product_id":"P2","warehouse":"W1","record_date":"2025-09-07","daily_change":-20,"cumulative_stock":80},{"product_id":"P2","warehouse":"W1","record_date":"2025-09-08","daily_change":-20,"cumulative_stock":60}]'::jsonb, TRUE, 'WITH daily AS (
  SELECT product_id, warehouse, record_date, SUM(delta_qty) AS daily_change
  FROM inventory
  GROUP BY product_id, warehouse, record_date
)
SELECT
', '["Aggregate to (product, warehouse, date) first — a day could have multiple inventory rows.","SUM(daily_change) OVER (PARTITION BY product_id, warehouse ORDER BY record_date) is the running total.","No ROWS BETWEEN needed here — the default frame for an ORDER BY window is already ''from the start through the current row''."]'::jsonb, 'WITH daily AS (
    SELECT product_id, warehouse, record_date, SUM(delta_qty) AS daily_change
    FROM inventory
    GROUP BY product_id, warehouse, record_date
)
SELECT *,
       SUM(daily_change) OVER (
           PARTITION BY product_id, warehouse
           ORDER BY record_date
       ) AS cumulative_stock
FROM daily
ORDER BY product_id, warehouse, record_date;', 19)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('cumulative-stock-levels-pandas', 'Daily & Cumulative Stock Levels', 'python', 'easy', '["pandas","cumsum"]'::jsonb, 'The warehouse team wants a daily closing-stock ledger per product/warehouse — the running total that everything else (reorder alerts, stockout detection) gets built on top of.', 'DataFrame `inventory(product_id, record_date, delta_qty, is_restock, warehouse)` — `delta_qty` is signed (positive for restocks, negative for sales/usage).

For each product/warehouse, compute the daily net change and the running cumulative stock. Build `result` with columns `product_id, warehouse, record_date, daily_change, cumulative_stock`, sorted by product, warehouse, date.', NULL, NULL, '{"inventory":[{"product_id":"P1","record_date":"2025-09-01","delta_qty":50,"is_restock":1,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-02","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-03","delta_qty":-15,"is_restock":0,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-04","delta_qty":-10,"is_restock":0,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-05","delta_qty":-8,"is_restock":0,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-06","delta_qty":5,"is_restock":0,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-07","delta_qty":-30,"is_restock":0,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-08","delta_qty":40,"is_restock":1,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-01","delta_qty":200,"is_restock":1,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-02","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-03","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-04","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-05","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-06","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-07","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-08","delta_qty":-20,"is_restock":0,"warehouse":"W1"}]}'::jsonb, '[{"product_id":"P1","warehouse":"W1","record_date":"2025-09-01","daily_change":50,"cumulative_stock":50},{"product_id":"P1","warehouse":"W1","record_date":"2025-09-02","daily_change":-20,"cumulative_stock":30},{"product_id":"P1","warehouse":"W1","record_date":"2025-09-03","daily_change":-15,"cumulative_stock":15},{"product_id":"P1","warehouse":"W1","record_date":"2025-09-04","daily_change":-10,"cumulative_stock":5},{"product_id":"P1","warehouse":"W1","record_date":"2025-09-05","daily_change":-8,"cumulative_stock":-3},{"product_id":"P1","warehouse":"W1","record_date":"2025-09-06","daily_change":5,"cumulative_stock":2},{"product_id":"P1","warehouse":"W1","record_date":"2025-09-07","daily_change":-30,"cumulative_stock":-28},{"product_id":"P1","warehouse":"W1","record_date":"2025-09-08","daily_change":40,"cumulative_stock":12},{"product_id":"P2","warehouse":"W1","record_date":"2025-09-01","daily_change":200,"cumulative_stock":200},{"product_id":"P2","warehouse":"W1","record_date":"2025-09-02","daily_change":-20,"cumulative_stock":180},{"product_id":"P2","warehouse":"W1","record_date":"2025-09-03","daily_change":-20,"cumulative_stock":160},{"product_id":"P2","warehouse":"W1","record_date":"2025-09-04","daily_change":-20,"cumulative_stock":140},{"product_id":"P2","warehouse":"W1","record_date":"2025-09-05","daily_change":-20,"cumulative_stock":120},{"product_id":"P2","warehouse":"W1","record_date":"2025-09-06","daily_change":-20,"cumulative_stock":100},{"product_id":"P2","warehouse":"W1","record_date":"2025-09-07","daily_change":-20,"cumulative_stock":80},{"product_id":"P2","warehouse":"W1","record_date":"2025-09-08","daily_change":-20,"cumulative_stock":60}]'::jsonb, TRUE, 'daily = inventory.groupby([''product_id'', ''warehouse'', ''record_date''])[''delta_qty''].sum().reset_index()
daily = daily.sort_values([''product_id'', ''warehouse'', ''record_date''])

# your code here
result = None
', '["groupby([''product_id'',''warehouse''])[''delta_qty''].cumsum() gives the running total per group, aligned back to every row.","Rename the summed delta_qty column to daily_change for the final output."]'::jsonb, 'daily = inventory.groupby([''product_id'', ''warehouse'', ''record_date''])[''delta_qty''].sum().reset_index()
daily = daily.sort_values([''product_id'', ''warehouse'', ''record_date''])

daily[''cumulative_stock''] = daily.groupby([''product_id'', ''warehouse''])[''delta_qty''].cumsum()
result = daily.rename(columns={''delta_qty'': ''daily_change''})
', 20)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('out-of-stock-streaks', 'Out-of-Stock Streaks', 'sql', 'hard', '["gaps and islands","window functions"]'::jsonb, 'Supply chain wants every stretch of consecutive days a product sat at zero or negative stock — not just whether it ever happened — to prioritize which SKUs need safety-stock fixes first.', 'Table `inventory(inventory_id, product_id, record_date, delta_qty, is_restock, warehouse)`.

For each product/warehouse, find every unbroken streak of consecutive days where the closing stock was ≤ 0. Return `product_id, warehouse, streak_start, streak_end, consecutive_oos_days`.', 'CREATE TABLE inventory (
  inventory_id INTEGER PRIMARY KEY,
  product_id TEXT,
  record_date TEXT,
  delta_qty REAL,
  is_restock INTEGER,
  warehouse TEXT
);', 'INSERT INTO inventory (inventory_id, product_id, record_date, delta_qty, is_restock, warehouse) VALUES
  (1, ''P1'', ''2025-09-01'', 50, 1, ''W1''),
  (2, ''P1'', ''2025-09-02'', -20, 0, ''W1''),
  (3, ''P1'', ''2025-09-03'', -15, 0, ''W1''),
  (4, ''P1'', ''2025-09-04'', -10, 0, ''W1''),
  (5, ''P1'', ''2025-09-05'', -8, 0, ''W1''),
  (6, ''P1'', ''2025-09-06'', 5, 0, ''W1''),
  (7, ''P1'', ''2025-09-07'', -30, 0, ''W1''),
  (8, ''P1'', ''2025-09-08'', 40, 1, ''W1''),
  (9, ''P2'', ''2025-09-01'', 200, 1, ''W1''),
  (10, ''P2'', ''2025-09-02'', -20, 0, ''W1''),
  (11, ''P2'', ''2025-09-03'', -20, 0, ''W1''),
  (12, ''P2'', ''2025-09-04'', -20, 0, ''W1''),
  (13, ''P2'', ''2025-09-05'', -20, 0, ''W1''),
  (14, ''P2'', ''2025-09-06'', -20, 0, ''W1''),
  (15, ''P2'', ''2025-09-07'', -20, 0, ''W1''),
  (16, ''P2'', ''2025-09-08'', -20, 0, ''W1'');', NULL, '[{"product_id":"P1","warehouse":"W1","streak_start":"2025-09-05","streak_end":"2025-09-05","consecutive_oos_days":1},{"product_id":"P1","warehouse":"W1","streak_start":"2025-09-07","streak_end":"2025-09-07","consecutive_oos_days":1}]'::jsonb, TRUE, 'WITH daily_stock AS (
  SELECT *,
         SUM(daily_change) OVER (
             PARTITION BY product_id, warehouse ORDER BY record_date
         ) AS closing_stock
  FROM (
    SELECT product_id, warehouse, record_date, SUM(delta_qty) AS daily_change
    FROM inventory
    GROUP BY product_id, warehouse, record_date
  ) d
)
SELECT
', '["First compute the cumulative closing_stock (same as the cumulative-stock question), then flag is_oos = closing_stock <= 0.","Gaps-and-islands, but partitioned by (product_id, warehouse, is_oos) so in-stock and out-of-stock runs get separate row-number sequences.","Filter to is_oos = 1 before grouping by the anchor — you only want the out-of-stock islands, not the in-stock ones."]'::jsonb, 'WITH daily_stock AS (
    SELECT *,
           SUM(daily_change) OVER (
               PARTITION BY product_id, warehouse ORDER BY record_date
           ) AS closing_stock
    FROM (
        SELECT product_id, warehouse, record_date, SUM(delta_qty) AS daily_change
        FROM inventory
        GROUP BY product_id, warehouse, record_date
    ) d
),
flagged AS (
    SELECT *,
           CASE WHEN closing_stock <= 0 THEN 1 ELSE 0 END AS is_oos,
           date(
               record_date,
               ''-'' || (ROW_NUMBER() OVER (
                   PARTITION BY product_id, warehouse,
                                CASE WHEN closing_stock <= 0 THEN 1 ELSE 0 END
                   ORDER BY record_date
               )) || '' days''
           ) AS grp
    FROM daily_stock
)
SELECT product_id, warehouse,
       MIN(record_date) AS streak_start,
       MAX(record_date) AS streak_end,
       COUNT(*)         AS consecutive_oos_days
FROM flagged
WHERE is_oos = 1
GROUP BY product_id, warehouse, grp
ORDER BY product_id, warehouse, streak_start;', 21)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('out-of-stock-streaks-pandas', 'Out-of-Stock Streaks', 'python', 'hard', '["pandas","gaps and islands"]'::jsonb, 'Supply chain wants every stretch of consecutive days a product sat at zero or negative stock — not just whether it ever happened — to prioritize which SKUs need safety-stock fixes first.', 'DataFrame `inventory(product_id, record_date, delta_qty, is_restock, warehouse)`.

For each product/warehouse, find every unbroken streak of consecutive days where the closing stock was ≤ 0. Build `result` with columns `product_id, warehouse, streak_start, streak_end, consecutive_oos_days` (dates as plain strings).', NULL, NULL, '{"inventory":[{"product_id":"P1","record_date":"2025-09-01","delta_qty":50,"is_restock":1,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-02","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-03","delta_qty":-15,"is_restock":0,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-04","delta_qty":-10,"is_restock":0,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-05","delta_qty":-8,"is_restock":0,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-06","delta_qty":5,"is_restock":0,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-07","delta_qty":-30,"is_restock":0,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-08","delta_qty":40,"is_restock":1,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-01","delta_qty":200,"is_restock":1,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-02","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-03","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-04","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-05","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-06","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-07","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-08","delta_qty":-20,"is_restock":0,"warehouse":"W1"}]}'::jsonb, '[{"product_id":"P1","warehouse":"W1","streak_start":"2025-09-05","streak_end":"2025-09-05","consecutive_oos_days":1},{"product_id":"P1","warehouse":"W1","streak_start":"2025-09-07","streak_end":"2025-09-07","consecutive_oos_days":1}]'::jsonb, TRUE, 'daily = inventory.groupby([''product_id'', ''warehouse'', ''record_date''])[''delta_qty''].sum().reset_index()
daily = daily.sort_values([''product_id'', ''warehouse'', ''record_date''])
daily[''closing_stock''] = daily.groupby([''product_id'', ''warehouse''])[''delta_qty''].cumsum()

# your code here
result = None
', '["is_oos = (closing_stock <= 0).astype(int); groupby([''product_id'',''warehouse'',''is_oos'']).cumcount() gives the per-run row number.","grp = record_date - pd.to_timedelta(row_number, unit=''D'') — same anchor trick, computed only within is_oos runs.","Filter to is_oos == 1 before the final groupby([''product_id'',''warehouse'',''grp''])."]'::jsonb, 'daily = inventory.groupby([''product_id'', ''warehouse'', ''record_date''])[''delta_qty''].sum().reset_index()
daily = daily.sort_values([''product_id'', ''warehouse'', ''record_date''])
daily[''closing_stock''] = daily.groupby([''product_id'', ''warehouse''])[''delta_qty''].cumsum()

daily[''is_oos''] = (daily[''closing_stock''] <= 0).astype(int)
daily[''row_num''] = daily.groupby([''product_id'', ''warehouse'', ''is_oos'']).cumcount() + 1
daily[''record_date''] = pd.to_datetime(daily[''record_date''])
daily[''grp''] = daily[''record_date''] - pd.to_timedelta(daily[''row_num''], unit=''D'')

streaks = (
    daily[daily[''is_oos''] == 1]
    .groupby([''product_id'', ''warehouse'', ''grp''])
    .agg(streak_start=(''record_date'', ''min''), streak_end=(''record_date'', ''max''), consecutive_oos_days=(''record_date'', ''count''))
    .reset_index()
    .drop(columns=''grp'')
    .sort_values([''product_id'', ''warehouse'', ''streak_start''])
)
streaks[''streak_start''] = streaks[''streak_start''].dt.strftime(''%Y-%m-%d'')
streaks[''streak_end''] = streaks[''streak_end''].dt.strftime(''%Y-%m-%d'')
result = streaks.reset_index(drop=True)
', 22)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('reorder-trigger-date', 'Reorder Trigger Date', 'sql', 'medium', '["left join","running total"]'::jsonb, 'Purchasing wants an automated alert the moment any product/warehouse first crosses the 10-unit reorder threshold.', 'Table `inventory(inventory_id, product_id, record_date, delta_qty, is_restock, warehouse)`. Reorder threshold is 10 units.

For every product/warehouse combo, find the earliest date its closing stock dropped to ≤ 10 — `reorder_trigger_date`. If it never happened, show `NULL` rather than omitting the combo.', 'CREATE TABLE inventory (
  inventory_id INTEGER PRIMARY KEY,
  product_id TEXT,
  record_date TEXT,
  delta_qty REAL,
  is_restock INTEGER,
  warehouse TEXT
);', 'INSERT INTO inventory (inventory_id, product_id, record_date, delta_qty, is_restock, warehouse) VALUES
  (1, ''P1'', ''2025-09-01'', 50, 1, ''W1''),
  (2, ''P1'', ''2025-09-02'', -20, 0, ''W1''),
  (3, ''P1'', ''2025-09-03'', -15, 0, ''W1''),
  (4, ''P1'', ''2025-09-04'', -10, 0, ''W1''),
  (5, ''P1'', ''2025-09-05'', -8, 0, ''W1''),
  (6, ''P1'', ''2025-09-06'', 5, 0, ''W1''),
  (7, ''P1'', ''2025-09-07'', -30, 0, ''W1''),
  (8, ''P1'', ''2025-09-08'', 40, 1, ''W1''),
  (9, ''P2'', ''2025-09-01'', 200, 1, ''W1''),
  (10, ''P2'', ''2025-09-02'', -20, 0, ''W1''),
  (11, ''P2'', ''2025-09-03'', -20, 0, ''W1''),
  (12, ''P2'', ''2025-09-04'', -20, 0, ''W1''),
  (13, ''P2'', ''2025-09-05'', -20, 0, ''W1''),
  (14, ''P2'', ''2025-09-06'', -20, 0, ''W1''),
  (15, ''P2'', ''2025-09-07'', -20, 0, ''W1''),
  (16, ''P2'', ''2025-09-08'', -20, 0, ''W1'');', NULL, '[{"product_id":"P1","warehouse":"W1","reorder_trigger_date":"2025-09-04"},{"product_id":"P2","warehouse":"W1","reorder_trigger_date":null}]'::jsonb, TRUE, 'WITH daily AS (
  SELECT product_id, warehouse, record_date, SUM(delta_qty) AS daily_change
  FROM inventory
  GROUP BY product_id, warehouse, record_date
),
running AS (
  SELECT *,
         SUM(daily_change) OVER (
             PARTITION BY product_id, warehouse ORDER BY record_date
         ) AS closing_stock
  FROM daily
)
SELECT
', '["MIN(record_date) WHERE closing_stock <= 10, grouped by product/warehouse, gives the trigger date for combos that ever crossed it.","That alone would silently drop combos that never crossed 10 — LEFT JOIN it onto the full DISTINCT list of product/warehouse combos.","A combo with no match in the trigger CTE naturally comes through as NULL from the LEFT JOIN."]'::jsonb, 'WITH daily AS (
    SELECT product_id, warehouse, record_date, SUM(delta_qty) AS daily_change
    FROM inventory
    GROUP BY product_id, warehouse, record_date
),
running AS (
    SELECT *,
           SUM(daily_change) OVER (
               PARTITION BY product_id, warehouse ORDER BY record_date
           ) AS closing_stock
    FROM daily
),
triggered AS (
    SELECT product_id, warehouse, MIN(record_date) AS reorder_trigger_date
    FROM running
    WHERE closing_stock <= 10
    GROUP BY product_id, warehouse
),
all_combos AS (
    SELECT DISTINCT product_id, warehouse FROM inventory
)
SELECT ac.product_id, ac.warehouse, t.reorder_trigger_date
FROM all_combos ac
LEFT JOIN triggered t
  ON ac.product_id = t.product_id AND ac.warehouse = t.warehouse
ORDER BY ac.product_id;', 23)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('reorder-trigger-date-pandas', 'Reorder Trigger Date', 'python', 'medium', '["pandas","merge","cumsum"]'::jsonb, 'Purchasing wants an automated alert the moment any product/warehouse first crosses the 10-unit reorder threshold.', 'DataFrame `inventory(product_id, record_date, delta_qty, is_restock, warehouse)`. Reorder threshold is 10 units.

For every product/warehouse combo, find the earliest date its closing stock dropped to ≤ 10 — `reorder_trigger_date`. If it never happened, show a missing value rather than omitting the combo. Build `result` with columns `product_id, warehouse, reorder_trigger_date`.', NULL, NULL, '{"inventory":[{"product_id":"P1","record_date":"2025-09-01","delta_qty":50,"is_restock":1,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-02","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-03","delta_qty":-15,"is_restock":0,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-04","delta_qty":-10,"is_restock":0,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-05","delta_qty":-8,"is_restock":0,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-06","delta_qty":5,"is_restock":0,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-07","delta_qty":-30,"is_restock":0,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-08","delta_qty":40,"is_restock":1,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-01","delta_qty":200,"is_restock":1,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-02","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-03","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-04","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-05","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-06","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-07","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-08","delta_qty":-20,"is_restock":0,"warehouse":"W1"}]}'::jsonb, '[{"product_id":"P1","warehouse":"W1","reorder_trigger_date":"2025-09-04"},{"product_id":"P2","warehouse":"W1","reorder_trigger_date":null}]'::jsonb, TRUE, 'daily = inventory.groupby([''product_id'', ''warehouse'', ''record_date''])[''delta_qty''].sum().reset_index()
daily = daily.sort_values([''product_id'', ''warehouse'', ''record_date''])
daily[''closing_stock''] = daily.groupby([''product_id'', ''warehouse''])[''delta_qty''].cumsum()

# your code here
result = None
', '["Filter to closing_stock <= 10, then groupby([''product_id'',''warehouse''])[''record_date''].min() for the combos that ever crossed it.","merge(..., how=''left'') the full distinct (product_id, warehouse) list onto that — a plain/inner merge would drop combos that never triggered.","record_date is already a plain string here, so no datetime formatting needed on the way out."]'::jsonb, 'daily = inventory.groupby([''product_id'', ''warehouse'', ''record_date''])[''delta_qty''].sum().reset_index()
daily = daily.sort_values([''product_id'', ''warehouse'', ''record_date''])
daily[''closing_stock''] = daily.groupby([''product_id'', ''warehouse''])[''delta_qty''].cumsum()

below = daily[daily[''closing_stock''] <= 10]
first_trigger = below.groupby([''product_id'', ''warehouse''])[''record_date''].min().reset_index(name=''reorder_trigger_date'')

all_pairs = daily[[''product_id'', ''warehouse'']].drop_duplicates()
result = all_pairs.merge(first_trigger, on=[''product_id'', ''warehouse''], how=''left'').sort_values(''product_id'').reset_index(drop=True)
', 24)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('restock-scenario-modeling', 'Restock Scenario Modeling (+10%)', 'sql', 'very_hard', '["window functions","what-if analysis"]'::jsonb, 'Supply chain is proposing a blanket +10% restock buffer to cut stockouts, and wants to see exactly how that would have changed closing stock day by day for product P1 before committing budget to it.', 'Table `inventory(inventory_id, product_id, record_date, delta_qty, is_restock, warehouse)`.

Model a scenario where every restock event (`is_restock = 1`) is increased by 10%. For product `P1` / warehouse `W1`, return `record_date, closing_stock_actual, closing_stock_scenario, stock_diff` — the actual vs. scenario running stock and their difference, ordered by date.', 'CREATE TABLE inventory (
  inventory_id INTEGER PRIMARY KEY,
  product_id TEXT,
  record_date TEXT,
  delta_qty REAL,
  is_restock INTEGER,
  warehouse TEXT
);', 'INSERT INTO inventory (inventory_id, product_id, record_date, delta_qty, is_restock, warehouse) VALUES
  (1, ''P1'', ''2025-09-01'', 50, 1, ''W1''),
  (2, ''P1'', ''2025-09-02'', -20, 0, ''W1''),
  (3, ''P1'', ''2025-09-03'', -15, 0, ''W1''),
  (4, ''P1'', ''2025-09-04'', -10, 0, ''W1''),
  (5, ''P1'', ''2025-09-05'', -8, 0, ''W1''),
  (6, ''P1'', ''2025-09-06'', 5, 0, ''W1''),
  (7, ''P1'', ''2025-09-07'', -30, 0, ''W1''),
  (8, ''P1'', ''2025-09-08'', 40, 1, ''W1''),
  (9, ''P2'', ''2025-09-01'', 200, 1, ''W1''),
  (10, ''P2'', ''2025-09-02'', -20, 0, ''W1''),
  (11, ''P2'', ''2025-09-03'', -20, 0, ''W1''),
  (12, ''P2'', ''2025-09-04'', -20, 0, ''W1''),
  (13, ''P2'', ''2025-09-05'', -20, 0, ''W1''),
  (14, ''P2'', ''2025-09-06'', -20, 0, ''W1''),
  (15, ''P2'', ''2025-09-07'', -20, 0, ''W1''),
  (16, ''P2'', ''2025-09-08'', -20, 0, ''W1'');', NULL, '[{"record_date":"2025-09-01","closing_stock_actual":50,"closing_stock_scenario":55,"stock_diff":5},{"record_date":"2025-09-02","closing_stock_actual":30,"closing_stock_scenario":35,"stock_diff":5},{"record_date":"2025-09-03","closing_stock_actual":15,"closing_stock_scenario":20,"stock_diff":5},{"record_date":"2025-09-04","closing_stock_actual":5,"closing_stock_scenario":10,"stock_diff":5},{"record_date":"2025-09-05","closing_stock_actual":-3,"closing_stock_scenario":2,"stock_diff":5},{"record_date":"2025-09-06","closing_stock_actual":2,"closing_stock_scenario":7,"stock_diff":5},{"record_date":"2025-09-07","closing_stock_actual":-28,"closing_stock_scenario":-23,"stock_diff":5},{"record_date":"2025-09-08","closing_stock_actual":12,"closing_stock_scenario":21,"stock_diff":9}]'::jsonb, TRUE, 'WITH scenario_source AS (
  SELECT
    product_id, warehouse, record_date,
    CASE WHEN is_restock = 1 THEN delta_qty * 1.1 ELSE delta_qty END AS delta_qty
  FROM inventory
)
SELECT
', '["Build a scenario_source CTE that bumps only the restock rows by 10%, leaving everything else untouched.","Compute cumulative closing stock (same running-total pattern) for both the actual and scenario data independently, then join them on (product_id, warehouse, record_date).","Filter the final SELECT to product_id = ''P1'' — the computation itself still runs correctly across every product because the window functions are partitioned."]'::jsonb, 'WITH scenario_source AS (
    SELECT
        product_id, warehouse, record_date,
        CASE WHEN is_restock = 1 THEN delta_qty * 1.1 ELSE delta_qty END AS delta_qty
    FROM inventory
),
actual_daily AS (
    SELECT product_id, warehouse, record_date, SUM(delta_qty) AS daily_change
    FROM inventory
    GROUP BY product_id, warehouse, record_date
),
actual_closing AS (
    SELECT *,
           SUM(daily_change) OVER (
               PARTITION BY product_id, warehouse ORDER BY record_date
           ) AS closing_stock_actual
    FROM actual_daily
),
scenario_daily AS (
    SELECT product_id, warehouse, record_date, SUM(delta_qty) AS daily_change
    FROM scenario_source
    GROUP BY product_id, warehouse, record_date
),
scenario_closing AS (
    SELECT *,
           SUM(daily_change) OVER (
               PARTITION BY product_id, warehouse ORDER BY record_date
           ) AS closing_stock_scenario
    FROM scenario_daily
)
SELECT
    a.record_date,
    a.closing_stock_actual,
    s.closing_stock_scenario,
    s.closing_stock_scenario - a.closing_stock_actual AS stock_diff
FROM actual_closing a
JOIN scenario_closing s
  ON a.product_id = s.product_id
 AND a.warehouse = s.warehouse
 AND a.record_date = s.record_date
WHERE a.product_id = ''P1''
ORDER BY a.record_date;', 25)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;

INSERT INTO questions (slug, title, category, difficulty, topic_tags, story, prompt, schema_sql, seed_sql, seed_data, expected_result, order_matters, starter_code, hints, solution_code, sort_order)
VALUES ('restock-scenario-modeling-pandas', 'Restock Scenario Modeling (+10%)', 'python', 'very_hard', '["pandas","what-if analysis","cumsum"]'::jsonb, 'Supply chain is proposing a blanket +10% restock buffer to cut stockouts, and wants to see exactly how that would have changed closing stock day by day for product P1 before committing budget to it.', 'DataFrame `inventory(product_id, record_date, delta_qty, is_restock, warehouse)`.

Model a scenario where every restock event (`is_restock == 1`) is increased by 10%. For product `P1` / warehouse `W1`, build `result` with `record_date, closing_stock_actual, closing_stock_scenario, stock_diff`, sorted by date.', NULL, NULL, '{"inventory":[{"product_id":"P1","record_date":"2025-09-01","delta_qty":50,"is_restock":1,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-02","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-03","delta_qty":-15,"is_restock":0,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-04","delta_qty":-10,"is_restock":0,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-05","delta_qty":-8,"is_restock":0,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-06","delta_qty":5,"is_restock":0,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-07","delta_qty":-30,"is_restock":0,"warehouse":"W1"},{"product_id":"P1","record_date":"2025-09-08","delta_qty":40,"is_restock":1,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-01","delta_qty":200,"is_restock":1,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-02","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-03","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-04","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-05","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-06","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-07","delta_qty":-20,"is_restock":0,"warehouse":"W1"},{"product_id":"P2","record_date":"2025-09-08","delta_qty":-20,"is_restock":0,"warehouse":"W1"}]}'::jsonb, '[{"record_date":"2025-09-01","closing_stock_actual":50,"closing_stock_scenario":55,"stock_diff":5},{"record_date":"2025-09-02","closing_stock_actual":30,"closing_stock_scenario":35,"stock_diff":5},{"record_date":"2025-09-03","closing_stock_actual":15,"closing_stock_scenario":20,"stock_diff":5},{"record_date":"2025-09-04","closing_stock_actual":5,"closing_stock_scenario":10,"stock_diff":5},{"record_date":"2025-09-05","closing_stock_actual":-3,"closing_stock_scenario":2,"stock_diff":5},{"record_date":"2025-09-06","closing_stock_actual":2,"closing_stock_scenario":7,"stock_diff":5},{"record_date":"2025-09-07","closing_stock_actual":-28,"closing_stock_scenario":-23,"stock_diff":5},{"record_date":"2025-09-08","closing_stock_actual":12,"closing_stock_scenario":21,"stock_diff":9}]'::jsonb, TRUE, 'scenario = inventory.copy()
scenario[''delta_qty''] = np.where(scenario[''is_restock''] == 1, scenario[''delta_qty''] * 1.1, scenario[''delta_qty''])

# your code here
result = None
', '["np.where(is_restock == 1, delta_qty * 1.1, delta_qty) bumps only restock rows.","Write a small daily_closing(df) helper (groupby + cumsum) and call it once on `inventory` and once on `scenario` — same pattern as the earlier cumulative-stock question.","merge the two closings on (product_id, warehouse, record_date), take the diff, then filter to product_id == ''P1'' for the final result."]'::jsonb, 'scenario = inventory.copy()
scenario[''delta_qty''] = np.where(scenario[''is_restock''] == 1, scenario[''delta_qty''] * 1.1, scenario[''delta_qty''])

def daily_closing(df):
    d = df.groupby([''product_id'', ''warehouse'', ''record_date''])[''delta_qty''].sum().reset_index()
    d = d.sort_values([''product_id'', ''warehouse'', ''record_date''])
    d[''closing_stock''] = d.groupby([''product_id'', ''warehouse''])[''delta_qty''].cumsum()
    return d

actual_daily = daily_closing(inventory).rename(columns={''closing_stock'': ''closing_stock_actual''})
scenario_daily = daily_closing(scenario).rename(columns={''closing_stock'': ''closing_stock_scenario''})

comparison = actual_daily.merge(
    scenario_daily[[''product_id'', ''warehouse'', ''record_date'', ''closing_stock_scenario'']],
    on=[''product_id'', ''warehouse'', ''record_date'']
)
comparison[''stock_diff''] = comparison[''closing_stock_scenario''] - comparison[''closing_stock_actual'']

result = comparison[comparison[''product_id''] == ''P1''][
    [''record_date'', ''closing_stock_actual'', ''closing_stock_scenario'', ''stock_diff'']
].reset_index(drop=True)
', 26)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  topic_tags = EXCLUDED.topic_tags,
  story = EXCLUDED.story,
  prompt = EXCLUDED.prompt,
  schema_sql = EXCLUDED.schema_sql,
  seed_sql = EXCLUDED.seed_sql,
  seed_data = EXCLUDED.seed_data,
  expected_result = EXCLUDED.expected_result,
  order_matters = EXCLUDED.order_matters,
  starter_code = EXCLUDED.starter_code,
  hints = EXCLUDED.hints,
  solution_code = EXCLUDED.solution_code,
  sort_order = EXCLUDED.sort_order;
