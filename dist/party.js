const app = document.getElementById("app");
const dialog = document.getElementById("card-dialog");
const live = document.getElementById("live");
const minTeams = 2;
const maxTeams = 6; // con 5 o 6 squadre la mano resta quella di main: vedi dealCards()
const flashRevealDuration = 850;
const listTurnDurations = [10, 15, 20, 30, 45, 60];
const defaultListTurnSeconds = 15;
const partyQuizCategories = [...mintakaCategories, famousPhotos];
const quizTileCount = partyQuizCategories.reduce((count, category) => count + category.clues.length, 0);
const quizEffects = {
  sprint: { name: "Sprint", type: "bonus", sign: 1, adjustment: 2, description: "+2 punti se la risposta è esatta" },
  scudo: { name: "Scudo", type: "bonus", sign: -1, adjustment: 2, description: "2 punti di penalità in meno se la risposta è sbagliata" },
  pressione: { name: "Pressione", type: "malus", sign: -1, adjustment: -2, description: "2 punti di penalità in più se la risposta è sbagliata" },
  freno: { name: "Freno", type: "malus", sign: 1, adjustment: -2, description: "2 punti in meno se la risposta è esatta" },
};
const lookup = new Map(partyRounds.map((round) => [round.id, round]));
const warmupIndex = partyRounds.findIndex((round) => round.id === "proverbs");
// Keep the saved round indexes stable while starting new parties with the warm-up.
const defaultRoundOrder = [warmupIndex, ...partyRounds.flatMap((round, index) =>
  round.suspended || index === warmupIndex ? [] : [index]
)];
function flashBank(trueCards, falseCards) {
  return [...trueCards.map((prompt) => [prompt, true]), ...falseCards.map((prompt) => [prompt, false])];
}

const timedBanks = {
  it: { mime: mimeCards, flash: flashBank(flashTrue, flashFalse) },
  en: { mime: englishMimeCards, flash: flashBank(englishFlashTrue, englishFlashFalse) },
};
const teamClass = (index) => `team-${index}`;
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]
));

let state = null;
let teamDraft = ["", ""];
let roundOrderDraft = [...defaultRoundOrder];
let selectedRounds = [...defaultRoundOrder];
let listTurnDraft = defaultListTurnSeconds;
let stageFocus = false;
// Solo presentazione: servono a far partire le animazioni quando cambia la scena.
let lastViewKey = null;
let lastCardKey = null;
let lastScores = null;
let movedRound = null;
let roundDrag = null;
let songVideos = [];
let songVideoIndex = 0;
const presenterId = `${Date.now()}-${Math.random()}`;
let presenter = false;
let lastProjection = "";
let lastVideoSync = 0;

function ownsPresentation() {
  if (!presenter) return false;
  try {
    return localStorage.getItem(presenterStorage) === presenterId;
  } catch {
    return true;
  }
}

function acquirePresentation(force = false) {
  try {
    const owner = localStorage.getItem(presenterStorage);
    if (!owner || force) localStorage.setItem(presenterStorage, presenterId);
    presenter = localStorage.getItem(presenterStorage) === presenterId;
  } catch {
    presenter = true;
  }
  if (!presenter) {
    render();
    return;
  }
  state = readParty();
  if (state) saveParty();
  render();
  if (state?.phase === "play" && roundNow().id === "quiz" && state.play.selected !== null) {
    showQuizCard(state.play.selected);
  }
}

function readParty() {
  try {
    const saved = JSON.parse(localStorage.getItem(partyStorage));
    if (
      [1, partyVersion].includes(saved?.version) && Array.isArray(saved.teams) &&
      saved.teams.length >= minTeams && saved.teams.length <= maxTeams &&
      saved.teams.every((name) => typeof name === "string") &&
      Number.isInteger(saved.round) && partyRounds[saved.round] &&
      (saved.roundOrder === undefined || validRoundOrder(saved.roundOrder, saved.round)) &&
      ["welcome", "intro", "play", "results", "final"].includes(saved.phase) &&
      Array.isArray(saved.scores) && Array.isArray(saved.history) &&
      saved.draw && saved.play
    ) {
      if (saved.version === 1) migrateParty(saved);
      if (partyRounds[saved.round].suspended && ["welcome", "intro", "play"].includes(saved.phase)) {
        skipSavedRound(saved);
      }
      const warmup = partyRounds[warmupIndex];
      const updateScores = (scores) => scores.map((score) => score === warmup.hand ? warmup.completionPoints : score);
      if (saved.history[warmupIndex]) saved.history[warmupIndex] = updateScores(saved.history[warmupIndex]);
      if (saved.round === warmupIndex) saved.scores = updateScores(saved.scores);
      if (partyRounds[saved.round].id === "list" && saved.phase === "play") {
        saved.play.step ??= "ready";
      }
      return saved;
    }
  } catch {
    // A blocked or unavailable storage does not prevent play.
  }
  return null;
}

function validRoundOrder(order, currentRound) {
  return Array.isArray(order) && order.length > 0 && new Set(order).size === order.length &&
    order.every((index) => Number.isInteger(index) && partyRounds[index]) && order.includes(currentRound);
}

function nextRoundIndex() {
  return remainingRoundIndexes()[0] ?? -1;
}

function migrateParty(saved) {
  const round = partyRounds[saved.round];
  saved.version = partyVersion;
  delete saved.draw.song;
  if (round.id === "song" && ["intro", "play"].includes(saved.phase)) {
    skipSavedRound(saved);
  } else if (round.id === "proverbs" && saved.phase === "play") {
    // An earlier turn used a different hand size, deadline, and scoring rule.
    saved.phase = "intro";
    saved.play = {};
    saved.scores = saved.teams.map(() => 0);
  }
  return saved;
}

function skipSavedRound(saved) {
  const order = sessionRoundIndexes(saved);
  const next = order.slice(order.indexOf(saved.round) + 1).find((index) => !partyRounds[index].suspended);
  if (next === undefined) saved.phase = "final";
  else {
    saved.round = next;
    if (saved.phase !== "welcome") saved.phase = "intro";
  }
  saved.play = {};
  saved.scores = saved.teams.map(() => 0);
}

function saveParty() {
  if (!ownsPresentation()) return;
  try {
    if (state) localStorage.setItem(partyStorage, JSON.stringify(state));
    else localStorage.removeItem(partyStorage);
  } catch {
    // The party can continue in the current tab.
  }
}

function shuffle(values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const other = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[other]] = [copy[other], copy[i]];
  }
  return copy;
}

function indices(length, offset = 0) {
  return Array.from({ length }, (_, index) => index + offset);
}

// Come slice(offset, offset + count), ma se il mazzo finisce ricomincia da capo:
// con 5 o 6 squadre ogni squadra riceve lo stesso numero di carte di main e le
// ultime rivedono carte già uscite. Fino a 4 squadre il risultato è quello di main.
function dealCards(cards, offset, count) {
  return indices(count, offset).map((position) => cards[position % cards.length]);
}

function drawCards(teams) {
  const trueCards = shuffle(indices(flashTrue.length));
  const falseCards = shuffle(indices(flashFalse.length, flashTrue.length));
  const halfFlashHand = lookup.get("flash").hand / 2;
  return {
    quiz: mintakaCategories.map(({ clues }) => clues.map(() => Math.floor(Math.random() * 2))),
    mime: dealCards(shuffle(indices(mimeCards.length)), 0, teams * lookup.get("mime").hand),
    flash: indices(teams).flatMap((index) => {
      const offset = index * halfFlashHand;
      return shuffle([
        ...dealCards(trueCards, offset, halfFlashHand),
        ...dealCards(falseCards, offset, halfFlashHand),
      ]);
    }),
    proverbs: shuffle(indices(proverbCards.length)).slice(0, teams * partyRounds[warmupIndex].hand),
  };
}

function roundNow() {
  return partyRounds[state.round];
}

function teamOnTurn() {
  if (roundNow().id === "song") return state.play.team ?? 0;
  return activePartyTeam(state);
}

function timedCard() {
  if (state.round === warmupIndex) return warmupCard(state);
  return timedPartyCard(state, timedBanks[language][roundNow().id]);
}

function roundProgress(position, total) {
  return `${tr("Manche", "Round")} ${progressCount(position, total)}`;
}

function completedRounds(count) {
  return count === 1 ? tr("1 manche completata", "1 round completed") : tr(`${count} manche completate`, `${count} rounds completed`);
}

function englishPlace(place) {
  return `${place}${["th", "st", "nd", "rd"][place] ?? "th"}`;
}

function quizClue(index) {
  const rowSize = mintakaCategories[0].clues.length;
  const column = Math.floor(index / rowSize);
  const row = index % rowSize;
  const category = partyQuizCategories[column];
  const alternate = state.draw.quiz[column]?.[row];
  const italian = alternate ? quizAlternates[column][row] : category.clues[row];
  const english = (category.englishClues ?? englishQuizClues[alternate ? "alternate" : "mintaka"][column])[row];
  const [question, answer] = tr(italian, english);
  return { category: quizCategoryName(category.name), value: row + 1, question, answer, photo: category.photos?.[row] };
}

