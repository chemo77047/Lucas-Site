/* ============================================================
   THE FINAL BATTLE — Companion cavalry defense.
   Persians march left across the plain; click to launch a
   golden cavalry charge that rides down everything in its path.
   ============================================================ */
(function () {
  const canvas = document.getElementById("battle");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("battle-score");
  const livesEl = document.getElementById("battle-lives");
  const startEl = document.getElementById("battle-start");
  const overEl = document.getElementById("battle-over");
  const finalEl = document.getElementById("battle-final");
  const againBtn = document.getElementById("battle-again");

  const W = 1000, H = 320;
  canvas.width = W;
  canvas.height = H;
  const LINE_X = 70;        // your banner line
  const GROUND = H - 60;

  let state = "idle";       // idle | running | over
  let enemies = [];
  let charges = [];
  let particles = [];
  let shake = 0;
  let score = 0, lives = 3;
  let spawnT = 0, spawnEvery = 1500, elapsed = 0;
  let last = 0;
  let boss = null;          // war elephant
  let nextBossAt = 100;     // routed-count that summons it

  /* ---------- tiny horn ---------- */
  let ac = null;
  function horn() {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(196, ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(147, ac.currentTime + 0.25);
      g.gain.setValueAtTime(0.07, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
      o.connect(g).connect(ac.destination);
      o.start();
      o.stop(ac.currentTime + 0.45);
    } catch (e) { /* silence is fine */ }
  }

  /* ---------- soldiers ---------- */
  function spawn() {
    enemies.push({
      x: W + 20,
      y: GROUND + 8 + Math.random() * 34,
      speed: 26 + Math.random() * 24 + elapsed * 0.012,
      bob: Math.random() * Math.PI * 2,
    });
  }

  function drawSoldier(e) {
    const march = Math.sin(elapsed * 0.012 + e.bob) * 2;
    ctx.save();
    ctx.translate(e.x, e.y);
    // spear
    ctx.strokeStyle = "#5a4632";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -34); ctx.lineTo(4, 2);
    ctx.stroke();
    // body
    ctx.fillStyle = "#6e2020";
    ctx.fillRect(-5, -22 + march, 10, 22 - march);
    // head
    ctx.beginPath(); ctx.arc(0, -27 + march, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = "#8a6a50"; ctx.fill();
    // round shield
    ctx.beginPath(); ctx.arc(-8, -12 + march, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#3a3f52"; ctx.fill();
    ctx.strokeStyle = "#8a94b8"; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  }

  function drawCharge(c) {
    // golden wedge of Companion cavalry
    ctx.save();
    ctx.translate(c.x, c.y);
    const flicker = 0.85 + Math.random() * 0.15;
    ctx.fillStyle = `rgba(212, 175, 55, ${0.9 * flicker})`;
    ctx.beginPath();
    ctx.moveTo(38, 0);
    ctx.lineTo(-30, -16);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-30, 16);
    ctx.closePath();
    ctx.fill();
    // spear tips
    ctx.strokeStyle = "#f4e3a1";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(38, 0); ctx.lineTo(52, 0);
    ctx.moveTo(20, -8); ctx.lineTo(34, -10);
    ctx.moveTo(20, 8); ctx.lineTo(34, 10);
    ctx.stroke();
    ctx.restore();

    // dust trail
    for (let i = 0; i < 3; i++) {
      particles.push({
        x: c.x - 20 - Math.random() * 30,
        y: c.y + (Math.random() - 0.5) * 24,
        vx: -1 - Math.random(),
        vy: -0.4 - Math.random() * 0.5,
        life: 26,
        r: 2 + Math.random() * 3,
        col: "196,160,80",
      });
    }
  }

  function drawElephant(b) {
    const sway = Math.sin(elapsed * 0.006) * 3;
    ctx.save();
    ctx.translate(b.x, b.y);

    // marching legs
    ctx.fillStyle = "#3c3c4e";
    for (let i = 0; i < 4; i++) {
      const ph = Math.sin(elapsed * 0.007 + i * 1.6) * 6;
      ctx.fillRect(-42 + i * 26 + ph, -8, 11, 34);
    }
    // body
    ctx.beginPath();
    ctx.ellipse(0, -34, 58, 36, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#4e4e64"; ctx.fill();
    // war drape
    ctx.fillStyle = "#7a1f1f";
    ctx.beginPath();
    ctx.ellipse(6, -40, 44, 24, 0, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = "#d4af37"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(6, -40, 44, 24, 0, 0, Math.PI); ctx.stroke();
    // head + ear + trunk (facing left)
    ctx.beginPath(); ctx.arc(-52, -40, 22, 0, Math.PI * 2); ctx.fillStyle = "#4e4e64"; ctx.fill();
    ctx.beginPath(); ctx.ellipse(-44, -44, 10, 14, 0.4, 0, Math.PI * 2); ctx.fillStyle = "#3c3c4e"; ctx.fill();
    ctx.strokeStyle = "#4e4e64"; ctx.lineWidth = 9; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-70, -34);
    ctx.quadraticCurveTo(-88, -10 + sway, -78, 10 + sway);
    ctx.stroke();
    // tusk
    ctx.strokeStyle = "#e8dfc8"; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-66, -26);
    ctx.quadraticCurveTo(-82, -22, -84, -12);
    ctx.stroke();
    // howdah with an archer
    ctx.fillStyle = "#5a4632";
    ctx.fillRect(-18, -88, 40, 30);
    ctx.strokeStyle = "#d4af37"; ctx.lineWidth = 1;
    ctx.strokeRect(-18, -88, 40, 30);
    ctx.fillStyle = "#8a6a50";
    ctx.beginPath(); ctx.arc(2, -94, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#5a4632"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-4, -92); ctx.lineTo(-16, -100); ctx.stroke();
    ctx.restore();

    // hp bar
    const bw = 110;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(b.x - bw / 2, b.y - 118, bw, 8);
    ctx.fillStyle = "#9c2b2b";
    ctx.fillRect(b.x - bw / 2, b.y - 118, bw * (b.hp / b.maxHp), 8);
    ctx.strokeStyle = "rgba(212,175,55,0.7)";
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x - bw / 2, b.y - 118, bw, 8);
    ctx.fillStyle = "rgba(212,175,55,0.9)";
    ctx.font = "700 11px Cinzel, serif";
    ctx.textAlign = "center";
    ctx.fillText("WAR ELEPHANT", b.x, b.y - 126);
  }

  function drawScenery() {
    // ground line + tufts
    ctx.strokeStyle = "rgba(212,175,55,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, GROUND + 26); ctx.lineTo(W, GROUND + 26); ctx.stroke();

    // your banner on the line
    ctx.strokeStyle = "#8a6f28";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(LINE_X, GROUND + 30); ctx.lineTo(LINE_X, 60); ctx.stroke();
    // banner cloth
    ctx.fillStyle = "#1d2a6b";
    ctx.beginPath();
    ctx.moveTo(LINE_X, 60); ctx.lineTo(LINE_X + 42, 70); ctx.lineTo(LINE_X, 92);
    ctx.closePath(); ctx.fill();
    // sun emblem on banner
    ctx.fillStyle = "#d4af37";
    ctx.beginPath(); ctx.arc(LINE_X + 13, 72, 4, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(LINE_X + 13 + Math.cos(a) * 7, 72 + Math.sin(a) * 7, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    // the line itself
    ctx.strokeStyle = "rgba(212,175,55,0.4)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(LINE_X, 40); ctx.lineTo(LINE_X, GROUND + 30); ctx.stroke();
    ctx.setLineDash([]);
  }

  /* ---------- input ---------- */
  function fieldPos(e) {
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {
      x: ((t.clientX - r.left) / r.width) * W,
      y: ((t.clientY - r.top) / r.height) * H,
    };
  }

  // listen on the wrapper — the overlays sit above the canvas
  canvas.parentElement.addEventListener("pointerdown", (e) => {
    if (state === "idle") { start(); return; }
    if (state !== "running") return;
    const p = fieldPos(e);
    charges.push({ x: LINE_X + 10, y: Math.max(46, Math.min(GROUND + 18, p.y)), speed: 14 });
    horn();
  });

  function start() {
    state = "running";
    startEl.classList.add("hidden");
    last = performance.now();
    horn();
  }

  function gameOver(cause) {
    state = "over";
    overEl.classList.remove("hidden");
    const title = document.getElementById("battle-over-title");
    if (cause === "elephant") title.textContent = "THE ELEPHANT BROKE THE LINE";
    else title.textContent = score >= 60 ? "A KING'S LAST STAND" : "THE LINE HAS BROKEN";
    finalEl.textContent = `${score} Persians routed before the fall — the chroniclers will sing of it`;
  }

  againBtn.addEventListener("click", () => {
    enemies = []; charges = []; particles = [];
    boss = null; nextBossAt = 100;
    score = 0; lives = 3; elapsed = 0; spawnEvery = 1500; spawnT = 0;
    scoreEl.textContent = "0 routed";
    livesEl.textContent = "☀ ☀ ☀";
    overEl.classList.add("hidden");
    state = "running";
    last = performance.now();
    horn();
  });

  /* ---------- loop ---------- */
  function step(dt) {
    elapsed += dt;
    spawnT += dt;
    const every = Math.max(420, spawnEvery - elapsed * 0.028);
    if (spawnT > every) { spawnT = 0; spawn(); }

    // a war elephant answers every hundred routed
    if (!boss && score >= nextBossAt) {
      boss = { x: W + 90, y: GROUND + 24, hp: 10, maxHp: 10, speed: 11 + score * 0.02 };
      nextBossAt += 100;
      shake = 16;
      horn();
    }
    if (boss) {
      boss.x -= boss.speed * dt / 1000;
      if (boss.x < LINE_X + 40) {
        lives = 0;
        livesEl.textContent = "—";
        gameOver("elephant");
        return;
      }
    }

    // enemies march
    for (const e of enemies) e.x -= e.speed * dt / 1000;

    // breaches
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (enemies[i].x < LINE_X) {
        enemies.splice(i, 1);
        lives--;
        shake = 12;
        livesEl.textContent = "☀ ".repeat(lives).trim() || "—";
        if (lives <= 0) { gameOver(); return; }
      }
    }

    // charges ride
    for (let i = charges.length - 1; i >= 0; i--) {
      const c = charges[i];
      c.x += c.speed;
      // a charge may wound the beast once as it rides past
      if (boss && !c.struck &&
          Math.abs(c.x - boss.x) < 64 && Math.abs(c.y - boss.y) < 48) {
        c.struck = true;
        boss.hp--;
        shake = Math.max(shake, 6);
        for (let k = 0; k < 14; k++) {
          particles.push({
            x: boss.x - 30, y: boss.y - 30,
            vx: -2 - Math.random() * 3, vy: (Math.random() - 0.5) * 3,
            life: 30, r: 2 + Math.random() * 3, col: "212,175,55",
          });
        }
        if (boss.hp <= 0) {
          // the beast falls
          for (let k = 0; k < 60; k++) {
            particles.push({
              x: boss.x + (Math.random() - 0.5) * 90,
              y: boss.y - Math.random() * 60,
              vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 4,
              life: 50, r: 2.5 + Math.random() * 4, col: "212,175,55",
            });
          }
          score += 50;
          scoreEl.textContent = `${score} routed`;
          shake = 20;
          boss = null;
          horn();
        }
      }
      // trample everything near the wedge
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (e.x > c.x - 36 && e.x < c.x + 46 && Math.abs(e.y - c.y) < 30) {
          enemies.splice(j, 1);
          score++;
          scoreEl.textContent = `${score} routed`;
          shake = Math.max(shake, 4);
          for (let k = 0; k < 10; k++) {
            particles.push({
              x: e.x, y: e.y - 12,
              vx: (Math.random() - 0.5) * 4,
              vy: -Math.random() * 3,
              life: 30,
              r: 2 + Math.random() * 2.5,
              col: "212,175,55",
            });
          }
        }
      }
      if (c.x > W + 80) charges.splice(i, 1);
    }

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.08;
      if (--p.life <= 0) particles.splice(i, 1);
    }
  }

  function render() {
    ctx.save();
    if (shake > 0) {
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      shake *= 0.85;
    }
    ctx.clearRect(0, 0, W, H);

    drawScenery();
    if (boss) drawElephant(boss);
    for (const e of enemies) drawSoldier(e);
    for (const c of charges) drawCharge(c);

    for (const p of particles) {
      ctx.fillStyle = `rgba(${p.col},${p.life / 34})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function frame(now) {
    const dt = Math.min(50, now - last);
    last = now;
    if (state === "running") step(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
