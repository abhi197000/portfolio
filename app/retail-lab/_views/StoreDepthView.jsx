import { Panel, Badge, AgentNote, Controls, Select, Slider } from "../_kit/ui";
import { HBar } from "../_kit/charts";

const DEPTH_STYLES = ["CHINO-KHK", "CHINO-BLK", "WHITE-TEE", "RETRO-RUNNER"];
const METHOD_LABEL = { push: "Fixed push", depth: "Store depth", demand: "Demand-based" };

// a store as a tube: stock on hand, the depth line, and what a delivery would add
function Tube({ r, mode, scale }) {
  const add = mode === "push" ? r.fixed_push : r.depth_send;
  const ohH = r.position * scale;
  const below = Math.max(0, Math.min(r.position + add, Math.max(r.depth, r.position)) - r.position);
  const over = add - below;
  return (
    <div className="lab-tube-col">
      <div className="lab-tube" style={{ height: 200 }}>
        <i className="oh" style={{ height: ohH }} />
        <i className="add" style={{ bottom: ohH, height: below * scale }} />
        <i className="over" style={{ bottom: ohH + below * scale, height: over * scale }} />
        <span className="depth" style={{ bottom: r.depth * scale }} />
      </div>
      <b>{r.name.replace(/^Store /, "S").split(" · ")[0]}</b>
      <small>{mode === "push" ? `+${add}` : `+${add}`}</small>
    </div>
  );
}

export default function StoreDepthView({ data, params, update, loading, catalog }) {
  const name = (id) => catalog.products.find((p) => p.style_id === id)?.name ?? id;
  const k = Object.fromEntries(data.kpis.map((x) => [x.label, x.value]));
  const heroes = data.hero_stores.length ? data.hero_stores : data.comparison.slice(0, 5);
  const scale = 196 / Math.max(...heroes.map((r) => Math.max(r.position + r.fixed_push, r.depth)), 1);
  // too shallow first (those stores run out), then the deepest overstock
  const stale = [
    ...data.staleness.filter((s) => s.status === "too_shallow").sort((a, b) => a.weeks_of_cover - b.weeks_of_cover),
    ...data.staleness.filter((s) => s.status === "too_deep").sort((a, b) => b.weeks_of_cover - a.weeks_of_cover),
  ];
  const flagged = data.methods.filter((m) => m.flagged);
  const tl = data.timeline;
  const lastWeek = 12;

  return (
    <>
      <Controls loading={loading}>
        <Select label="Depth-managed style" value={params.style ?? data.focus.style_id} options={DEPTH_STYLES.map((id) => ({ value: id, label: name(id) }))} onChange={(v) => update({ style: v })} />
        <Slider label="Target weeks of cover" value={params.targetCoverWeeks ?? 6} min={4} max={8} step={1} format={(v) => `${v} wks`} onChange={(v) => update({ targetCoverWeeks: v })} />
      </Controls>

      <AgentNote>
        <p>
          Ship the gap, not the truck: depth sends <b>{k["Store depth: units sent"]?.toLocaleString("en-US")}</b> of {data.focus.delivery_units.toLocaleString("en-US")} units and keeps{" "}
          {k["Store depth: kept at DC"]?.toLocaleString("en-US")} at the DC, where a fixed push of {data.focus.push_each} each would send {k["Fixed push: sent past target"]?.toLocaleString("en-US")} past target and still leave{" "}
          {k["Fixed push: stores still short"]} stores short.
          {flagged.length ? ` Switch ${flagged.map((m) => `${m.name.toLowerCase()} to ${METHOD_LABEL[m.recommended].toLowerCase()}`).join(", ")}.` : ""}
        </p>
      </AgentNote>

      <Panel title={`Same ${data.focus.delivery_units.toLocaleString("en-US")} units, two ways`} sub={`${data.focus.name}. Solid = in store, bright = this delivery, red = sent past the depth line (dashed).`}>
        <div className="lab-grid-2 tight">
          <div>
            <h3 className="lab-sub">
              <Badge tone="bad">Fixed push · {data.focus.push_each} each</Badge>
            </h3>
            <div className="lab-tubes">
              {heroes.map((r) => (
                <Tube key={r.store_no} r={r} mode="push" scale={scale} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="lab-sub">
              <Badge tone="good">Store depth · the gap</Badge>
            </h3>
            <div className="lab-tubes">
              {heroes.map((r) => (
                <Tube key={r.store_no} r={r} mode="depth" scale={scale} />
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <div className="lab-grid-2">
        <Panel title="Depth targets that went stale" sub={`Weeks of cover each target buys at today's rate; healthy is 4–8. Resized to ${params.targetCoverWeeks ?? 6} weeks.`}>
          {stale.slice(0, 10).map((s) => (
            <HBar
              key={s.store_no}
              label={s.name}
              sub={`${s.weekly_rate}/wk · depth ${s.depth} → ${s.suggested_depth}${s.display_min_applied ? " (display min)" : ""}`}
              value={Math.min(s.weeks_of_cover ?? 0, 30)}
              max={30}
              band={[4, 8]}
              display={`${s.weeks_of_cover ?? "–"} wks`}
              color={s.status === "too_shallow" ? "var(--bad)" : "var(--warn)"}
            />
          ))}
          {!stale.length && <p className="lab-empty">Every depth target is in the healthy range.</p>}
        </Panel>

        <Panel title="Which method fits each item" sub="Checked before tonight's run.">
          <div className="lab-methods">
            {data.methods.map((m) => (
              <div key={m.style_id} className={m.flagged ? "flag" : ""}>
                <div>
                  <strong>{m.name}</strong>
                  <small>{m.reason}</small>
                </div>
                <span className="lab-switch">
                  {m.flagged ? <s>{METHOD_LABEL[m.current]}</s> : <em>Keep</em>}
                  <Badge tone={m.recommended === "push" ? "accent" : m.recommended === "depth" ? "good" : "neutral"}>{METHOD_LABEL[m.recommended]}</Badge>
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title={`When to switch: ${tl.name}`} sub={`Launch week ${tl.current_week} today.`}>
        <div className="lab-lane">
          {tl.phases.map((p) => {
            const to = p.to_week ?? lastWeek;
            return (
              <div key={p.method} className={`ph ${p.method}`} style={{ left: `${((p.from_week - 1) / lastWeek) * 100}%`, width: `${((to - p.from_week + 1) / lastWeek) * 100}%` }}>
                {METHOD_LABEL[p.method]}
              </div>
            );
          })}
          {tl.switches.map((s) => (
            <div key={s.week} className="pin" style={{ left: `${((s.week - 1) / lastWeek) * 100}%` }}>
              <span>
                W{s.week}: {s.trigger}
              </span>
            </div>
          ))}
          <div className="now" style={{ left: `${((tl.current_week - 0.5) / lastWeek) * 100}%` }}>
            <span>Today</span>
          </div>
        </div>
        <div className="lab-weeks">
          {Array.from({ length: lastWeek }, (_, i) => (
            <span key={i}>W{i + 1}</span>
          ))}
        </div>
      </Panel>
    </>
  );
}
