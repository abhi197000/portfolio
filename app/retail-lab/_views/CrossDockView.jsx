import { useState } from "react";
import { Panel, Badge, AgentNote, Controls, Select, Slider } from "../_kit/ui";
import { shortDate } from "../_kit/format";

const CALL = {
  cross_dock: ["Cross-dock", "accent"],
  split: ["Split", "warn"],
  top_up: ["Top up a few", "neutral"],
  put_away: ["Put away", "neutral"],
};
const n = (v) => v.toLocaleString("en-US");

// ---- the DC as an isometric engineering drawing (same projection as the video) ----
const C30 = 0.8660254;
const iso = (x, y, z = 0) => [(x - y) * C30, (x + y) * 0.5 - z];
const P = (x, y, z = 0) => iso(x, y, z).map((v) => v.toFixed(1)).join(" ");
const poly = (pts, close = true) => "M" + pts.map((p) => P(...p)).join(" L") + (close ? " Z" : "");
const W = 560;
const D = 340;
const IN_X = 133;

function Box({ x, y, z = 0, w, d, h, className }) {
  return (
    <g className={className}>
      <path d={poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]])} />
      <path d={poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]])} />
      <path className="top" d={poly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]])} />
    </g>
  );
}

// keyframes that carry a carton along world waypoints at an even pace, fading in and out
function route(name, pts) {
  const s = pts.map((p) => iso(...p));
  const seg = s.slice(1).map((q, i) => Math.hypot(q[0] - s[i][0], q[1] - s[i][1]));
  const tot = seg.reduce((a, b) => a + b, 0);
  let acc = 0;
  const frames = s.map((q, i) => {
    if (i) acc += seg[i - 1];
    const at = 4 + (acc / tot) * 84;
    return `${at.toFixed(1)}%{transform:translate(${q[0].toFixed(1)}px,${q[1].toFixed(1)}px)}`;
  });
  const [a, b] = [s[0], s[s.length - 1]];
  return `@keyframes ${name}{0%{opacity:0;transform:translate(${a[0].toFixed(1)}px,${a[1].toFixed(1)}px)}4%{opacity:1}${frames.join("")}88%{opacity:1}100%{opacity:0;transform:translate(${b[0].toFixed(1)}px,${b[1].toFixed(1)}px)}}`;
}
const XD = [[IN_X, D + 40, 16], [IN_X, D - 20, 0], [IN_X, 280, 0], [W - 30, 280, 0], [W + 50, 280, 16]];
const PA = [[IN_X, D + 40, 16], [IN_X, D - 20, 0], [IN_X, 190, 0], [330, 190, 0], [330, 166, 0], [330, 148, 18]];
const KEYFRAMES = route("xd-b", XD) + route("xd-a", PA);
const line = (pts) => "M" + pts.map((p) => P(...p)).join(" L");

function Carton({ tone, delay }) {
  return (
    <g className={`xd-ctn ${tone}`} style={{ animation: `${tone === "b" ? "xd-b" : "xd-a"} 4.2s linear ${delay}s infinite` }}>
      <path d={poly([[-9, 9, 0], [9, 9, 0], [9, 9, 14], [-9, 9, 14]])} />
      <path className="side" d={poly([[9, -9, 0], [9, 9, 0], [9, 9, 14], [9, -9, 14]])} />
      <path className="top" d={poly([[-9, -9, 14], [9, -9, 14], [9, 9, 14], [-9, 9, 14]])} />
    </g>
  );
}

