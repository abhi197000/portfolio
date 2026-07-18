export async function POST(request) {
  const { token, billingProject, query, location } = await request.json();

  if (!token || !billingProject || !query) {
    return Response.json({ error: "Missing required fields." }, { status: 400 });
  }

  const url = `https://bigquery.googleapis.com/bigquery/v2/projects/${encodeURIComponent(billingProject)}/queries`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      useLegacySql: false,
      location: location || "US",
      maxResults: 200,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return Response.json(
      { error: err.error?.message || `BigQuery API error (${res.status})` },
      { status: res.status },
    );
  }

  const data = await res.json();
  const fields = data.schema?.fields || [];
  const rows = (data.rows || []).map((row) => {
    const obj = {};
    row.f.forEach((cell, i) => {
      obj[fields[i].name] = cell.v;
    });
    return obj;
  });

  return Response.json({
    columns: fields.map((f) => f.name),
    rows,
    totalRows: parseInt(data.totalRows || "0", 10),
  });
}
