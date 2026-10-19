// Small SVG/HTML charts that take their colors from the page theme (CSS variables).

export function LineChart({ labels, series, height = 260, yMax, yMin = 0, yFormat = (v) => Math.round(v).toLocaleString("en-US"), threshold, label }) {
  const W = 680;
  const H = height;
  const L = 52;
  const R = 18;
  const T = 18;
  const B = 34;
  const values = series.flatMap((s) => s.values.filter((v) => v != null));
  const top = yMax ?? Math.max(1, ...values, threshold?.value ?? 0) * 1.12;
  const x = (i) => L + (i * (W - L - R)) / Math.max(1, labels.length - 1);
  const y = (v) => T + (1 - (v - yMin) / (top - yMin)) * (H - T - B);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => yMin + f * (top - yMin));
  const every = Math.ceil(labels.length / 8);
  return (
    <figure className="lab-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid" x1={L} x2={W - R} y1={y(t)} y2={y(t)} />
            <text className="axis" x={L - 8} y={y(t) + 4} textAnchor="end">
              {yFormat(t)}
            </text>
          </g>
        ))}
        {labels.map((lb, i) =>
          i % every === 0 || i === labels.length - 1 ? (
            <text key={lb + i} className="axis" x={x(i)} y={H - 10} textAnchor="middle">
              {lb}
            </text>
          ) : null
        )}
        {threshold && (
          <g>
            <line className="threshold" x1={L} x2={W - R} y1={y(threshold.value)} y2={y(threshold.value)} />
            <text className="threshold-label" x={L + 8} y={y(threshold.value) - 7} textAnchor="start">
              {threshold.label}
            </text>
          </g>
        )}
        {series.map((s) => {
          const pts = s.values.map((v, i) => (v == null ? null : [x(i), y(v)])).filter(Boolean);
          const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
          const last = pts[pts.length - 1];
          return (
            <g key={s.name} style={{ "--c": s.color }} className={`series ${s.dashed ? "dashed" : ""} ${s.faint ? "faint" : ""}`}>
              <path d={d} pathLength="1" />
              {!s.faint && last && <circle cx={last[0]} cy={last[1]} r="5" />}
            </g>
          );
        })}
      </svg>
      <figcaption className="lab-legend">
        {series
          .filter((s) => !s.faint)
          .map((s) => (
            <span key={s.name} style={{ "--c": s.color }}>
              <i className={s.dashed ? "dashed" : ""} />
              {s.name}
            </span>
          ))}
      </figcaption>
    </figure>
  );
}

// horizontal bar with an optional marker line and band (e.g. a healthy range)
export function HBar({ label, value, max, display, color = "var(--accent)", marker, band, sub }) {
  const pctOf = (v) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`;
  return (
    <div className="lab-hbar">
      <span className="lab-hbar-label">
        {label}
        {sub && <small>{sub}</small>}
      </span>
      <div className="lab-hbar-track">
        {band && <span className="band" style={{ left: pctOf(band[0]), width: `calc(${pctOf(band[1])} - ${pctOf(band[0])})` }} />}
        <i style={{ width: pctOf(value), background: color }} />
        {marker != null && <span className="marker" style={{ left: pctOf(marker) }} />}
      </div>
      <span className="lab-hbar-value">{display ?? value}</span>
    </div>
  );
}

// vertical columns, optionally grouped (several values per label)
export function Columns({ groups, max, height = 180, format = (v) => v }) {
  const top = max ?? Math.max(1, ...groups.flatMap((g) => g.values.map((v) => v.value)));
  return (
    <div className="lab-cols" style={{ "--h": `${height}px` }}>
      {groups.map((g) => (
        <div key={g.label} className="lab-col">
          <div className="lab-col-bars">
            {g.values.map((v) => (
              <div key={v.name} className="lab-col-bar" title={`${v.name}: ${format(v.value)}`}>
                <em>{format(v.value)}</em>
                <i style={{ height: `${(v.value / top) * 100}%`, background: v.color }} />
              </div>
            ))}
          </div>
          <span>{g.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Spark({ values, width = 120, height = 34, marks = [] }) {
  if (!values.length) return <svg className="lab-spark" width={width} height={height} />;
  const max = Math.max(1, ...values);
  const x = (i) => 2 + (i * (width - 4)) / Math.max(1, values.length - 1);
  const y = (v) => height - 3 - (v / max) * (height - 6);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg className="lab-spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {marks.map((on, i) => (on ? <rect key={i} x={x(i) - 2.5} y={0} width={5} height={height} className="mark" /> : null))}
      <path d={d} />
    </svg>
  );
}

export function Ring({ value, size = 150, stroke = 14, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="lab-ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="track" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill" strokeDasharray={`${c * Math.max(0, Math.min(1, value))} ${c}`} />
      </svg>
      <div>{children}</div>
    </div>
  );
}
