"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/*
 * GuidedTour — a floating AI guide that walks users through a demo.
 *
 * steps: [{
 *   target:  CSS selector to spotlight (optional),
 *   title:   short step label,
 *   text:    narration shown in the guide bubble,
 *   action:  optional fn (sync or async) run when the step starts —
 *            use it to drive the demo (fill inputs, click run, ...),
 *   wait:    extra ms to hold after typing finishes (default 2600)
 * }]
 */
export default function GuidedTour({ steps, agentName = "Agent Guide", accent = "#38bdf8" }) {
  const [playing, setPlaying] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [paused, setPaused] = useState(false);
  const [spot, setSpot] = useState(null);
  const timerRef = useRef(null);
  const typingRef = useRef(null);
  const stepIdxRef = useRef(0);
  const playingRef = useRef(false);

  const clearTimers = () => {
    clearTimeout(timerRef.current);
    clearInterval(typingRef.current);
  };

  const positionSpot = useCallback((selector) => {
    if (!selector) {
      setSpot(null);
      return;
    }
    // the target may only render after the step's action triggers a re-render,
    // so retry the lookup a few times before giving up
    const attempt = (tries) => {
      const el = document.querySelector(selector);
      if (!el) {
        if (tries > 0) setTimeout(() => attempt(tries - 1), 160);
        else setSpot(null);
        return;
      }
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // measure after the scroll settles
      setTimeout(() => {
        const r = el.getBoundingClientRect();
        setSpot({
          top: r.top - 8,
          left: r.left - 8,
          width: r.width + 16,
          height: r.height + 16,
        });
      }, 450);
    };
    attempt(6);
  }, []);

  const runStep = useCallback(
    async (idx) => {
      if (idx >= steps.length) {
        stop();
        return;
      }
      stepIdxRef.current = idx;
      setStepIdx(idx);
      setTyped("");
      const step = steps[idx];

      positionSpot(step.target);

      try {
        if (step.action) await step.action();
      } catch (e) {
        console.error("Tour step action failed:", e);
      }
      if (!playingRef.current) return;

      // re-measure after the action may have changed layout
      if (step.target) positionSpot(step.target);

      // typewriter narration
      const text = step.text;
      let i = 0;
      clearInterval(typingRef.current);
      typingRef.current = setInterval(() => {
        i += 2;
        setTyped(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(typingRef.current);
          const hold = step.wait ?? 2600;
          timerRef.current = setTimeout(() => {
            if (playingRef.current) runStep(stepIdxRef.current + 1);
          }, hold);
        }
      }, 18);
    },
    [steps, positionSpot]
  );

  function start() {
    playingRef.current = true;
    setPlaying(true);
    setPaused(false);
    runStep(0);
  }

  function stop() {
    playingRef.current = false;
    clearTimers();
    setPlaying(false);
    setPaused(false);
    setSpot(null);
    setTyped("");
    setStepIdx(0);
  }

  function next() {
    clearTimers();
    setPaused(false);
    runStep(stepIdxRef.current + 1);
  }

  function prev() {
    clearTimers();
    setPaused(false);
    runStep(Math.max(0, stepIdxRef.current - 1));
  }

  function togglePause() {
    if (paused) {
      setPaused(false);
      // resume: show remainder instantly, then schedule advance
      setTyped(steps[stepIdxRef.current].text);
      timerRef.current = setTimeout(() => {
        if (playingRef.current) runStep(stepIdxRef.current + 1);
      }, steps[stepIdxRef.current].wait ?? 2600);
    } else {
      clearTimers();
      setPaused(true);
      setTyped(steps[stepIdxRef.current].text);
    }
  }

  // keep the spotlight aligned while scrolling
  useEffect(() => {
    if (!playing) return;
    const handler = () => positionSpot(steps[stepIdxRef.current]?.target);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [playing, steps, positionSpot]);

  useEffect(() => () => clearTimers(), []);

  const step = steps[stepIdx];

  return (
    <>
      {!playing && (
        <button className="tour-launch" onClick={start} style={{ "--tour-accent": accent }}>
          <span className="tour-launch-bot" aria-hidden="true">🤖</span>
          <span>
            <strong>Watch guided demo</strong>
            <small>Let the agent walk you through it</small>
          </span>
        </button>
      )}

      {playing && (
        <div className="tour-layer" style={{ "--tour-accent": accent }}>
          {spot && (
            <div
              className="tour-spotlight"
              style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
              aria-hidden="true"
            />
          )}

          <div className="tour-bubble" role="dialog" aria-label={`${agentName} walkthrough`}>
            <div className="tour-bubble-head">
              <span className="tour-avatar" aria-hidden="true">🤖</span>
              <div>
                <strong>{agentName}</strong>
                <small>
                  Step {stepIdx + 1} of {steps.length}
                  {step?.title ? ` — ${step.title}` : ""}
                </small>
              </div>
              <button className="tour-close" onClick={stop} aria-label="End walkthrough">✕</button>
            </div>
            <p className="tour-text">
              {typed}
              {typed.length < (step?.text.length ?? 0) && <span className="tour-caret">▍</span>}
            </p>
            <div className="tour-progress" aria-hidden="true">
              <span style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }} />
            </div>
            <div className="tour-controls">
              <button onClick={prev} disabled={stepIdx === 0}>← Back</button>
              <button onClick={togglePause}>{paused ? "▶ Resume" : "⏸ Pause"}</button>
              <button onClick={next}>
                {stepIdx === steps.length - 1 ? "Finish" : "Next →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
