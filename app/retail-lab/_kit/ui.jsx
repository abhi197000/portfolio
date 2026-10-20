import Link from "next/link";
import { LAB, LAB_ORDER } from "../content";
import { fmt, shortDate } from "./format";

// The themed page frame: a per-theme backdrop, a top bar, and the footer note.
export function Shell({ theme, children, active, source, asOf }) {
  return (
    <div className={`lab ${theme}`}>
      <div className="lab-bd" aria-hidden="true">
        <i className="bd1" />
        <i className="bd2" />
        <i className="bd3" />
        <div className="bd-floor" />
      </div>
      <header className="lab-top">
        <Link href="/" className="lab-home">← Abhimanyu Sheoran</Link>
        <Link href="/retail-lab" className="lab-brand">
          <span className="lab-brand-dot" />Agentic Retail Lab
        </Link>
        {source && <span className={`lab-source ${source}`}>{source === "supabase" ? "Live from Supabase" : "Demo data"}</span>}
      </header>
      {active && <UseCaseNav active={active} />}
      <main className="lab-main">{children}</main>
      <footer className="lab-foot">
        <p>
          <strong>Cobalt Lane Apparel</strong> is a fictional US retailer. Every store, vendor and number is generated demo data
          {asOf ? `, as of ${shortDate(asOf)}, 2026` : ""}. The agents are deterministic decision rules, so the same data always gives the same answer.
        </p>
      </footer>
    </div>
  );
}

export function UseCaseNav({ active }) {
  return (
    <nav className="lab-nav" aria-label="Use cases">
      <Link href="/retail-lab/planner" className={`lab-nav-story ${active === "planner" ? "on" : ""}`} aria-current={active === "planner" ? "page" : undefined}>
        <b>★</b>A planner&apos;s Monday
      </Link>
      {LAB_ORDER.map((id) => (
        <Link key={id} href={`/retail-lab/${id}`} className={id === active ? "on" : ""} aria-current={id === active ? "page" : undefined}>
          <b>{String(LAB[id].n).padStart(2, "0")}</b>
          {LAB[id].video}
        </Link>
      ))}
    </nav>
  );
}

export function Hero({ id, question }) {
  const c = LAB[id];
  return (
    <section className="lab-hero">
      <p className="lab-kicker">
        <span>{String(c.n).padStart(2, "0")}</span>
        {c.kicker}
      </p>
      <h1>
        {c.title[0]}
        <em>{c.title[1]}</em>
      </h1>
      <p className="lab-intro">{c.intro}</p>
      {question && <p className="lab-question"><span>The question</span>{question}</p>}
    </section>
  );
}

export function Kpis({ items }) {
  return (
    <div className="lab-kpis">
      {items.map((k) => (
        <div key={k.label} className="lab-kpi">
          <b>{fmt(k.value, k.format)}</b>
          <span>{k.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Panel({ title, sub, children, className = "", aside }) {
  return (
    <section className={`lab-panel ${className}`}>
      {(title || aside) && (
        <div className="lab-panel-head">
          <div>
            {title && <h2>{title}</h2>}
            {sub && <p>{sub}</p>}
          </div>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Badge({ tone = "neutral", children }) {
  return <span className={`lab-badge ${tone}`}>{children}</span>;
}

// the agent's voice: a small orb and its recommendation
export function AgentNote({ title = "The agent recommends", children }) {
  return (
    <div className="lab-agent">
      <span className="lab-orb" aria-hidden="true">
        <i />
        <i />
      </span>
      <div>
        <strong>{title}</strong>
        <div>{children}</div>
      </div>
    </div>
  );
}

export function HowItDecides({ id }) {
  return (
    <Panel title="How the agent decides" className="lab-how">
      <ol>
        {LAB[id].how.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ol>
    </Panel>
  );
}

export function PrevNext({ id }) {
  const i = LAB_ORDER.indexOf(id);
  const prev = LAB_ORDER[i - 1];
  const next = LAB_ORDER[i + 1];
  return (
    <div className="lab-prevnext">
      {prev ? <Link href={`/retail-lab/${prev}`}>← {LAB[prev].video}</Link> : <Link href="/retail-lab">← All use cases</Link>}
      {next ? <Link href={`/retail-lab/${next}`}>{LAB[next].video} →</Link> : <Link href="/retail-lab">All use cases →</Link>}
    </div>
  );
}

// ---- controls (used inside client views) ----

export function Select({ label, value, options, onChange }) {
  return (
    <label className="lab-ctl">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Slider({ label, value, min, max, step, onChange, format = (v) => v }) {
  return (
    <label className="lab-ctl">
      <span>
        {label} <b>{format(value)}</b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function Controls({ children, loading }) {
  return (
    <div className={`lab-controls ${loading ? "is-loading" : ""}`}>
      <span className="lab-controls-tag">Try it{loading ? " · running…" : ""}</span>
      {children}
    </div>
  );
}
