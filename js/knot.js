/* ============================================================
   THE GORDIAN KNOT — swipe to slice every thread before the
   sand runs out. Each knot has more threads.
   ============================================================ */
(function () {
  const $ = (id) => document.getElementById(id);
  const canvas = $("knot"), ctx = canvas.getContext("2d"), wrap = canvas.parentElement;
  const scoreEl = $("knot-score"), levelEl = $("knot-level");
  const startEl = $("knot-start"), overEl = $("knot-over"), finalEl = $("knot-final");
  const W = 800, H = 450, CX = 400, CY = 225, RAD = 175;
  canvas.width = W; canvas.height = H;
  const COLORS = ["#d4af37", "#b8432f", "#e8cd72", "#9a6a35", "#c98b3a"];

  let state = "idle", threads = [], debris = [], sparks = [], trail = [];
  let level = 1, score = 0, timeLeft = 1, timeMax = 1, pause = 0, banner = "";
  let cutting = false, prev = null, last = performance.now();

  const edgePt = (a) => [CX + Math.cos(a) * RAD, CY + Math.sin(a) * RAD * 0.85];
  function makeThread() {
    const a = Math.random() * Math.PI * 2, b = a + Math.PI * (0.6 + Math.random() * 0.8);
    const p0 = edgePt(a), p3 = edgePt(b);
    const c1 = [CX + (Math.random() - 0.5) * RAD * 1.6, CY + (Math.random() - 0.5) * RAD * 1.4];
    const c2 = [CX + (Math.random() - 0.5) * RAD * 1.6, CY + (Math.random() - 0.5) * RAD * 1.4];
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30, u = 1 - t;
      pts.push([
        u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1],
      ]);
    }
    return { pts, color: COLORS[(Math.random() * COLORS.length) | 0] };
  }

  function setupLevel() {
    const n = Math.min(3 + level, 12);
    threads = Array.from({ length: n }, makeThread);
    timeMax = timeLeft = Math.max(4, 9 - level * 0.4) + n * 0.6;
    levelEl.textContent = `knot ${level}`;
  }

  function start() {
    level = 1; score = 0; debris = []; sparks = [];
    scoreEl.textContent = "0 cut";
    setupLevel();
    state = "playing";
    startEl.classList.add("hidden");
    overEl.classList.add("hidden");
    wrap.classList.add("playing");
  }

  function end() {
    state = "over"; cutting = false;
    wrap.classList.remove("playing");
    SFX.tone(140, 0.5, "sawtooth", 0.05);
    finalEl.textContent = `${score} threads cut · reached knot ${level} — ` +
      (level >= 6 ? "even Alexander would bow to that blade" : "the knot grows wiser; so will your sword");
    overEl.classList.remove("hidden");
  }

  function crosses(a, b, c, d) {
    const r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]];
    const den = r[0] * s[1] - r[1] * s[0];
    if (Math.abs(den) < 1e-9) return false;
    const qp = [c[0] - a[0], c[1] - a[1]];
    const t = (qp[0] * s[1] - qp[1] * s[0]) / den, u = (qp[0] * r[1] - qp[1] * r[0]) / den;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }

  function slice(a, b) {
    for (let i = threads.length - 1; i >= 0; i--) {
      const th = threads[i];
      for (let k = 0; k < th.pts.length - 1; k++) {
        if (crosses(a, b, th.pts[k], th.pts[k + 1])) {
          threads.splice(i, 1);
          sever(th, k);
          score++;
          scoreEl.textContent = `${score} cut`;
          for (let j = 0; j < 10; j++) sparks.push({ x: th.pts[k][0], y: th.pts[k][1], vx: (Math.random() - 0.5) * 7, vy: (Math.random() - 0.5) * 7, life: 22 });
          SFX.tone(600 + Math.random() * 250, 0.09, "triangle", 0.05);
          break;
        }
      }
    }
    if (state === "playing" && threads.length === 0) {
      state = "between"; pause = 1.2; banner = "KNOT CUT!";
      score += level; scoreEl.textContent = `${score} cut`;
      [523, 659, 784].forEach((f, i) => setTimeout(() => SFX.tone(f, 0.25, "triangle", 0.05), i * 90));
    }
  }

  function sever(th, k) {
    [[th.pts.slice(0, k + 1), -1], [th.pts.slice(k + 1), 1]].forEach(([pts, dir]) => {
      if (pts.length > 1) debris.push({ pts: pts.map((p) => p.slice()), vx: dir * (1 + Math.random() * 2), vy: -2 - Math.random() * 2, color: th.color, life: 60 });
    });
  }

  function pos(e) {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height];
  }

  wrap.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    SFX.unlock();
    if (state === "idle") { start(); return; }
    if (state === "over") return;
    cutting = true;
    prev = pos(e);
    try { wrap.setPointerCapture(e.pointerId); } catch (_) {}
  });
  wrap.addEventListener("pointermove", (e) => {
    if (!cutting) return;
    const p = pos(e);
    if (state === "playing") slice(prev, p);
    trail.push({ a: prev, b: p, life: 12 });
    prev = p;
  });
  ["pointerup", "pointercancel"].forEach((ev) => wrap.addEventListener(ev, () => { cutting = false; prev = null; SFX.unlock(); }));
  $("knot-again").addEventListener("click", () => { SFX.unlock(); start(); });

  function step(dt) {
    const f = dt * 60;
    if (state === "playing") {
      timeLeft -= dt;
      if (timeLeft <= 0) { timeLeft = 0; end(); }
    } else if (state === "between") {
      pause -= dt;
      if (pause <= 0) { level++; setupLevel(); state = "playing"; }
    }
    for (const d of debris) {
      d.vy += 0.25 * f;
      for (const p of d.pts) { p[0] += d.vx * f; p[1] += d.vy * f; }
      d.life -= f;
    }
    debris = debris.filter((d) => d.life > 0);
    for (const s of sparks) { s.x += s.vx * f; s.y += s.vy * f; s.life -= f; }
    sparks = sparks.filter((s) => s.life > 0);
    for (const t of trail) t.life -= f;
    trail = trail.filter((t) => t.life > 0);
  }

  function rope(pts, color, alpha) {
    ctx.globalAlpha = alpha;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.strokeStyle = "#2a1d08"; ctx.lineWidth = 11; ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = 7; ctx.stroke();
    ctx.setLineDash([5, 6]);
    ctx.strokeStyle = "rgba(40,26,4,0.45)"; ctx.lineWidth = 3; ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createRadialGradient(CX, CY, 20, CX, CY, RAD * 1.6);
    g.addColorStop(0, "rgba(212,175,55,0.14)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // the yoke pole of King Gordias
    ctx.fillStyle = "#4a3415";
    ctx.fillRect(40, CY - 9, W - 80, 18);
    ctx.fillStyle = "rgba(212,175,55,0.35)";
    ctx.fillRect(40, CY - 9, W - 80, 3);

    ctx.setLineDash([4, 8]);
    ctx.strokeStyle = "rgba(212,175,55,0.25)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(CX, CY, RAD + 12, (RAD + 12) * 0.85, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    for (const th of threads) rope(th.pts, th.color, 1);
    for (const d of debris) rope(d.pts, d.color, Math.max(0, d.life / 60));

    for (const s of sparks) {
      ctx.fillStyle = `rgba(255,230,150,${s.life / 22})`;
      ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
    }
    // sword trail
    ctx.lineCap = "round";
    for (const t of trail) {
      ctx.strokeStyle = `rgba(255,248,220,${t.life / 12})`;
      ctx.lineWidth = 2 + t.life * 0.4;
      ctx.beginPath(); ctx.moveTo(t.a[0], t.a[1]); ctx.lineTo(t.b[0], t.b[1]); ctx.stroke();
    }

    // sand timer bar
    if (state !== "idle") {
      const frac = Math.max(0, timeLeft / timeMax);
      ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(60, H - 26, W - 120, 10);
      ctx.fillStyle = frac < 0.3 ? "#e07856" : "#d4af37";
      ctx.fillRect(60, H - 26, (W - 120) * frac, 10);
    }
    if (state === "between") {
      ctx.fillStyle = "#f7e7a8";
      ctx.font = "700 46px Cinzel, serif";
      ctx.textAlign = "center";
      ctx.fillText(banner, CX, 70);
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt);
    render();
    requestAnimationFrame(frame);
  }
  setupLevel();
  requestAnimationFrame(frame);
})();