function ranked(scores) {
  const ordered = scores.map((score, team) => ({ score, team })).sort((a, b) => b.score - a.score);
  for (let start = 0; start < ordered.length;) {
    let end = start + 1;
    while (end < ordered.length && ordered[end].score === ordered[start].score) end++;
    const points = ordered.length - start;
    for (let i = start; i < end; i++) {
      ordered[i].place = start + 1;
      ordered[i].points = points;
    }
    start = end;
  }
  return ordered;
}

function totalScores() {
  const totals = state.teams.map(() => 0);
  state.history.forEach((scores, index) => {
    if (!scores) return;
    if (index === warmupIndex) scores.forEach((score, team) => { totals[team] += score; });
    else for (const entry of ranked(scores)) totals[entry.team] += entry.points;
  });
  return totals;
}

function icon(round) {
  return `<span class="round-icon tone-${round.id}" aria-hidden="true">${ico(round.id)}</span>`;
}

function teamChip(index) {
  return `<span class="team-label ${teamClass(index)}"><i class="team-dot" aria-hidden="true"></i>${esc(state.teams[index])}</span>`;
}

function teamForm() {
  return `
    <form id="team-form" class="team-form">
      <div class="team-fields">
        ${teamDraft.map((name, index) => `
          <div class="team-field ${teamClass(index)}">
            <label for="team-name-${index}">${teamName(index)}</label>
            <input id="team-name-${index}" type="text" maxlength="40" autocomplete="off" placeholder="${t("Nome della squadra")}" value="${esc(name)}">
            ${teamDraft.length > minTeams ? `<button type="button" class="icon-button remove-team" data-action="remove-team" data-index="${index}" aria-label="${tr(`Rimuovi squadra ${index + 1}`, `Remove team ${index + 1}`)}">${ico("close")}</button>` : ""}
          </div>`).join("")}
      </div>
      ${teamDraft.length < maxTeams ? `<button type="button" class="button ghost" data-action="add-team">${ico("plus")} ${t("Aggiungi squadra")}</button>` : ""}
      ${roundOrderView()}
      ${selectedRounds.some((index) => partyRounds[index].id === "list") ? `
        <div class="list-settings">
          <label for="list-turn-seconds">${t("Sfida delle liste · Tempo per risposta")}</label>
          <select id="list-turn-seconds">
            ${listTurnDurations.map((seconds) => `<option value="${seconds}" ${seconds === listTurnDraft ? "selected" : ""}>${tr(`${seconds} secondi`, `${seconds} seconds`)}</option>`).join("")}
          </select>
        </div>` : ""}
      <button class="button primary team-start" type="submit">${t("Inizia la partita")}</button>
    </form>`;
}

function roundOrderView() {
  return `<section class="round-order" aria-labelledby="round-order-title">
    <h3 class="panel-title" id="round-order-title">${tr("Scegli e ordina le manche", "Choose and order the rounds")}</h3>
    <p id="round-reorder-help" class="sr-only">${tr("Trascina la maniglia o usa i tasti freccia su e giù per spostare la manche.", "Drag the handle or use the Up and Down arrow keys to move the round.")}</p>
    <ol class="round-order-list" role="list">
      ${roundOrderDraft.map((index, position) => {
        const round = partyRounds[index];
        const enabled = selectedRounds.includes(index);
        const moved = movedRound?.index === index ? ` class="moved" style="--dir: ${movedRound.dir}"` : "";
        return `<li role="listitem"${moved}>
          <span class="round-position" aria-hidden="true">${position + 1}</span>
          ${icon(round)}
          <label class="round-choice"><input type="checkbox" data-round-selection="${index}" ${enabled ? "checked" : ""} ${enabled && selectedRounds.length === 1 ? "disabled" : ""}> <strong>${esc(t(round.title))}</strong></label>
          <button type="button" class="button ghost round-handle" data-round-handle="${index}" aria-label="${tr(`Sposta ${esc(t(round.title))}`, `Move ${esc(t(round.title))}`)}" aria-describedby="round-reorder-help" aria-keyshortcuts="ArrowUp ArrowDown">${ico("grip")}</button>
        </li>`;
      }).join("")}
    </ol>
  </section>`;
}

function setupView() {
  return `
    ${debugRoundMenu()}
    <section class="hero" aria-labelledby="setup-heading">
      <div class="hero-copy">
        <h1 id="setup-heading">${tr("Serata <span>giochi</span>", "<span>Game</span> Night")}</h1>
        <p>${t("Scegli i giochi da fare insieme sullo stesso schermo.")}</p>
      </div>
      <section class="panel team-panel" aria-labelledby="setup-title">
        <h2 class="panel-title" id="setup-title" tabindex="-1">${t("Prepara le squadre")}</h2>
        <p class="panel-note">${t("Puoi giocare con 2–6 squadre.")}</p>
        ${teamForm()}
      </section>
    </section>
    ${partyDebug ? `<section aria-labelledby="rounds-heading">
      <h2 class="panel-title" id="rounds-heading">${t("Le manche")}</h2>
      <ol class="round-list">
        ${[...defaultRoundOrder, ...indices(partyRounds.length).filter((index) => partyRounds[index].suspended)].map((index) => partyRounds[index]).map((round) => `
          <li class="${round.suspended ? "suspended" : ""}">
            ${icon(round)}
            <div class="round-info"><strong>${t(round.title)}</strong><small>${round.suspended ? t("In sospeso") : t(round.summary)}</small></div>
            ${round.suspended ? "" : `<span class="round-format">${t(round.format)}</span>`}
          </li>`).join("")}
      </ol>
    </section>` : ""}`;
}

function sessionRoundIndexes(party = state) {
  const order = party.roundOrder ?? indices(partyRounds.length).filter((index) => (
    !["list", "song"].includes(partyRounds[index].id) || party.history[index] || index === party.round
  ));
  return order.filter((index) => !partyRounds[index].suspended || party.history[index] || index === party.round);
}

function remainingRoundIndexes() {
  if (!state) return roundOrderDraft.filter((index) => selectedRounds.includes(index));
  const order = sessionRoundIndexes();
  return order.slice(order.indexOf(state.round) + 1).filter((index) => !partyRounds[index].suspended);
}

function debugRoundMenu() {
  if (!partyDebug) return "";
  const buttons = remainingRoundIndexes().map((index) =>
    `<button type="button" class="button secondary" data-action="debug-round" data-index="${index}">${tr("Vai a", "Go to")} ${esc(t(partyRounds[index].title))}</button>`
  ).join("");
  return `<nav class="debug-rounds" aria-label="${t("Scorciatoie di debug")}"><strong>${t("Modalità debug")}</strong>${buttons}</nav>`;
}

function roadmap() {
  if (!partyDebug) return "";
  const rounds = sessionRoundIndexes();
  return `<ol class="roadmap" style="--steps: ${rounds.length}" aria-label="${t("Avanzamento delle manche")}">
    ${rounds.map((index) => {
      const round = partyRounds[index];
      const done = Boolean(state.history[index]);
      return `<li class="tone-${round.id}${done ? " done" : ""}" ${index === state.round && state.phase !== "final" ? 'aria-current="step"' : ""}><span aria-hidden="true">${ico(done ? "check" : round.id)}</span>${t(round.short)}${done ? `<span class="sr-only"> ${t("completata")}</span>` : ""}</li>`;
    }).join("")}
  </ol>`;
}

function roundTitle(title, end = "") {
  const round = roundNow();
  const rounds = sessionRoundIndexes();
  const progress = state.phase === "final"
    ? completedRounds(state.history.filter(Boolean).length)
    : roundProgress(rounds.indexOf(state.round) + 1, rounds.length);
  return `<div class="stage-header">
    <div>
      <p class="kicker">${progress}</p>
      <h1 id="stage-title" tabindex="-1">${title}</h1>
    </div>
    ${end || icon(round)}
  </div>`;
}

function standings(scores, activeTeam = -1, hud = false) {
  // Nel gioco i podi restano nell'ordine delle squadre, così nessuno cambia posto durante la manche.
  const entries = hud ? scores.map((score, team) => ({ score, team })) : ranked(scores);
  const cards = hud && roundNow().id === "quiz";
  return `<ol class="standings" style="--n: ${entries.length}">
      ${entries.map(({ team, score }) => {
        const used = cards ? state.play.cards?.[team] : null;
        const bump = hud && lastScores && lastScores[team] !== undefined && lastScores[team] !== score;
        return `<li class="${teamClass(team)}${team === activeTeam ? " current" : ""}${bump ? " bump" : ""}">
        ${teamChip(team)}<strong class="total">${formatNumber(score)} pt</strong>
        ${cards ? `<small>${used ? `${tr("Carta usata", "Card used")} · ${t(quizEffects[used.effect].name)}` : t("Carta disponibile")}</small>` : ""}
      </li>`;
      }).join("")}
    </ol>`;
}

