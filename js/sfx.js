/* Tiny shared sound effects for the games (one audio engine for all). */
window.SFX = (function () {
  const AC = window.AudioContext || window.webkitAudioContext;
  let ac = null;
  function unlock() {
    if (!AC) return;
    try {
      if (!ac) ac = new AC();
      if (ac.state !== "running") ac.resume().catch(() => {});
    } catch (e) {}
  }
  function tone(freq, dur, type, vol) {
    if (!ac || ac.state !== "running") return;
    try {
      const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol || 0.06, t);
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      o.connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + dur + 0.05);
    } catch (e) {}
  }
  return { unlock, tone };
})();
