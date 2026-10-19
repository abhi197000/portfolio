import { Panel, Badge, AgentNote, Controls, Slider } from "../_kit/ui";
import { HBar, Ring } from "../_kit/charts";
import { pct, usd, shortDate } from "../_kit/format";

const EXIT = { flush: ["Flush to stores", "accent"], hold: ["Hold over", "good"], off_price: ["Off-price", "bad"] };

export default function EndOfSeasonView({ data, params, update, loading }) {
  const a = data.assumptions;
  const mix = data.policies.find((p) => p.id === "agent_mix");
  const best = data.policies.filter((p) => p.id !== "agent_mix").sort((x, y) => y.dollars - x.dollars)[0];
  const f = data.focus;

  return (
    <>
      <Controls loading={loading}>
        <Slider label="In-season markdown on a flush" value={params.flushMarkdown ?? a.flush_markdown} min={0.1} max={0.5} step={0.05} format={(v) => pct(v)} onChange={(v) => update({ flushMarkdown: v })} />
        <Slider label="Post-season clearance recovery" value={params.postSeasonClearance ?? a.post_season_clearance} min={0.1} max={0.4} step={0.05} format={(v) => pct(v)} onChange={(v) => update({ postSeasonClearance: v })} />
        <Slider label="Off-price recovery" value={params.offPriceRecovery ?? a.off_price_recovery} min={0.2} max={0.5} step={0.05} format={(v) => pct(v)} onChange={(v) => update({ offPriceRecovery: v })} />
        <Slider label="Holding cost to next season" value={params.holdingCostPct ?? a.holding_cost} min={0.02} max={0.2} step={0.02} format={(v) => pct(v)} onChange={(v) => update({ holdingCostPct: v })} />
      </Controls>

      <div className="lab-eos-top">
        <Panel className="lab-clock">
          <Ring value={1 - f.days_left / 98}>
            <b>{f.days_left}</b>
            <small>days left</small>
          </Ring>
          <div>
            <strong>{f.season} ends {shortDate(f.season_end)}</strong>
            <p>The next season lands {shortDate(f.next_season_start)}, and the DC needs the space.</p>
          </div>
        </Panel>
        <AgentNote>
          <p>
            {data.items.map((i, n) => (
              <span key={i.style_id}>
                {n ? "; " : ""}
                <b>{i.name}</b>: {i.action.toLowerCase()}
              </span>
            ))}
            . The mix recovers <b>{pct(mix.recovery, 1)}</b> of full price: {usd(mix.dollars - best.dollars)} more than &ldquo;{best.label.toLowerCase()}&rdquo;.
          </p>
        </AgentNote>
      </div>

      <div className="lab-cards">
        {data.items.map((i) => (
          <article key={i.style_id} className="lab-exit">
            <header>
              <div>
                <strong>{i.name}</strong>
                <small>
                  {i.dc_units.toLocaleString("en-US")} units in the DC · {usd(i.full_price_value)} at full price{i.carryover ? " · carryover style" : ""}
                </small>
              </div>
              <Badge tone={EXIT[i.best][1]}>{i.action}</Badge>
            </header>
            {Object.entries(i.recovery).map(([k, v]) => (
              <HBar key={k} label={EXIT[k][0]} value={v} max={1} display={pct(v)} color={k === i.best ? "var(--accent)" : "var(--mute)"} />
            ))}
            <p className="lab-reason">{i.reason}</p>
            {i.flush_targets.length > 0 && i.flush_targets.length <= 8 && (
              <div className="lab-tags">
                {i.flush_targets.map((t) => (
                  <Badge key={t.store_no} tone="neutral">
                    {t.name.replace(/^Store \d+ · /, "")} +{t.units}
                  </Badge>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      <Panel title="One rule for everything vs the agent's mix" sub="Share of full-price value recovered across every leftover unit.">
        {data.policies.map((p) => (
          <HBar key={p.id} label={p.label} value={p.recovery} max={1} display={`${pct(p.recovery, 1)} · ${usd(p.dollars)}`} color={p.id === "agent_mix" ? "var(--accent)" : "var(--mute)"} />
        ))}
      </Panel>
    </>
  );
}