function halftimeStandings() {
  const rounds = sessionRoundIndexes();
  const midpoint = Math.ceil(rounds.length / 2);
  if (midpoint >= rounds.length || state.round !== rounds[midpoint - 1]) return "";
  return `<section class="halftime-standings" aria-labelledby="halftime-title">
    <h2 class="panel-title" id="halftime-title">${t("Classifica a metà serata")}</h2>
    ${standings(totalScores())}
  </section>`;
}

function turnLine(label) {
  const index = teamOnTurn();
  return `<div class="turn-box ${teamClass(index)}"><div class="turn-line"><span>${label}</span>${teamChip(index)}</div></div>`;
}

function timer(seconds = roundNow().seconds) {
  return `<div class="timer" aria-label="${t("Tempo rimanente")}">
    <span class="timer-output" id="timer-display">0:${seconds}</span>
    <progress id="timer-bar" max="${seconds}" value="${seconds}" aria-label="${t("Tempo rimanente")}"></progress>
  </div>`;
}

function introView(forPlayers = false) {
  const round = roundNow();
  const controls = state.round === warmupIndex
    ? warmupCategories.map((category, index) => `<button type="button" class="button primary" data-action="begin-round" data-index="${index}">${t(category.label)}</button>`).join("")
    : `<button type="button" class="button primary" data-action="begin-round">${t("Inizia la manche")}</button>`;
  return `<div class="sigla" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="intro-content">
      ${roundTitle(t(round.title))}
      <div class="intro-rules">
        <p>${t(round.rules)}</p>
        ${round.id === "mime" ? `<p class="intro-note">${t("Fate distogliere lo sguardo alle altre persone mentre viene mostrata la carta.")}</p>` : ""}
      </div>
    </div>
    ${forPlayers ? "" : `<div class="actions intro-actions">${controls}</div>`}`;
}

function cardProgress(round, completed) {
  const label = round.id === "proverbs" ? t("Risposte corrette di fila") : t("Avanzamento del turno");
  return `<div class="cards-progress">
    <span>${label}</span>
    <progress max="${round.hand}" value="${completed}" aria-label="${label}" aria-valuetext="${progressCount(completed, round.hand)}"></progress>
  </div>`;
}

function readyTurnView(round, forPlayers) {
  const mime = round.id === "mime";
  const warmup = round.id === "proverbs";
  return `<div class="turn-ready">
    <div class="turn-ready-team">
      <p class="kicker">${t("Si prepara")}</p>
      <h2 class="${teamClass(teamOnTurn())}">${teamChip(teamOnTurn())}</h2>
      <p class="turn-count">${tr("Turno", "Turn")} ${progressCount(state.play.turn + 1, state.teams.length)}</p>
    </div>
    ${forPlayers ? "" : `<div class="turn-ready-controls">
      ${mime ? `<p class="stage-copy">${t("Mostra la carta solo a chi mima. Il tempo parte quando la carta viene nascosta.")}</p>` : ""}
      ${warmup ? `<p class="stage-copy">${t(warmupCategories[state.play.category ?? 0].label)}</p>` : ""}
      <button type="button" class="button primary" data-action="${mime ? "mime-card" : "start-timer"}">${mime ? t("Mostra primo titolo") : tr(`Avvia ${round.seconds} secondi`, `Start ${round.seconds}-second timer`)}</button>
    </div>`}
  </div>`;
}

function timedView(forPlayers = false) {
  const round = roundNow();
  const play = state.play;
  const heading = roundTitle(t(round.title), timer());
  if (play.step === "ready") return heading + readyTurnView(round, forPlayers);
  const output = [heading];
  if (round.id !== "mime") output.push(cardProgress(round, play.card));

  if (play.step === "done") {
    const score = state.scores[teamOnTurn()];
    const label = play.endedBy === "time" ? t("Tempo scaduto") : play.endedBy === "success" ? t("Sequenza completata") : t("Turno concluso");
    output.push(turnLine(label));
    output.push(`<div class="prompt-card"><p class="prompt">${formatNumber(score)} ${pointLabel(score)}</p></div>`);
    const last = play.turn + 1 === state.teams.length;
    if (!forPlayers) output.push(`<div class="actions"><button type="button" class="button primary" data-action="next-turn">${last ? t("Vedi risultati") : t("Prossima squadra")}</button></div>`);
    return output.join("");
  }

  const card = timedCard();
  output.push(turnLine(t("Tocca a")));
  if (round.id === "mime") {
    output.push(`<div class="prompt-card"><span class="prompt-note">${tr("Carta", "Card")} ${progressCount(play.card + 1, round.hand)}</span><p class="prompt">${t("Titolo nascosto")}</p></div>
      <div class="actions">
        <button type="button" class="button secondary" data-action="mime-card">${t("Mostra titolo in privato")}</button>
        <button type="button" class="button positive" data-action="mime-correct" ${play.seen ? "" : "disabled"}>${t("Indovinato +1")}</button>
        <button type="button" class="button ghost" data-action="pass">${t("Passa")}</button>
      </div>`);
  } else if (round.id === "flash") {
    const reveal = play.reveal;
    output.push(`<div class="flash-question${reveal ? ` ${reveal.correct ? "flash-correct" : "flash-incorrect"}` : ""}">
      <p class="prompt">${esc(card[0])}</p>
      ${reveal ? `<p class="flash-verdict">${ico(reveal.correct ? "check" : "close")} ${flashVerdict(reveal.correct, card[1])}</p>` : ""}
    </div>`);
    if (!forPlayers) output.push(`<div class="actions">
      <button type="button" class="button positive" data-action="flash-true" ${reveal ? "disabled" : ""}>${tr("Vero (V)", "True (T)")}</button>
      <button type="button" class="button negative" data-action="flash-false" ${reveal ? "disabled" : ""}>${tr("Falso (F)", "False (F)")}</button>
      <button type="button" class="button secondary" data-action="pass" ${reveal ? "disabled" : ""}>${tr("Passa (P)", "Pass (P)")}</button>
      <button type="button" class="button ghost" data-action="end-turn" ${reveal ? "disabled" : ""}>${t("Termina turno")}</button>
    </div>`);
    return output.join("");
  } else {
    output.push(`<div class="prompt-card"><p class="prompt">${esc(card[0])}</p></div>`);
    if (!forPlayers) output.push(`<p class="presenter-answer"><strong>${t("Risposta")}</strong> ${esc(card[1])}</p>
      <div class="actions">
        <button type="button" class="button positive" data-action="warmup-correct">${t("Corretto")}</button>
        <button type="button" class="button negative" data-action="warmup-wrong">${t("Errore · ricomincia")}</button>
      </div>`);
  }
  output.push(`<p class="feedback" aria-hidden="true">${esc(t(play.feedback || ""))}</p>`);
  if (!forPlayers) output.push(`<div class="actions"><button type="button" class="button ghost" data-action="end-turn">${t("Termina turno")}</button></div>`);
  return output.join("");
}


function listView(forPlayers = false) {
  const play = state.play;
  if (play.category === null) {
    return `${roundTitle(t("La sfida delle liste"))}
      <div class="list-pick">
      <p class="stage-copy">${tr("Scegli una categoria per la manche.", "Choose a category for this round.")}</p>
      ${forPlayers ? "" : `<div class="actions">${listCategories.map((category, index) => `
        <button type="button" class="button secondary" style="--i: ${index}" data-action="list-category" data-index="${index}">${esc(category[language])}</button>`).join("")}</div>`}
      </div>`;
  }
  const category = listCategories[play.category];
  const ready = play.step === "ready";
  return `${roundTitle(t("La sfida delle liste"), timer(listTurnSeconds()))}
    <div class="list-play">
    <div class="turn-ready-team list-team">
      <p class="kicker">${t(ready ? "Si prepara" : "Tocca a")}</p>
      <h2 class="${teamClass(teamOnTurn())}">${teamChip(teamOnTurn())}</h2>
    </div>
    <p class="panel-title list-category">${esc(category[language])}</p>
    <p class="panel-note">${tr("Risposte trovate", "Answers found")} ${play.used.length} / ${category.answers.length} · ${tr("Passaggi consecutivi", "Consecutive passes")} ${play.passes} / ${state.teams.length}</p>
    </div>
    ${forPlayers ? "" : `
    <div class="list-answers" aria-label="${tr("Risposte valide", "Valid answers")}">
      ${category.answers.map((answer, index) => `<button type="button" class="button secondary" style="--i: ${index}" data-action="list-answer" data-index="${index}" ${ready || play.used.includes(index) ? "disabled" : ""}>${esc(answer[language === "en" ? 1 : 0])}${play.used.includes(index) ? ` ${ico("check")}` : ""}</button>`).join("")}
    </div>
    <div class="actions">
      ${ready ? `<button type="button" class="button primary" data-action="list-start">${t("Avvia il primo turno")}</button>` :
        `<button type="button" class="button ghost" data-action="list-pass">${t("Passa")}</button>`}
    </div>`}`;
}

