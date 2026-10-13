/* ============================================================
   PHALANX DEFENSE — tap the field to station hoplites in three
   lanes. Hold the city wall against each bigger wave.
   ============================================================ */
(function () {
  const $ = (id) => document.getElementById(id);
  const canvas = $("phalanx"), ctx = canvas.getContext("2d"), wrap = canvas.parentElement;
  const waveEl = $("phalanx-wave"), coinsEl = $("phalanx-coins"), livesEl = $("phalanx-lives");
  const startEl = $("phalanx-start"), overEl = $("phalanx-over"), finalEl = $("phalanx-final");
  const W = 800, H = 450;
  canvas.width = W; canvas.height = H;
  const TOP = 100, LANE_H = 112, LANES = 3, WALL = 52;
  const COL0 = 62, COL_W = 88, COLS = 5, COST = 5;
  const laneY = (l) => TOP + LANE_H * l + LANE_H / 2;
  const colX = (c) => COL0 + COL_W * c + COL_W / 2;

  let state = "idle", units, enemies, sparks, wave, coins, lives, toSpawn, spawnT, coinT, pause, banner, flash, shake;
  let last = performance.now();

  function reset() {
    units = []; enemies = []; sparks = [];
    wave = 1; coins = 15; lives = 3; coinT = 0; pause = 0; banner = ""; flash = 0; shake = 0;
    setupWave();
  }
  function setupWave() {
    toSpawn = 4 + wave * 2;
    spawnT = 1.5;
    banner = `WAVE ${wave}`; pause = 1.6;
  }
  function hud() {
    waveEl.textContent = `wave ${wave}`;
    coinsEl.textContent = `◉ ${coins} drachmae`;
    livesEl.textContent = "☀ ".repeat(lives).trim() || "—";
  }

  function spawn() {
    const chariot = Math.random() < Math.min(0.4, (wave - 1) * 0.08);
    const lane = (Math.random() * LANES) | 0;
    const mult = 1 + wave * 0.05;
    enemies.push(chariot
      ? { lane, x: W + 40, type: "chariot", hp: 6, max: 6, speed: 44 * mult, dmg: 2, cd: 0, hurt: 0, reach: 58 }
      : { lane, x: W + 20, type: "foot", hp: 3, max: 3, speed: 22 * mult, dmg: 1, cd: 0, hurt: 0, reach: 42 });
  }

  function start() {
    reset(); hud();
    state = "playing";
    startEl.classList.add("hidden");
    overEl.classList.add("hidden");
  }
  function end() {
    state = "over";
    SFX.tone(110, 0.6, "sawtooth", 0.05);
    const held = wave - 1;
    finalEl.textContent = `${held} wave${held === 1 ? "" : "s"} held — ` +
      (held >= 5 ? "Sparta would be jealous of this phalanx" : "regroup, sharpen the spears, and march again");
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
    if (state !== "playing") return;
    const [x, y] = pos(e);
    const lane = Math.floor((y - TOP) / LANE_H), col = Math.floor((x - COL0) / COL_W);
    if (lane < 0 || lane >= LANES || col < 0 || col >= COLS) return;
    if (units.some((u) => u.lane === lane && u.col === col)) return;
    if (coins < COST) { flash = 0.5; SFX.tone(160, 0.12, "square", 0.03); return; }
    coins -= COST;
    units.push({ lane, col, x: colX(col), hp: 5, max: 5, cd: 0, stab: 0, hurt: 0 });
    SFX.tone(330, 0.12, "triangle", 0.05);
    hud();
  });
  wrap.addEventListener("pointerup", () => SFX.unlock());
  $("phalanx-again").addEventListener("click", () => { SFX.unlock(); start(); });

  function step(dt) {
    flash = Math.max(0, flash - dt);
    shake = Math.max(0, shake - dt);
    for (const s of sparks) { s.x += s.vx * dt * 60; s.y += s.vy * dt * 60; s.life -= dt * 60; }
    sparks = sparks.filter((s) => s.life > 0);
    if (state !== "playing") return;

    coinT += dt;
    if (coinT >= 1.5) { coinT -= 1.5; coins++; hud(); }

    if (pause > 0) { pause -= dt; if (pause <= 0) banner = ""; return; }

    if (toSpawn > 0) {
      spawnT -= dt;
      if (spawnT <= 0) { spawn(); toSpawn--; spawnT = Math.max(0.7, 2.6 - wave * 0.2) + Math.random() * 0.8; }
    }

    for (const e of enemies) {
      e.hurt = Math.max(0, e.hurt - dt);
      const blocker = units.find((u) => u.lane === e.lane && e.x - u.x > 0 && e.x - u.x < e.reach);
      if (blocker) {
        e.cd -= dt;
        if (e.cd <= 0) {
          e.cd = 1;
          blocker.hp -= e.dmg; blocker.hurt = 0.2;
          SFX.tone(200, 0.06, "square", 0.025);
        }
      } else {
        e.x -= e.speed * dt;
      }
      if (e.x < WALL + 10) {
        e.dead = true; lives--; shake = 0.4; hud();
        SFX.tone(90, 0.4, "sawtooth", 0.05);
      }
    }
    units = units.filter((u) => u.hp > 0);

    for (const u of units) {
      u.cd -= dt; u.stab = Math.max(0, u.stab - dt); u.hurt = Math.max(0, u.hurt - dt);
      if (u.cd > 0) continue;
      const target = enemies.find((e) => !e.dead && e.lane === u.lane && e.x - u.x > -20 && e.x - u.x < 75);
      if (!target) continue;
      u.cd = 0.8; u.stab = 0.18;
      target.hp--; target.hurt = 0.15;
      for (let j = 0; j < 5; j++) sparks.push({ x: target.x - 14, y: laneY(target.lane) - 20, vx: (Math.random() - 0.3) * 4, vy: (Math.random() - 0.5) * 4, life: 16 });
      if (target.hp <= 0) {
        target.dead = true;
        coins += target.type === "chariot" ? 2 : 1;
        SFX.tone(440, 0.1, "triangle", 0.04);
        hud();
      }
    }
    enemies = enemies.filter((e) => !e.dead);

    if (lives <= 0) { end(); return; }
    if (toSpawn === 0 && enemies.length === 0) {
      banner = `WAVE ${wave} HELD!`;
      coins += 5; wave++; hud();
      [523, 659, 784].forEach((f, i) => setTimeout(() => SFX.tone(f, 0.25, "triangle", 0.05), i * 90));
      toSpawn = 4 + wave * 2; spawnT = 1.5; pause = 2;
    }
  }

  /* ---------- painters ---------- */
  function drawWall() {
    ctx.fillStyle = "#5c5140";
    ctx.fillRect(0, TOP - 30, WALL, H - TOP + 30);
    for (let y = TOP - 30; y < H; y += 22) {
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.strokeRect(0, y, WALL, 22);
    }
    ctx.fillStyle = "#6e624d";
    for (let y = TOP - 30; y < H; y += 44) ctx.fillRect(WALL - 6, y, 12, 22);
    ctx.fillStyle = "#d4af37";
    ctx.fillRect(18, TOP - 70, 3, 40);
    ctx.fillRect(21, TOP - 70, 22, 14);
  }
  function drawHoplite(u) {
    const y = laneY(u.lane), x = u.x + (u.stab > 0 ? 6 : 0);
    ctx.save();
    ctx.translate(x, y);
    if (u.hurt > 0) ctx.globalAlpha = 0.6;
    ctx.strokeStyle = "#c9c2a8"; ctx.lineWidth = 3;          // spear
    ctx.beginPath(); ctx.moveTo(-10, -26); ctx.lineTo(u.stab > 0 ? 48 : 36, -30); ctx.stroke();
    ctx.fillStyle = "#3a2d1a"; ctx.fillRect(-7, -34, 14, 26);   // body
    ctx.fillStyle = "#7a1f1f"; ctx.fillRect(-10, -30, 6, 22);   // cloak
    ctx.strokeStyle = "#2a2118"; ctx.lineWidth = 4;              // legs
    ctx.beginPath(); ctx.moveTo(-3, -8); ctx.lineTo(-6, 10); ctx.moveTo(3, -8); ctx.lineTo(6, 10); ctx.stroke();
    ctx.fillStyle = "#8a6a50"; ctx.beginPath(); ctx.arc(0, -42, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#d4af37"; ctx.beginPath(); ctx.arc(0, -44, 7.5, Math.PI, 0); ctx.fill();
    ctx.fillStyle = "#b8432f"; ctx.fillRect(-2, -58, 4, 8);      // crest
    const g = ctx.createRadialGradient(10, -22, 2, 12, -20, 16);  // shield
    g.addColorStop(0, "#f7e7a8"); g.addColorStop(1, "#9a7b25");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(12, -20, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#6e5518";
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.fillRect(12 + Math.cos(a) * 7 - 1.5, -20 + Math.sin(a) * 7 - 1.5, 3, 3);
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < u.max; i++) {
      ctx.fillStyle = i < u.hp ? "#d4af37" : "rgba(212,175,55,0.2)";
      ctx.fillRect(-12 + i * 5, 16, 4, 4);
    }
    ctx.restore();
  }
  function drawEnemy(e) {
    const y = laneY(e.lane);
    ctx.save();
    ctx.translate(e.x, y);
    if (e.hurt > 0) ctx.globalAlpha = 0.55;
    if (e.type === "foot") {
      ctx.strokeStyle = "#a89f86"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(10, -26); ctx.lineTo(-30, -28); ctx.stroke();
      ctx.fillStyle = "#2d4a7a"; ctx.fillRect(-7, -34, 14, 26);
      ctx.strokeStyle = "#1c2433"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-3, -8); ctx.lineTo(-6, 10); ctx.moveTo(3, -8); ctx.lineTo(6, 10); ctx.stroke();
      ctx.fillStyle = "#8a6a50"; ctx.beginPath(); ctx.arc(0, -42, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#c9b98a"; ctx.fillRect(-7, -52, 14, 7);
      ctx.fillStyle = "#7a6237"; ctx.fillRect(-18, -34, 9, 26);
    } else {
      ctx.fillStyle = "#2a2118";                                   // horse
      ctx.beginPath(); ctx.ellipse(-30, -26, 20, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-44, -30); ctx.lineTo(-56, -44); ctx.lineTo(-50, -48); ctx.lineTo(-40, -34); ctx.fill();
      ctx.strokeStyle = "#2a2118"; ctx.lineWidth = 4;
      const t = performance.now() / 90;
      for (const [bx, ph] of [[-42, 0], [-20, Math.PI]]) {
        ctx.beginPath(); ctx.moveTo(bx, -20); ctx.lineTo(bx + Math.sin(t + ph) * 8, 4); ctx.stroke();
      }
      ctx.fillStyle = "#6b3f1f"; ctx.fillRect(-8, -36, 30, 22);   // car
      ctx.strokeStyle = "#3b2410"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(8, -8, 13, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const a = t * 0.5 + (i * Math.PI) / 4;
        ctx.beginPath(); ctx.moveTo(8 - Math.cos(a) * 13, -8 - Math.sin(a) * 13); ctx.lineTo(8 + Math.cos(a) * 13, -8 + Math.sin(a) * 13); ctx.stroke();
      }
      ctx.fillStyle = "#2d4a7a"; ctx.fillRect(2, -56, 12, 20);    // driver
      ctx.fillStyle = "#8a6a50"; ctx.beginPath(); ctx.arc(8, -62, 6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (e.hp < e.max) {
      ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(-14, 16, 28, 4);
      ctx.fillStyle = "#e07856"; ctx.fillRect(-14, 16, 28 * (e.hp / e.max), 4);
    }
    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * 8, 0);
    for (let l = 0; l < LANES; l++) {
      ctx.fillStyle = l % 2 ? "rgba(212,175,55,0.05)" : "rgba(212,175,55,0.09)";
      ctx.fillRect(0, TOP + l * LANE_H, W, LANE_H);
    }
    if (state === "playing" || state === "idle") {
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = coins >= COST ? "rgba(212,175,55,0.22)" : "rgba(224,120,86,0.25)";
      for (let l = 0; l < LANES; l++) for (let c = 0; c < COLS; c++) {
        if (units && units.some((u) => u.lane === l && u.col === c)) continue;
        ctx.strokeRect(COL0 + c * COL_W + 6, TOP + l * LANE_H + 8, COL_W - 12, LANE_H - 16);
      }
      ctx.setLineDash([]);
    }
    drawWall();
    const all = [...(units || []).map((u) => [laneY(u.lane), () => drawHoplite(u)]), ...(enemies || []).map((e) => [laneY(e.lane), () => drawEnemy(e)])];
    all.sort((a, b) => a[0] - b[0]).forEach((d) => d[1]());
    for (const s of sparks) { ctx.fillStyle = `rgba(255,220,140,${s.life / 16})`; ctx.fillRect(s.x, s.y, 3, 3); }
    ctx.restore();

    ctx.textAlign = "center";
    if (banner) {
      ctx.fillStyle = "#f7e7a8"; ctx.font = "700 40px Cinzel, serif";
      ctx.fillText(banner, W / 2 + 26, 70);
    } else if (flash > 0) {
      ctx.fillStyle = "#e07856"; ctx.font = "600 22px Cinzel, serif";
      ctx.fillText(`a hoplite costs ${COST} drachmae`, W / 2 + 26, 70);
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt);
    render();
    requestAnimationFrame(frame);
  }
  reset(); banner = ""; coins = 15; hud();
  requestAnimationFrame(frame);
})();