function DcDrawing({ share, dc }) {
  const total = 9;
  const b = share > 0 ? Math.max(1, Math.round(share * total)) : 0;
  const cartons = Array.from({ length: total }, (_, i) => ({ tone: i < b ? "b" : "a", delay: -((i * 4.2) / total) }));
  return (
    <svg className="xd-dc" viewBox="-370 -110 930 640" role="img" aria-label={`Cutaway of the ${dc}: inbound dock, reserve racks and store doors, with cartons moving on both routes`}>
      <style>{KEYFRAMES}</style>
      <path className="xd-floor" d={poly([[0, 0, 0], [W, 0, 0], [W, D, 0], [0, D, 0]])} />
      {Array.from({ length: 13 }, (_, i) => (
        <path key={`x${i}`} className="xd-thin" d={poly([[40 * (i + 1), 0, 0], [40 * (i + 1), D, 0]], false)} />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <path key={`y${i}`} className="xd-thin" d={poly([[0, 40 * (i + 1), 0], [W, 40 * (i + 1), 0]], false)} />
      ))}
      <path className="xd-stage" d={poly([[150, 248, 0], [W - 14, 248, 0], [W - 14, 310, 0], [150, 310, 0]])} />
      <path className="xd-wall" d={poly([[0, 0, 0], [W, 0, 0], [W, 0, 70], [0, 0, 70]])} />
      <path className="xd-wall" d={poly([[0, 0, 0], [0, D, 0], [0, D, 70], [0, 0, 70]])} />
      {[26, 78, 130].map((ry) => (
        <g key={ry}>
          <Box x={196} y={ry} w={326} d={24} h={54} className="xd-rack" />
          {Array.from({ length: 7 }, (_, k) => (
            <path key={k} className="xd-rack2" d={poly([[196 + k * 54.3, ry + 24, 0], [196 + k * 54.3, ry + 24, 54]], false)} />
          ))}
          {[18, 36].map((z) => (
            <path key={z} className="xd-rack2" d={poly([[196, ry + 24, z], [522, ry + 24, z]], false)} />
          ))}
        </g>
      ))}
      <path className="xd-cut" d={poly([[0, D, 70], [W, D, 70], [W, 0, 70]], false)} />
      <path className="xd-wall" style={{ fill: "none" }} d={poly([[0, D, 0], [W, D, 0], [W, 0, 0]], false)} />
      {[62, IN_X, 204].map((x) => (
        <path key={x} className="xd-door" d={poly([[x - 24, D, 0], [x + 24, D, 0], [x + 24, D, 56], [x - 24, D, 56]])} />
      ))}
      {[70, 140, 210, 280].map((y) => (
        <path key={y} className="xd-door out" d={poly([[W, y - 24, 0], [W, y + 24, 0], [W, y + 24, 56], [W, y - 24, 56]])} />
      ))}
      <path className="xd-route a" d={line(PA)} />
      {share > 0 && <path className="xd-route b" d={line(XD)} />}
      <Box x={IN_X - 28} y={D + 14} w={56} d={118} h={58} className="xd-truck" />
      <Box x={IN_X - 26} y={D + 132} w={52} d={34} h={44} className="xd-truck" />
      {[140, 280].map((y) => (
        <g key={y}>
          <Box x={W + 14} y={y - 22} w={118} d={44} h={48} className="xd-truck out" />
          <Box x={W + 132} y={y - 21} w={32} d={42} h={38} className="xd-truck out" />
        </g>
      ))}
      {cartons.map((c, i) => (
        <Carton key={i} {...c} />
      ))}
      <text className="xd-lbl c" x="40" y="-74">ROUTE A · RESERVE · NEXT RUN</text>
      <text className="xd-lbl o" x="-340" y="470">ROUTE B · CROSS-DOCK · SAME DAY</text>
      <text className="xd-lbl" x="-350" y="118">INBOUND DOCK</text>
      <text className="xd-lbl o" x="420" y="236">STORE DOORS</text>
    </svg>
  );
}

// ---- the two routes on one day ruler ----
function Routes({ timeline, hero }) {
  const a = timeline.put_away_route;
  const b = timeline.cross_dock_route;
  const end = Math.ceil(Math.max(14, a[a.length - 1].day ?? 0));
  const x = (d) => `${(d / end) * 100}%`;
  const row = (steps, tone) =>
    steps.slice(1).map((s, i) => {
      const from = steps[i].day ?? 0;
      return (
        <div key={s.step} className={`xd-seg ${tone} ${s.step.startsWith("Wait") ? "wait" : ""}`} style={{ left: x(from), width: `calc(${x((s.day ?? from) - from)} - 3px)`, animationDelay: `${i * 0.12}s` }} title={`${s.step}: day ${s.day}`}>
          <span>{s.step.startsWith("Wait") ? `Idle · ${s.day - from} days` : ""}</span>
        </div>
      );
    });
  return (
    <div className="xd-routes">
      <div className="xd-route-row">
        <p>
          <b>Route A · put away</b> {a.map((s) => s.step).join(" → ")}
        </p>
        <div className="xd-track">
          {row(a, "a")}
          <em style={{ left: x(a[a.length - 1].day ?? 0) }}>{a[a.length - 1].day != null ? `${a[a.length - 1].day} days` : ""}</em>
        </div>
      </div>
      <div className="xd-route-row">
        <p>
          <b>Route B · cross-dock</b> {b.map((s) => s.step).join(" → ")}
        </p>
        <div className="xd-track">
          {row(b, "b")}
          <em className="b" style={{ left: x(b[b.length - 1].day ?? 0) }}>{b[b.length - 1].day != null ? `${b[b.length - 1].day} days` : "nothing cross-docked"}</em>
        </div>
      </div>
      <div className="xd-ruler">
        {Array.from({ length: end + 1 }, (_, d) => (
          <i key={d} className={d % 7 ? "" : "mj"} style={{ left: x(d) }}>
            {d % 7 ? null : <span>D{d}</span>}
          </i>
        ))}
      </div>
      {hero && (
        <p className="xd-hero">
          {hero.name} · {hero.style.toLowerCase()}: runs out {shortDate(hero.runs_out)}. Route A restocks it <s>{shortDate(hero.via_put_away)}</s>, route B <b>{shortDate(hero.via_cross_dock)}</b>, {hero.days_saved} days sooner.
        </p>
      )}
    </div>
  );
}

