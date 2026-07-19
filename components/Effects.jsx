"use client";

import { useEffect, useRef, useState } from "react";

/* ---------- 3D tilt wrapper: tilts children toward the cursor ---------- */
export function Tilt({ children, className = "", max = 10, glare = true }) {
  const ref = useRef(null);

  function onMove(e) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - py) * max}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * max}deg`);
    el.style.setProperty("--gx", `${px * 100}%`);
    el.style.setProperty("--gy", `${py * 100}%`);
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return (
    <div
      ref={ref}
      className={`tilt3d ${glare ? "tilt3d-glare" : ""} ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
}

/* ---------- Scroll reveal: fades/slides content in when visible ---------- */
export function Reveal({ children, className = "", delay = 0, direction = "up" }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add("revealed");
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal reveal-${direction} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ---------- Animated particle constellation background ---------- */
export function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let particles = [];
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      const count = Math.min(70, Math.floor(canvas.offsetWidth / 18));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
      }));
    }

    function step() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        // gentle attraction to cursor
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 160 && dist > 0.01) {
          p.x += (dx / dist) * 0.25;
          p.y += (dy / dist) * 0.25;
        }
      });

      // connective lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) {
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.14 * (1 - d / 130)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        ctx.fillStyle = "rgba(129, 140, 248, 0.55)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(step);
    }

    function onMouse(e) {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    }
    function onLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    resize();
    step();
    window.addEventListener("resize", resize);
    canvas.parentElement.addEventListener("mousemove", onMouse);
    canvas.parentElement.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.parentElement?.removeEventListener("mousemove", onMouse);
      canvas.parentElement?.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-field" aria-hidden="true" />;
}

/* ---------- Hero portrait: 3D floating glass frame ---------- */
export function HeroPortrait({ src, alt }) {
  return (
    <Tilt className="hero-portrait-tilt" max={12}>
      <div className="hero-portrait">
        <div className="hero-portrait-ring" aria-hidden="true" />
        <img src={src} alt={alt} />
        <div className="hero-portrait-badge">
          <span className="pulse-dot" /> Open to opportunities
        </div>
      </div>
    </Tilt>
  );
}

/* ---------- Typewriter headline ---------- */
export function Typewriter({ words, className = "" }) {
  const [text, setText] = useState("");
  const [idx, setIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[idx % words.length];
    const speed = deleting ? 35 : 75;
    const t = setTimeout(() => {
      if (!deleting) {
        const next = word.slice(0, text.length + 1);
        setText(next);
        if (next === word) setTimeout(() => setDeleting(true), 1600);
      } else {
        const next = word.slice(0, text.length - 1);
        setText(next);
        if (!next) {
          setDeleting(false);
          setIdx((i) => i + 1);
        }
      }
    }, speed);
    return () => clearTimeout(t);
  }, [text, deleting, idx, words]);

  return (
    <span className={`typewriter ${className}`}>
      {text}
      <span className="typewriter-caret" aria-hidden="true">|</span>
    </span>
  );
}
