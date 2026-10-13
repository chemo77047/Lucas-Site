/* ============================================================
   THE ROYAL HYMN — background music player.
   Plays assets/hymn.mp3 softly on a seamless loop (Web Audio, so
   there is no gap at the loop point and volume works on phones).
   Starts on the first touch/click/keypress. Once the visitor turns
   it off with the button, it stays off until the button is pressed
   again. Toggle button bottom-right.
   ============================================================ */
(function () {
  const btn = document.getElementById("audio-toggle");
  const SRC = "assets/hymn.mp3";
  const TARGET = 0.25;   // soft — ambience, not a concert
  const FADE = 0.8;      // seconds

  const AC = window.AudioContext || window.webkitAudioContext;
  // iOS: let the hymn play even when the ringer switch is on silent
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}

  let ctx = null, gain = null, source = null, bufferPromise = null;
  let fallback = null;       // <audio> element, only if Web Audio can't be used
  let on = false;            // music currently audible
  let started = false;       // first gesture already handled
  let pauseTimer = null;

  function reflect() {
    btn.classList.toggle("on", on);
    btn.textContent = on ? "♫" : "♪";
    btn.title = on ? "silence the hymn" : "play the royal hymn";
  }

  // trim encoder silence at both ends so the loop is seamless
  function loopBounds(buf) {
    const d = buf.getChannelData(0), n = d.length, th = 0.001;
    let a = 0, b = n - 1;
    while (a < n && Math.abs(d[a]) < th) a++;
    while (b > a && Math.abs(d[b]) < th) b--;
    return [a / buf.sampleRate, (b + 1) / buf.sampleRate];
  }

  function loadBuffer() {
    if (!bufferPromise) {
      bufferPromise = fetch(SRC)
        .then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then((data) => new Promise((res, rej) => ctx.decodeAudioData(data, res, rej)));
    }
    return bufferPromise;
  }

  function useFallback() {
    if (!fallback) {
      fallback = new Audio(SRC);
      fallback.loop = true;
      fallback.volume = TARGET;
    }
  }

  function setup() {
    if (ctx || fallback) return;
    if (!AC) { useFallback(); return; }
    ctx = new AC();
    gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    ctx.onstatechange = () => { if (ctx && ctx.state === "running") markStarted(); };
    loadBuffer().then((buf) => {
      const [s, e] = loopBounds(buf);
      source = ctx.createBufferSource();
      source.buffer = buf;
      source.loop = true;
      source.loopStart = s;
      source.loopEnd = e;
      source.connect(gain);
      source.start(0, s);
    }).catch(() => {
      // e.g. opened straight from disk (file://) — fall back to plain audio
      ctx.close(); ctx = null; useFallback();
      if (on) fallback.play().catch(() => {});
    });
  }

  function turnOn() {
    setup();
    clearTimeout(pauseTimer);
    on = true;
    reflect();
    if (fallback) {
      fallback.play().then(markStarted).catch(() => { on = false; reflect(); });
      return;
    }
    ctx.resume().then(() => {
      const t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(TARGET, t + FADE);
    }).catch(() => { on = false; reflect(); });
  }

  function turnOff() {
    on = false;
    reflect();
    if (fallback) { fallback.pause(); return; }
    if (!ctx) return;
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + FADE);
    // suspend after the fade so it resumes exactly where it left off
    clearTimeout(pauseTimer);
    pauseTimer = setTimeout(() => { if (!on) ctx.suspend(); }, FADE * 1000 + 50);
  }

  // the first interaction anywhere starts the hymn — only until it has
  // actually started (or the visitor used the button); never after that
  const FIRST = ["pointerdown", "touchend", "click", "keydown"];
  function markStarted() {
    if (started) return;
    started = true;
    FIRST.forEach((ev) => window.removeEventListener(ev, firstGesture, true));
  }
  function firstGesture(e) {
    if (started || btn.contains(e.target)) return; // the button handles its own click
    turnOn();
  }
  FIRST.forEach((ev) => window.addEventListener(ev, firstGesture, true));

  btn.addEventListener("click", () => {
    on ? turnOff() : turnOn();
    markStarted();
  });

  // try true autoplay; browsers that block it wait for the first gesture
  if (AC) {
    setup();
    if (ctx) ctx.resume().then(() => {
      if (ctx && ctx.state === "running" && !on) turnOn();
    }).catch(() => {});
  }
  reflect();
})();
