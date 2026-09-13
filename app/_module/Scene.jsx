"use client";
import { useEffect, useRef } from "react";

// Immersive backdrop: a starfield drifting toward the viewer from a vanishing
// point, over a receding neon grid floor. Fixed, non-interactive, and static
// for users who prefer reduced motion.
export default function Scene() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };
    let w = 0;
    let h = 0;
    let raf = 0;
    let stars = [];

    const spawn = (z) => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z,
      hue: Math.random() < 0.2 ? 280 : 188,
    });

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(260, Math.floor((w * h) / 5200));
      stars = Array.from({ length: count }, () => spawn(0.05 + Math.random() * 0.95));
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      eased.x += (mouse.x - eased.x) * 0.04;
      eased.y += (mouse.y - eased.y) * 0.04;
      const cx = w / 2 + eased.x * 36;
      const cy = h * 0.42 + eased.y * 24;

      for (const s of stars) {
        if (!reduce) {
          s.z -= 0.0011;
          if (s.z <= 0.03) Object.assign(s, spawn(1));
        }
        const k = 0.5 / s.z;
        const px = cx + s.x * w * k * 0.5;
        const py = cy + s.y * h * k * 0.5;
        if (px < 0 || px > w || py < 0 || py > h) {
          if (!reduce) Object.assign(s, spawn(1));
          continue;
        }
        const depth = 1 - s.z;
        ctx.beginPath();
        ctx.fillStyle = `hsla(${s.hue}, 100%, 78%, ${Math.min(1, depth * 1.3)})`;
        ctx.arc(px, py, Math.max(0.3, depth * 2.1), 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(frame);
    }

    function onMove(e) {
      mouse.x = (e.clientX / w - 0.5) * 2;
      mouse.y = (e.clientY / h - 0.5) * 2;
    }

    resize();
    frame();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div className="cc-scene" aria-hidden="true">
      <div className="cc-scene-nebula" />
      <canvas ref={canvasRef} className="cc-scene-canvas" />
      <div className="cc-scene-horizon" />
      <div className="cc-scene-grid" />
      <div className="cc-scene-scan" />
      <div className="cc-scene-vignette" />
    </div>
  );
}