function listTurnSeconds() {
  return state.listTurnSeconds ?? defaultListTurnSeconds;
}

function startListTurn() {
  const play = state.play;
  if (play.step !== "ready" || play.category === null) return;
  play.step = "active";
  play.deadline = Date.now() + listTurnSeconds() * 1000;
  refresh(true);
}

function listAdvance(index) {
  if (state?.phase !== "play" || roundNow().id !== "list") return;
  const play = state.play;
  if (play.step !== "active") return;
  const expired = play.correctionTime === undefined && Date.now() >= play.deadline;
  if (expired) index = null;
  if (index !== null && (!Number.isInteger(index) || !listCategories[play.category].answers[index] || play.used.includes(index))) return;
  if (!expired) rememberJudgment();
  if (index === null) play.passes++;
  else {
    play.used.push(index);
    state.scores[teamOnTurn()]++;
    play.passes = 0;
  }
  if (play.passes >= state.teams.length || play.used.length === listCategories[play.category].answers.length) {
    hideDialog();
    return finishRound();
  }
  play.turn++;
  play.deadline = Date.now() + listTurnSeconds() * 1000;
  live.textContent = `${expired ? t("Tempo scaduto.") + " " : ""}${t("Tocca a")} ${state.teams[teamOnTurn()]}.`;
  refresh(!expired);
}

function songView() {
  if (state.play.scoring) {
    return `${roundTitle(t("Valutazione karaoke"))}
      <div class="turn-ready-team song-score-team">
        <p class="kicker">${t("Voto per")}</p>
        <h2 class="${teamClass(teamOnTurn())}">${teamChip(teamOnTurn())}</h2>
      </div>
      <div class="song-scores" role="group" aria-label="${t("Punti per la canzone")}">
        ${indices(6).map((score) => `<button type="button" class="button positive" style="--i: ${score}" data-action="song-score" data-index="${score}" aria-label="${score} ${pointLabel(score)}">${score}</button>`).join("")}
      </div>
      <div class="actions spaced"><button type="button" class="button secondary" data-action="song-review">${t("Torna al video")}</button></div>`;
  }

  const clip = songVideos[songVideoIndex];
  return `${roundTitle(t("Karaoke"))}
    <div class="song-controls">
      <label for="song-files">${t("Carica video MP4")}</label>
      <input id="song-files" type="file" accept=".mp4,video/mp4" multiple>
      <label for="song-team">${t("Squadra che gioca")}</label>
      <select id="song-team">
        ${state.teams.map((name, index) => `<option value="${index}" ${index === teamOnTurn() ? "selected" : ""}>${esc(name)}</option>`).join("")}
      </select>
      ${songVideos.length > 1 ? `
        <label for="song-video-select">${t("Video da riprodurre")}</label>
        <select id="song-video-select">
          ${songVideos.map(({ name }, index) => `<option value="${index}" ${index === songVideoIndex ? "selected" : ""}>${esc(name)}</option>`).join("")}
        </select>` : ""}
    </div>
    ${clip ? `<video id="song-player" class="song-player" src="${esc(clip.url)}" aria-label="${t("Video karaoke")}" controls playsinline preload="metadata"></video>` : ""}
    <p id="song-message" class="panel-note" role="status"></p>
    <div class="actions spaced">
      ${clip ? `<button type="button" class="button primary" data-action="song-rate">${t("Vai al voto")}</button>` : ""}
      <button type="button" class="button secondary" data-action="finish-song">${t("Termina la manche")}</button>
    </div>`;
}

function rateSong() {
  if (state.play.scoring) return;
  state.play.scoring = true;
  refresh(true);
}

function reviewSong() {
  state.play.scoring = false;
  refresh(true);
}

function scoreSong(_, score) {
  if (!state.play.scoring || !Number.isInteger(score) || score < 0 || score > 5) return;
  rememberJudgment();
  const team = teamOnTurn();
  state.scores[team] += score;
  state.play.hasSongScore = true;
  state.play.team = (team + 1) % state.teams.length;
  live.textContent = `${state.teams[team]} · ${score} ${pointLabel(score)}`;
  reviewSong();
}

function clearSongVideos() {
  for (const clip of songVideos) URL.revokeObjectURL(clip.url);
  songVideos = [];
  songVideoIndex = 0;
}

function loadSongVideos(input) {
  const files = [...input.files];
  if (!files.length) return;
  const videos = files.filter(({ name, type }) => /\.mp4$/i.test(name) || type === "video/mp4");
  if (videos.length) {
    clearSongVideos();
    songVideos = videos.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }));
    render();
    app.querySelector("#song-player").focus({ preventScroll: true });
  } else {
    input.value = "";
  }
  if (videos.length !== files.length) {
    app.querySelector("#song-message").textContent = t("Seleziona solo file video MP4.");
  }
}

function quizView(forPlayers = false) {
  const taken = state.play.used;
  const lockedTile = quizCardOnTile() ? state.play.selected : null;
  return `${roundTitle(t("Tabellone quiz"))}
    <div class="quiz-meta">${turnLine(t("Sceglie"))}
    <p class="turn-count">${tr("Caselle giocate", "Tiles played")}: ${progressCount(taken.length, quizTileCount)}</p></div>
    ${lockedTile !== null ? `<p class="turn-count">${t("Completa la casella con la carta attiva.")}</p>` : ""}
    <div class="bulbs" aria-hidden="true"></div>
    <div class="quiz-grid" aria-label="${t("Categorie del quiz")}">
      ${partyQuizCategories.map((category, column) => `
        <section class="quiz-column">
          <h2>${quizCategoryName(category.name)}</h2>
          ${category.clues.map((_, row) => {
            const i = column * category.clues.length + row;
            const used = taken.includes(i);
            const value = row + 1;
            const label = `${esc(quizCategoryName(category.name))}, ${value} ${pointLabel(value)}${used ? t(", già giocata") : lockedTile === i ? t(", carta attiva") : ""}`;
            if (forPlayers) return `<span class="quiz-tile${used ? " used" : ""}" style="--i: ${column + row}" aria-label="${label}">${used ? ico("check") : value}</span>`;
            return `<button type="button" class="quiz-tile${used ? " used" : ""}" style="--i: ${column + row}" data-action="quiz-open" data-index="${i}" aria-label="${label}" ${used || (lockedTile !== null && lockedTile !== i) ? "disabled" : ""}>${used ? ico("check") : value}</button>`;
          }).join("")}
        </section>`).join("")}
    </div>
    <div class="bulbs" aria-hidden="true"></div>`;
}

function resultsView(final = false, forPlayers = false) {
  const scores = final ? totalScores() : state.history[state.round];
  const warmup = !final && state.round === warmupIndex;
  const unscored = !final && roundNow().id === "song" && scores.length === 0;
  const entries = ranked(scores);
  const winners = entries.filter((entry) => entry.place === 1).map(({ team }) => state.teams[team]);
  const title = final ? t("Classifica finale") : unscored ? t(roundNow().title) : `${tr("Risultati", "Results")} · ${t(roundNow().title)}`;
  const outcome = winners.length > 1
    ? `${tr("Parità tra", "Tie between")} ${esc(new Intl.ListFormat(language).format(winners))}.`
    : tr(`Vince ${esc(winners[0])}!`, `${esc(winners[0])} wins!`);
  return `${roundTitle(title)}
    <p class="stage-copy">${final ? outcome : unscored ? t("Manche conclusa.") : warmup ? t("Sequenza completata: 2 punti in classifica. Sequenza incompleta: 0 punti.") : t("Ogni squadra riceve tutti i punti del proprio piazzamento, anche a pari merito.")}</p>
    ${unscored ? "" : warmup ? standings(scores) : `<ol class="result-table ${final ? "final-table" : ""}" style="--n: ${entries.length}">
      ${entries.map(({ score, team, place, points }, position) => `<li class="result-row ${teamClass(team)}${place === 1 ? " winner" : ""}" style="--rev: ${entries.length - 1 - position}">
        <span class="result-place" aria-label="${tr("Posizione", "Place")} ${place}">${tr(`${place}°`, englishPlace(place))}</span>
        ${teamChip(team)}
        <div class="result-values"><strong class="total">${final ? formatNumber(score) : `+${formatNumber(points)}`} pt</strong>
        ${final ? "" : `<small>${formatNumber(score)} ${t("nella manche")}</small>`}</div>
      </li>`).join("")}
    </ol>`}
    ${final ? "" : halftimeStandings()}
    ${forPlayers ? "" : `<div class="actions spaced">
      ${correctionButton()}
      <button type="button" class="button primary" data-action="${final ? "ask-reset" : "advance-round"}">${final ? t("Nuova serata") : nextRoundIndex() === -1 ? t("Vedi classifica finale") : t("Prossima manche")}</button>
    </div>`}`;
}

