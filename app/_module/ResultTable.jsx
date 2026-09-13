export default function ResultTable({ rows, empty = "No rows returned." }) {
  if (!rows || rows.length === 0) {
    return <p className="cc-muted" style={{ fontSize: 13, margin: 0 }}>{empty}</p>;
  }
  const columns = Object.keys(rows[0]);
  return (
    <div className="cc-table-wrap">
      <table className="cc-table">
        <thead>
          <tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => <td key={c}>{row[c] == null ? "null" : String(row[c])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
