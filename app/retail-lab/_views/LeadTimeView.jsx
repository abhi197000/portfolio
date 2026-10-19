import { Panel, Badge, AgentNote, Controls, Select, Slider } from "../_kit/ui";
import { HBar } from "../_kit/charts";
import { pct, shortDate } from "../_kit/format";

const STATUS = { ok: ["OK", "g"], watch: ["WATCH", "a"], drifting: ["DRIFTING", "r"] };

// split-flap board text: one cell per character, flipping in one after another
function Flap({ text, width, tone = "", delay = 0 }) {
  const chars = String(text).toUpperCase().padEnd(width, " ").slice(0, width).split("");
  return (
    <span className={`flap ${tone}`}>
      {chars.map((c, i) => (
        <i key={i} style={{ animationDelay: `${delay + i * 0.035}s` }}>
          {c === " " ? " " : c}
        </i>
      ))}
    </span>
  );
}

export default function LeadTimeView({ data, params, update, loading }) {
  const focus = data.vendors.find((v) => v.vendor_id === data.focus.vendor_id);
  const flat = data.focus.flat_rule_days;
  const maxLead = Math.max(...focus.history.map((h) => h.lead), focus.promised + 10);
  const minLead = Math.min(...focus.history.map((h) => h.lead), focus.promised) - 2;
  const x = (d) => `${((d - minLead) / (maxLead + 2 - minLead)) * 100}%`;
  const lanes = [];
  const lanePos = focus.history.map((h) => {
    let n = 0;
    while ((lanes[n] || []).some((o) => Math.abs(o - h.lead) < 1.6)) n += 1;
    (lanes[n] = lanes[n] || []).push(h.lead);
    return n;
  });
  const ex = data.stockout_example;
  const maxBuffer = Math.max(...data.vendors.map((v) => v.buffer_days), flat) + 2;

  return (
    <>
      <Controls loading={loading}>
        <Select label="Vendor" value={params.vendor ?? data.focus.vendor_id} options={data.vendors.map((v) => ({ value: v.vendor_id, label: `${v.name} (${v.country})` }))} onChange={(v) => update({ vendor: v })} />
        <Slider label="Flat safety-stock rule" value={flat} min={3} max={14} step={1} format={(v) => `${v} days`} onChange={(v) => update({ flatRuleDays: v })} />
      </Controls>

      <Panel className="lab-board" title="Arrivals · DC inbound" sub="Promised vs real lead times, last 12 received POs per vendor.">
        <div className="board-head">
          <span>Vendor</span>
          <span>Said</span>
          <span>Real p90</span>
          <span>Range</span>
          <span>Trend</span>
          <span>Status</span>
        </div>
        {data.vendors.map((v, r) => (
          <div key={v.vendor_id} className={`board-row ${v.vendor_id === focus.vendor_id ? "on" : ""}`} onClick={() => update({ vendor: v.vendor_id })}>
            <Flap text={v.name} width={16} delay={r * 0.12} />
            <Flap text={v.promised} width={3} tone="y" delay={r * 0.12 + 0.3} />
            <Flap text={Math.round(v.p90)} width={3} tone={STATUS[v.status][1]} delay={r * 0.12 + 0.4} />
            <Flap text={`${v.min}-${v.max}`} width={5} delay={r * 0.12 + 0.5} />
            <Flap text={v.drift_days >= 3 ? `+${Math.round(v.drift_days)} SINCE AUG` : v.status === "watch" ? "LATE TAIL" : "STEADY"} width={13} delay={r * 0.12 + 0.6} />
            <Flap text={STATUS[v.status][0]} width={8} tone={STATUS[v.status][1]} delay={r * 0.12 + 0.8} />
          </div>
        ))}
      </Panel>

      <AgentNote>
        <p>
          {data.flags.map((f) => (
            <span key={f.vendor_id}>
              <b>{f.name}</b>: {f.why}.{" "}
            </span>
          ))}
          Size each vendor&apos;s buffer to its real spread: {data.vendors.map((v) => `${v.name.split(" ")[0]} ${v.buffer_days}d`).join(" · ")}, instead of {flat} days for everyone.
        </p>
      </AgentNote>

      <Panel title={`${focus.name}: every PO's real arrival`} sub={`Days from order to receipt. Promised ${focus.promised}; dashed = promise + ${focus.buffer_days}-day buffer.`}>
        <div className="lab-runway" style={{ height: 60 + lanes.length * 34 }}>
          <span className="promise" style={{ left: x(focus.promised) }}>
            <em>Promised {focus.promised}</em>
          </span>
          <span className="buffer" style={{ left: x(focus.promised + focus.buffer_days) }} />
          {focus.history.map((h, i) => (
            <span key={h.po_no} className={`plane ${h.late_by >= 7 ? "late" : h.late_by > 1 ? "slow" : ""}`} style={{ left: x(h.lead), bottom: 30 + lanePos[i] * 34, animationDelay: `${i * 0.08}s` }} title={`PO ${h.po_no} · ${h.style_id} · ordered ${shortDate(h.order_date)} · ${h.lead} days`}>
              ✈
            </span>
          ))}
          <div className="axis">
            {Array.from({ length: Math.ceil((maxLead + 2 - minLead) / 5) + 1 }, (_, i) => Math.ceil(minLead / 5) * 5 + i * 5)
              .filter((d) => d <= maxLead + 2)
              .map((d) => (
                <span key={d} style={{ left: x(d) }}>
                  {d}
                </span>
              ))}
          </div>
        </div>
        <div className="lab-tags">
          <Badge tone="neutral">Average {focus.mean} days</Badge>
          <Badge tone="warn">
            Range {focus.min}–{focus.max} days
          </Badge>
          <Badge tone="bad">{pct(focus.week_late_pct)} of POs a week+ late</Badge>
          <Badge tone="good">
            Buffer covers {pct(focus.covered_resized)} of POs (flat {flat}d: {pct(focus.covered_flat)})
          </Badge>
        </div>
      </Panel>

      <div className="lab-grid-2">
        <Panel title="Buffer each vendor really needs" sub={`Bar = p90 − promise + 1 day; marker = the flat ${flat}-day rule.`}>
          {data.vendors.map((v) => (
            <HBar key={v.vendor_id} label={v.name} sub={`${v.daily_demand}/day`} value={v.buffer_days} max={maxBuffer} marker={flat} display={`${v.buffer_days}d ${v.flat_rule_gap > 0 ? `(${v.flat_rule_gap} too many)` : v.flat_rule_gap < 0 ? `(${-v.flat_rule_gap} short)` : ""}`} color={v.flat_rule_gap < 0 ? "var(--bad)" : "var(--good)"} />
          ))}
        </Panel>
        {ex && (
          <Panel title={`What PO ${ex.po_no} did at the DC`} sub="Planned on the promise plus one day of safety stock.">
            <div className="lab-gap">
              <span>
                <small>Promised</small>
                <b>{ex.promised} days</b>
              </span>
              <span>
                <small>Landed</small>
                <b className="bad">{ex.landed} days</b>
              </span>
              <span>
                <small>Out of stock</small>
                <b className="bad">{ex.days_out_of_stock} days</b>
              </span>
              <span>
                <small>Sales lost</small>
                <b>≈ {ex.units_lost.toLocaleString("en-US")}</b>
              </span>
            </div>
            <p className="lab-meta">
              The {(ex.name ?? ex.style_id).toLowerCase()} sells about {ex.daily_demand} units a day across the chain.
            </p>
          </Panel>
        )}
      </div>
    </>
  );
}