function playerQuizView() {
  if (dialog.dataset.kind !== "quiz" || !dialog.open || !quizQuestionShown()) return quizView(true);
  const clue = quizClue(state.play.selected);
  return `${roundTitle(t("Tabellone quiz"))}
    ${turnLine(t("Tocca a"))}
    <p class="kicker">${esc(clue.category)} · ${clue.value} ${pointLabel(clue.value)}</p>
    <p class="prompt-card"><span class="prompt">${esc(clue.question)}</span></p>
    ${clue.photo ? `<figure class="quiz-photo"><img src="${esc(clue.photo.src)}" alt="${esc(tr(...clue.photo.alt))}">
      ${state.play.revealed ? `<figcaption>${esc(clue.photo.credit)}</figcaption>` : ""}</figure>` : ""}
    ${state.play.revealed ? `<div class="prompt-card player-answer"><p class="prompt-note">${t("Risposta")}</p><p class="prompt">${esc(clue.answer)}</p></div>` : ""}`;
}

function publishDisplay() {
  if (!ownsPresentation()) return;
  const round = state && roundNow();
  const playing = state?.phase === "play";
  let markup;
  let clock = null;
  let media = null;
  if (!state) markup = `<h1>Quizboard</h1><p class="stage-copy">${t("La serata sta per cominciare.")}</p>`;
  else if (state.phase === "welcome") markup = welcomeView(true);
  else if (state.phase === "intro") markup = introView(true);
  else if (!playing) markup = resultsView(state.phase === "final", true);
  else if (round.id === "quiz") markup = playerQuizView();
  else if (round.id === "list") markup = listView(true);
  else if (round.id === "song") {
    const video = app.querySelector("#song-player");
    markup = roundTitle(t("Karaoke")) + turnLine(t(state.play.scoring ? "Voto per" : "Tocca a"));
    if (video) media = {
      src: video.src,
      time: video.currentTime,
      running: !video.paused && !video.seeking && video.readyState >= 3,
      rate: video.playbackRate,
      at: Date.now(),
    };
  } else {
    markup = timedView(true);
  }
  if (playing && (round.seconds || (round.id === "list" && state.play.category !== null))) {
    const { step, deadline, correctionTime } = state.play;
    clock = { step, deadline, correctionTime, duration: round.seconds ?? listTurnSeconds() };
  }
  const projection = JSON.stringify({
    owner: presenterId, language, markup, clock, media,
    tone: round?.id ?? "quiz",
    // Solo presentazione: lo schermo giocatori usa la scena per far partire gli ingressi.
    scene: lastViewKey,
    scores: playing ? standings(state.scores, state.play.step === "done" ? -1 : teamOnTurn(), true) : "",
  });
  if (projection === lastProjection) return;
  try {
    localStorage.setItem(playerStorage, projection);
    lastProjection = projection;
  } catch {
    // The presentation can continue on the presenter screen.
  }
}

function render() {
  if (!ownsPresentation()) {
    app.classList.remove("play-view", "intro-view", "results-view");
    lastViewKey = null;
    document.getElementById("reset-button").hidden = true;
    app.innerHTML = `<section class="panel stage elsewhere"><h1>${t("Il gioco è aperto in un’altra finestra.")}</h1>
      <p class="stage-copy">${t("Usa quella finestra per condurre oppure riprendi il controllo qui.")}</p>
      <div class="actions spaced"><button class="button primary" type="button" data-action="take-presentation">${t("Riprendi il controllo")}</button></div></section>`;
    return;
  }
  const playing = state?.phase === "play";
  const intro = state?.phase === "intro";
  const welcome = state?.phase === "welcome";
  app.classList.toggle("play-view", playing);
  app.classList.toggle("intro-view", intro || welcome);
  app.classList.toggle("results-view", ["results", "final"].includes(state?.phase));
  // Le animazioni d'ingresso partono solo quando cambia la scena, non a ogni aggiornamento.
  const viewKey = state ? [state.phase, state.round, state.play.step ?? "", state.play.step === "ready" ? state.play.turn : "", state.play.category ?? "", state.play.scoring ? "voto" : ""].join("|") : "setup";
  const cardKey = state?.phase === "play" ? [state.play.card ?? "", state.play.reveal ? 1 : 0, state.play.feedback ?? ""].join("|") : "";
  app.classList.remove("view-enter", "card-enter");
  void app.offsetWidth;
  app.classList.toggle("view-enter", viewKey !== lastViewKey);
  app.classList.toggle("card-enter", viewKey === lastViewKey && cardKey !== lastCardKey);
  lastViewKey = viewKey;
  lastCardKey = cardKey;
  document.getElementById("reset-button").hidden = !state;
  const previousAction = document.activeElement?.dataset.action;
  if (!state) {
    app.innerHTML = setupView();
    if (stageFocus) app.querySelector("#setup-title").focus();
  } else {
    const id = roundNow().id;
    let view;
    if (welcome) view = welcomeView();
    else if (intro) view = introView();
    else if (state.phase === "results") view = resultsView();
    else if (state.phase === "final") view = resultsView(true);
    else if (id === "quiz") view = quizView();
    else if (id === "list") view = listView();
    else if (id === "song") view = songView();
    else view = timedView();
    app.innerHTML = playing ? `
      <section class="stage play-stage tone-${id}" aria-labelledby="stage-title">
        <div class="play-content">
          ${state.play.correctionTime !== undefined ? `<div class="correction-notice">
            <p>${t("Timer in pausa. Registra di nuovo la risposta oppure riprendi il timer.")}</p>
            <button type="button" class="button secondary" data-action="resume-correction-timer">${t("Riprendi il timer")}</button>
          </div>` : ""}
          ${view}
        </div>
        <div class="play-hud">
          <aside aria-labelledby="round-scores-title">
            <h2 class="round-scores-title" id="round-scores-title">${t("Punti della manche")}</h2>
            ${standings(state.scores, state.play.step === "done" ? -1 : teamOnTurn(), true)}
          </aside>
          <div class="actions presenter-actions">
            ${correctionButton()}
            <button type="button" class="button secondary reset" data-action="ask-reset">${t("Nuova serata")}</button>
          </div>
        </div>
        ${debugRoundMenu()}
      </section>` : `
      ${welcome ? "" : roadmap()}
      ${welcome ? "" : debugRoundMenu()}
      <section class="panel stage ${welcome ? "tone-quiz intro-stage" : `tone-${id}${intro ? " intro-stage" : ""}`}" aria-labelledby="stage-title">${view}</section>`;
    lastScores = playing ? [...state.scores] : null;
    updateClock();
    if (stageFocus) app.querySelector("#stage-title").focus();
    else if (previousAction && !dialog.open) {
      app.querySelector(`button[data-action="${previousAction}"]:not(:disabled)`)?.focus({ preventScroll: true });
    }
  }
  stageFocus = false;
  movedRound = null;
  publishDisplay();
}

function refresh(focus = false) {
  saveParty();
  stageFocus = focus;
  render();
}

function welcomeView(forPlayers = false) {
  return `<div class="sigla" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="intro-content">
    <div class="stage-header"><h1 id="stage-title" tabindex="-1">${tr("Benvenuti alla serata giochi!", "Welcome to game night!")}</h1></div>
    <div class="intro-rules"><p>${tr("Le squadre sono pronte. Che la serata abbia inizio!", "The teams are ready. Let game night begin!")}</p></div>
    <div class="welcome-teams">${state.teams.map((_, index) => `<span style="--i: ${index}" class="${teamClass(index)} team-label">${esc(state.teams[index])}</span>`).join("")}</div>
  </div>
  ${forPlayers ? "" : `<div class="actions intro-actions"><button type="button" class="button primary" data-action="start-evening">${tr("Cominciamo", "Let's begin")}</button></div>`}`;
}

function createParty(form, round = roundOrderDraft.find((index) => selectedRounds.includes(index)), phase = "welcome") {
  const teams = readTeamFields(form).map((name, index) => name.trim() || teamName(index));
  state = {
    version: partyVersion, teams, round, roundOrder: roundOrderDraft.filter((index) => selectedRounds.includes(index)), phase, history: [], scores: teams.map(() => 0),
    draw: drawCards(teams.length), play: {}, listTurnSeconds: listTurnDraft,
  };
  refresh(true);
}

