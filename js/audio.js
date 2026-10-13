/* ============================================================
   THE ROYAL HYMN — background music player.
   Plays assets/hymn.mp3 softly on loop. Attempts autoplay on
   load; if the browser requires a gesture, arms the first
   click/keypress instead. Toggle button bottom-right.
   ============================================================ */
(function () {
  const btn = document.getElementById("audio-toggle");
  const audio = new Audio("assets/hymn.mp3");
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0;

  const TARGET = 0.25;   // soft — ambience, not a concert
  let on = false;
  let ramp = null;

  function fadeTo(v, done) {
    clearInterval(ramp);
    const dv = (v - audio.volume) / 28;
    ramp = setInterval(() => {
      const next = audio.volume + dv;
      if ((dv > 0 && next >= v) || (dv < 0 && next <= v)) {
        audio.volume = v;
        clearInterval(ramp);
        if (done) done();
      } else {
        audio.volume = next;
      }
    }, 40);
  }

  function reflect() {
    btn.classList.toggle("on", on);
    btn.textContent = on ? "♫" : "♪";
    btn.title = on ? "silence the hymn" : "play the royal hymn";
  }

  function play() {
    if (on) return;
    audio.play()
      .then(() => { on = true; fadeTo(TARGET); reflect(); })
      .catch(() => { /* browser still wants a gesture — stay armed */ });
  }

  // try true autoplay; if blocked, the first real interaction starts it
  play();
  ["pointerdown", "keydown", "touchstart"].forEach((ev) =>
    window.addEventListener(ev, play)
  );

  btn.addEventListener("click", () => {
    if (on) {
      on = false;
      fadeTo(0, () => audio.pause());
      reflect();
    } else {
      audio.play().then(() => {
        on = true;
        fadeTo(TARGET);
        reflect();
      }).catch(() => {});
    }
  });
})();
