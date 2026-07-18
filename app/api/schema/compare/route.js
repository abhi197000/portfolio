import { NextResponse } from "next/server";

export async function POST(request) {
  const body = await request.json();
  const { token, sources, tables } = body;

  if (!token)
    return NextResponse.json(
      { error: "Access token is required." },
      { status: 400 },
    );
  if (!sources?.length)
    return NextResponse.json(
      { error: "At least one source is required." },
      { status: 400 },
    );
  if (!tables?.length)
    return NextResponse.json(
      { error: "At least one table name is required." },
      { status: 400 },
    );

  const results = [];

  for (const table of tables) {
    const sourceSchemas = {};
    const errors = [];

    await Promise.all(
      sources.map(async (source) => {
        const url = `https://bigquery.googleapis.com/bigquery/v2/projects/${encodeURIComponent(source.projectId)}/datasets/${encodeURIComponent(source.datasetId)}/tables/${encodeURIComponent(table)}`;
        try {
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            errors.push(
              `${source.name}: ${err.error?.message || res.statusText}`,
            );
            return;
          }
          const data = await res.json();
          const schema = {};
          for (const field of data.schema?.fields || []) {
            schema[field.name] = field.type;
          }
          sourceSchemas[source.name] = schema;
        } catch (e) {
          errors.push(`${source.name}: ${e.message}`);
        }
      }),
    );

    const allColumns = [
      ...new Set(
        Object.values(sourceSchemas).flatMap((s) => Object.keys(s)),
      ),
    ].sort();

    const sourceNames = sources.map((s) => s.name);

    const rows = allColumns.map((col) => {
      const row = { column: col };
      const typesFound = new Set();
      const typeToSources = {};
      const missingSources = [];

      for (const name of sourceNames) {
        if (sourceSchemas[name]) {
          const dtype = sourceSchemas[name][col] || "—";
          row[name] = dtype;
          if (dtype === "—") {
            missingSources.push(name);
          } else {
            typesFound.add(dtype);
            if (!typeToSources[dtype]) typeToSources[dtype] = [];
            typeToSources[dtype].push(name);
          }
        } else {
          row[name] = "N/A";
        }
      }

      row.isMismatch = typesFound.size > 1 || missingSources.length > 0;

      const details = [];
      if (typesFound.size > 1) {
        const majorityType = Object.entries(typeToSources).sort(
          (a, b) => b[1].length - a[1].length,
        )[0][0];
        for (const [dtype, srcs] of Object.entries(typeToSources)) {
          if (dtype !== majorityType) {
            details.push({
              type: "type_diff",
              sources: srcs,
              expected: majorityType,
              actual: dtype,
            });
          }
        }
      }
      if (missingSources.length) {
        details.push({ type: "missing", sources: missingSources });
      }
      row.details = details;

      return row;
    });

    const activeSources = sourceNames.filter((n) => sourceSchemas[n]);

    results.push({
      tableName: table,
      sources: activeSources,
      rows,
      allColumns,
      errors,
      status: Object.keys(sourceSchemas).length > 0 ? "ok" : "error",
    });
  }

  return NextResponse.json({ results });
}
