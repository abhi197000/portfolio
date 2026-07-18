export async function POST(request) {
  const { token, projectId, datasetId, tableName } = await request.json();

  if (!token || !projectId || !datasetId || !tableName) {
    return Response.json({ error: "Missing required fields." }, { status: 400 });
  }

  const url = `https://bigquery.googleapis.com/bigquery/v2/projects/${encodeURIComponent(projectId)}/datasets/${encodeURIComponent(datasetId)}/tables/${encodeURIComponent(tableName)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return Response.json(
      { error: err.error?.message || `BigQuery API error (${res.status})` },
      { status: res.status },
    );
  }

  const data = await res.json();
  const columns = (data.schema?.fields || []).map((f) => ({
    name: f.name,
    type: f.type,
  }));

  return Response.json({ columns });
}
