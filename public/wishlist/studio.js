/* Wishlist Growth Studio — immersive layer runtime.
   Builds: ambient twilight 3D scene, journey bar, guided "next" beacon, step hint.
   Reads: <body data-wl-step="1..4">. Safe/no-op if attribute missing. */
(function () {
  if (window.__wlStudio) return;
  window.__wlStudio = true;

  var STEPS = [
    { n: 1, label: "Collect", title: "Signal Scraper", href: "/wishlist/scraper.html",
      hint: "Hit <b>Scrape</b> (or Load sample) to pull real reviews, copy them — then move to <b>Discover</b>." },
    { n: 2, label: "Discover", title: "Signal Engine", href: "/wishlist/engine.html",
      hint: "Paste reviews or <b>Load sample corpus</b>, read the ranked opportunities — then head to <b>Validate</b>." },
    { n: 3, label: "Validate", title: "Research Kit", href: "/wishlist/research-kit.html",
      hint: "Skim the interview guide and <b>take / share the 2-min survey</b> — then go <b>Ship</b>." },
    { n: 4, label: "Ship", title: "Confidence MVP", href: "/wishlist/mvp.html",
      hint: "Open a saved item and resolve <b>fit, quality &amp; styling</b> to unlock Add to Bag — then loop back to the Studio." }
  ];
  var HOME = "/agents/wishlist-growth";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  function build() {
    var cur = parseInt(document.body.getAttribute("data-wl-step"), 10);
    if (!cur || cur < 1) cur = 1;

    /* ---- ambient scene ---- */
    if (!reduce) {
      var sky = document.createElement("canvas"); sky.id = "wl-sky";
      document.body.appendChild(sky);
      startScene(sky);
    }
    var veil = el("div"); veil.id = "wl-veil"; document.body.appendChild(veil);

    /* ---- journey bar ---- */
    var bar = el("div"); bar.id = "wl-journey";
    var home = el("a", "wl-home", "&#9670; Studio"); home.href = HOME;
    bar.appendChild(home);
    var path = el("div", "wl-path");
    STEPS.forEach(function (s, i) {
      var node = el("a", "wl-node" + (s.n === cur ? " active" : (s.n < cur ? " done" : "")));
      node.href = s.href;
      node.appendChild(el("span", "wl-dot", s.n < cur ? "&#10003;" : String(s.n)));
      node.appendChild(el("span", null, s.label));
      path.appendChild(node);
      if (i < STEPS.length - 1) { var lk = el("span", "wl-link", "<i></i>"); path.appendChild(lk); }
    });
    bar.appendChild(path);
    document.body.insertBefore(bar, document.body.firstChild);

    /* ---- next beacon ---- */
    var next = STEPS[cur] ? STEPS[cur] : null; // cur is 1-based; STEPS[cur] = the step after
    var beacon = el("a"); beacon.id = "wl-next";
    if (next) {
      beacon.href = next.href;
      beacon.innerHTML = '<span class="wl-next-lbl"><small>Next step</small><b>' + next.label + " &middot; " + next.title + '</b></span><span class="wl-arrow">&rarr;</span>';
    } else {
      beacon.href = HOME;
      beacon.innerHTML = '<span class="wl-next-lbl"><small>You&rsquo;ve completed the flow</small><b>Back to the Studio</b></span><span class="wl-arrow">&#9670;</span>';
    }
    document.body.appendChild(beacon);

    /* ---- step hint (once per session per step) ---- */
    var here = STEPS[cur - 1];
    var key = "wlhint-" + cur;
    var seen = false;
    try { seen = sessionStorage.getItem(key) === "1"; } catch (e) {}
    if (here && !seen) {
      var hint = el("div"); hint.id = "wl-hint";
      hint.innerHTML = '<button class="wl-x" aria-label="dismiss">&times;</button>' +
        '<div class="wl-hint-step">Step ' + cur + " of 4 &middot; " + here.label + "</div>" +
        "<p>" + here.hint + "</p>";
      document.body.appendChild(hint);
      hint.querySelector(".wl-x").onclick = function () { hint.remove(); try { sessionStorage.setItem(key, "1"); } catch (e) {} };
      setTimeout(function () { if (hint.parentNode) { hint.remove(); try { sessionStorage.setItem(key, "1"); } catch (e) {} } }, 11000);
    }
  }

  /* ============ ambient 3D twilight scene ============ */
  function startScene(canvas) {
    var ctx = canvas.getContext("2d");
    var W, H, dpr, particles = [];
    var mouse = { x: 0, y: 0 }, off = { x: 0, y: 0 };
    var t = 0;

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.width = Math.floor(innerWidth * dpr);
      H = canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
      particles = [];
      var n = Math.min(70, Math.floor(innerWidth / 20));
      for (var i = 0; i < n; i++) {
        particles.push({
          x: Math.random() * W, y: Math.random() * H * 0.66,
          z: 0.3 + Math.random() * 0.7, r: (0.6 + Math.random() * 1.6) * dpr,
          s: (0.1 + Math.random() * 0.4) * dpr
        });
      }
    }
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", function (e) {
      mouse.x = (e.clientX / innerWidth - 0.5);
      mouse.y = (e.clientY / innerHeight - 0.5);
    });
    resize();

    function draw() {
      t += 1;
      off.x += (mouse.x * 26 - off.x) * 0.05;
      off.y += (mouse.y * 18 - off.y) * 0.05;
      ctx.clearRect(0, 0, W, H);

      var horizon = H * 0.60 + off.y * dpr;
      var cx = W / 2 + off.x * dpr * 1.6;

      /* perspective grid floor -> the "VR" depth */
      ctx.lineWidth = 1 * dpr;
      // receding horizontal lines
      var rows = 16;
      for (var i = 0; i <= rows; i++) {
        var p = i / rows;
        var yy = horizon + (H - horizon) * (p * p); // ease -> denser near horizon
        var a = 0.05 + 0.16 * (1 - p);
        ctx.strokeStyle = "rgba(150,125,255," + a.toFixed(3) + ")";
        ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke();
      }
      // radiating vertical lines from vanishing point
      var cols = 22;
      for (var j = 0; j <= cols; j++) {
        var fx = (j / cols) * 2 - 1; // -1..1
        var bx = cx + fx * W * 1.15;
        var a2 = 0.05 + 0.10 * (1 - Math.abs(fx));
        ctx.strokeStyle = "rgba(120,210,230," + a2.toFixed(3) + ")";
        ctx.beginPath(); ctx.moveTo(cx, horizon); ctx.lineTo(bx, H); ctx.stroke();
      }
      // scrolling light band along the floor
      var band = horizon + ((t * 1.4) % (H - horizon));
      var g = ctx.createLinearGradient(0, band - 40 * dpr, 0, band + 40 * dpr);
      g.addColorStop(0, "rgba(167,139,250,0)");
      g.addColorStop(0.5, "rgba(167,139,250,0.10)");
      g.addColorStop(1, "rgba(167,139,250,0)");
      ctx.fillStyle = g; ctx.fillRect(0, band - 40 * dpr, W, 80 * dpr);

      /* drifting dust / stars with parallax */
      for (var k = 0; k < particles.length; k++) {
        var pt = particles[k];
        pt.y -= pt.s; if (pt.y < -4) { pt.y = horizon; pt.x = Math.random() * W; }
        var px = pt.x + off.x * dpr * pt.z * 2.2;
        var py = pt.y + off.y * dpr * pt.z * 1.4;
        ctx.beginPath();
        ctx.arc(px, py, pt.r, 0, 6.283);
        ctx.fillStyle = "rgba(224,220,255," + (0.25 + pt.z * 0.5).toFixed(2) + ")";
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
