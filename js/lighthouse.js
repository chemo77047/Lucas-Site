/* ============================================================
   THE LIGHTHOUSE OF ALEXANDRIA — watch the beacon's signal,
   then repeat it on the lamps. Each round adds one more.
   ============================================================ */
(function () {
  const $ = (id) => document.getElementById(id);
  const canvas = $("lighthouse"), ctx = canvas.getContext("2d"), wrap = canvas.parentElement;
  const roundEl = $("lh-round"), bestEl = $("lh-best");
  const startEl = $("lh-start"), overEl = $("lh-over"), finalEl = $("lh-final");
  const W = 800, H = 450;
  canvas.width = W; canvas.height = H;
  const LAMPS = [
    { x: 190, color: "#e0503c", tone: 330 },
    { x: 330, color: "#3cb371", tone: 392 },
    { x: 470, color: "#3c7be0", tone: 494 },
    { x: 610, color: "#e8c040", tone: 587 },
  ];
  const LY = 365, LR = 46;
  const BUILDINGS = Array.from({ length: 12 }, (_, i) => {
    const left = i < 6, k = left ? i : i - 6;
    return { x: left ? 40 + k * 50 : 470 + k * 50, w: 40, h: 30 + ((i * 37) % 45) };
  });
  const STARS = Array.from({ length: 50 }, (_, i) => [(i * 157) % W, (i * 89) % 200, (i % 3) + 1]);

  let state = "idle", seq = [], idx = 0, best = 0, token = 0;
  let lit = -1, litUntil = 0, ships = [], last = performance.now();

  function flash(c, ms) {
    lit = c; litUntil = performance.now() + ms;
    SFX.tone(LAMPS[c].tone, ms / 1000, "sine", 0.09);
  }

  function nextRound() {
    seq.push((Math.random() * 4) | 0);
    roundEl.textContent = `round ${seq.length}`;
    state = "showing";
    const tok = ++token;
    const on = Math.max(240, 560 - seq.length * 25), gap = on * 0.5;
    let t = 700;
    seq.forEach((c) => { setTimeout(() => { if (tok === token) flash(c, on); }, t); t += on + gap; });
    setTimeout(() => { if (tok === token) { state = "input"; idx = 0; } }, t);
  }

  function start() {
    seq = []; ships = []; token++;
    startEl.classList.add("hidden");
    overEl.classList.add("hidden");
    nextRound();
  }

  function end() {
    state = "over"; token++;
    SFX.tone(120, 0.6, "sawtooth", 0.05);
    const rounds = seq.length - 1;
    best = Math.max(best, rounds);
    bestEl.textContent = `best: ${best}`;
    finalEl.textContent = `the beacon held for ${rounds} round${rounds === 1 ? "" : "s"} — ` +
      (rounds >= 8 ? "a memory worthy of the great library" : "the harbor awaits your next watch");
    overEl.classList.remove("hidden");
  }

  function pos(e) {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height];
  }
  wrap.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    SFX.unlock();
    if (state === "idle") { start(); return; }
    if (state !== "input") return;
    const [x, y] = pos(e);
    const c = LAMPS.findIndex((l) => Math.hypot(x - l.x, y - LY) < LR + 14);
    if (c < 0) return;
    flash(c, 220);
    if (c !== seq[idx]) { end(); return; }
    idx++;
    if (idx === seq.length) {
      state = "between";
      ships.push({ x: W + 40, y: 296 + (ships.length % 2) * 6, target: 120 + ((ships.length * 90) % 560) });
      const tok = token;
      setTimeout(() => { if (tok === token) nextRound(); }, 900);
    }
  });
  wrap.addEventListener("pointerup", () => SFX.unlock());
  $("lh-again").addEventListener("click", () => { SFX.unlock(); start(); });

  function render(now) {
    if (lit >= 0 && now > litUntil) lit = -1;
    const sky = ctx.createLinearGradient(0, 0, 0, 300);
    sky.addColorStop(0, "#0b0d1a"); sky.addColorStop(1, "#2a2010");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    for (const [x, y, r] of STARS) {
      ctx.fillStyle = `rgba(247,231,168,${0.3 + 0.3 * Math.sin(now / 700 + x)})`;
      ctx.fillRect(x, y, r, r);
    }

    // beam
    const beamColor = lit >= 0 ? LAMPS[lit].color : "rgba(247,231,168,1)";
    const a = now / 1400;
    ctx.save();
    ctx.globalAlpha = lit >= 0 ? 0.55 : 0.12;
    ctx.fillStyle = beamColor;
    for (const dir of [0, Math.PI]) {
      ctx.beginPath();
      ctx.moveTo(400, 70);
      ctx.arc(400, 70, 520, a + dir - 0.12, a + dir + 0.12);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    // city — buildings light up as rounds are passed
    const litCount = Math.max(0, (state === "input" || state === "showing" ? seq.length - 1 : seq.length));
    BUILDINGS.forEach((b, i) => {
      ctx.fillStyle = "#1c1508";
      ctx.fillRect(b.x, 280 - b.h, b.w, b.h);
      const on = state !== "idle" && i < litCount;
      ctx.fillStyle = on ? "#f2c94c" : "rgba(212,175,55,0.12)";
      for (let wy = 280 - b.h + 6; wy < 274; wy += 12)
        for (let wx = b.x + 6; wx < b.x + b.w - 6; wx += 12) ctx.fillRect(wx, wy, 5, 6);
    });

    // tower
    ctx.fillStyle = "#cbbf9d";
    ctx.beginPath(); ctx.moveTo(370, 280); ctx.lineTo(380, 150); ctx.lineTo(420, 150); ctx.lineTo(430, 280); ctx.fill();
    ctx.fillStyle = "#b3a682";
    ctx.beginPath(); ctx.moveTo(384, 150); ctx.lineTo(389, 90); ctx.lineTo(411, 90); ctx.lineTo(416, 150); ctx.fill();
    ctx.fillStyle = "#9b8f6c"; ctx.fillRect(374, 146, 52, 6); ctx.fillRect(386, 86, 28, 5);
    ctx.fillStyle = lit >= 0 ? LAMPS[lit].color : "#f7e7a8";
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = lit >= 0 ? 40 : 15;
    ctx.beginPath(); ctx.arc(400, 72, 13, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // sea + ships
    ctx.fillStyle = "#0f1a2b"; ctx.fillRect(0, 280, W, 32);
    ctx.strokeStyle = "rgba(212,175,55,0.25)";
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x + ((now / 40) % 40), 294); ctx.lineTo(x + 14 + ((now / 40) % 40), 294); ctx.stroke();
    }
    for (const s of ships) {
      s.x += (s.target - s.x) * 0.03;
      ctx.fillStyle = "#4a3415";
      ctx.beginPath(); ctx.moveTo(s.x - 18, s.y); ctx.lineTo(s.x + 18, s.y); ctx.lineTo(s.x + 12, s.y + 7); ctx.lineTo(s.x - 12, s.y + 7); ctx.fill();
      ctx.fillStyle = "#e8dcb5";
      ctx.beginPath(); ctx.moveTo(s.x, s.y - 22); ctx.lineTo(s.x, s.y - 2); ctx.lineTo(s.x + 13, s.y - 4); ctx.fill();
    }

    // lamps
    LAMPS.forEach((l, i) => {
      const on = i === lit;
      ctx.fillStyle = "#1a1408";
      ctx.beginPath(); ctx.arc(l.x, LY, LR + 6, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = on ? 1 : 0.35;
      ctx.fillStyle = l.color;
      if (on) { ctx.shadowColor = l.color; ctx.shadowBlur = 35; }
      ctx.beginPath(); ctx.arc(l.x, LY, LR, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(212,175,55,0.6)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(l.x, LY, LR + 6, 0, Math.PI * 2); ctx.stroke();
    });

    ctx.textAlign = "center";
    ctx.font = "600 18px Cinzel, serif";
    ctx.fillStyle = "#e8cd72";
    const msg = state === "showing" ? "watch the signal" : state === "input" ? "your turn — repeat it" : state === "between" ? "the ship is safe!" : "";
    if (msg) ctx.fillText(msg, W / 2, 438);
  }

  function frame(now) {
    last = now;
    render(now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
