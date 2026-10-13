/* ============================================================
   THE RIDE OF BUCEPHALUS — endless runner.
   Click / Space to jump (twice = double jump). Spear racks,
   urns and ruins approach ever faster. Don't stumble.
   ============================================================ */
(function () {
  const canvas = document.getElementById("ride");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("ride-score");
  const bestEl = document.getElementById("ride-best");
  const startEl = document.getElementById("ride-start");
  const overEl = document.getElementById("ride-over");
  const finalEl = document.getElementById("ride-final");
  const againBtn = document.getElementById("ride-again");

  const W = 1000, H = 260;
  canvas.width = W;
  canvas.height = H;
  const GROUND = 205;
  const HX = 110; // horse x anchor

  let state = "idle"; // idle | running | over
  let horse, obstacles, particles, clouds;
  let speed, dist, best = 0, spawnT, elapsed, last;

  function reset() {
    horse = { y: GROUND, vy: 0, jumps: 0 };
    obstacles = [];
    particles = [];
    speed = 5.2;
    dist = 0;
    spawnT = 600;
    elapsed = 0;
  }
  reset();

  clouds = Array.from({ length: 5 }, () => ({
    x: Math.random() * W, y: 20 + Math.random() * 60,
    w: 60 + Math.random() * 80, s: 0.1 + Math.random() * 0.15,
  }));

  const OBSTACLES = [
    { w: 20, h: 58, draw: drawRack },
    { w: 34, h: 36, draw: drawUrn },
    { w: 30, h: 48, draw: drawRuin },
    { w: 44, h: 62, draw: drawRack2 },
  ];

  function jump() {
    if (state === "idle") { startGame(); return; }
    if (state !== "running") return;
    if (horse.jumps < 2) {
      horse.vy = horse.jumps === 0 ? -11 : -9.5;
      horse.jumps++;
      dust(6);
    }
  }

  function startGame() {
    state = "running";
    startEl.classList.add("hidden");
    last = performance.now();
  }

  function end() {
    state = "over";
    best = Math.max(best, Math.floor(dist));
    bestEl.textContent = `best: ${best} m`;
    overEl.classList.remove("hidden");
    finalEl.textContent =
      `${Math.floor(dist)} metres ridden — ` +
      (dist > 400 ? "the horse is legend, the rider more so"
                  : "even Bucephalus had to learn to fly");
  }

  // wrapper, not canvas — the overlays sit above it and would eat clicks
  canvas.parentElement.addEventListener("pointerdown", jump);
  againBtn.addEventListener("click", () => {
    reset();
    overEl.classList.add("hidden");
    state = "running";
    last = performance.now();
  });
  window.addEventListener("keydown", (e) => {
    if (e.code !== "Space" && e.code !== "ArrowUp") return;
    const r = canvas.getBoundingClientRect();
    const visible = r.top < innerHeight && r.bottom > 0;
    if (!visible || state === "over") return;
    e.preventDefault();
    jump();
  });

  function dust(n) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x: HX - 20 + Math.random() * 30,
        y: GROUND - 2,
        vx: -2 - Math.random() * 2,
        vy: -Math.random() * 1.6,
        life: 24,
        r: 2 + Math.random() * 3,
      });
    }
  }

  /* ---------- obstacle painters ---------- */
  function drawRack(o) {
    // crossed spears stuck in the ground
    ctx.strokeStyle = "#6e5720";
    ctx.lineWidth = 3;
    for (const dx of [-8, 0, 8]) {
      ctx.beginPath();
      ctx.moveTo(o.x + o.w / 2 + dx, GROUND);
      ctx.lineTo(o.x + o.w / 2 + dx * 0.3, GROUND - o.h);
      ctx.stroke();
    }
    ctx.fillStyle = "#c9c2a8";
    for (const dx of [-8, 0, 8]) {
      ctx.beginPath();
      ctx.moveTo(o.x + o.w / 2 + dx * 0.3 - 3, GROUND - o.h);
      ctx.lineTo(o.x + o.w / 2 + dx * 0.3 + 3, GROUND - o.h);
      ctx.lineTo(o.x + o.w / 2 + dx * 0.3, GROUND - o.h - 9);
      ctx.closePath(); ctx.fill();
    }
  }
  function drawRack2(o) { drawRack(o); drawRack({ ...o, x: o.x + 18 }); }
  function drawUrn(o) {
    ctx.fillStyle = "#8a5a34";
    ctx.beginPath();
    ctx.ellipse(o.x + o.w / 2, GROUND - o.h * 0.45, o.w / 2, o.h * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(o.x + o.w / 2 - 7, GROUND - o.h - 4, 14, 8);
    ctx.strokeStyle = "#5f3c20"; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(o.x + 4, GROUND - o.h * 0.55);
    ctx.quadraticCurveTo(o.x + o.w / 2, GROUND - o.h * 0.3, o.x + o.w - 4, GROUND - o.h * 0.55);
    ctx.stroke();
  }
  function drawRuin(o) {
    // broken column
    ctx.fillStyle = "#7d7663";
    ctx.fillRect(o.x, GROUND - o.h, o.w, o.h);
    ctx.fillStyle = "#6b6452";
    ctx.fillRect(o.x - 4, GROUND - 6, o.w + 8, 6);
    ctx.fillRect(o.x - 2, GROUND - o.h, o.w + 4, 7);
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(o.x + (o.w / 4) * i, GROUND - o.h + 8);
      ctx.lineTo(o.x + (o.w / 4) * i, GROUND - 8);
      ctx.stroke();
    }
  }

  /* ---------- horse ---------- */
  function drawHorse() {
    const airborne = horse.y < GROUND - 1;
    const t = elapsed * 0.02 * (speed / 5.2);
    const gallop = airborne ? 0 : Math.sin(t) ;
    const y = horse.y;

    ctx.save();
    ctx.translate(HX, y);

    // legs — two pairs galloping
    ctx.strokeStyle = "#2a2118";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    for (const [bx, ph] of [[-22, 0], [-14, Math.PI], [16, Math.PI * 0.6], [24, Math.PI * 1.6]]) {
      const a = airborne ? (bx < 0 ? -0.7 : 0.7) : Math.sin(t + ph) * 0.7;
      const fx = bx + Math.sin(a) * 26;
      const fy = Math.cos(a) * 26;
      ctx.beginPath();
      ctx.moveTo(bx, -26);
      ctx.lineTo(fx, fy);
      ctx.stroke();
    }

    // body
    ctx.fillStyle = "#2a2118";
    ctx.beginPath();
    ctx.ellipse(0, -34, 34, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    // neck + head (running left-to-right, facing right)
    ctx.beginPath();
    ctx.moveTo(20, -40);
    ctx.quadraticCurveTo(38, -58, 46, -58 + gallop * 2);
    ctx.lineTo(52, -50 + gallop * 2);
    ctx.quadraticCurveTo(40, -44, 30, -34);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath(); // muzzle
    ctx.ellipse(50, -52 + gallop * 2, 9, 6, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // ear
    ctx.beginPath();
    ctx.moveTo(42, -60 + gallop * 2);
    ctx.lineTo(46, -70 + gallop * 2);
    ctx.lineTo(49, -58 + gallop * 2);
    ctx.fill();
    // mane
    ctx.strokeStyle = "#1a1410";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(24, -44);
    ctx.quadraticCurveTo(36, -56, 44, -58 + gallop * 2);
    ctx.stroke();
    // tail flowing
    ctx.strokeStyle = "#1a1410";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-32, -38);
    ctx.quadraticCurveTo(-52, -30 - speed, -60, -44 - speed);
    ctx.stroke();

    /* --- the rider: Lucas --- */
    // crimson cloak streaming
    ctx.fillStyle = "#7a1f1f";
    ctx.beginPath();
    ctx.moveTo(4, -52);
    ctx.quadraticCurveTo(-20 - speed * 2, -58, -34 - speed * 2.5, -44);
    ctx.quadraticCurveTo(-16, -46, 6, -44);
    ctx.closePath();
    ctx.fill();
    // torso + arm with sword
    ctx.fillStyle = "#3a2d1a";
    ctx.fillRect(-2, -66, 10, 18);
    ctx.strokeStyle = "#c9c2a8";
    ctx.lineWidth = 3;
    const swordA = airborne ? -0.4 : Math.sin(t * 2) * 0.15 - 0.9;
    ctx.beginPath();
    ctx.moveTo(6, -60);
    ctx.lineTo(6 + Math.cos(swordA) * 26, -60 + Math.sin(swordA) * 26);
    ctx.stroke();
    // head + gold helmet
    ctx.fillStyle = "#8a6a50";
    ctx.beginPath(); ctx.arc(4, -72, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#d4af37";
    ctx.beginPath(); ctx.arc(4, -74, 6.5, Math.PI, 0); ctx.fill();

    ctx.restore();
  }

  function drawScenery() {
    // sky glow
    const g = ctx.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, "rgba(60,42,10,0.25)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, GROUND);

    // far mountains (parallax)
    ctx.fillStyle = "rgba(90,75,45,0.35)";
    const mo = (elapsed * speed * 0.06) % 500;
    for (let x = -mo; x < W + 500; x += 500) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND);
      ctx.lineTo(x + 160, GROUND - 90);
      ctx.lineTo(x + 320, GROUND);
      ctx.closePath(); ctx.fill();
    }

    // ground + scrolling tufts
    ctx.fillStyle = "#241a08";
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.strokeStyle = "rgba(212,175,55,0.25)";
    ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke();
    ctx.fillStyle = "rgba(212,175,55,0.18)";
    const to = (elapsed * speed) % 90;
    for (let x = -to; x < W + 90; x += 90) {
      ctx.fillRect(x, GROUND + 14 + (x % 3) * 8, 8, 3);
    }

    // clouds
    ctx.fillStyle = "rgba(212,175,55,0.06)";
    for (const c of clouds) {
      c.x -= c.s;
      if (c.x < -c.w) { c.x = W + c.w; c.y = 20 + Math.random() * 60; }
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Vergina sun setting in the sky
    ctx.fillStyle = "rgba(212,175,55,0.5)";
    ctx.beginPath(); ctx.arc(W - 140, 60, 26, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + elapsed * 0.0004;
      ctx.save();
      ctx.translate(W - 140, 60);
      ctx.rotate(a);
      ctx.fillRect(28, -2, 16, 4);
      ctx.restore();
    }
  }

  /* ---------- loop ---------- */
  function step(dt) {
    elapsed += dt;
    const f = dt / 16.7; // normalize to ~60fps steps

    speed += 0.0012 * f;
    dist += speed * f * 0.05;
    scoreEl.textContent = `${Math.floor(dist)} m`;

    // physics
    horse.vy += 0.55 * f;
    horse.y += horse.vy * f;
    if (horse.y >= GROUND) {
      if (horse.vy > 4) dust(5);
      horse.y = GROUND;
      horse.vy = 0;
      horse.jumps = 0;
    }
    if (horse.y === GROUND && Math.random() < 0.3) dust(1);

    // spawn obstacles (gap shrinks as speed grows)
    spawnT -= dt;
    if (spawnT <= 0) {
      const t = OBSTACLES[(Math.random() * OBSTACLES.length) | 0];
      obstacles.push({ x: W + 40, w: t.w, h: t.h, draw: t.draw });
      spawnT = Math.max(650, 1400 - speed * 60) + Math.random() * 700;
    }

    for (const o of obstacles) o.x -= speed * f;
    obstacles = obstacles.filter((o) => o.x > -60);

    // collision — horse box ~ x:HX-28..HX+52, y:horse.y-78..horse.y
    const hb = { x0: HX - 26, x1: HX + 50, y0: horse.y - 76, y1: horse.y - 2 };
    for (const o of obstacles) {
      if (o.x < hb.x1 && o.x + o.w > hb.x0 &&
          GROUND - o.h < hb.y1 && GROUND > hb.y0) {
        end();
        return;
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * f; p.y += p.vy * f;
      if (--p.life <= 0) particles.splice(i, 1);
    }
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawScenery();
    for (const o of obstacles) o.draw(o);
    drawHorse();
    for (const p of particles) {
      ctx.fillStyle = `rgba(196,160,80,${p.life / 26})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
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
