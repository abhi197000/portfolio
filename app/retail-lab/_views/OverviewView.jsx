import { Panel, Badge, AgentNote, Controls, Select, Slider } from "../_kit/ui";
import { HBar, Spark } from "../_kit/charts";
import { usd, shortDate } from "../_kit/format";

const REPLEN_STYLES = ["CREW-TEE", "WHITE-TEE", "HOODIE", "SOCKS-3PK", "POLO-TEE", "OXFORD", "SLIM-DENIM"];

export default function OverviewView({ data, params, update, loading, catalog }) {
  const name = (id) => catalog.products.find((p) => p.style_id === id)?.name ?? id;
  const radius = params.transferRadiusKm ?? 60;
  const risks = data.stockouts.slice(0, 6);
  const dead = data.excess.filter((e) => e.verdict === "truly_dead");
  const healthy = data.excess.filter((e) => e.verdict !== "truly_dead");
  const replen = data.replenishment.stores.slice(0, 12);
  const maxQ = Math.max(1, ...replen.map((r) => Math.max(r.static_max, r.tuned_max)));
  // each risk gets its own fix: a worthwhile transfer, else the next DC truck, else a human
  const fix = (s) =>
    s.transfer?.recommended
      ? `move ${s.transfer.units} from ${s.transfer.from_name} (${s.transfer.km} km): ${usd(s.transfer.margin_saved)} of margin saved for ${usd(s.transfer.cost)} of freight`
      : s.options.length
        ? s.options[0].charAt(0).toLowerCase() + s.options[0].slice(1)
        : "flag it to the allocator";

  return (
    <>
      <Controls loading={loading}>
        <Select label="Replenishment style" value={params.replenStyle ?? data.replenishment.style_id} options={REPLEN_STYLES.map((id) => ({ value: id, label: name(id) }))} onChange={(v) => update({ replenStyle: v })} />
        <Slider label="Transfer radius" value={radius} min={10} max={300} step={10} format={(v) => `${v} km`} onChange={(v) => update({ transferRadiusKm: v })} />
      </Controls>

      <AgentNote title="Today's briefing">
        {risks.length ? (
          risks.slice(0, 2).map((s) => (
            <p key={`${s.store_no}-${s.style_id}`}>
              <b>{s.name}</b> runs out of {s.style.toLowerCase()} on <b>{s.runs_out_day}</b>, {s.days_uncovered} days before its truck: {fix(s)}.
            </p>
          ))
        ) : (
          <p>No store runs out before its next delivery.</p>
        )}
        {dead.length > 0 && (
          <p>
            Clear {dead.map((d) => d.name.toLowerCase()).join(", ")} now, while it still has value.
            {healthy.length ? ` Hold ${healthy[0].name.toLowerCase()}: slow, but demand is building.` : ""}
          </p>
        )}
      </AgentNote>

      <div className="lab-grid-2">
        <Panel title="Stockouts before the next truck" sub="On-hand ÷ daily selling rate, against each store's next delivery.">
          <div className="lab-list">
            {risks.map((s) => (
              <article key={`${s.store_no}-${s.style_id}`} className="lab-alert">
                <header>
                  <strong>{s.name}</strong>
                  <span>{s.style}</span>
                </header>
                <div className="lab-race">
                  <div>
                    <small>Runs out</small>
                    <b className="bad">
                      {s.runs_out_day} {shortDate(s.runs_out)}
                    </b>
                  </div>
                  <i aria-hidden="true" />
                  <div>
                    <small>Next truck</small>
                    <b>
                      {s.next_delivery_day} {shortDate(s.next_delivery)}
                    </b>
                  </div>
                </div>
                <p className="lab-meta">
                  {s.on_hand} on hand · {s.weekly_rate}/week · {s.days_uncovered} days uncovered · {usd(s.margin_at_risk)} margin at risk
                </p>
                <div className="lab-tags">
                  {s.options.length ? s.options.map((o) => <Badge key={o} tone="accent">{o}</Badge>) : <Badge tone="warn">No quick fix: flag to the allocator</Badge>}
                </div>
              </article>
            ))}
            {!risks.length && <p className="lab-empty">No store runs out before its next delivery.</p>}
          </div>
        </Panel>

        <Panel title="Transfers, only when the math works" sub={`A store with spare stock within ${radius} km, and margin saved beating the freight.`}>
          <div className="lab-list">
            {data.transfers.map((t) => (
              <article key={`${t.to_store}-${t.style}`} className={`lab-transfer ${t.recommended ? "yes" : "no"}`}>
                <div className="lab-route">
                  <b>{t.from_name}</b>
                  <span>{t.km} km →</span>
                  <b>{t.to_name}</b>
                </div>
                <p className="lab-meta">
                  {t.units} × {t.style} · sender holds {t.sender_weeks_of_cover} weeks · freight {usd(t.cost)} vs margin {usd(t.margin_saved)}
                </p>
                <div className="lab-tags">
                  <Badge tone={t.recommended ? "good" : "bad"}>{t.recommended ? "Transfer" : "Skip"}</Badge>
                  <span className="lab-why">{t.why}</span>
                </div>
              </article>
            ))}
            {!data.transfers.length && <p className="lab-empty">No transfer candidates.</p>}
          </div>
        </Panel>
      </div>

      <Panel title="Excess: slow but healthy, or truly dead" sub="Chain stock ÷ weekly sales, read together with the last six weeks' trend.">
        <div className="lab-grid-2 tight">
          {[
            ["Truly dead", dead, "bad"],
            ["Slow but healthy", healthy, "good"],
          ].map(([title, rows, tone]) => (
            <div key={title}>
              <h3 className="lab-sub">
                <Badge tone={tone}>{title}</Badge>
              </h3>
              {rows.map((e) => (
                <div key={e.style_id} className="lab-excess">
                  <div>
                    <strong>{e.name}</strong>
                    <small>
                      {e.units.toLocaleString("en-US")} units · {e.weeks_of_cover ?? "∞"} weeks of cover · {(e.weekly_sell_through * 100).toFixed(1)}% a week
                    </small>
                    <em>{e.action}</em>
                  </div>
                  <Spark values={e.weekly ?? []} />
                </div>
              ))}
              {!rows.length && <p className="lab-empty">None right now.</p>}
            </div>
          ))}
        </div>
      </Panel>

      <Panel title={`Replenishment: ${data.replenishment.name}`} sub="Today's static max (marker) vs an order-up-to level tuned to each store's own rate and noise (bar). Biggest changes first.">
        {replen.map((r) => (
          <HBar key={r.store_no} label={r.name} sub={`${r.weekly_rate}/week`} value={r.tuned_max} max={maxQ} marker={r.static_max} display={`${r.static_max} → ${r.tuned_max}`} color={r.change > 0 ? "var(--accent)" : "var(--accent-2)"} />
        ))}
      </Panel>
    </>
  );
}