export default function CrossDockView({ data, params, update, loading }) {
  const [pick, setPick] = useState(null);
  const t = data.totals;
  const a = data.asn;
  const line = data.lines.find((l) => l.style_id === pick) ?? data.lines.find((l) => l.cross_dock > 0) ?? data.lines[0];
  const straight = data.lines.filter((l) => l.decision === "cross_dock" || l.decision === "split");
  const reserve = data.lines.filter((l) => l.decision === "top_up" || l.decision === "put_away");
  const asnLabel = (x) => `ASN ${x.asn_no} · ${x.vendor_id.charAt(0) + x.vendor_id.slice(1).toLowerCase()} → ${x.dc_id} · ${shortDate(x.eta)} · ${n(x.units)} units`;

  return (
    <>
      <Controls loading={loading}>
        <Select label="Inbound truck (this week's ship notices)" value={String(a.asn_no)} options={data.asns.map((x) => ({ value: String(x.asn_no), label: asnLabel(x) }))} onChange={(v) => { setPick(null); update({ asn: Number(v) }); }} />
        <Slider label="Cross-dock if a store would dip under display min +" value={params.safetyDays ?? 3} min={0} max={7} step={1} format={(v) => `${v} day${v === 1 ? "" : "s"} of sales`} onChange={(v) => update({ safetyDays: v })} />
        <Slider label="Fill cross-docked stores to" value={params.targetWeeks ?? 2} min={1} max={4} step={1} format={(v) => `${v} week${v === 1 ? "" : "s"} of cover`} onChange={(v) => update({ targetWeeks: v })} />
      </Controls>

      <AgentNote>
        {t.cross_dock > 0 ? (
          <p>
            Cross-dock <b>{n(t.cross_dock)}</b> of {n(t.units)} units to <b>{t.stores} stores</b> the day {a.vendor}&apos;s truck lands:{" "}
            {straight.map((l) => `${l.name.toLowerCase()} (${n(l.cross_dock)})`).join(" and ")} go straight to store doors
            {reserve.length ? `; ${reserve.map((l) => l.name.toLowerCase()).join(" and ")} mostly go to reserve` : ""}. Dock to store drops from {t.dock_to_store_put_away} to {t.dock_to_store_cross_dock} days
            {data.hero ? `, and ${data.hero.name} gets its ${data.hero.style.toLowerCase()} ${shortDate(data.hero.via_cross_dock)} instead of ${shortDate(data.hero.via_put_away)}` : ""}.
          </p>
        ) : (
          <p>
            Put the whole truck away. Every store {a.dc_id} serves holds enough {data.lines.map((l) => l.name.toLowerCase()).join(", ")} to reach the next allocation run, so there&apos;s nothing to gain from sorting it to store doors.
          </p>
        )}
      </AgentNote>

      <div className="lab-grid-2 xd-top">
        <Panel title="The ship notice" sub={`Sent ${shortDate(a.shipped_on)}, before the truck. ${a.carrier}.`}>
          <div className="xd-asn">
            <small>Advance ship notice</small>
            <strong>ASN {a.asn_no}</strong>
            <p>
              {a.vendor} → {a.dc_id === "DC-E" ? "Columbus DC" : "Reno DC"} · <b>ETA {a.eta_day} {shortDate(a.eta)}</b>
            </p>
            {data.lines.map((l) => (
              <div key={l.line_no} className="xd-asn-line">
                <span>
                  {String(l.line_no).padStart(2, "0")} {l.name}
                </span>
                <span>{n(l.units)}</span>
              </div>
            ))}
            <div className="xd-asn-line tot">
              <span>{n(a.units)} units</span>
              <span>{n(a.cartons)} cartons</span>
            </div>
          </div>
          <div className="xd-split" aria-label={`${t.cross_dock} units cross-docked, ${t.put_away} to reserve`}>
            {t.cross_dock > 0 && (
              <div className="b" style={{ flexBasis: `${t.share * 100}%` }}>
                <b>{n(t.cross_dock)}</b> to {t.stores} stores
              </div>
            )}
            <div className="a">
              <b>{n(t.put_away)}</b> to reserve
            </div>
          </div>
        </Panel>
        <Panel title={`${a.dc_id === "DC-E" ? "Columbus" : "Reno"} DC, cut away`} sub="Route B sorts cartons from the inbound dock straight to store doors. Route A puts them away to wait for the next allocation run.">
          <DcDrawing share={t.share} dc={a.dc_id === "DC-E" ? "Columbus DC" : "Reno DC"} />
        </Panel>
      </div>

      <Panel title="Two routes, dimensioned" sub={`Days after the truck docks. The allocation run goes out ${data.timeline.run_day} morning, before receiving opens, so a receipt always waits for the next one.`}>
        <Routes timeline={data.timeline} hero={data.hero} />
      </Panel>

      <Panel title="Every line on the truck" sub="Which stores would run thin before route A could reach them, case packs kept whole. Pick a line to see its stores.">
        <div className="lab-table-wrap">
          <table className="lab-table xd-lines">
            <thead>
              <tr>
                <th>Line</th>
                <th>On truck</th>
                <th>Straight to stores ▸ reserve</th>
                <th>Call</th>
              </tr>
            </thead>
            <tbody>
              {data.lines.map((l) => (
                <tr key={l.line_no} className={l.style_id === line.style_id ? "on" : ""} onClick={() => setPick(l.style_id)}>
                  <td>
                    <strong>{l.name}</strong>
                    <small>{l.reason}</small>
                  </td>
                  <td>
                    {n(l.units)}
                    <small>{l.cartons} cartons of {l.case_pack}</small>
                  </td>
                  <td>
                    <div className="xd-bar">
                      <i style={{ width: `${l.share * 100}%` }} />
                      <span className="b" style={l.share < 0.14 ? { left: `calc(${l.share * 100}% + 6px)`, color: "var(--accent)" } : undefined}>{n(l.cross_dock)}</span>
                      <span className="a">{n(l.put_away)}</span>
                    </div>
                  </td>
                  <td>
                    <Badge tone={CALL[l.decision][1]}>{CALL[l.decision][0]}</Badge>
                    {l.stores > 0 && <small>{l.stores} stores</small>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title={`Store by store · ${line.name}`} sub={`Stores served by ${a.dc_id}, most urgent first. Route A and B dates are when each store's own truck could bring it.`}>
        <div className="lab-table-wrap">
          <table className="lab-table xd-stores">
            <thead>
              <tr>
                <th>Store</th>
                <th>Truck</th>
                <th>On hand</th>
                <th>Sells / wk</th>
                <th>Runs out</th>
                <th>Route A</th>
                <th>Route B</th>
                <th>Cross-dock</th>
              </tr>
            </thead>
            <tbody>
              {line.stores_detail.map((s) => (
                <tr key={s.store_no} className={s.cross_dock ? "xd-go" : ""}>
                  <td>
                    <strong>{s.name}</strong>
                    <small>Grade {s.grade}</small>
                  </td>
                  <td>{s.truck_day}</td>
                  <td>
                    {s.on_hand}
                    {s.in_transit ? <small>+{s.in_transit} on the way</small> : null}
                  </td>
                  <td>{s.weekly_rate}</td>
                  <td className={s.runs_out && s.runs_out < s.via_put_away ? "xd-late" : ""}>{s.runs_out ? shortDate(s.runs_out) : "—"}</td>
                  <td>{shortDate(s.via_put_away)}</td>
                  <td>{shortDate(s.via_cross_dock)}</td>
                  <td>{s.cross_dock ? <Badge tone="accent">{s.cross_dock} units</Badge> : <span className="lab-why">waits for the run</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
