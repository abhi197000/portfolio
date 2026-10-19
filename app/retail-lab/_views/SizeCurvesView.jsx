import { Panel, Badge, AgentNote, Controls, Select, Slider } from "../_kit/ui";
import { Columns } from "../_kit/charts";

const METHOD = { chain: ["Chain curve", "neutral"], own: ["Own curve", "accent"], cluster: ["Cluster curve", "warn"] };

export default function SizeCurvesView({ data, params, update, loading }) {
  const sizes = data.focus.sizes;
  const store = data.stores.find((s) => s.store_no === data.focus.store_no);
  const target = store.method === "own" ? store.curve : store.method === "cluster" ? store.cluster_curve : data.chain_curve;
  const units = params.allocateUnits ?? data.focus.allocate_units;
  const byStore = [...data.stores].sort((a, b) => a.store_no - b.store_no);
  const pctFmt = (v) => `${Math.round(v * 100)}%`;
  const gaps = data.reshape.by_size.filter((s) => s.gap_if_chain !== 0);

  return (
    <>
      <Controls loading={loading}>
        <Select label="Store" value={String(data.focus.store_no)} options={byStore.map((s) => ({ value: String(s.store_no), label: `${s.name} · ${METHOD[s.method][0]}` }))} onChange={(v) => update({ store: Number(v) })} />
        <Slider label="Units to allocate" value={units} min={12} max={96} step={6} onChange={(v) => update({ allocateUnits: v })} />
      </Controls>

      <AgentNote>
        <p>
          <b>{store.name}</b>: {store.reason.charAt(0).toLowerCase() + store.reason.slice(1)}. Allocate {units} units on the <b>{METHOD[store.method][0].toLowerCase()}</b>
          {gaps.length ? `; the chain ratio would get ${gaps.map((g) => `${g.size} ${g.gap_if_chain > 0 ? `+${g.gap_if_chain}` : g.gap_if_chain}`).join(", ")} wrong.` : ", which matches what the chain ratio would send."}
        </p>
      </AgentNote>

      <div className="lab-grid-2">
        <Panel title={`Size mix: chain vs ${store.name}`} sub={`${data.focus.name}, last 13 weeks of sales by size.`} aside={<Badge tone={METHOD[store.method][1]}>{METHOD[store.method][0]}</Badge>}>
          <Columns
            format={pctFmt}
            max={Math.max(...data.chain_curve, ...target) * 1.1}
            groups={sizes.map((sz, i) => ({
              label: sz,
              values: [
                { name: "Chain", value: data.chain_curve[i], color: "var(--tan)" },
                { name: store.method === "cluster" ? "Region" : "Store", value: target[i], color: "var(--accent)" },
              ],
            }))}
          />
          <p className="lab-note">
            <i className="sw tan" /> chain curve <i className="sw acc" /> {store.method === "cluster" ? "region curve (borrowed)" : "this store"}
          </p>
        </Panel>

        <Panel title={`Reshape ${units} units`} sub="What each curve would send, against what the store actually sells.">
          <Columns
            groups={data.reshape.by_size.map((s) => ({
              label: s.size,
              values: [
                { name: "Chain ratio", value: s.chain_ratio, color: "var(--tan)" },
                { name: "Agent", value: s.store_curve, color: "var(--accent)" },
                { name: "Demand", value: s.demand, color: "var(--accent-2)" },
              ],
            }))}
          />
          <p className="lab-note">
            <i className="sw tan" /> chain ratio <i className="sw acc" /> agent&apos;s curve <i className="sw acc2" /> store demand
          </p>
        </Panel>
      </div>

      <Panel title="Every store's curve" sub="Sorted by how far each store sits from the chain curve. Pick one to reshape.">
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th>Store</th>
                <th>13-wk units</th>
                <th>Size mix ({sizes.join(" ")})</th>
                <th>Distance</th>
                <th>Curve</th>
              </tr>
            </thead>
            <tbody>
              {data.stores.map((s) => (
                <tr key={s.store_no} className={s.store_no === store.store_no ? "on" : ""} onClick={() => update({ store: s.store_no })}>
                  <td>
                    <strong>{s.name}</strong>
                    <small>{s.reason}</small>
                  </td>
                  <td>{s.total_13w}</td>
                  <td>
                    <span className="lab-mini">
                      {s.curve.map((c, i) => (
                        <i key={i} style={{ height: `${Math.max(4, c * 120)}%` }} />
                      ))}
                    </span>
                  </td>
                  <td>{Math.round(s.distance * 100)}%</td>
                  <td>
                    <Badge tone={METHOD[s.method][1]}>{METHOD[s.method][0]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {data.broken_sizes.length > 0 && (
        <Panel title="Broken size runs" sub="Plenty of stock, but a core size is gone: the customer who wants it leaves empty-handed.">
          <div className="lab-cards">
            {data.broken_sizes.map((b) => (
              <article key={b.store_no} className="lab-broken">
                <strong>{b.name}</strong>
                <small>{b.on_hand} units on hand</small>
                <div className="lab-sizes">
                  {Object.entries(b.by_size).map(([sz, u]) => (
                    <span key={sz} className={u === 0 ? "zero" : ""}>
                      <small>{sz}</small>
                      <b>{u}</b>
                    </span>
                  ))}
                </div>
                <Badge tone="bad">Missing {b.missing.join(" and ")}</Badge>
              </article>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
