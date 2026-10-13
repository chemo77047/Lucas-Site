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

  // download the song right away; the audio engine itself is only
  // created inside a touch/click, which is what iPhones require
  const bytes = AC ? fetch(SRC).then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }) : null;
  if (bytes) bytes.catch(() => {});

  let ctx = null, gain = null, source = null;
  let fallback = null;       // <audio> element, only if Web Audio can't be used
  let want = false;          // visitor wants music on
  let started = false;       // first-touch autoplay already happened
  let pauseTimer = null;

  function audible() {
    if (!want) return false;
    if (fallback) return !fallback.paused;
    return !!ctx && ctx.state === "running";
  }

  function reflect() {
    const on = want;
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

  function useFallback() {
    if (!fallback) {
      fallback = new Audio(SRC);
      fallback.loop = true;
      fallback.volume = TARGET;
    }
  }

  // must run inside a user gesture
  function unlock() {
    if (fallback) return;
    if (!AC) { useFallback(); return; }
    if (!ctx) {
      ctx = new AC();
      gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(ctx.destination);
      ctx.onstatechange = () => { if (audible()) markStarted(); };
      bytes
        .then((data) => new Promise((res, rej) => ctx.decodeAudioData(data, res, rej)))
        .then((buf) => {
          const [s, e] = loopBounds(buf);
          source = ctx.createBufferSource();
          source.buffer = buf;
          source.loop = true;
          source.loopStart = s;
          source.loopEnd = e;
          source.connect(gain);
          source.start(0, s);
        })
        .catch(() => {
          // e.g. opened straight from disk (file://) — fall back to plain audio
          try { ctx.close(); } catch (e) {}
          ctx = null; useFallback();
          if (want) fallback.play().then(markStarted).catch(() => {});
        });
    }
    // a silent blip played inside the gesture is what wakes iOS audio
    const blip = ctx.createBufferSource();
    blip.buffer = ctx.createBuffer(1, 1, 22050);
    blip.connect(ctx.destination);
    blip.start(0);
    if (ctx.state !== "running") ctx.resume().catch(() => {});
  }

  function turnOn() {
    want = true;
    reflect();
    clearTimeout(pauseTimer);
    unlock();
    if (fallback) { fallback.play().then(markStarted).catch(() => {}); return; }
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(TARGET, t + FADE);
    if (audible()) markStarted();
  }

  function turnOff() {
    want = false;
    reflect();
    if (fallback) { fallback.pause(); return; }
    if (!ctx) return;
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + FADE);
    // suspend after the fade so it resumes exactly where it left off
    clearTimeout(pauseTimer);
    pauseTimer = setTimeout(() => { if (!want && ctx) ctx.suspend(); }, FADE * 1000 + 50);
  }

  // the first touch anywhere starts the hymn; keeps trying on each touch
  // until sound is actually playing, and never after the button is used
  const FIRST = ["touchend", "pointerup", "click", "keydown"];
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
    markStarted();
    // if it shows on but the phone kept it silent, a press wakes it instead of muting
    if (want && !audible()) turnOn();
    else want ? turnOff() : turnOn();
  });

  // coming back via the back button: let the next touch wake the sound again
  window.addEventListener("pageshow", (e) => {
    if (e.persisted && want && !audible()) {
      started = false;
      FIRST.forEach((ev) => window.addEventListener(ev, firstGesture, true));
    }
  });

  reflect();
})();
