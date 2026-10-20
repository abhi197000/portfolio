"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Spark } from "../../_kit/charts";
import { usd } from "../../_kit/format";

function Swatch({ hex, size = 16 }) {
  return <i className="pl-swatch" style={{ background: hex, width: size, height: size }} aria-hidden="true" />;
}

export default function ArticleBoard({ data }) {
  const [filter, setFilter] = useState("all");
  const [dept, setDept] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const order = useMemo(() => Object.keys(data.actions), [data.actions]);
  const rows = useMemo(
    () =>
      data.articles
        .filter((a) => (filter === "all" || a.action === filter) && (dept === "all" || a.department === dept) && `${a.style} ${a.color} ${a.vendor}`.toLowerCase().includes(q.trim().toLowerCase()))
        .sort((x, y) => order.indexOf(x.action) - order.indexOf(y.action) || (y.stake?.usd ?? 0) - (x.stake?.usd ?? 0)),
    [data.articles, filter, dept, q, order]
  );
  const depts = [...new Set(data.articles.map((a) => a.department))].sort();

  return (
    <section className="lab-panel pl-board" id="board">
      <div className="pl-filters">
        <div className="lab-chips" role="group" aria-label="Filter by action">
          <button className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>
            All {data.summary.articles}
          </button>
          {order
            .filter((id) => data.counts[id])
            .map((id) => (
              <button key={id} className={filter === id ? "on" : ""} onClick={() => setFilter(id)}>
                {data.actions[id].label} {data.counts[id]}
              </button>
            ))}
        </div>
        <div className="pl-filter-row">
          <label className="lab-ctl">
            <span>Department</span>
            <select value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="all">All departments</option>
              {depts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="lab-ctl">
            <span>Search</span>
            <input className="pl-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Style, color or vendor" />
          </label>
        </div>
      </div>
      <div className="lab-table-wrap">
        <table className="lab-table pl-table">
          <thead>
            <tr>
              <th>Article</th>
              <th>Action</th>
              <th>Why</th>
              <th>At stake</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => [
              <tr key={a.article_id} className={open === a.article_id ? "on" : ""} onClick={() => setOpen(open === a.article_id ? null : a.article_id)} aria-expanded={open === a.article_id}>
                <td>
                  <span className="pl-cell-art">
                    <Swatch hex={a.hex} />
                    <span>
                      <strong>{a.style}</strong>
                      <small>
                        {a.color} · {a.department}
                      </small>
                    </span>
                  </span>
                </td>
                <td>
                  <span className={`pl-tag sm ch-${a.chapter}`}>{a.label}</span>
                </td>
                <td className="pl-why-td">
                  <div className="pl-cell-why">{a.why}</div>
                </td>
                <td>{a.stake ? usd(a.stake.usd) : "—"}</td>
              </tr>,
              open === a.article_id ? (
                <tr key={`${a.article_id}-x`} className="pl-detail">
                  <td colSpan={4}>
                    <div className="pl-detail-grid">
                      <div>
                        <dl className="pl-ev">
                          {a.evidence.map((e) => (
                            <div key={e.label} className={e.tone}>
                              <dt>{e.label}</dt>
                              <dd>{e.value}</dd>
                            </div>
                          ))}
                        </dl>
                        <p className="pl-rule">Rule: {a.rule}</p>
                        {a.also.length > 0 && <p className="pl-also">Also: {a.also.join(" · ")}</p>}
                      </div>
                      <div className="pl-detail-side">
                        <small>Weekly sales, last {a.weekly.length} weeks</small>
                        <Spark values={a.weekly} width={220} height={54} />
                        {a.use_case && (
                          <Link href={`/retail-lab/${a.use_case}`} className="pl-band-go">
                            Open the agent →
                          </Link>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : null,
            ])}
          </tbody>
        </table>
        {!rows.length && <p className="lab-empty">No articles match.</p>}
      </div>
    </section>
  );
}
