let sqlJsPromise = null;

function loadSqlJs() {
  if (!sqlJsPromise) {
    sqlJsPromise = import("sql.js").then((mod) =>
      mod.default({ locateFile: (file) => `/${file}` })
    );
  }
  return sqlJsPromise;
}

/**
 * Runs a user's SQL query against a fresh in-memory SQLite database seeded
 * with the question's schema_sql + seed_sql. Everything happens client-side —
 * nothing here ever reaches a server.
 */
export async function runSqlQuery({ schemaSql, seedSql, query }) {
  const SQL = await loadSqlJs();
  const db = new SQL.Database();
  try {
    if (schemaSql) db.run(schemaSql);
    if (seedSql) db.run(seedSql);

    const results = db.exec(query);
    if (results.length === 0) {
      return { rows: [], columns: [] };
    }
    const { columns, values } = results[results.length - 1];
    const rows = values.map((row) =>
      Object.fromEntries(columns.map((col, i) => [col, row[i]]))
    );
    return { rows, columns };
  } finally {
    db.close();
  }
}
