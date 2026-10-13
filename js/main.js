/* ============================================================
   LUCAS ALEXANDER THE GREAT — site engine.
   Vergina sun generator · ember particles · campaign timeline ·
   interactive royal mint (canvas coin, click to flip).
   ============================================================ */
(function () {

  /* ============ 1. Vergina sun (16-rayed star of Macedon) ============ */

  function verginaSVG(size) {
    const R = 50, cx = 50, cy = 50;
    const rays = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const long = i % 2 === 0;
      const len = long ? R * 0.92 : R * 0.62;
      const w = long ? 0.10 : 0.085; // half-angle of the tapered ray
      const x1 = cx + Math.cos(a - w) * R * 0.30;
      const y1 = cy + Math.sin(a - w) * R * 0.30;
      const tx = cx + Math.cos(a) * len;
      const ty = cy + Math.sin(a) * len;
      const x2 = cx + Math.cos(a + w) * R * 0.30;
      const y2 = cy + Math.sin(a + w) * R * 0.30;
      rays.push(`<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${tx.toFixed(1)} ${ty.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} Z"/>`);
    }
    const dots = [];
    for (let i = 0; i < 16; i++) {
      const a = ((i + 0.5) / 16) * Math.PI * 2;
      dots.push(`<circle cx="${(cx + Math.cos(a) * R * 0.42).toFixed(1)}" cy="${(cy + Math.sin(a) * R * 0.42).toFixed(1)}" r="2.1"/>`);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
      <g fill="#d4af37">${rays.join("")}${dots.join("")}
        <circle cx="50" cy="50" r="14"/>
      </g>
      <circle cx="50" cy="50" r="14" fill="none" stroke="#f4e3a1" stroke-width="1"/>
      <circle cx="50" cy="50" r="8" fill="#f4e3a1"/>
    </svg>`;
  }

  document.querySelectorAll(".vergina").forEach((el) => {
    el.innerHTML = verginaSVG(+el.dataset.size || 60);
  });

  /* ============ 2. Gold ember particles ============ */

  const embers = document.getElementById("embers");
  const ectx = embers.getContext("2d");
  let EW, EH;
  function eResize() {
    EW = embers.width = innerWidth;
    EH = embers.height = innerHeight;
  }
  addEventListener("resize", eResize);
  eResize();

  const sparks = Array.from({ length: 45 }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    r: 0.6 + Math.random() * 1.8,
    vy: -(0.15 + Math.random() * 0.45),
    vx: (Math.random() - 0.5) * 0.2,
    ph: Math.random() * Math.PI * 2,
  }));

  (function emberLoop() {
    ectx.clearRect(0, 0, EW, EH);
    for (const s of sparks) {
      s.ph += 0.03;
      s.x += s.vx + Math.sin(s.ph) * 0.15;
      s.y += s.vy;
      if (s.y < -10) { s.y = EH + 10; s.x = Math.random() * EW; }
      const tw = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(s.ph * 2));
      ectx.fillStyle = `rgba(226, 190, 90, ${tw})`;
      ectx.beginPath();
      ectx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ectx.fill();
    }
    requestAnimationFrame(emberLoop);
  })();

  /* ============ 3. Heir portrait fallback ============ */

  const heirImg = document.getElementById("heir-photo");
  const heirCap = document.getElementById("heir-caption");
  heirImg.addEventListener("error", () => {
    heirImg.src = "assets/bust.jpg";
    heirCap.textContent = "Marble placeholder — drop lucas.jpg into this folder to crown him";
  }, { once: true });

  /* ============ 4. Campaign timeline ============ */

  const CAMPAIGNS = [
    { year: "YEAR I · THE CORONATION", title: "The Heir Arrives",
      text: "On the day of his birth, the kingdom stood still. Physicians marveled, heralds proclaimed, and the royal historians opened a fresh scroll." },
    { year: "FIRST CAMPAIGN", title: "The Taming of Bucephalus",
      text: "A wild beast none could master — until the boy noticed it feared its own shadow. He turned it toward the sun, and <em>took his first steps</em>. Alexander tamed a horse; Lucas tamed gravity." },
    { year: "334 BC (IN SPIRIT)", title: "Battle of the Granicus",
      text: "At the river's edge he faced his first great enemy: <em>silence itself</em>. He shattered it with a single word, and the phonemes have been fleeing ever since." },
    { year: "THE LONG SIEGE", title: "The Siege of Tyre",
      text: "An island fortress deemed impregnable for a thousand nights. Alexander built a causeway. Lucas built <em>potty training</em>. Both were, historians agree, mostly engineering." },
    { year: "LEGEND SAYS", title: "The Gordian Knot",
      text: "Confronted by a knot no man could untie, the king drew his sword and cut it in two. Lucas applied the same doctrine to <em>shoelaces</em>, and the kingdom switched to velcro." },
    { year: "331 BC", title: "The Founding of Alexandria",
      text: "He planted a city of learning on the delta and filled it with scholars. Lucas did the same on <em>the first day of school</em> — though his library contains more crayons than scrolls." },
    { year: "ONGOING", title: "Conqueror of the Known World",
      text: "Alexander wept when he saw there were no more worlds to conquer. Lucas has no such problem — <em>every new day is a world</em>, and he has yet to lose." },
  ];

  const tl = document.getElementById("timeline");
  CAMPAIGNS.forEach((c) => {
    const div = document.createElement("div");
    div.className = "battle";
    div.innerHTML = `<div class="year">${c.year}</div><h3>${c.title}</h3><p>${c.text}</p>`;
    tl.appendChild(div);
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("shown"); io.unobserve(e.target); }
    });
  }, { threshold: 0.25 });
  document.querySelectorAll(".battle").forEach((b) => io.observe(b));

  /* ============ 5. The Royal Mint — canvas coin ============ */

  const coin = document.getElementById("coin");
  const ctx = coin.getContext("2d");
  const CX = 260, CY = 260, R = 240;
  let side = "obverse";
  let flip = null;            // { t0 } while flipping
  let mintSeed = Math.random() * 100;
  let minted = 0;

  // the king's likeness — official royal mint medallion
  const medalImg = new Image();
  let medalReady = false;
  medalImg.onload = () => (medalReady = true);
  medalImg.src = "gold-coin.png";

  const GOLD = ["#f7e7a8", "#e8cd72", "#cfa93f", "#9a7b25", "#6e5518"];

  function goldGrad(r0, r1, angle) {
    const g = ctx.createRadialGradient(
      CX + Math.cos(angle) * R * 0.4, CY + Math.sin(angle) * R * 0.4, r0,
      CX, CY, r1
    );
    g.addColorStop(0, GOLD[0]);
    g.addColorStop(0.45, GOLD[1]);
    g.addColorStop(0.75, GOLD[2]);
    g.addColorStop(1, GOLD[4]);
    return g;
  }

  function rimText(text, radius, startA, endA) {
    ctx.save();
    ctx.fillStyle = "#7a5f1c";
    ctx.strokeStyle = "#f9efc0";
    ctx.lineWidth = 0.6;
    ctx.font = "600 21px Cinzel, Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const n = text.length;
    for (let i = 0; i < n; i++) {
      const a = startA + (i / (n - 1)) * (endA - startA);
      ctx.save();
      ctx.translate(CX + Math.cos(a) * radius, CY + Math.sin(a) * radius);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillText(text[i], 0.8, 0.8);
      ctx.strokeText(text[i], 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  function ring(radius, width, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(CX, CY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  function reededEdge() {
    ctx.save();
    ctx.strokeStyle = "rgba(60, 42, 8, 0.55)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 140; i++) {
      const a = (i / 140) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(CX + Math.cos(a) * (R - 2), CY + Math.sin(a) * (R - 2));
      ctx.lineTo(CX + Math.cos(a) * (R - 12), CY + Math.sin(a) * (R - 12));
      ctx.stroke();
    }
    ctx.restore();
  }

  function verginaCenter(scale) {
    ctx.save();
    ctx.translate(CX, CY);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#8a6a20";
    ctx.strokeStyle = "#f9efc0";
    ctx.lineWidth = 1;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const long = i % 2 === 0;
      const len = long ? 88 : 58;
      const w = long ? 0.10 : 0.085;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - w) * 26, Math.sin(a - w) * 26);
      ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
      ctx.lineTo(Math.cos(a + w) * 26, Math.sin(a + w) * 26);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    for (let i = 0; i < 16; i++) {
      const a = ((i + 0.5) / 16) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 40, Math.sin(a) * 40, 3.4, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#f9efc0"; ctx.fill();
    ctx.restore();
  }

  function laurel() {
    // reverse motif: two laurel branches meeting at bottom
    ctx.save();
    ctx.strokeStyle = "#7a5f1c";
    ctx.fillStyle = "#8a6a20";
    for (const dir of [1, -1]) {
      for (let i = 0; i < 11; i++) {
        const a = dir * (0.55 + (i / 11) * 1.9); // symmetric around bottom
        const r = 120 - i * 0.5;
        const lx = CX + Math.sin(a) * r * 0.9;
        const ly = CY + Math.cos(a) * r;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(-dir * a);
        ctx.beginPath();
        ctx.ellipse(0, 0, 12 - i * 0.5, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function medallion() {
    // the official minted portrait, clipped into the coin face
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, R - 6, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(medalImg, CX - R, CY - R, R * 2, R * 2);
    // subtle inner shadow so it sits in the metal
    const sh = ctx.createRadialGradient(CX, CY, R * 0.55, CX, CY, R);
    sh.addColorStop(0, "rgba(0,0,0,0)");
    sh.addColorStop(1, "rgba(40,26,4,0.4)");
    ctx.fillStyle = sh;
    ctx.fillRect(CX - R, CY - R, R * 2, R * 2);
    ctx.restore();
  }

  function drawCoin(scaleX, seed) {
    ctx.clearRect(0, 0, 520, 520);
    ctx.save();
    ctx.translate(CX, CY);
    ctx.scale(Math.abs(scaleX) < 0.03 ? 0.03 : scaleX, 1);
    ctx.translate(-CX, -CY);

    // body
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.fillStyle = goldGrad(10, R, seed);
    ctx.fill();
    reededEdge();

    if (side === "obverse" && medalReady) {
      medallion();
      ring(R - 4, 3, "rgba(60,42,8,0.7)");
    } else {
      ring(R - 14, 2.5, "rgba(60,42,8,0.6)");
      ring(R - 20, 1, "rgba(249,239,192,0.5)");
      ring(110, 1.5, "rgba(60,42,8,0.5)");

      // rim dot ring
      ctx.fillStyle = "rgba(96, 70, 18, 0.7)";
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2 + seed;
        ctx.beginPath();
        ctx.arc(CX + Math.cos(a) * (R - 34), CY + Math.sin(a) * (R - 34), 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (side === "obverse" && !medalReady) {
      // the king's head — as on every proper imperial coin
      rimText("ΛΟΥΚΑΣ · ΑΛΕΞΑΝΔΡΟΣ", R - 62, -Math.PI * 0.82, -Math.PI * 0.18);
      rimText("ΒΑΣΙΛΕΥΣ Ὁ ΜΕΓΑΣ", R - 62, Math.PI * 0.82, Math.PI * 0.18);
      verginaCenter(1);
    } else if (side === "reverse") {
      // the dynasty's star in a laurel wreath
      rimText("ΦΙΛΟΣ · ΚΑΙ · ΝΙΚΗΤΗΣ", R - 62, -Math.PI * 0.82, -Math.PI * 0.18);
      rimText("ΒΑΣΙΛΕΩΣ ΛΟΥΚΟΥ", R - 62, Math.PI * 0.82, Math.PI * 0.18);
      verginaCenter(1);
      laurel();
    }

    // strike nicks (each minting is unique)
    const rand = mulberry(seed);
    ctx.strokeStyle = "rgba(60,42,8,0.35)";
    for (let i = 0; i < 6; i++) {
      const a = rand() * Math.PI * 2, rr = 130 + rand() * 90;
      ctx.beginPath();
      ctx.moveTo(CX + Math.cos(a) * rr, CY + Math.sin(a) * rr);
      ctx.lineTo(CX + Math.cos(a + 0.05) * (rr + 8 + rand() * 14), CY + Math.sin(a + 0.05) * (rr + 8));
      ctx.stroke();
    }

    ctx.restore();
  }

  // deterministic-ish rng for strike marks
  function mulberry(seed) {
    let s = (seed * 1e4) | 0 || 1;
    return () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function mint() {
    mintSeed = Math.random() * 100;
    document.getElementById("minted").textContent = ++minted;
    // a strike is a quick flip-flourish
    if (!flip) flip = { t0: performance.now(), swap: Math.random() < 0.3 };
  }

  coin.addEventListener("click", () => {
    if (!flip) flip = { t0: performance.now(), swap: true };
  });
  document.getElementById("mint-btn").addEventListener("click", mint);
  document.getElementById("coin-save").addEventListener("click", () => {
    try {
      const a = document.createElement("a");
      a.download = "lucas-tetradrachm.png";
      a.href = coin.toDataURL("image/png");
      a.click();
    } catch (e) {
      alert("The mint is sealed — serve this folder over http (e.g. python -m http.server) to export coins.");
    }
  });

  (function coinLoop() {
    let scaleX = 1;
    if (flip) {
      const t = (performance.now() - flip.t0) / 700;
      if (t >= 1) { flip = null; }
      else {
        const phase = t < 0.5 ? t * 2 : (1 - t) * 2; // 1→0→1
        if (t >= 0.5 && flip.swap) { flip.swap = false; side = side === "obverse" ? "reverse" : "obverse"; }
        scaleX = Math.cos((1 - phase) * Math.PI / 2);
      }
    }
    drawCoin(scaleX, mintSeed);
    requestAnimationFrame(coinLoop);
  })();

  mint(); // strike the first coin
})();
