const stage = document.getElementById("player-stage");
const heading = document.getElementById("player-heading");
const content = document.getElementById("player-content");
const scores = document.getElementById("player-scores");
const video = document.getElementById("player-video");
const fullscreen = document.getElementById("player-fullscreen");
const fullscreenStatus = document.getElementById("player-fullscreen-status");
const enableVideo = document.getElementById("player-enable-video");
const mediaStatus = document.getElementById("player-media-status");
let projection = null;
let shownContent = "";
let shownScores = "";
let showingRound = false;
let tone = "quiz";
let shownScene = null; // solo presentazione: ultima scena mostrata

const playerText = (it, en) => document.documentElement.lang === "en" ? en : it;

function syncClock() {
  if (!projection?.clock) return;
  const { step, deadline, duration, correctionTime } = projection.clock;
  const seconds = step === "ready" ? duration : step === "done" ? 0 : Math.max(0, Math.ceil((correctionTime ?? (deadline - Date.now())) / 1000));
  const timer = heading.querySelector("#timer-display");
  if (timer) {
    const text = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    if (timer.textContent !== text) timer.textContent = text;
    heading.querySelector("#timer-bar").value = seconds;
    timer.parentElement.classList.toggle("urgent", step === "active" && seconds <= 10);
  }
}

function syncVideo() {
  const media = projection?.media;
  video.hidden = !media;
  if (!media) {
    video.pause();
    if (video.hasAttribute("src")) {
      video.removeAttribute("src");
      video.load();
    }
    enableVideo.hidden = true;
    mediaStatus.hidden = true;
    return;
  }

  if (video.getAttribute("src") !== media.src) {
    mediaStatus.hidden = true;
    enableVideo.hidden = true;
    video.src = media.src;
  }
  if (video.readyState === 0) return;
  video.playbackRate = media.rate;
  const elapsed = media.running ? Math.max(0, Date.now() - media.at) / 1000 * media.rate : 0;
  const target = Math.min(media.time + elapsed, Number.isFinite(video.duration) ? video.duration : Infinity);
  if (Math.abs(video.currentTime - target) > (media.running ? 0.35 : 0.06)) video.currentTime = target;
  if (!media.running) {
    video.pause();
    enableVideo.hidden = true;
  } else if (video.paused) {
    video.play().then(() => { enableVideo.hidden = true; }).catch(() => {
      if (projection?.media?.running) enableVideo.hidden = false;
    });
  }
}

function readDisplay() {
  try {
    const owner = localStorage.getItem(presenterStorage);
    const saved = JSON.parse(localStorage.getItem(playerStorage));
    projection = owner && saved?.owner === owner ? saved : null;
  } catch {
    projection = null;
  }

  document.documentElement.lang = projection?.language ?? document.documentElement.lang;
  document.title = playerText("Schermo giocatori · Quizboard", "Player display · Quizboard");
  fullscreen.textContent = playerText("Schermo intero", "Full screen");
  enableVideo.textContent = playerText("Attiva video", "Enable video");
  const newTone = projection?.tone ?? "quiz";
  if (tone !== newTone) {
    stage.classList.replace(`tone-${tone}`, `tone-${newTone}`);
    tone = newTone;
  }

  const markup = projection?.markup ?? `<h1>Quizboard</h1><p class="stage-copy">${playerText("In attesa del presentatore.", "Waiting for the presenter.")}</p>`;
  const standings = projection?.scores ?? "";
  const playing = Boolean(standings);
  if (markup !== shownContent || playing !== showingRound) {
    // Solo presentazione: gli ingressi scenici partono quando cambia la scena, non a ogni aggiornamento.
    const scene = projection?.scene ?? "";
    const phase = scene.split("|")[0];
    document.body.classList.remove("view-enter", "card-enter");
    void document.body.offsetWidth;
    document.body.classList.add(scene !== shownScene ? "view-enter" : "card-enter");
    shownScene = scene;
    content.classList.toggle("intro-stage", !projection || ["", "setup", "welcome", "intro"].includes(phase));
    content.classList.toggle("results-stage", ["results", "final"].includes(phase));
    content.innerHTML = markup;
    const roundHeading = playing && content.querySelector(":scope > .stage-header");
    heading.replaceChildren();
    if (roundHeading) heading.append(roundHeading);
    heading.hidden = !roundHeading;
    shownContent = markup;
    showingRound = playing;
  }
  if (standings !== shownScores) {
    scores.innerHTML = standings;
    shownScores = standings;
  }
  scores.hidden = !standings;
  syncClock();
  syncVideo();
}

fullscreen.addEventListener("click", async () => {
  try {
    await document.documentElement.requestFullscreen();
    fullscreenStatus.hidden = true;
  } catch {
    fullscreenStatus.textContent = playerText(
      "Usa il comando Schermo intero del browser o del sistema.",
      "Use the full-screen command in your browser or operating system."
    );
    fullscreenStatus.hidden = false;
  }
});
enableVideo.addEventListener("click", syncVideo);
video.addEventListener("loadedmetadata", syncVideo);
video.addEventListener("error", () => {
  if (!projection?.media) return;
  mediaStatus.textContent = playerText("Video non disponibile su questo schermo.", "Video unavailable on this display.");
  mediaStatus.hidden = false;
});
window.addEventListener("storage", (event) => {
  if (event.key === presenterStorage || event.key === playerStorage || event.key === null) readDisplay();
});
window.addEventListener("pageshow", readDisplay);
readDisplay();
setInterval(syncClock, 125);
