import { Panel, Badge, AgentNote, Controls, Slider } from "../_kit/ui";
import { LineChart } from "../_kit/charts";
import { pct } from "../_kit/format";

const HERO_COLORS = ["var(--accent)", "var(--accent-2)", "#5dd6a0", "#ffad5c", "#ff6b7a"];

export default function FixedPushView({ data, params, update, loading }) {
  const trigger = params.releaseTrigger ?? data.focus.release_trigger;
  const pushPct = params.pushPct ?? data.focus.push_pct;
  const plan = data.plan;
  const days = data.sell_through[0]?.curve.map((_, i) => `Day ${i + 1}`) ?? [];
  const heroes = data.hero_stores;
  const heroSet = new Set(heroes.map((h) => h.store_no));
  const zeroStars = data.release.stores.filter((s) => s.was_zero_demand);
  const totalPlanned = Math.round(plan.dc_total * pushPct);

  return (
    <>
      <Controls loading={loading}>
        <Slider label="Push share of DC stock" value={pushPct} min={0.3} max={0.9} step={0.05} format={(v) => pct(v)} onChange={(v) => update({ pushPct: v })} />
        <Slider label="Release trigger (week-1 sell-through)" value={trigger} min={0.4} max={0.9} step={0.05} format={(v) => pct(v)} onChange={(v) => update({ releaseTrigger: v })} />
      </Controls>

      <AgentNote>
        <p>
          Push <b>{pct(pushPct)}</b> of the {data.focus.name.toLowerCase()} by grade and hold the rest.{" "}
          {data.censored_demand.length ? (
            <>
              Ignore the zero at <b>{data.censored_demand.map((c) => c.name).join(", ")}</b>: no sales, but no stock either.{" "}
            </>
          ) : null}
          After launch week, release <b>{data.release.released.toLocaleString("en-US")}</b> units to the {data.release.stores.length} stores past {pct(trigger)} sell-through
          {zeroStars.length ? `, including ${zeroStars.map((z) => z.name).join(", ")}, the "zero demand" store` : ""}; keep {data.release.kept.toLocaleString("en-US")} back.
        </p>
      </AgentNote>

      <div className="lab-grid-2">
        <Panel title="The push" sub={`${plan.dc_total.toLocaleString("en-US")} units at the DC on launch day.`}>
          <div className="lab-split">
            <i style={{ flex: totalPlanned }}>Push {totalPlanned.toLocaleString("en-US")}</i>
            <i className="hold" style={{ flex: plan.dc_total - totalPlanned }}>Hold {(plan.dc_total - totalPlanned).toLocaleString("en-US")}</i>
          </div>
          <div className="lab-grades">
            {Object.entries(plan.by_grade).map(([g, x]) => (
              <span key={g}>
                <small>
                  Grade {g} · {x.stores} stores
                </small>
                <b>{x.units_each}</b>
                <small>units each</small>
              </span>
            ))}
          </div>
          <p className="lab-note">As a % of DC stock, or the same thing as fixed units per store. Every store opens stocked.</p>
        </Panel>

        <Panel title="“Zero demand” that was zero stock" sub="Read from the like item's history before trusting a zero.">
          {data.censored_demand.map((c) => (
            <article key={c.store_no} className="lab-censor">
              <strong>{c.name}</strong>
              <p>{c.reason}</p>
              <Badge tone="warn">{c.action}</Badge>
            </article>
          ))}
          {!data.censored_demand.length && <p className="lab-empty">No censored stores.</p>}
        </Panel>
      </div>

      <Panel title="Launch week, day by day" sub={`Sell-through of the push in every store; ${heroes.length} stores highlighted. Above the line earns reserve.`}>
        <LineChart
          labels={days}
          yMax={1}
          yFormat={(v) => pct(v)}
          threshold={{ value: trigger, label: `Release trigger ${pct(trigger)}` }}
          series={[
            ...data.sell_through.filter((s) => !heroSet.has(s.store_no)).map((s) => ({ name: s.name, values: s.curve.map((c) => c.sell_through), color: "var(--mute)", faint: true })),
            ...heroes.map((h, i) => ({ name: `${h.name}${h.was_zero_demand ? " (was “zero demand”)" : ""}`, values: h.curve.map((c) => c.sell_through), color: HERO_COLORS[i % HERO_COLORS.length] })),
          ]}
        />
      </Panel>

      <Panel title="Releasing the reserve" sub={`${data.release.reserve.toLocaleString("en-US")} held back; shared by units sold among stores past the trigger, capped at 1.5× their push.`}>
        <div className="lab-release">
          {data.release.stores.map((s) => (
            <div key={s.store_no} className={s.was_zero_demand ? "star" : ""}>
              <strong>{s.name}</strong>
              <small>{pct(s.sell_through)} sold</small>
              <b>+{s.units}</b>
            </div>
          ))}
        </div>
        <p className="lab-note">
          {data.release.holds.length} stores below the trigger hold their push; slowest: {data.release.holds.slice(-3).reverse().map((h) => `${h.name} (${pct(h.sell_through)})`).join(", ")}.
        </p>
      </Panel>
    </>
  );
}
