import { Panel, Badge, AgentNote, Controls } from "../_kit/ui";
import { Spark } from "../_kit/charts";

export default function AvgPerStoreView({ data, params, update, loading, catalog }) {
  const selected = params.styles ?? data.items.map((i) => i.style_id);
  const toggle = (id) => {
    const next = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
    if (next.length) update({ styles: next });
  };
  const forecast = data.items.filter((i) => i.method === "forecast");
  const avg = data.items.filter((i) => i.method === "avg_per_store");
  const stores = data.focus.stores;

  return (
    <>
      <Controls loading={loading}>
        <div className="lab-ctl wide">
          <span>Items to check before the next allocation run</span>
          <div className="lab-chips">
            {catalog.products.map((p) => (
              <button key={p.style_id} type="button" className={selected.includes(p.style_id) ? "on" : ""} onClick={() => toggle(p.style_id)}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </Controls>

      <AgentNote>
        <p>
          {forecast.length ? (
            <>
              Let the forecast lead for <b>{forecast.map((i) => i.name.toLowerCase()).join(", ")}</b>.{" "}
            </>
          ) : null}
          {avg.length ? (
            <>
              Use an average per store for <b>{avg.map((i) => i.name.toLowerCase()).join(", ")}</b>: their history can&apos;t carry a forecast yet.
            </>
          ) : (
            "Every item here has enough clean history for a forecast."
          )}
        </p>
      </AgentNote>

      <div className="lab-cards">
        {data.items.map((i) => (
          <article key={i.style_id} className="lab-card3d">
            <header>
              <div>
                <strong>{i.name}</strong>
                <small>{i.lifecycle}</small>
              </div>
              <Badge tone={i.method === "forecast" ? "good" : "accent"}>{i.method === "forecast" ? "Forecast" : "Avg per store"}</Badge>
            </header>
            <p className="lab-reason">{i.reason}</p>
            <div className="lab-signal">
              <span>
                <b>{i.signal.history_weeks}</b>weeks history
              </span>
              <span>
                <b>{i.signal.stockout_weeks_last10}</b>stockout weeks /10
              </span>
              <span>
                <b>{Math.round(i.signal.variability * 100)}%</b>variability
              </span>
              <span>
                <b>{i.signal.dc_units.toLocaleString("en-US")}</b>DC units
              </span>
            </div>
            <Spark values={i.weekly_history.map((w) => w.units)} width={260} height={46} marks={i.weekly_history.map((w) => w.stockout_stores >= 0.3 * stores)} />
            <div className="lab-grades">
              {["A", "B", "C"].map((g) => (
                <span key={g}>
                  <small>Grade {g}</small>
                  <b>{i.per_store_by_grade[g]}</b>
                </span>
              ))}
              <span className="total">
                <small>Total</small>
                <b>{i.total_units.toLocaleString("en-US")}</b>
              </span>
            </div>
            <p className="lab-meta">Units per store for {data.focus.cover_weeks} weeks · basis: {i.basis}</p>
          </article>
        ))}
      </div>
      <Panel className="lab-legend-panel">
        <p className="lab-note">Sparklines show 26 weeks of chain sales; shaded weeks are when 30%+ of stores had stocked out, so sales there say little about demand.</p>
      </Panel>
    </>
  );
}