function beginRound(_, category) {
  const { id, hand } = roundNow();
  if (state.round === warmupIndex) {
    const bank = warmupCategories[category];
    if (!bank) return;
    state.draw[bank.drawKey] ??= shuffle(indices(bank.it.length)).slice(0, state.teams.length * hand);
  }
  state.phase = "play";
  if (id === "list") state.play = { turn: 0, category: null, used: [], passes: 0, step: "ready" };
  else if (id === "quiz") state.play = { turn: 0, used: [], selected: null, revealed: false, seenTiles: [], cards: [] };
  else if (id === "song") state.play = {};
  else prepareTimedTurn(0, state.round === warmupIndex ? category : undefined);
  refresh(true);
}

function prepareTimedTurn(turn, category = state.play.category) {
  state.play = { turn, step: "ready", card: 0, deadline: null, seen: false, feedback: "", category };
}

function openDialog(kind, markup) {
  dialog.dataset.kind = kind;
  dialog.dataset.look = kind;
  dialog.className = `tone-${state ? roundNow().id : "quiz"}`;
  dialog.innerHTML = markup;
  if (!dialog.open) dialog.showModal();
  (dialog.querySelector("[autofocus]") || dialog.querySelector(".actions button") || dialog.querySelector("button"))?.focus();
}

function hideDialog() {
  dialog.dataset.kind = "";
  if (dialog.open) dialog.close();
}

function closeDialog() {
  const tile = dialog.dataset.kind === "quiz" ? state.play.selected : null;
  if (dialog.dataset.kind === "quiz" && !quizCardOnTile()) {
    state.play.selected = null;
    state.play.revealed = false;
    saveParty();
  }
  hideDialog();
  // Il focus torna alla casella che ha aperto la finestra.
  if (tile !== null) app.querySelector(`[data-action="quiz-open"][data-index="${tile}"]`)?.focus();
  publishDisplay();
}

function showMimeCard() {
  const ready = state.play.step === "ready";
  if (!ready && !hasTime()) return;
  state.play.seen = true;
  saveParty();
  openDialog("mime", `
    <p class="kicker">${t("Solo per chi mima")}</p>
    <h2 id="card-title">${esc(timedCard())}</h2>
    <p class="stage-copy">${t("Memorizza il titolo, poi nascondi la carta.")}</p>
    <div class="actions spaced">
      <button type="button" class="button primary" data-action="${ready ? "start-timer" : "hide-mime"}">${ready ? t("Nascondi e avvia") : t("Nascondi titolo")}</button>
    </div>`);
}

function startTimer() {
  if (state.play.step !== "ready") return;
  hideDialog();
  state.play.step = "active";
  state.play.deadline = Date.now() + roundNow().seconds * 1000;
  live.textContent = tr(`Timer avviato. ${roundNow().seconds} secondi.`, `Timer started. ${roundNow().seconds} seconds.`);
  refresh(true);
}

function hideMimeCard() {
  hideDialog();
  render();
  app.querySelector('[data-action="mime-correct"]')?.focus();
}

function updateClock() {
  if (!ownsPresentation()) return;
  const output = document.getElementById("timer-display");
  if (!output || state.phase !== "play") return;
  const list = roundNow().id === "list";
  const duration = list ? listTurnSeconds() : roundNow().seconds;
  const { step, deadline, correctionTime } = state.play;
  const now = Date.now();
  const seconds = step === "ready" ? duration : step === "done" ? 0 : Math.max(0, Math.ceil((correctionTime ?? (deadline - now)) / 1000));
  const formatted = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  if (output.textContent !== formatted) output.textContent = formatted;
  document.getElementById("timer-bar").value = seconds;
  output.parentElement.classList.toggle("urgent", step === "active" && seconds <= 10);
  if (correctionTime !== undefined) return;
  if (step === "active" && state.play.reveal) {
    if (now >= state.play.reveal.until) finishFlashReveal(seconds);
    return;
  }
  if (step === "active" && seconds === 0) {
    if (list) listAdvance(null);
    else finishTurn("time");
  }
}

function hasTime() {
  if (state.play.step !== "active" || state.play.reveal) return false;
  if (state.play.correctionTime !== undefined || Date.now() < state.play.deadline) return true;
  finishTurn("time");
  return false;
}

function finishTurn(reason) {
  hideDialog();
  delete state.play.correctionTime;
  state.play.step = "done";
  state.play.endedBy = reason;
  live.textContent = reason === "time" ? t("Tempo scaduto.") : reason === "success" ? t("Sequenza completata.") : t("Turno concluso.");
  refresh(true);
}

function scoreTimed(score, feedback) {
  if (!hasTime()) return;
  rememberJudgment();
  state.scores[teamOnTurn()] += score;
  state.play.card += 1;
  if (state.play.card === roundNow().hand) {
    finishTurn("cards");
    return;
  }
  state.play.seen = false;
  state.play.feedback = feedback;
  live.textContent = t(feedback);
  refresh();
}

function flashVerdict(correct, truth) {
  return t(correct ? "Risposta esatta +1" : truth ? "Risposta sbagliata −1 · Era vero" : "Risposta sbagliata −1 · Era falso");
}

function answerFlash(guess) {
  if (!hasTime()) return;
  const truth = timedCard()[1];
  const correct = guess === truth;
  rememberJudgment();
  state.scores[teamOnTurn()] += correct ? 1 : -1;
  state.play.reveal = { correct, until: Date.now() + flashRevealDuration };
  live.textContent = flashVerdict(correct, truth);
  refresh();
}

function finishFlashReveal(seconds) {
  const play = state.play;
  delete play.reveal;
  play.card++;
  if (play.card === roundNow().hand) finishTurn("cards");
  else if (seconds === 0) finishTurn("time");
  else refresh();
}

function answerWarmup(correct) {
  if (!hasTime()) return;
  rememberJudgment();
  const play = state.play;
  if (!correct) {
    play.card = 0;
    play.feedback = "Errore. Si riparte dalla prima domanda.";
  } else {
    play.card++;
    if (play.card === roundNow().hand) {
      state.scores[teamOnTurn()] = roundNow().completionPoints;
      finishTurn("success");
      return;
    }
    play.feedback = "Corretto.";
  }
  live.textContent = t(play.feedback);
  refresh();
}

function nextTimedTurn() {
  const next = state.play.turn + 1;
  if (next === state.teams.length) finishRound();
  else {
    prepareTimedTurn(next);
    refresh(true);
  }
}

function quizCardOnTile() {
  return state.play.cards?.find((card) => card?.tile === state.play.selected);
}

function quizCardOptions(type) {
  const turn = teamOnTurn();
  const options = Object.entries(quizEffects).filter(([, effect]) => effect.type === type);
  return `<div class="quiz-card-options">
    ${state.teams.map((_, team) => {
      if ((type === "bonus") !== (team === turn) || state.play.cards?.[team]) return "";
      return `<div class="quiz-card-option">
        ${teamChip(team)}
        <div class="actions">${options.map(([key, effect]) => `
          <button type="button" class="button ${type === "bonus" ? "positive" : "negative"}" data-action="quiz-${key}" data-index="${team}" aria-label="${tr(`Usa ${t(effect.name)} di ${esc(state.teams[team])}`, `Use ${esc(state.teams[team])}’s ${t(effect.name)}`)}. ${t(effect.description)}">${t(effect.name)}<small>${t(effect.description)}</small></button>`).join("")}
        </div>
      </div>`;
    }).join("")}
  </div>`;
}

function useQuizCard(team, key) {
  const play = state.play;
  const effect = quizEffects[key];
  const target = teamOnTurn();
  if (play.selected === null || quizQuestionShown() || quizCardOnTile() || play.cards?.[team] ||
      !state.teams[team] || (effect.type === "bonus") !== (team === target)) return;
  play.cards ??= [];
  play.cards[team] = { effect: key, tile: play.selected, target };
  saveParty();
  render();
  showQuizCard(play.selected);
}

function quizQuestionShown() {
  const { selected, seenTiles } = state.play;
  return selected !== null && (seenTiles?.includes(selected) ?? true);
}

function quizScore(sign) {
  const base = quizClue(state.play.selected).value;
  const effect = quizEffects[quizCardOnTile()?.effect];
  const adjustment = effect?.sign === sign ? effect.adjustment : 0;
  return sign * Math.max(0, base + sign * adjustment);
}

