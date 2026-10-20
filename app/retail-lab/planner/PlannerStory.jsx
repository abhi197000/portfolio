"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PEOPLE_DEFS, person } from "../_kit/people";
import { Spark } from "../_kit/charts";
import { usd, shortDate } from "../_kit/format";

const CHAPTER_TONE = { inbound: "#ff8a3d", launch: "#5b6cff", season: "#3346d3", stores: "#12a59a", on_track: "#c9b8a6" };

function Swatch({ hex, size = 18 }) {
  return <i className="pl-swatch" style={{ background: hex, width: size, height: size }} aria-hidden="true" />;
}

function Evidence({ items }) {
  return (
    <dl className="pl-ev">
      {items.map((e) => (
        <div key={e.label} className={e.tone}>
          <dt>{e.label}</dt>
          <dd>{e.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ArticleCard({ a }) {
  return (
    <article className="pl-card" id={`a-${a.article_id}`}>
      <header>
        <Swatch hex={a.hex} />
        <div className="pl-card-name">
          <strong>{a.style}</strong>
          <small>
            {a.color} · {a.vendor}
          </small>
        </div>
      </header>
      <div className="pl-tagrow">
        <span className="pl-tag">{a.label}</span>
        <span className="pl-spark" title={`Weekly sales, last ${a.weekly.length} weeks`}>
          <Spark values={a.weekly} width={78} height={24} />
        </span>
      </div>
      <p className="pl-why">{a.why}</p>
      <Evidence items={a.evidence} />
      <footer>
        {a.stake && <b className="pl-stake">{a.stake.text}</b>}
        {a.also.length > 0 && <small className="pl-also">Also: {a.also.join(" · ")}</small>}
        <small className="pl-rule">Rule: {a.rule}</small>
      </footer>
    </article>
  );
}

function Video({ id, label }) {
  return (
    <figure className="pl-video">
      {/* compressed web cut of the LinkedIn video; loads only when played */}
      <video src={`/videos/${id}.mp4`} poster={`/videos/${id}.jpg`} controls muted playsInline preload="none" aria-label={`${label} video`} />
    </figure>
  );
}

// one band per use case inside a chapter, wearing that video's theme
function Band({ useCase, articles, look }) {
  return (
    <div className={`pl-band ${look.theme}`}>
      <div className="pl-band-side">
        <p className="pl-band-n">
          <span>{String(look.n).padStart(2, "0")}</span>
          {look.video}
        </p>
        <h3>{look.title}</h3>
        <Video id={useCase} label={look.video} />
        <Link href={`/retail-lab/${useCase}`} className="pl-band-go">
          Open the agent →
        </Link>
      </div>
      <div className="pl-band-cards">
        {articles.map((a) => (
          <ArticleCard key={a.article_id} a={a} />
        ))}
      </div>
    </div>
  );
}

function Chapter({ ch, looks }) {
  // actions that share a use case (e.g. flush / hold / off-price) share one band and one video
  const bands = [];
  for (const g of ch.groups) {
    const key = g.use_case ?? "on_track";
    let b = bands.find((x) => x.key === key);
    if (!b) bands.push((b = { key, articles: [] }));
    b.articles.push(...g.articles);
  }
  return (
    <section className={`pl-chapter ch-${ch.id}`} id={ch.id} style={{ "--ch": CHAPTER_TONE[ch.id] }}>
      <div className="pl-ch-head">
        <span className="pl-ch-n">{ch.n}</span>
        <div>
          <p className="pl-ch-kicker">{ch.kicker}</p>
          <h2>{ch.title}</h2>
          <p>{ch.intro}</p>
        </div>
        <b className="pl-ch-count">
          {ch.count} <small>article{ch.count === 1 ? "" : "s"}</small>
        </b>
      </div>
      {ch.id === "on_track" ? (
        <div className="pl-calm">
          {bands[0]?.articles.map((a) => (
            <div key={a.article_id} className="pl-calm-row" title={a.why}>
              <Swatch hex={a.hex} size={14} />
              <span>
                {a.style} · {a.color}
              </span>
              <small>{a.stats.weeks_of_cover ?? "—"} wks cover</small>
            </div>
          ))}
        </div>
      ) : (
        bands.map((b) => <Band key={b.key} useCase={b.key} articles={b.articles} look={looks[b.key]} />)
      )}
    </section>
  );
}

function Board({ data, filter, setFilter }) {
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
      <div className="lab-panel-head">
        <div>
          <h2>Every article, one list</h2>
          <p>All {data.summary.articles} articles, most urgent action first. Open a row for the evidence and the rule that tagged it.</p>
        </div>
      </div>
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
                    <Swatch hex={a.hex} size={16} />
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
                        <Evidence items={a.evidence} />
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

export default function PlannerStory({ data, looks }) {
  const [filter, setFilter] = useState("all");
  const s = data.summary;
  const p = data.persona;
  const pick = (id) => {
    setFilter(id);
    document.getElementById("board")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const byChapter = data.chapters.map((c) => ({ id: c.id, title: c.title, count: c.count }));
  const inbound = data.chapters.find((c) => c.id === "inbound");

  return (
    <>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs dangerouslySetInnerHTML={{ __html: PEOPLE_DEFS }} />
      </svg>
      <section className="lab-hero pl-hero">
        <div>
          <p className="lab-kicker">
            <span>★</span>A planner&apos;s Monday · {shortDate(data.as_of)}, 2026
          </p>
          <h1>
            {s.articles} articles. One Monday. <em>Every tag backed by data.</em>
          </h1>
          <p className="lab-intro">
            The nine videos, as one working morning. Every article {p.name.split(" ")[0]} manages is checked against the same rules as the agents in the Retail Lab, and tagged with the one action it needs most. Every tag shows the numbers that triggered it.
          </p>
        </div>
        <div className="pl-persona">
          {/* person() builds trusted, static SVG markup from our own palette, no user input */}
          <span className="lab-person" dangerouslySetInnerHTML={{ __html: person("dc", { h: 190, g: "wave", gd: 0.6 }) }} />
          <div>
            <strong>{p.name}</strong>
            <span>{p.role}</span>
            <small>{p.team}</small>
            <small>{p.scope}</small>
          </div>
        </div>
      </section>

      <div className="lab-agent pl-brief">
        <span className="lab-orb" aria-hidden="true">
          <i />
          <i />
        </span>
        <div>
          <strong>This morning&apos;s briefing</strong>
          <p>
            Good morning, {p.name.split(" ")[0]}. <b>{s.need_action}</b> of your {s.articles} articles need a decision today, across {s.kinds} kinds of action, with about <b>{usd(s.at_stake)}</b> riding on them. Start upstream: {inbound?.count ?? 0} articles are tied to trucks and POs that move this week. {s.on_track} are on track and need nothing.
          </p>
          <div className="pl-mix" role="img" aria-label={byChapter.map((c) => `${c.title}: ${c.count}`).join(", ")}>
            {byChapter.map((c) => (
              <a key={c.id} href={`#${c.id}`} style={{ flexGrow: c.count, background: CHAPTER_TONE[c.id] }} title={`${c.title}: ${c.count}`}>
                <span>{c.count}</span>
              </a>
            ))}
          </div>
          <div className="pl-mix-key">
            {byChapter.map((c) => (
              <a key={c.id} href={`#${c.id}`}>
                <i style={{ background: CHAPTER_TONE[c.id] }} />
                {c.title}
              </a>
            ))}
          </div>
          <div className="lab-chips pl-actions">
            {Object.keys(data.actions)
              .filter((id) => data.counts[id] && id !== "on_track")
              .map((id) => (
                <button key={id} onClick={() => pick(id)}>
                  {data.actions[id].label} <b>{data.counts[id]}</b>
                </button>
              ))}
          </div>
        </div>
      </div>

      {data.chapters.map((ch) => (
        <Chapter key={ch.id} ch={ch} looks={looks} />
      ))}

      <Board data={data} filter={filter} setFilter={setFilter} />

      <section className="lab-panel lab-how">
        <div className="lab-panel-head">
          <div>
            <h2>How the tags are decided</h2>
            <p>Each article is checked against these rules in order. The first one its numbers meet sets the tag; any later ones show as &ldquo;also&rdquo;.</p>
          </div>
        </div>
        <ol>
          <li>Inbound: cross-dock what this week&apos;s trucks carry for stores that would run thin; trim draft POs sized on store orders back to shopper demand; raise the DC buffer when a drifting vendor&apos;s real lead time outlasts the stock.</li>
          <li>Launches: campaigns and launches start on a fixed push; items with no usable history are allocated on an average per store.</li>
          <li>Season end: every unit left in the DC gets the exit (flush, hold or off-price) that recovers the most.</li>
          <li>
            Stores: mark down a color holding {data.rules.markdown.cover}+ weeks of cover while its share of sales falls; allocate on store size curves and fill to depth where those methods fit; chase a color gaining share with too little stock; transfer or pull forward when a store runs out before its truck.
          </li>
          <li>Colors split their style&apos;s sales by each color&apos;s mix (tilted toward warm or cold stores and trending week to week) and its stock by stock mix, so every color adds back up to its style.</li>
        </ol>
      </section>
    </>
  );
}
