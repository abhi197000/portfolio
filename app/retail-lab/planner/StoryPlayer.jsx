"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PEOPLE_DEFS, person } from "../_kit/people";

const CPS = 44; // narration: characters per second
const LINE_GAP = 1; // seconds between lines
const DECIDE = 12; // seconds to choose before the agent applies its own pick
const AFTER = 2.6; // seconds to show the result before moving on

const usd = (v) => (Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${Math.round(v)}`);

// when each line starts, and how long the step runs
function plan(step) {
  let t = 0.7;
  const lines = step.lines.map((l) => {
    const start = t;
    t += l.text.length / CPS + LINE_GAP;
    return { ...l, start };
  });
  return { lines, talk: t, duration: step.decision ? null : Math.max(7.5, t + 2.4) };
}

// ---- the holographic screens ----
function Persona({ persona }) {
  const svg = useMemo(() => person("dc", { h: 150, g: "wave", gd: 0.5 }), []);
  return (
    <div className="vr-persona">
      {/* person() builds trusted, static SVG markup from our own palette, no user input */}
      <span dangerouslySetInnerHTML={{ __html: svg }} />
      <div>
        <b>{persona.name}</b>
        <span>Planner & allocator</span>
        <small>{persona.scope}</small>
      </div>
    </div>
  );
}

function ScreenBody({ s, persona, ledger }) {
  switch (s.kind) {
    case "persona":
      return <Persona persona={persona} />;
    case "metric":
      return (
        <div className="vr-metric">
          <b>{s.value}</b>
          <span>{s.label}</span>
          {s.sub && <small>{s.sub}</small>}
        </div>
      );
    case "compare": {
      const max = Math.max(...s.bars.map((b) => b.value));
      return (
        <div className="vr-compare">
          {s.bars.map((b, i) => (
            <div key={b.label} className={b.good ? "good" : b.bad ? "bad" : ""}>
              <span>{b.label}</span>
              <i style={{ "--w": `${(b.value / max) * 100}%`, "--d": `${0.5 + i * 0.25}s` }} />
              <b>
                {b.value}
                {s.unit === "%" ? "%" : ` ${s.unit}`}
              </b>
            </div>
          ))}
        </div>
      );
    }
    case "list":
      return (
        <ul className="vr-list">
          {s.rows.map((r, i) => (
            <li key={r.label + i} style={{ "--d": `${0.45 + i * 0.12}s` }}>
              <span>{r.label}</span>
              <b>{r.value}</b>
              {r.tag && <em>{r.tag}</em>}
            </li>
          ))}
        </ul>
      );
    case "article":
      return (
        <div className="vr-article">
          <div className="vr-art-head">
            <i style={{ background: s.hex }} />
            <span className="vr-chip">{s.tag}</span>
          </div>
          <p>{s.why}</p>
          <dl>
            {s.evidence.map((e) => (
              <div key={e.label} className={e.tone}>
                <dt>{e.label}</dt>
                <dd>{e.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      );
    case "swatches":
      return (
        <div className="vr-swatches">
          {s.items.map((it) => (
            <span key={it.label} title={it.label}>
              <i style={{ background: it.hex }} />
              {it.label}
            </span>
          ))}
        </div>
      );
    case "ledger":
      return ledger;
    default:
      return null;
  }
}

const Screens = memo(function Screens({ step, persona, ledger }) {
  return (
    <div className="vr-world-inner" key={step.id}>
      {step.screens.map((s) => (
        <section key={s.slot + s.kind} className={`vr-screen ${s.slot} k-${s.kind}`} aria-label={s.title ?? s.kind}>
          <div className="vr-pane">
            <header>
              <i />
              <span>{s.kind === "article" ? "Why the agent tagged it" : s.title ?? step.chapter}</span>
              <em>LIVE</em>
            </header>
            {s.kind === "article" && <h4>{s.title}</h4>}
            <ScreenBody s={s} persona={persona} ledger={ledger} />
          </div>
        </section>
      ))}
    </div>
  );
});

function Caption({ lines, elapsed, playing }) {
  const t = !playing && elapsed < (lines[0]?.start ?? 0) ? lines[0].start + 99 : elapsed;
  const shown = lines.filter((l) => t >= l.start);
  const cur = shown[shown.length - 1];
  const prev = shown.length > 1 ? shown[shown.length - 2] : null;
  if (!cur) return <div className="vr-caption" aria-live="polite" />;
  const chars = Math.floor((t - cur.start) * CPS);
  return (
    <div className="vr-caption" aria-live="polite">
      {prev && <p className={`old ${prev.who}`}>{prev.text}</p>}
      <p className={cur.who}>
        <b>{cur.who === "agent" ? "Agent" : "Jordan"}</b>
        {cur.text.slice(0, chars)}
        {chars < cur.text.length && <i className="vr-cursor" />}
      </p>
    </div>
  );
}

function Countdown({ left }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <svg className="vr-ring" viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r={r} className="track" />
      <circle cx="22" cy="22" r={r} className="fill" strokeDasharray={`${c * Math.max(0, left / DECIDE)} ${c}`} />
      <text x="22" y="26.5" textAnchor="middle">
        {Math.ceil(left)}
      </text>
    </svg>
  );
}

const Icon = {
  prev: <path d="M6 5h2v14H6zM20 5v14L9 12z" />,
  next: <path d="M16 5h2v14h-2zM4 5v14l11-7z" />,
  play: <path d="M7 4v16l13-8z" />,
  pause: <path d="M6 4h4v16H6zM14 4h4v16h-4z" />,
  again: <path d="M12 5V1L7 6l5 5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" />,
  video: <path d="M3 5h13v14H3zM17 9l4-3v12l-4-3z" />,
};
const Btn = ({ icon, label, onClick, className = "" }) => (
  <button type="button" className={`vr-btn ${className}`} onClick={onClick} aria-label={label} title={label}>
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {Icon[icon]}
    </svg>
  </button>
);

export default function StoryPlayer({ story, looks }) {
  const steps = story.steps;
  const plans = useMemo(() => steps.map(plan), [steps]);
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [choices, setChoices] = useState({});
  const [decidedAt, setDecidedAt] = useState(null);
  const [video, setVideo] = useState(null);
  const [burst, setBurst] = useState(null);
  const step = steps[index];
  const p = plans[index];
  const last = steps.length - 1;
  const total = Object.values(choices).reduce((t, c) => t + c.value, 0);

  // the clock: advances only while playing and no video is open
  useEffect(() => {
    if (!playing || video) return undefined;
    let raf;
    let prev = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.1, (now - prev) / 1000);
      prev = now;
      setElapsed((e) => e + dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, video, index]);

  const go = useCallback(
    (i) => {
      const to = Math.max(0, Math.min(last, i));
      setIndex(to);
      setElapsed(0);
      setDecidedAt(null);
      setBurst(null);
    },
    [last]
  );

  const choose = useCallback(
    (opt, auto = false) => {
      setChoices((c) => ({ ...c, [step.id]: { prompt: step.decision.prompt, label: opt.label, value: opt.value, auto, picked: opt.id } }));
      setDecidedAt(elapsed);
      if (opt.value > 0) setBurst({ text: `+${usd(opt.value)}`, auto, key: `${step.id}-${elapsed}` });
    },
    [step, elapsed]
  );

  // what happens when time runs out on a step
  useEffect(() => {
    if (step.decision) {
      const done = choices[step.id];
      if (!done && elapsed >= p.talk + DECIDE) choose(step.decision.options.find((o) => o.recommended), true);
      const at = decidedAt ?? (done ? p.talk : null);
      if (at != null && elapsed >= at + AFTER && index < last) go(index + 1);
    } else if (elapsed >= p.duration && index < last) go(index + 1);
  }, [elapsed, step, p, choices, decidedAt, index, last, go, choose]);

  const next = useCallback(() => {
    if (step.decision && !choices[step.id]) {
      const rec = step.decision.options.find((o) => o.recommended);
      setChoices((c) => ({ ...c, [step.id]: { prompt: step.decision.prompt, label: rec.label, value: rec.value, auto: true, picked: rec.id } }));
    }
    go(index + 1);
  }, [step, choices, go, index]);

  // keyboard: space plays/pauses, arrows step
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea, select")) return;
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((v) => !v);
      } else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === "Escape") setVideo(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, go, index]);

  // value counter eases toward the total
  const [shownTotal, setShownTotal] = useState(0);
  const target = useRef(0);
  target.current = total;
  useEffect(() => {
    let raf;
    const tick = () => {
      setShownTotal((v) => (Math.abs(target.current - v) < 1 ? target.current : v + (target.current - v) * 0.12));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const deciding = step.decision && elapsed >= p.talk - 0.4;
  const chosen = choices[step.id];
  const left = Math.max(0, p.talk + DECIDE - elapsed);
  const progress = step.decision ? (chosen ? 1 : Math.min(1, elapsed / (p.talk + DECIDE))) : Math.min(1, elapsed / p.duration);
  const look = step.use_case ? looks[step.use_case] : null;
  const jordanSvg = useMemo(() => ({ wave: person("dc", { h: 300, g: "wave", gd: 0.8 }), point: person("dc", { h: 300, g: "point", gd: 0.3 }), thumb: person("dc", { h: 300, g: "thumb", gd: 0.3 }) }), []);
  const pose = chosen ? "thumb" : step.decision ? "point" : "wave";

  const ledger = (
    <div className="vr-ledger">
      <ul>
        {steps
          .filter((s) => s.decision)
          .map((s) => {
            const c = choices[s.id];
            return (
              <li key={s.id}>
                <span>{s.decision.prompt}</span>
                <b className={c && c.value > 0 ? "" : "none"}>{c ? (c.value > 0 ? `+${usd(c.value)}` : "nothing unlocked") : "skipped"}</b>
                <small>{c ? `${c.auto ? "Agent's pick" : "You chose"}: ${c.label}` : ""}</small>
              </li>
            );
          })}
      </ul>
      <p className="vr-ledger-total">
        Value unlocked this morning <b>{usd(total)}</b>
      </p>
      <div className="vr-ctas">
        <button type="button" onClick={() => { setChoices({}); go(0); setPlaying(true); }}>
          ↺ Play it again
        </button>
        <Link href="/retail-lab">Explore the nine agents →</Link>
        <Link href="/retail-lab/planner/articles">See all {story.summary.articles} articles →</Link>
      </div>
    </div>
  );

  return (
    <div className={`vr ${playing ? "is-playing" : "is-paused"}`} style={{ "--holo": step.holo, "--cam": index }}>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs dangerouslySetInnerHTML={{ __html: PEOPLE_DEFS }} />
      </svg>
      <div className="vr-stage">
        <div className="vr-sky" aria-hidden="true" />
        <div className="vr-beams" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="vr-floor" aria-hidden="true" />

        <div className="vr-hud">
          <span className="vr-live">
            <i />
            Mon {story.as_of.slice(8)} Oct · {step.time}
          </span>
          <span className="vr-chapter">
            {step.chapter}
            {look && (
              <em>
                {String(look.n).padStart(2, "0")} · {look.video}
              </em>
            )}
          </span>
          <span className="vr-value">
            Value unlocked <b>{usd(shownTotal)}</b>
          </span>
        </div>

        <h2 className="vr-title" key={`t-${step.id}`}>
          {step.title}
        </h2>

        <div className="vr-world" style={{ "--swing": `${((index % 3) - 1) * 7}deg`, "--dolly": `${-30 - (index % 2) * 40}px` }}>
          <Screens step={step} persona={story.persona} ledger={step.finale ? ledger : null} />
        </div>

        <div className={`vr-jordan pose-${pose}`} aria-hidden="true" key={`j-${pose}`} dangerouslySetInnerHTML={{ __html: jordanSvg[pose] }} />

        <div className="vr-narrator">
          <span className="lab-orb" aria-hidden="true">
            <i />
            <i />
          </span>
          <Caption lines={p.lines} elapsed={elapsed} playing={playing} />
        </div>

        {step.decision && deciding && (
          <div className={`vr-decision ${chosen ? "is-done" : ""}`} role="dialog" aria-label={step.decision.prompt}>
            <div className="vr-decision-head">
              <strong>{step.decision.prompt}</strong>
              {!chosen && <Countdown left={left} />}
            </div>
            {!chosen && <p className="vr-decision-hint">Click to decide. In {Math.ceil(left)}s the agent applies its own pick.</p>}
            <div className="vr-options">
              {step.decision.options.map((o) => (
                <button key={o.id} type="button" className={`${o.recommended ? "rec" : ""} ${chosen?.picked === o.id ? "picked" : ""}`} onClick={() => choose(o)}>
                  {o.recommended && <em>Agent&apos;s pick</em>}
                  <b>{o.label}</b>
                  <span>{o.detail}</span>
                </button>
              ))}
            </div>
            {chosen && <p className="vr-decision-hint">{chosen.auto ? "No click, so the agent applied its pick. You can still change it." : "Done. Moving on."}</p>}
          </div>
        )}
        {burst && (
          <div className="vr-burst" key={burst.key}>
            {burst.text}
            <small>{burst.auto ? "agent's pick" : "unlocked"}</small>
          </div>
        )}

        <div className="vr-controls">
          <Btn icon="prev" label="Previous step" onClick={() => go(index - 1)} />
          <Btn icon={playing ? "pause" : "play"} label={playing ? "Pause" : "Play"} onClick={() => setPlaying((v) => !v)} className="main" />
          <Btn icon="next" label="Next step" onClick={next} />
          <div className="vr-progress" role="group" aria-label="Story steps">
            {steps.map((s, i) => (
              <button key={s.id} type="button" className={`${i < index ? "done" : ""} ${i === index ? "now" : ""} ${s.decision ? "dec" : ""}`} onClick={() => go(i)} aria-label={`Step ${i + 1}: ${s.title}`} title={s.title}>
                <i style={i === index ? { transform: `scaleX(${progress})` } : undefined} />
              </button>
            ))}
          </div>
          <span className="vr-count">
            {index + 1}/{steps.length}
          </span>
          {step.use_case && (
            <button type="button" className="vr-watch" onClick={() => setVideo(step.use_case)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {Icon.video}
              </svg>
              Watch the video
            </button>
          )}
        </div>
      </div>

      {video && (
        <div className="vr-video" role="dialog" aria-label={`${looks[video]?.video} video`} onClick={() => setVideo(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <video src={`/videos/${video}.mp4`} poster={`/videos/${video}.jpg`} controls autoPlay muted playsInline />
            <button type="button" onClick={() => setVideo(null)}>
              Close and resume the story
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