function showQuizCard(index, picker) {
  const play = state.play;
  if (!Number.isInteger(index) || index < 0 || index >= quizTileCount || play.used.includes(index)) return;
  if (play.selected !== index) {
    if (quizCardOnTile()) return;
    play.selected = index;
    play.seenTiles ??= [];
    play.revealed = false;
  }
  const clue = quizClue(index);
  const points = pointLabel(clue.value);
  const owner = play.cards?.findIndex((card) => card?.tile === index) ?? -1;
  const active = owner < 0 ? null : play.cards[owner];
  const effect = quizEffects[active?.effect];
  const turn = teamOnTurn();
  const shown = quizQuestionShown();
  if (shown && !play.seenTiles?.includes(index)) (play.seenTiles ??= []).push(index);
  const turnText = `<p class="stage-copy">${tr(`Tocca a ${esc(state.teams[turn])}.`, `${esc(state.teams[turn])}’s turn.`)}</p>`;
  const cardText = active ? `<p class="quiz-active-card"><strong>${t(effect.name)}</strong> ${tr(`giocata da ${esc(state.teams[owner])} su ${esc(state.teams[active.target])}`, `played by ${esc(state.teams[owner])} on ${esc(state.teams[active.target])}`)}. ${t(effect.description)}.</p>` : "";
  const correct = quizScore(1);
  const wrong = quizScore(-1);
  const back = `<button type="button" class="button ghost" data-action="close-dialog">${t("Torna al tabellone")}</button>`;
  saveParty();
  dialog.dataset.picker = picker ?? "";
  openDialog("quiz", `
    <div class="quiz-clue-head">
      <p class="kicker quiz-clue-category">${esc(clue.category)} · ${clue.value} ${points}</p>
      <div>${turnText}<button type="button" class="icon-button" data-action="close-dialog" aria-label="${t("Torna al tabellone")}">${ico("close")}</button></div>
    </div>
    <div class="quiz-clue-content">
      <h2 id="card-title">${shown ? esc(clue.question) : picker === "bonus" ? t("Gioca un bonus") : picker === "malus" ? t("Chi gioca il malus?") : t("Prima della domanda")}</h2>
      ${cardText}
      ${shown && clue.photo ? `<figure class="quiz-photo">
        <img src="${esc(clue.photo.src)}" alt="${esc(tr(...clue.photo.alt))}">
        ${play.revealed ? `<figcaption><a href="${esc(clue.photo.source)}" target="_blank" rel="noopener noreferrer">${esc(clue.photo.credit)}</a></figcaption>` : ""}
      </figure>` : ""}
      ${shown ? `<div class="presenter-answer"><strong>${t(play.revealed ? "Risposta" : "Risposta riservata")}</strong> ${esc(clue.answer)}</div>` : ""}
    </div>
    ${!shown && picker && !active ? `${quizCardOptions(picker)}<div class="actions"><button type="button" class="button ghost" data-action="quiz-card-back">${t("Indietro")}</button></div>` : `
      <div class="actions">
        ${shown && play.revealed ? `
          <button type="button" class="button positive" data-action="quiz-correct">${t("Esatta")} ${correct ? `+${correct}` : "0"}</button>
          <button type="button" class="button negative" data-action="quiz-wrong">${t("Sbagliata")} ${wrong ? `−${-wrong}` : "0"}</button>
        ` : `<button type="button" class="button primary" data-action="${shown ? "quiz-reveal" : "quiz-question"}">${shown ? t("Mostra la risposta") : t("Mostra la domanda")}</button>`}
        ${!shown && !active ? `
          <button type="button" class="button positive" data-action="quiz-bonus" ${play.cards?.[turn] ? "disabled" : ""}>Bonus</button>
          <button type="button" class="button negative" data-action="quiz-malus" ${state.teams.some((_, team) => team !== turn && !play.cards?.[team]) ? "" : "disabled"}>${t("Malus")}</button>` : ""}
        ${back}
      </div>`}`);
  publishDisplay();
}

function scoreQuiz(sign) {
  const play = state.play;
  if (play.selected === null || !play.revealed) return;
  rememberJudgment();
  state.scores[teamOnTurn()] += quizScore(sign);
  play.used.push(play.selected);
  play.selected = null;
  play.revealed = false;
  play.turn++;
  hideDialog();
  if (play.used.length === quizTileCount) finishRound();
  else refresh(true);
}

function correctionButton() {
  if (!state.judgments?.length) return "";
  return `<button type="button" class="button secondary" data-action="undo-judgment">${t("Correggi ultimo inserimento")}</button>`;
}

function restartCorrectionTimer() {
  const play = state.play;
  if (play.correctionTime === undefined) return;
  play.deadline = Date.now() + play.correctionTime;
  delete play.correctionTime;
}

function rememberJudgment() {
  const { correctionTime, ...play } = state.play;
  const remaining = play.step === "active" ? correctionTime ?? Math.max(0, play.deadline - Date.now()) : null;
  (state.judgments ??= []).push({ play: structuredClone(play), scores: [...state.scores], remaining });
  restartCorrectionTimer();
}

function undoJudgment() {
  const judgment = state.judgments?.pop();
  if (!judgment) return;
  hideDialog();
  if (state.phase !== "play") state.history[state.round] = null;
  state.phase = "play";
  state.play = judgment.play;
  state.scores = judgment.scores;
  if (judgment.remaining !== null) state.play.correctionTime = judgment.remaining;
  live.textContent = t("Inserimento annullato. Registra la correzione.");
  refresh(true);
  if (roundNow().id === "quiz") showQuizCard(state.play.selected);
}

function finishRound() {
  clearSongVideos();
  state.history[state.round] = roundNow().id === "song" && !state.play.hasSongScore ? [] : [...state.scores];
  state.phase = "results";
  refresh(true);
}

function advanceRound() {
  const next = nextRoundIndex();
  if (next !== -1) return openRound(next);
  state.phase = "final";
  refresh(true);
}

function openRound(index) {
  clearSongVideos();
  state.round = index;
  state.phase = "intro";
  state.play = {};
  delete state.judgments;
  state.scores = state.teams.map(() => 0);
  refresh(true);
}

function jumpToDebugRound(_, index) {
  if (!partyDebug || !remainingRoundIndexes().includes(index)) return;
  if (state) {
    hideDialog();
    openRound(index);
  } else {
    createParty(app.querySelector("#team-form"), index, "intro");
  }
}

function askReset() {
  openDialog("reset", `
    <h2 id="card-title">${t("Iniziare una nuova serata?")}</h2>
    <p class="stage-copy">${t("La classifica e i progressi di questa serata verranno azzerati.")}</p>
    <div class="actions spaced">
      <button type="button" class="button ghost" data-action="close-dialog" autofocus>${t("Continua a giocare")}</button>
      <button type="button" class="button primary" data-action="confirm-reset">${t("Nuova serata")}</button>
    </div>`);
}

function resetParty() {
  hideDialog();
  clearSongVideos();
  teamDraft = [...state.teams];
  listTurnDraft = listTurnSeconds();
  roundOrderDraft = [...defaultRoundOrder];
  selectedRounds = [...defaultRoundOrder];
  state = null;
  refresh(true);
}

function readTeamFields(form) {
  return Array.from(form.querySelectorAll('input[type="text"]'), (field) => field.value);
}

function changeTeamFields(action, index) {
  teamDraft = readTeamFields(app.querySelector("#team-form"));
  if (action === "add-team" && teamDraft.length < maxTeams) {
    index = teamDraft.length;
    teamDraft.push("");
  } else if (action === "remove-team" && teamDraft.length > minTeams) {
    teamDraft.splice(index, 1);
    index = Math.min(index, teamDraft.length - 1);
  }
  render();
  app.querySelectorAll('#team-form input[type="text"]')[index]?.focus();
}

function moveRound(index, target) {
  const position = roundOrderDraft.indexOf(index);
  if (state || position < 0 || target === position || target < 0 || target >= roundOrderDraft.length) return;

  teamDraft = readTeamFields(app.querySelector("#team-form"));
  roundOrderDraft.splice(position, 1);
  roundOrderDraft.splice(target, 0, index);
  movedRound = { index, dir: position - target };
  render();
  app.querySelector(`[data-round-handle="${index}"]`)?.focus({ preventScroll: true });
  live.textContent = `${t(partyRounds[index].title)}, ${tr("posizione", "position")} ${progressCount(target + 1, roundOrderDraft.length)}.`;
}

function roundDropPosition(clientY) {
  const target = roundDrag.rows.findIndex((row) => {
    const { top, height } = row.getBoundingClientRect();
    return clientY < top + height / 2;
  });
  return target === -1 ? roundDrag.rows.length : target;
}

function clearRoundDropMarker() {
  roundDrag.marker?.classList.remove("round-drop-before", "round-drop-after");
  roundDrag.marker = null;
}

app.addEventListener("pointerdown", (event) => {
  const handle = event.target.closest("[data-round-handle]");
  if (!handle || roundDrag || event.button !== 0 || !event.isPrimary) return;
  const row = handle.closest("li");
  const index = Number(handle.dataset.roundHandle);
  handle.setPointerCapture(event.pointerId);
  roundDrag = {
    pointer: event.pointerId, index, row, start: roundOrderDraft.indexOf(index),
    rows: [...row.parentElement.children].filter((item) => item !== row), marker: null,
  };
  row.classList.add("round-dragging");
});

