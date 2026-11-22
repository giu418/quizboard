"use strict";

/* Effetti sonori sintetizzati con la Web Audio API: nessun file audio, nessuna rete.
   Lo script osserva la pagina e non tocca la logica di gioco:
   - sigla: quando una scena entra con la sigla (benvenuto e inizio manche);
   - timer: un battito al secondo negli ultimi 10 secondi e il segnale di tempo scaduto;
   - risposta: la rivelazione della risposta e l'esito (esatta o sbagliata).
   Il timbro dipende dal tema: theme.css lo dichiara in --sound-theme. */
(() => {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  const storageKey = "quizboard-sound";
  let ctx = null;
  let master = null;
  let muted = false;
  try { muted = localStorage.getItem(storageKey) === "off"; } catch { /* senza memoria locale i suoni restano accesi */ }

  function unlock() {
    if (!ctx) {
      ctx = new AudioCtx();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.3;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
  }
  // Il browser permette l'audio solo dopo un gesto: si sblocca al primo tocco o tasto.
  document.addEventListener("pointerdown", unlock, true);
  document.addEventListener("keydown", unlock, true);

  const note = (semitones) => 261.63 * 2 ** (semitones / 12); // 0 = do centrale

  function tone(freq, at, length, { type = "sine", gain = 0.5, to = null, attack = 0.008 } = {}) {
    const start = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, start + length);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(amp).connect(master);
    osc.start(start);
    osc.stop(start + length + 0.05);
  }

  function sweep(at, length, from, to, gain = 0.25) {
    const start = ctx.currentTime + at;
    const frames = Math.ceil(ctx.sampleRate * length);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const amp = ctx.createGain();
    source.buffer = buffer;
    filter.type = "bandpass";
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(from, start);
    filter.frequency.exponentialRampToValueAtTime(to, start + length);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + length * 0.6);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + length);
    source.connect(filter).connect(amp).connect(master);
    source.start(start);
  }

  const chord = (notes, at, length, options) => notes.forEach((n) => tone(note(n), at, length, options));

  const themes = {
    // Prima serata: ottoni sintetici, colpi netti, cicalino da studio.
    studio: {
      sigla() {
        sweep(0, 0.55, 300, 6000);
        [0, 4, 7, 12].forEach((n, i) => tone(note(n), 0.1 + i * 0.09, 0.22, { type: "sawtooth", gain: 0.22 }));
        chord([12, 16, 19, 24], 0.5, 1.1, { type: "sawtooth", gain: 0.16 });
        tone(note(-24), 0.5, 0.9, { type: "sine", gain: 0.5 });
      },
      tick(last) { tone(last ? 1320 : 880, 0, 0.09, { type: "square", gain: 0.16 }); },
      timeUp() { chord([-15, -14], 0, 0.8, { type: "sawtooth", gain: 0.3 }); },
      reveal() {
        sweep(0, 0.25, 800, 7000, 0.18);
        tone(note(19), 0.12, 0.18, { type: "sawtooth", gain: 0.2 });
        chord([12, 19, 24], 0.26, 0.9, { type: "sawtooth", gain: 0.16 });
      },
      correct() { tone(note(28), 0, 0.5, { gain: 0.4 }); tone(note(33), 0.09, 0.7, { gain: 0.4 }); },
      wrong() { chord([-20, -19], 0, 0.45, { type: "square", gain: 0.2 }); },
    },
    // Varietà: orchestrina da teatro, glissando d'arpa, trombone che si sgonfia.
    varieta: {
      sigla() {
        [-5, 0, 4, 7, 12, 16, 19, 24].forEach((n, i) => tone(note(n), i * 0.06, 0.5, { type: "triangle", gain: 0.3 }));
        chord([12, 16, 19], 0.62, 0.22, { type: "triangle", gain: 0.3 });
        chord([12, 16, 19, 24], 0.9, 1.2, { type: "triangle", gain: 0.3 });
        tone(note(-12), 0.9, 1, { gain: 0.45 });
      },
      tick(last) { tone(last ? 990 : 660, 0, 0.07, { type: "triangle", gain: 0.5, to: last ? 700 : 480 }); },
      timeUp() {
        [3, 2, 1].forEach((n, i) => tone(note(n - 12), i * 0.28, 0.3, { type: "sawtooth", gain: 0.2 }));
        tone(note(-12), 0.84, 0.9, { type: "sawtooth", gain: 0.22, to: note(-17) });
      },
      reveal() {
        [0, 4, 7, 12, 16, 19, 24, 28].forEach((n, i) => tone(note(n), i * 0.035, 0.45, { type: "triangle", gain: 0.28 }));
        chord([12, 16, 19, 24], 0.34, 1, { type: "triangle", gain: 0.28 });
      },
      correct() { [16, 19, 24].forEach((n, i) => tone(note(n + 12), i * 0.08, 0.55, { gain: 0.36 })); },
      wrong() { tone(note(-9), 0, 0.2, { type: "sawtooth", gain: 0.2 }); tone(note(-12), 0.2, 0.5, { type: "sawtooth", gain: 0.2, to: note(-16) }); },
    },
  };

  function play(name, ...args) {
    if (muted || !ctx || ctx.state !== "running") return;
    const key = getComputedStyle(document.documentElement).getPropertyValue("--sound-theme").trim();
    (themes[key] || themes.studio)[name](...args);
  }

  // ---------- Pulsante per silenziare, accanto a quello della lingua ----------

  const languageButton = document.querySelector("[data-language-toggle]");
  if (languageButton) {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "sound-toggle";
    toggle.dataset.soundToggle = "";
    const paint = () => {
      toggle.innerHTML = ico(muted ? "mute" : "sound");
      toggle.setAttribute("aria-pressed", String(muted));
      toggle.setAttribute("aria-label", tr("Silenzia i suoni", "Mute sounds"));
      toggle.title = muted ? tr("Suoni spenti", "Sounds off") : tr("Suoni accesi", "Sounds on");
    };
    toggle.addEventListener("click", () => {
      muted = !muted;
      try { localStorage.setItem(storageKey, muted ? "off" : "on"); } catch { /* vale solo per questa sessione */ }
      if (master) master.gain.setTargetAtTime(muted ? 0 : 0.3, ctx.currentTime, 0.02);
      paint();
      if (!muted) play("correct");
    });
    window.addEventListener("quizboard-language", paint);
    paint();
    languageButton.before(toggle);
  }

  // ---------- Cosa osservare nella pagina ----------

  const playedSiglas = new WeakSet();
  let lastTimer = "";
  let answerShown = false;
  let verdictShown = false;

  function check() {
    const sigla = document.querySelector(".view-enter .sigla");
    if (sigla && !playedSiglas.has(sigla)) {
      playedSiglas.add(sigla);
      play("sigla");
    }

    const timer = document.getElementById("timer-display");
    const text = timer ? timer.textContent.trim() : "";
    if (text && text !== lastTimer) {
      const seconds = Number(text.split(":")[1]);
      if (lastTimer === "0:01" && text === "0:00") play("timeUp");
      else if (timer.parentElement.classList.contains("urgent") && seconds > 0) play("tick", seconds <= 3);
    }
    if (text) lastTimer = text;

    const answer = Boolean(document.querySelector("dialog[open] .quiz-clue-content .prompt-card, dialog[open] #revealed:not([hidden])"));
    if (answer && !answerShown) play("reveal");
    answerShown = answer;

    const verdict = document.querySelector(".flash-correct, .flash-incorrect");
    if (verdict && !verdictShown) play(verdict.classList.contains("flash-correct") ? "correct" : "wrong");
    verdictShown = Boolean(verdict);
  }

  new MutationObserver(check).observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class", "hidden", "open"],
  });

  const positive = new Set(["quiz-correct", "mime-correct", "proverb-correct", "list-answer"]);
  const negative = new Set(["quiz-wrong", "proverb-wrong"]);
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (positive.has(action) || button.id === "correct") play("correct");
    else if (negative.has(action) || button.id === "wrong") play("wrong");
  }, true);
})();
