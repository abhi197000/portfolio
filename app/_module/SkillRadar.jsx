"use client";
import { useRef, useState } from "react";

const SIZE = 320;
const C = SIZE / 2;
const R = 104;
const RINGS = [25, 50, 75, 100];

function polar(index, count, radius) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
  return [C + radius * Math.cos(angle), C + radius * Math.sin(angle), angle];
}

// Radar ("player card") for 1-2 series over the same axes. Series colors come
// from --v-series-1 / --v-series-2; all text stays in text ink. Each axis is a
// focusable hover target that reads out every series at once.
export default function SkillRadar({ axes, series }) {
  const hostRef = useRef(null);
  const [active, setActive] = useState(null);
  const n = axes.length;

  function showAxis(index, target) {
    const host = hostRef.current.getBoundingClientRect();
    const box = target.getBoundingClientRect();
    setActive({ index, x: box.left - host.left + box.width / 2, y: box.top - host.top });
  }

  const summary = axes
    .map((axis, i) => `${axis.label}: ${series.map((s) => `${s.label} ${s.values[i]}%`).join(", ")}`)
    .join("; ");

  return (
    <figure className="cc-radar" ref={hostRef} onPointerLeave={() => setActive(null)}>
      {series.length > 1 && (
        <figcaption className="cc-radar-legend">
          {series.map((s, si) => (
            <span key={s.id}>
              <i style={{ background: `var(--v-series-${si + 1})` }} />
              {s.label}
            </span>
          ))}
        </figcaption>
      )}

      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`Skill graph. ${summary}`}>
        {RINGS.map((ring) => (
          <circle key={ring} cx={C} cy={C} r={(R * ring) / 100} className="cc-radar-ring" />
        ))}
        {axes.map((axis, i) => {
          const [x, y] = polar(i, n, R);
          return <line key={axis.id} x1={C} y1={C} x2={x} y2={y} className="cc-radar-spoke" />;
        })}

        {series.map((s, si) => (
          <g key={s.id} style={{ "--series": `var(--v-series-${si + 1})` }}>
            <polygon
              className="cc-radar-area"
              points={s.values.map((v, i) => polar(i, n, (R * v) / 100).slice(0, 2).join(",")).join(" ")}
            />
            {s.values.map((v, i) => {
              const [x, y] = polar(i, n, (R * v) / 100);
              return <circle key={axes[i].id} cx={x} cy={y} r={4} className="cc-radar-dot" />;
            })}
          </g>
        ))}

        {axes.map((axis, i) => {
          const [lx, ly, angle] = polar(i, n, R + 22);
          const [ex, ey] = polar(i, n, R + 8);
          const cos = Math.cos(angle);
          const anchor = Math.abs(cos) < 0.2 ? "middle" : cos > 0 ? "start" : "end";
          return (
            <g
              key={axis.id}
              className={`cc-radar-axis ${active?.index === i ? "is-active" : ""}`}
              tabIndex={0}
              aria-label={`${axis.label}: ${series.map((s) => `${s.label} ${s.values[i]}%`).join(", ")}`}
              onPointerEnter={(e) => showAxis(i, e.currentTarget)}
              onFocus={(e) => showAxis(i, e.currentTarget)}
              onBlur={() => setActive(null)}
            >
              <line x1={C} y1={C} x2={ex} y2={ey} className="cc-radar-hit" />
              <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle" className="cc-radar-label">
                {axis.code}
              </text>
            </g>
          );
        })}
      </svg>

      {active && (
        <div className="cc-tip" style={{ left: active.x, top: active.y }}>
          <span>{axes[active.index].label}</span>
          {series.map((s, si) => (
            <span key={s.id} className="cc-tip-row">
              <i style={{ background: `var(--v-series-${si + 1})` }} />
              <strong>{s.values[active.index]}%</strong> {s.label}
            </span>
          ))}
        </div>
      )}
    </figure>
  );
}