app.addEventListener("pointermove", (event) => {
  if (roundDrag?.pointer !== event.pointerId) return;
  const { rows, start } = roundDrag;
  const target = roundDropPosition(event.clientY);
  clearRoundDropMarker();
  if (target === start) return;
  roundDrag.marker = rows[target] ?? rows.at(-1);
  roundDrag.marker.classList.add(target < rows.length ? "round-drop-before" : "round-drop-after");
});

for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
  app.addEventListener(type, (event) => {
    if (roundDrag?.pointer !== event.pointerId) return;
    const { index, row } = roundDrag;
    const target = type === "pointerup" ? roundDropPosition(event.clientY) : roundDrag.start;
    clearRoundDropMarker();
    row.classList.remove("round-dragging");
    roundDrag = null;
    moveRound(index, target);
  });
}

app.addEventListener("keydown", (event) => {
  const handle = event.target.closest("[data-round-handle]");
  if (!handle || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
  event.preventDefault();
  const index = Number(handle.dataset.roundHandle);
  moveRound(index, roundOrderDraft.indexOf(index) + (event.key === "ArrowUp" ? -1 : 1));
});

const actionHandlers = {
  "take-presentation": () => acquirePresentation(true),
  "start-evening": () => { if (state?.phase === "welcome") { state.phase = "intro"; refresh(true); } },
  "list-category": (_, index) => { if (state.play.category === null && listCategories[index]) { state.play.category = index; refresh(true); } },
  "list-start": startListTurn,
  "list-answer": (_, index) => listAdvance(index),
  "list-pass": () => listAdvance(null),
  "add-team": changeTeamFields,
  "remove-team": changeTeamFields,
  "ask-reset": askReset,
  "close-dialog": closeDialog,
  "confirm-reset": resetParty,
  "begin-round": beginRound,
  "undo-judgment": undoJudgment,
  "resume-correction-timer": () => { restartCorrectionTimer(); refresh(true); },
  "song-rate": rateSong,
  "song-review": reviewSong,
  "song-score": scoreSong,
  "finish-song": finishRound,
  "advance-round": advanceRound,
  "debug-round": jumpToDebugRound,
  "mime-card": showMimeCard,
  "hide-mime": hideMimeCard,
  "start-timer": startTimer,
  "flash-true": () => answerFlash(true),
  "flash-false": () => answerFlash(false),
  "mime-correct": () => { if (state.play.seen) scoreTimed(1, "Indovinato +1"); },
  "warmup-correct": () => answerWarmup(true),
  "warmup-wrong": () => answerWarmup(false),
  "pass": () => scoreTimed(0, "Carta saltata"),
  "end-turn": () => { if (hasTime()) finishTurn("manual"); },
  "next-turn": nextTimedTurn,
  "quiz-open": (_, index) => showQuizCard(index),
  "quiz-bonus": () => showQuizCard(state.play.selected, "bonus"),
  "quiz-malus": () => showQuizCard(state.play.selected, "malus"),
  "quiz-card-back": () => showQuizCard(state.play.selected),
  "quiz-sprint": (_, team) => useQuizCard(team, "sprint"),
  "quiz-scudo": (_, team) => useQuizCard(team, "scudo"),
  "quiz-pressione": (_, team) => useQuizCard(team, "pressione"),
  "quiz-freno": (_, team) => useQuizCard(team, "freno"),
  "quiz-question": () => {
    const play = state.play;
    if (play.selected === null || quizQuestionShown()) return;
    play.seenTiles.push(play.selected);
    showQuizCard(play.selected);
  },
  "quiz-reveal": () => {
    if (!quizQuestionShown()) return;
    state.play.revealed = true;
    showQuizCard(state.play.selected);
  },
  "quiz-correct": () => scoreQuiz(1),
  "quiz-wrong": () => scoreQuiz(-1),
};

document.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (button && !button.disabled) {
    if (!dialog.open) {
      const box = button.getBoundingClientRect();
      dialog.style.setProperty("--ox", `${box.left + box.width / 2}px`);
      dialog.style.setProperty("--oy", `${box.top + box.height / 2}px`);
    }
    const { action, index } = button.dataset;
    if (action !== "take-presentation" && !ownsPresentation()) return;
    actionHandlers[action](action, Number(index));
  }
});

document.addEventListener("keydown", (event) => {
  if (
    !ownsPresentation() || state?.phase !== "play" || roundNow().id !== "flash" || state.play.step !== "active" || dialog.open ||
    event.defaultPrevented || event.repeat || event.isComposing || event.altKey || event.ctrlKey || event.metaKey ||
    event.target.isContentEditable || event.target.closest?.("input, textarea, select")
  ) return;

  const key = event.key.toLowerCase();
  const trueKey = tr("v", "t");
  if (key !== trueKey && key !== "f" && key !== "p") return;
  event.preventDefault();
  if (key === "p") scoreTimed(0, "Carta saltata");
  else answerFlash(key === trueKey);
});

app.addEventListener("change", (event) => {
  if (!ownsPresentation()) return;
  if (event.target.id === "song-files") {
    loadSongVideos(event.target);
    return;
  }
  if (event.target.id === "song-team") {
    state.play.team = Number(event.target.value);
    refresh();
    app.querySelector("#song-team").focus({ preventScroll: true });
    return;
  }
  if (event.target.id === "song-video-select") {
    songVideoIndex = Number(event.target.value);
    app.querySelector("#song-message").textContent = "";
    app.querySelector("#song-player").src = songVideos[songVideoIndex].url;
    publishDisplay();
    return;
  }
  if (!state && event.target.id === "list-turn-seconds") {
    const seconds = Number(event.target.value);
    if (listTurnDurations.includes(seconds)) listTurnDraft = seconds;
    return;
  }
  const input = event.target.closest("[data-round-selection]");
  if (!input || state) return;
  teamDraft = readTeamFields(app.querySelector("#team-form"));
  const index = Number(input.dataset.roundSelection);
  selectedRounds = input.checked ? [...selectedRounds, index] : selectedRounds.filter((item) => item !== index);
  render();
  app.querySelector(`[data-round-selection="${index}"]`)?.focus();
});

app.addEventListener("error", (event) => {
  if (event.target.id === "song-player") {
    app.querySelector("#song-message").textContent = t("Questo video non può essere riprodotto. Prova un altro file MP4.");
  }
}, true);

app.addEventListener("ended", (event) => {
  if (ownsPresentation() && event.target.id === "song-player") rateSong();
}, true);

for (const type of ["play", "playing", "pause", "seeking", "seeked", "waiting", "ratechange", "loadeddata", "timeupdate"]) {
  app.addEventListener(type, (event) => {
    if (event.target.id !== "song-player") return;
    const now = Date.now();
    if (type === "timeupdate" && now - lastVideoSync < 750) return;
    lastVideoSync = now;
    publishDisplay();
  }, true);
}

app.addEventListener("submit", (event) => {
  if (event.target.id !== "team-form") return;
  event.preventDefault();
  if (!ownsPresentation()) return;
  createParty(event.target);
});

dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  if (dialog.dataset.kind === "mime" && state.play.step === "active") hideMimeCard();
  else closeDialog();
});

window.addEventListener("quizboard-language", () => {
  if (!ownsPresentation()) {
    render();
    return;
  }
  if (!state) teamDraft = readTeamFields(app.querySelector("#team-form"));
  live.textContent = "";
  render();
  if (!dialog.open) return;
  if (dialog.dataset.kind === "quiz") showQuizCard(state.play.selected, dialog.dataset.picker);
  else if (dialog.dataset.kind === "mime") showMimeCard();
  else if (dialog.dataset.kind === "reset") askReset();
});

window.addEventListener("storage", (event) => {
  if (event.key === presenterStorage || event.key === null) {
    if (presenter && !ownsPresentation()) {
      presenter = false;
      lastProjection = "";
      hideDialog();
      clearSongVideos();
      render();
    }
    return;
  }
  if (event.key !== listAnswerStorage || !event.newValue ||
      !ownsPresentation() || state?.phase !== "play" || roundNow().id !== "list" || state.play.step !== "active") return;
  let answer;
  try {
    answer = JSON.parse(event.newValue);
  } catch {
    return;
  }
  if (answer?.turn === state.play.turn && answer.deadline === state.play.deadline && Number.isInteger(answer.index)) {
    listAdvance(answer.index);
  }
});

const displayLink = document.getElementById("display-link");
if (partyDebug) displayLink.href += "?debug=1";
displayLink.addEventListener("click", (event) => {
  if (window.open(displayLink.href, displayLink.target, "popup")) event.preventDefault();
});
window.addEventListener("pagehide", () => {
  if (!ownsPresentation()) return;
  try {
    localStorage.removeItem(presenterStorage);
    lastProjection = "";
  } catch {
    // This browser does not share presentation state.
  }
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) acquirePresentation();
});
acquirePresentation();
setInterval(updateClock, 125);
