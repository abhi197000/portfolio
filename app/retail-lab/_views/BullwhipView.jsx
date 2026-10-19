import { Panel, Badge, AgentNote, Controls, Select, Slider } from "../_kit/ui";
import { LineChart, HBar } from "../_kit/charts";
import { PEOPLE_DEFS, person } from "../_kit/people";
import { pct, shortDate, signedPct } from "../_kit/format";

const STYLES = [
  ["HOODIE", "Core fleece hoodie"],
  ["CREW-TEE", "Core crew tee (calm for contrast)"],
];

function Person({ who, h, gesture, mood }) {
  // person() builds trusted, static SVG markup from our own palette, no user input
  return <span className="lab-person" dangerouslySetInnerHTML={{ __html: person(who, { h, g: gesture, gd: 0.8, mood }) }} />;
}

export default function BullwhipView({ data, params, update, loading }) {
  const v = data.variability;
  const s = data.series;
  const growth = s.length ? s.slice(-3).reduce((a, w) => a + w.pos, 0) / s.slice(0, 3).reduce((a, w) => a + w.pos, 0) - 1 : 0;
  const peak = s.reduce((m, w) => (w.store_orders > m.store_orders ? w : m), s[0]);
  const po = data.po_check;
  const chain = [
    { who: "shopper", role: "Shoppers", stat: signedPct(growth), note: "change in sales", gesture: "wave", tone: "good" },
    { who: "store", role: "Store orders", stat: pct(v.store_orders), note: "week-to-week swing", gesture: "point", tone: "warn" },
    { who: "dc", role: "DC orders", stat: pct(v.dc_orders), note: "week-to-week swing", gesture: "point", tone: "bad", mood: "worry" },
    { who: "vendor", role: "Vendor", stat: po ? po.drafted_qty.toLocaleString("en-US") : "—", note: po ? "units on the draft PO" : "no draft PO", tone: "bad", mood: "o" },
  ];

  return (
    <>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs dangerouslySetInnerHTML={{ __html: PEOPLE_DEFS }} />
      </svg>

      <Controls loading={loading}>
        <Select label="Style" value={params.style ?? data.focus.style_id} options={STYLES.map(([value, label]) => ({ value, label }))} onChange={(x) => update({ style: x })} />
        <Slider label="PO order cycle" value={params.coverWeeks ?? 4} min={2} max={8} step={1} format={(x) => `${x} weeks`} onChange={(x) => update({ coverWeeks: x })} />
      </Controls>

      <Panel className="lab-cast-panel">
        <div className="lab-cast">
          {chain.map((c, i) => (
            <div key={c.who} className="lab-cast-member">
              <span className={`lab-stat ${c.tone}`} style={{ fontSize: `${1.1 + i * 0.22}rem` }}>
                {c.stat}
              </span>
              <Person who={c.who} h={210} gesture={c.gesture} mood={c.mood} />
              <strong>{c.role}</strong>
              <small>{c.note}</small>
            </div>
          ))}
        </div>
        <p className="lab-note">Every link reacts to the order in front of it, not to the shopper.</p>
      </Panel>

      <div className="lab-grid-2">
        <Panel title="Shoppers vs store orders vs DC orders" sub={`${data.focus.name}, last ${s.length} weeks, units.`}>
          <LineChart
            labels={s.map((w) => shortDate(w.week_start))}
            series={[
              { name: "Shopper sales (POS)", values: s.map((w) => w.pos), color: "var(--good)" },
              { name: "Store orders to DC", values: s.map((w) => w.store_orders), color: "var(--accent)" },
              { name: "DC orders to vendor", values: s.map((w) => w.dc_orders), color: "var(--navy)", dashed: true },
            ]}
          />
        </Panel>
        <Panel title="How hard each link swings" sub="Week-to-week variability (standard deviation ÷ mean).">
          <HBar label="Shoppers" value={v.shoppers} max={Math.max(v.dc_orders, 0.01)} display={pct(v.shoppers, 1)} color="var(--good)" />
          <HBar label="Store orders" value={v.store_orders} max={Math.max(v.dc_orders, 0.01)} display={pct(v.store_orders, 1)} color="var(--accent)" />
          <HBar label="DC orders" value={v.dc_orders} max={Math.max(v.dc_orders, 0.01)} display={pct(v.dc_orders, 1)} color="var(--bad)" />
          <h3 className="lab-sub">Why store orders jumped the week of {shortDate(peak.week_start)}</h3>
          <ul className="lab-bullets">
            {data.echo_reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
            {data.watch && <li className="watch">{data.watch}</li>}
          </ul>
        </Panel>
      </div>

      {po ? (
        <AgentNote title={`PO ${po.po_no} · ${data.focus.name} · ${po.vendor_id}`}>
          <div className="lab-po">
            <span>
              <small>Drafted from store orders</small>
              <s>{po.drafted_qty.toLocaleString("en-US")}</s>
            </span>
            <span>
              <small>Agent&apos;s suggestion</small>
              <b>{po.suggested_qty.toLocaleString("en-US")}</b>
            </span>
            <Badge tone={po.delta < 0 ? "good" : "warn"}>
              {po.delta > 0 ? "+" : ""}
              {po.delta.toLocaleString("en-US")} units
            </Badge>
          </div>
          <p className="lab-meta">{po.basis}. Forecast shared with the vendor, so their line plans to it too.</p>
        </AgentNote>
      ) : (
        <AgentNote>
          <p>No draft PO for this style: store orders are tracking shopper sales, so there&apos;s no echo to correct.</p>
        </AgentNote>
      )}
    </>
  );
}
