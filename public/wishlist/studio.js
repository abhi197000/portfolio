/* Wishlist Growth Studio — immersive layer runtime.
   Ambient twilight 3D scene, journey bar, guided "next" beacon, step hint,
   edge peek-cards for the adjacent stages, and 3D fly-in / fly-out page transitions.
   Reads <body data-wl-step="1..4">. */
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
  var CUR;

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  function flyTo(href, dir) {
    if (reduce || !href) { window.location.href = href; return; }
    var f = el("div", null); f.id = "wl-flyout"; f.className = dir === "prev" ? "prev" : "next";
    document.body.appendChild(f);
    setTimeout(function () { window.location.href = href; }, 500);
  }
  function nav(a, href, dir) {
    if (!a) return;
    a.addEventListener("click", function (e) { e.preventDefault(); flyTo(href, dir); });
  }

  function build() {
    CUR = parseInt(document.body.getAttribute("data-wl-step"), 10);
    if (!CUR || CUR < 1) CUR = 1;

    /* ambient scene */
    if (!reduce) { var sky = document.createElement("canvas"); sky.id = "wl-sky"; document.body.appendChild(sky); startScene(sky); }
    var veil = el("div"); veil.id = "wl-veil"; document.body.appendChild(veil);

    /* fly-in on arrival */
    if (!reduce) {
      var fi = el("div"); fi.id = "wl-flyin"; document.body.appendChild(fi);
      fi.addEventListener("animationend", function () { fi.remove(); });
      setTimeout(function () { if (fi.parentNode) fi.remove(); }, 950);
    }

    /* journey bar */
    var bar = el("div"); bar.id = "wl-journey";
    var home = el("a", "wl-home", "&#9670; Studio"); home.href = HOME; nav(home, HOME, "prev");
    bar.appendChild(home);
    var path = el("div", "wl-path");
    STEPS.forEach(function (s, i) {
      var node = el("a", "wl-node" + (s.n === CUR ? " active" : (s.n < CUR ? " done" : "")));
      node.href = s.href;
      node.appendChild(el("span", "wl-dot", s.n < CUR ? "&#10003;" : String(s.n)));
      node.appendChild(el("span", null, s.label));
      if (s.n !== CUR) nav(node, s.href, s.n > CUR ? "next" : "prev");
      path.appendChild(node);
      if (i < STEPS.length - 1) path.appendChild(el("span", "wl-link", "<i></i>"));
    });
    bar.appendChild(path);
    document.body.insertBefore(bar, document.body.firstChild);

    /* next beacon */
    var after = STEPS[CUR]; // step after current (1-based -> index CUR)
    var beacon = el("a"); beacon.id = "wl-next";
    if (after) {
      beacon.href = after.href;
      beacon.innerHTML = '<span class="wl-next-lbl"><small>Next step</small><b>' + after.label + " &middot; " + after.title + '</b></span><span class="wl-arrow">&rarr;</span>';
      nav(beacon, after.href, "next");
    } else {
      beacon.href = HOME;
      beacon.innerHTML = '<span class="wl-next-lbl"><small>You&rsquo;ve completed the flow</small><b>Back to the Studio</b></span><span class="wl-arrow">&#9670;</span>';
      nav(beacon, HOME, "prev");
    }
    document.body.appendChild(beacon);

    /* edge peek cards for adjacent stages */
    var prev = STEPS[CUR - 2], next = after;
    if (prev) document.body.appendChild(peek(prev, "prev"));
    if (next) document.body.appendChild(peek(next, "next"));

    /* step hint */
    var here = STEPS[CUR - 1];
    var key = "wlhint-" + CUR, seen = false;
    try { seen = sessionStorage.getItem(key) === "1"; } catch (e) {}
    if (here && !seen) {
      var hint = el("div"); hint.id = "wl-hint";
      hint.innerHTML = '<button class="wl-x" aria-label="dismiss">&times;</button>' +
        '<div class="wl-hint-step">Step ' + CUR + " of 4 &middot; " + here.label + "</div><p>" + here.hint + "</p>";
      document.body.appendChild(hint);
      var dismiss = function () { hint.remove(); try { sessionStorage.setItem(key, "1"); } catch (e) {} };
      hint.querySelector(".wl-x").onclick = dismiss;
      setTimeout(function () { if (hint.parentNode) dismiss(); }, 11000);
    }
  }

  function peek(step, dir) {
    var a = el("a", "wl-peek " + dir);
    a.href = step.href;
    a.innerHTML = '<div class="wl-peek-step">' + (dir === "next" ? "Next &middot; Step " : "Back &middot; Step ") + step.n + "</div>" +
      "<h4>" + step.label + "</h4><small>" + step.title + "</small>";
    nav(a, step.href, dir);
    return a;
  }

  /* ============ ambient 3D twilight scene ============ */
  function startScene(canvas) {
    var ctx = canvas.getContext("2d");
    var W, H, dpr, particles = [];
    var mouse = { x: 0, y: 0 }, off = { x: 0, y: 0 }, t = 0;
    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.width = Math.floor(innerWidth * dpr);
      H = canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = innerWidth + "px"; canvas.style.height = innerHeight + "px";
      particles = [];
      var n = Math.min(70, Math.floor(innerWidth / 20));
      for (var i = 0; i < n; i++) particles.push({ x: Math.random() * W, y: Math.random() * H * 0.66, z: 0.3 + Math.random() * 0.7, r: (0.6 + Math.random() * 1.6) * dpr, s: (0.1 + Math.random() * 0.4) * dpr });
    }
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", function (e) { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; });
    resize();
    function draw() {
      t += 1;
      off.x += (mouse.x * 26 - off.x) * 0.05; off.y += (mouse.y * 18 - off.y) * 0.05;
      ctx.clearRect(0, 0, W, H);
      var horizon = H * 0.60 + off.y * dpr, cx = W / 2 + off.x * dpr * 1.6;
      ctx.lineWidth = 1 * dpr;
      for (var i = 0; i <= 16; i++) { var p = i / 16, yy = horizon + (H - horizon) * (p * p), a = 0.05 + 0.16 * (1 - p); ctx.strokeStyle = "rgba(150,125,255," + a.toFixed(3) + ")"; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
      for (var j = 0; j <= 22; j++) { var fx = (j / 22) * 2 - 1, bx = cx + fx * W * 1.15, a2 = 0.05 + 0.10 * (1 - Math.abs(fx)); ctx.strokeStyle = "rgba(120,210,230," + a2.toFixed(3) + ")"; ctx.beginPath(); ctx.moveTo(cx, horizon); ctx.lineTo(bx, H); ctx.stroke(); }
      var band = horizon + ((t * 1.4) % (H - horizon)); var g = ctx.createLinearGradient(0, band - 40 * dpr, 0, band + 40 * dpr);
      g.addColorStop(0, "rgba(167,139,250,0)"); g.addColorStop(0.5, "rgba(167,139,250,0.10)"); g.addColorStop(1, "rgba(167,139,250,0)");
      ctx.fillStyle = g; ctx.fillRect(0, band - 40 * dpr, W, 80 * dpr);
      for (var k = 0; k < particles.length; k++) { var pt = particles[k]; pt.y -= pt.s; if (pt.y < -4) { pt.y = horizon; pt.x = Math.random() * W; } var px = pt.x + off.x * dpr * pt.z * 2.2, py = pt.y + off.y * dpr * pt.z * 1.4; ctx.beginPath(); ctx.arc(px, py, pt.r, 0, 6.283); ctx.fillStyle = "rgba(224,220,255," + (0.25 + pt.z * 0.5).toFixed(2) + ")"; ctx.fill(); }
      requestAnimationFrame(draw);
    }
    draw();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
