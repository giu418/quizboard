const app = document.getElementById("app");
const dialog = document.getElementById("card-dialog");
const live = document.getElementById("live");
const minTeams = 2;
const maxTeams = 4;
const flashRevealDuration = 850;
const partyQuizCategories = [...mintakaCategories, famousPhotos];
const quizTileCount = partyQuizCategories.reduce((count, category) => count + category.clues.length, 0);
const quizEffects = {
  sprint: { name: "Sprint", type: "bonus", sign: 1, adjustment: 2, description: "+2 punti se la risposta è esatta" },
  scudo: { name: "Scudo", type: "bonus", sign: -1, adjustment: 2, description: "2 punti di penalità in meno se la risposta è sbagliata" },
  pressione: { name: "Pressione", type: "malus", sign: -1, adjustment: -2, description: "2 punti di penalità in più se la risposta è sbagliata" },
  freno: { name: "Freno", type: "malus", sign: 1, adjustment: -2, description: "2 punti in meno se la risposta è esatta" },
};
const lookup = new Map(partyRounds.map((round) => [round.id, round]));
const defaultRoundOrder = partyRounds.flatMap((round, index) => round.suspended ? [] : [index]);
function flashBank(trueCards, falseCards) {
  return [...trueCards.map((prompt) => [prompt, true]), ...falseCards.map((prompt) => [prompt, false])];
}

const timedBanks = {
  it: { mime: mimeCards, flash: flashBank(flashTrue, flashFalse), proverbs: proverbCards },
  en: { mime: englishMimeCards, flash: flashBank(englishFlashTrue, englishFlashFalse), proverbs: englishProverbCards },
};
const teamClass = (index) => `team-${index}`;
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]
));

let state = readParty();
let teamDraft = ["", ""];
let roundOrderDraft = [...defaultRoundOrder];
let selectedRounds = [...defaultRoundOrder];
let stageFocus = false;
// Solo presentazione: servono a far partire le animazioni quando cambia la scena.
let lastViewKey = null;
let lastCardKey = null;
let lastScores = null;
let movedRound = null;

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
    ) return saved.version === 1 ? migrateParty(saved) : saved;
  } catch {
    // A blocked or unavailable storage does not prevent play.
  }
  return null;
}

function validRoundOrder(order, currentRound) {
  return Array.isArray(order) && order.length > 0 && new Set(order).size === order.length &&
    order.every((index) => Number.isInteger(index) && partyRounds[index] && !partyRounds[index].suspended) && order.includes(currentRound);
}

function nextRoundIndex() {
  return remainingRoundIndexes()[0] ?? -1;
}

function migrateParty(saved) {
  const round = partyRounds[saved.round];
  saved.version = partyVersion;
  delete saved.draw.song;
  if (round.suspended && ["intro", "play"].includes(saved.phase)) {
    saved.round = defaultRoundOrder.find((index) => index > saved.round);
    saved.phase = "intro";
    saved.play = {};
    saved.scores = saved.teams.map(() => 0);
  } else if (round.id === "proverbs" && saved.phase === "play") {
    // An earlier turn used a different hand size, deadline, and scoring rule.
    saved.phase = "intro";
    saved.play = {};
    saved.scores = saved.teams.map(() => 0);
  }
  return saved;
}

function saveParty() {
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

function drawCards(teams) {
  const trueCards = shuffle(indices(flashTrue.length));
  const falseCards = shuffle(indices(flashFalse.length, flashTrue.length));
  const halfFlashHand = lookup.get("flash").hand / 2;
  return {
    quiz: mintakaCategories.map(({ clues }) => clues.map(() => Math.floor(Math.random() * 2))),
    mime: shuffle(indices(mimeCards.length)).slice(0, teams * lookup.get("mime").hand),
    flash: indices(teams).flatMap((index) => {
      const offset = index * halfFlashHand;
      return shuffle([
        ...trueCards.slice(offset, offset + halfFlashHand),
        ...falseCards.slice(offset, offset + halfFlashHand),
      ]);
    }),
    proverbs: shuffle(indices(proverbCards.length)).slice(0, teams * lookup.get("proverbs").hand),
  };
}

function roundNow() {
  return partyRounds[state.round];
}

function teamOnTurn() {
  return activePartyTeam(state);
}

function timedCard() {
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
    const points = ordered.length - (start + end - 1) / 2;
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
  for (const scores of state.history) {
    if (!scores) continue;
    for (const entry of ranked(scores)) totals[entry.team] += entry.points;
  }
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
      <button class="button primary team-start" type="submit">${t("Inizia la partita")}</button>
    </form>`;
}

function roundOrderView() {
  return `<section class="round-order" aria-labelledby="round-order-title">
    <h3 class="panel-title" id="round-order-title">${tr("Scegli e ordina le manche", "Choose and order the rounds")}</h3>
    <ol class="round-order-list" role="list">
      ${roundOrderDraft.map((index, position) => {
        const round = partyRounds[index];
        const enabled = selectedRounds.includes(index);
        const moved = movedRound?.index === index ? ` class="moved" style="--dir: ${movedRound.dir}"` : "";
        return `<li role="listitem"${moved}>
          <span class="round-position" aria-hidden="true">${position + 1}</span>
          ${icon(round)}
          <label class="round-choice"><input type="checkbox" data-round-selection="${index}" ${enabled ? "checked" : ""} ${enabled && selectedRounds.length === 1 ? "disabled" : ""}> <strong>${esc(t(round.title))}</strong></label>
          <div class="round-order-actions">
            <button type="button" class="button ghost" data-action="round-up" data-index="${index}" aria-label="${tr(`Sposta ${esc(t(round.title))} su`, `Move ${esc(t(round.title))} up`)}" ${position === 0 ? "disabled" : ""}>${t("Su")}</button>
            <button type="button" class="button ghost" data-action="round-down" data-index="${index}" aria-label="${tr(`Sposta ${esc(t(round.title))} giù`, `Move ${esc(t(round.title))} down`)}" ${position === roundOrderDraft.length - 1 ? "disabled" : ""}>${t("Giù")}</button>
          </div>
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
        <p class="panel-note">${t("Puoi giocare con 2–4 squadre.")}</p>
        ${teamForm()}
      </section>
    </section>
    ${partyDebug ? `<section aria-labelledby="rounds-heading">
      <h2 class="panel-title" id="rounds-heading">${t("Le manche")}</h2>
      <ol class="round-list">
        ${partyRounds.map((round) => `
          <li class="${round.suspended ? "suspended" : ""}">
            ${icon(round)}
            <div class="round-info"><strong>${t(round.title)}</strong><small>${round.suspended ? t("In sospeso") : t(round.summary)}</small></div>
            ${round.suspended ? "" : `<span class="round-format">${t(round.format)}</span>`}
          </li>`).join("")}
      </ol>
    </section>` : ""}`;
}

function sessionRoundIndexes() {
  return state.roundOrder ?? indices(partyRounds.length).filter((index) => (
    (partyRounds[index].id !== "list" && !partyRounds[index].suspended) || state.history[index] || index === state.round
  ));
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
  return `<ol class="standings">
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

function timer() {
  const { seconds } = roundNow();
  return `<div class="timer" aria-label="${t("Tempo rimanente")}">
    <span class="timer-output" id="timer-display">0:${seconds}</span>
    <progress id="timer-bar" max="${seconds}" value="${seconds}" aria-label="${t("Tempo rimanente")}"></progress>
  </div>`;
}

function introView() {
  const round = roundNow();
  return `<div class="sigla" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="intro-content">
      ${roundTitle(t(round.title))}
      <div class="intro-rules">
        <p>${t(round.rules)}</p>
        ${round.id === "mime" ? `<p class="intro-note">${t("Fate distogliere lo sguardo alle altre persone mentre viene mostrata la carta.")}</p>` : ""}
      </div>
    </div>
    <div class="actions intro-actions"><button type="button" class="button primary" data-action="begin-round">${t("Inizia la manche")}</button></div>`;
}

function cardProgress(round, completed) {
  const label = round.id === "proverbs" ? t("Proverbi corretti di fila") : t("Avanzamento del turno");
  return `<div class="cards-progress">
    <span>${label}</span>
    <progress max="${round.hand}" value="${completed}" aria-label="${label}" aria-valuetext="${progressCount(completed, round.hand)}"></progress>
  </div>`;
}

function judgeLink() {
  return `<a class="button secondary" href="./giudice.html${partyDebug ? "?debug=1" : ""}" target="_blank" rel="noopener">${t("Apri la scheda del giudice")}</a>`;
}

function readyTurnView(round) {
  const mime = round.id === "mime";
  const proverbs = round.id === "proverbs";
  return `<div class="turn-ready">
    <div class="turn-ready-team">
      <p class="kicker">${t("Si prepara")}</p>
      <h2 class="${teamClass(teamOnTurn())}">${teamChip(teamOnTurn())}</h2>
      <p class="turn-count">${tr("Turno", "Turn")} ${progressCount(state.play.turn + 1, state.teams.length)}</p>
    </div>
    <div class="turn-ready-controls">
      ${mime ? `<p class="stage-copy">${t("Mostra la carta solo a chi mima. Il tempo parte quando la carta viene nascosta.")}</p>` : ""}
      ${proverbs ? `<p class="stage-copy">${t("Apri la scheda su una finestra visibile solo al giudice. Il proverbio completo si aggiorna durante il turno.")}</p>` : ""}
      <button type="button" class="button primary" data-action="${mime ? "mime-card" : "start-timer"}">${mime ? t("Mostra primo titolo") : tr(`Avvia ${round.seconds} secondi`, `Start ${round.seconds}-second timer`)}</button>
      ${proverbs ? judgeLink() : ""}
    </div>
  </div>`;
}

function timedView() {
  const round = roundNow();
  const play = state.play;
  const heading = roundTitle(t(round.title), timer());
  if (play.step === "ready") return heading + readyTurnView(round);
  const output = [heading];
  if (round.id !== "mime") output.push(cardProgress(round, play.card));

  if (play.step === "done") {
    const score = state.scores[teamOnTurn()];
    const label = play.endedBy === "time" ? t("Tempo scaduto") : play.endedBy === "success" ? t("Sequenza completata") : t("Turno concluso");
    output.push(turnLine(label));
    output.push(`<div class="prompt-card"><p class="prompt">${formatNumber(score)} ${pointLabel(score)}</p></div>`);
    const last = play.turn + 1 === state.teams.length;
    output.push(`<div class="actions"><button type="button" class="button primary" data-action="next-turn">${last ? t("Vedi risultati") : t("Prossima squadra")}</button></div>`);
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
    </div>
    <div class="actions"><button type="button" class="button ghost" data-action="end-turn" ${reveal ? "disabled" : ""}>${t("Termina turno")}</button></div>`);
    return output.join("");
  } else {
    output.push(`<div class="prompt-card"><p class="prompt">${esc(card[0])}</p></div>
      <div class="actions">
        <button type="button" class="button positive" data-action="proverb-correct">${t("Corretto")}</button>
        <button type="button" class="button negative" data-action="proverb-wrong">${t("Errore · ricomincia")}</button>
        ${judgeLink()}
      </div>`);
  }
  output.push(`<p class="feedback" aria-hidden="true">${esc(t(play.feedback || ""))}</p>`);
  output.push(`<div class="actions"><button type="button" class="button ghost" data-action="end-turn">${t("Termina turno")}</button></div>`);
  return output.join("");
}


function listView() {
  const play = state.play;
  if (play.category === null) {
    return `${roundTitle(t("La sfida delle liste"))}
      <div class="list-pick">
      <p class="stage-copy">${tr("Scegli una categoria per la manche.", "Choose a category for this round.")}</p>
      <div class="actions">${listCategories.map((category, index) => `
        <button type="button" class="button secondary" style="--i: ${index}" data-action="list-category" data-index="${index}">${esc(category[language])}</button>`).join("")}</div>
      </div>`;
  }
  const category = listCategories[play.category];
  return `${roundTitle(t("La sfida delle liste"))}
    ${turnLine(t("Tocca a"))}
    <h2 class="panel-title list-category">${esc(category[language])}</h2>
    <p class="panel-note">${tr("Chi conduce seleziona la risposta detta dalla squadra.", "The host selects the answer given by the team.")}</p>
    <div class="list-answers" aria-label="${tr("Risposte valide", "Valid answers")}">
      ${category.answers.map((answer, index) => `
        <button type="button" class="button secondary" style="--i: ${index}" data-action="list-answer" data-index="${index}" ${play.used.includes(index) ? "disabled" : ""}>${esc(answer[language === "en" ? 1 : 0])}${play.used.includes(index) ? ` ${ico("check")}` : ""}</button>`).join("")}
    </div>
    <p class="panel-note">${tr("Risposte trovate", "Answers found")} ${play.used.length} / ${category.answers.length} · ${tr("Passaggi consecutivi", "Consecutive passes")} ${play.passes} / ${state.teams.length}</p>
    <div class="actions spaced"><button type="button" class="button ghost" data-action="list-pass">${t("Passa")}</button></div>`;
}

function listAdvance(index) {
  const play = state.play;
  if (play.category === null) return;
  if (index === null) play.passes++;
  else {
    if (!Number.isInteger(index) || !listCategories[play.category].answers[index] || play.used.includes(index)) return;
    play.used.push(index);
    state.scores[teamOnTurn()]++;
    play.passes = 0;
  }
  if (play.passes >= state.teams.length || play.used.length === listCategories[play.category].answers.length) return finishRound();
  play.turn++;
  refresh(true);
}

function quizView() {
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
            return `<button type="button" class="quiz-tile${used ? " used" : ""}" style="--i: ${column + row}" data-action="quiz-open" data-index="${i}" aria-label="${esc(quizCategoryName(category.name))}, ${value} ${pointLabel(value)}${used ? t(", già giocata") : lockedTile === i ? t(", carta attiva") : ""}" ${used || (lockedTile !== null && lockedTile !== i) ? "disabled" : ""}>${used ? ico("check") : value}</button>`;
          }).join("")}
        </section>`).join("")}
    </div>
    <div class="bulbs" aria-hidden="true"></div>`;
}

function resultsView(final = false) {
  const entries = ranked(final ? totalScores() : state.history[state.round]);
  const winners = entries.filter((entry) => entry.place === 1).map(({ team }) => state.teams[team]);
  const title = final ? t("Classifica finale") : `${tr("Risultati", "Results")} · ${t(roundNow().title)}`;
  const outcome = winners.length > 1
    ? `${tr("Parità tra", "Tie between")} ${esc(new Intl.ListFormat(language).format(winners))}.`
    : tr(`Vince ${esc(winners[0])}!`, `${esc(winners[0])} wins!`);
  return `${roundTitle(title)}
    <p class="stage-copy">${final ? outcome : t("I punti della serata dipendono dal piazzamento in questa manche. Le squadre a pari merito si dividono i punti dei posti occupati.")}</p>
    <ol class="result-table ${final ? "final-table" : ""}">
      ${entries.map(({ score, team, place, points }, position) => `<li class="result-row ${teamClass(team)}${place === 1 ? " winner" : ""}" style="--rev: ${entries.length - 1 - position}">
        <span class="result-place" aria-label="${tr("Posizione", "Place")} ${place}">${tr(`${place}°`, englishPlace(place))}</span>
        ${teamChip(team)}
        <div class="result-values"><strong class="total">${final ? formatNumber(score) : `+${formatNumber(points)}`} pt</strong>
        ${final ? "" : `<small>${formatNumber(score)} ${t("nella manche")}</small>`}</div>
      </li>`).join("")}
    </ol>
    ${final ? "" : halftimeStandings()}
    <div class="actions spaced">
      <button type="button" class="button primary" data-action="${final ? "ask-reset" : "advance-round"}">${final ? t("Nuova serata") : nextRoundIndex() === -1 ? t("Vedi classifica finale") : t("Prossima manche")}</button>
    </div>`;
}

function render() {
  const playing = state?.phase === "play";
  const intro = state?.phase === "intro";
  const welcome = state?.phase === "welcome";
  app.classList.toggle("play-view", playing);
  app.classList.toggle("intro-view", intro || welcome);
  app.classList.toggle("results-view", ["results", "final"].includes(state?.phase));
  // Le animazioni d'ingresso partono solo quando cambia la scena, non a ogni aggiornamento.
  const viewKey = state ? [state.phase, state.round, state.play.step ?? "", state.play.step === "ready" ? state.play.turn : "", state.play.category ?? ""].join("|") : "setup";
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
    else view = timedView();
    app.innerHTML = playing ? `
      <section class="stage play-stage tone-${id}" aria-labelledby="stage-title">
        <div class="play-content">${view}</div>
        <div class="play-hud">
          <aside aria-labelledby="round-scores-title">
            <h2 class="round-scores-title" id="round-scores-title">${t("Punti della manche")}</h2>
            ${standings(state.scores, state.play.step === "done" ? -1 : teamOnTurn(), true)}
          </aside>
          <button type="button" class="button secondary reset" data-action="ask-reset">${t("Nuova serata")}</button>
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
}

function refresh(focus = false) {
  saveParty();
  stageFocus = focus;
  render();
}

function welcomeView() {
  return `<div class="sigla" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="intro-content">
    <div class="stage-header"><h1 id="stage-title" tabindex="-1">${tr("Benvenuti alla serata giochi!", "Welcome to game night!")}</h1></div>
    <div class="intro-rules"><p>${tr("Le squadre sono pronte. Che la serata abbia inizio!", "The teams are ready. Let game night begin!")}</p></div>
    <div class="welcome-teams">${state.teams.map((_, index) => `<span style="--i: ${index}" class="${teamClass(index)} team-label">${esc(state.teams[index])}</span>`).join("")}</div>
  </div>
  <div class="actions intro-actions"><button type="button" class="button primary" data-action="start-evening">${tr("Cominciamo", "Let's begin")}</button></div>`;
}

function createParty(form, round = roundOrderDraft.find((index) => selectedRounds.includes(index)), phase = "welcome") {
  const teams = readTeamFields(form).map((name, index) => name.trim() || teamName(index));
  state = {
    version: partyVersion, teams, round, roundOrder: roundOrderDraft.filter((index) => selectedRounds.includes(index)), phase, history: [], scores: teams.map(() => 0),
    draw: drawCards(teams.length), play: {},
  };
  refresh(true);
}

function beginRound() {
  const id = roundNow().id;
  state.phase = "play";
  if (id === "list") state.play = { turn: 0, category: null, used: [], passes: 0 };
  else if (id === "quiz") state.play = { turn: 0, used: [], selected: null, revealed: false, seenTiles: [], cards: [] };
  else prepareTimedTurn(0);
  refresh(true);
}

function prepareTimedTurn(turn) {
  state.play = { turn, step: "ready", card: 0, deadline: null, seen: false, feedback: "" };
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
  const output = document.getElementById("timer-display");
  if (!output || state.phase !== "play") return;
  const duration = roundNow().seconds;
  const { step, deadline } = state.play;
  const now = Date.now();
  const seconds = step === "ready" ? duration : step === "done" ? 0 : Math.max(0, Math.ceil((deadline - now) / 1000));
  const formatted = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  if (output.textContent !== formatted) output.textContent = formatted;
  document.getElementById("timer-bar").value = seconds;
  output.parentElement.classList.toggle("urgent", step === "active" && seconds <= 10);
  if (step === "active" && state.play.reveal) {
    if (now >= state.play.reveal.until) finishFlashReveal(seconds);
    return;
  }
  if (step === "active" && seconds === 0) finishTurn("time");
}

function hasTime() {
  if (state.play.step !== "active" || state.play.reveal) return false;
  if (Date.now() < state.play.deadline) return true;
  finishTurn("time");
  return false;
}

function finishTurn(reason) {
  hideDialog();
  state.play.step = "done";
  state.play.endedBy = reason;
  live.textContent = reason === "time" ? t("Tempo scaduto.") : reason === "success" ? t("Sequenza completata.") : t("Turno concluso.");
  refresh(true);
}

function scoreTimed(score, feedback) {
  if (!hasTime()) return;
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

function answerProverb(correct) {
  if (!hasTime()) return;
  const play = state.play;
  if (!correct) {
    play.card = 0;
    play.feedback = "Errore. Si riparte dal primo proverbio.";
  } else {
    play.card++;
    if (play.card === roundNow().hand) {
      state.scores[teamOnTurn()] = roundNow().hand;
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
      ${shown && play.revealed ? `<div class="prompt-card"><p class="prompt-note">${t("Risposta")}</p><p class="prompt">${esc(clue.answer)}</p></div>` : ""}
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
}

function scoreQuiz(sign) {
  const play = state.play;
  if (play.selected === null || !play.revealed) return;
  state.scores[teamOnTurn()] += quizScore(sign);
  play.used.push(play.selected);
  play.selected = null;
  play.revealed = false;
  play.turn++;
  hideDialog();
  if (play.used.length === quizTileCount) finishRound();
  else refresh(true);
}

function finishRound() {
  state.history[state.round] = [...state.scores];
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
  state.round = index;
  state.phase = "intro";
  state.play = {};
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
  teamDraft = [...state.teams];
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

function moveRound(action, index) {
  const position = roundOrderDraft.indexOf(index);
  const target = position + (action === "round-up" ? -1 : 1);
  if (state || position < 0 || target < 0 || target >= roundOrderDraft.length) return;

  teamDraft = readTeamFields(app.querySelector("#team-form"));
  [roundOrderDraft[position], roundOrderDraft[target]] = [roundOrderDraft[target], roundOrderDraft[position]];
  movedRound = { index, dir: action === "round-up" ? 1 : -1 };
  render();
  const buttons = [...app.querySelectorAll(`.round-order-actions button[data-index="${index}"]:not(:disabled)`)];
  (buttons.find((button) => button.dataset.action === action) ?? buttons[0])?.focus({ preventScroll: true });
  live.textContent = `${t(partyRounds[index].title)}, ${tr("posizione", "position")} ${progressCount(target + 1, roundOrderDraft.length)}.`;
}

const actionHandlers = {
  "start-evening": () => { if (state?.phase === "welcome") { state.phase = "intro"; refresh(true); } },
  "list-category": (_, index) => { if (state.play.category === null && listCategories[index]) { state.play.category = index; refresh(true); } },
  "list-answer": (_, index) => listAdvance(index),
  "list-pass": () => listAdvance(null),
  "add-team": changeTeamFields,
  "remove-team": changeTeamFields,
  "round-up": moveRound,
  "round-down": moveRound,
  "ask-reset": askReset,
  "close-dialog": closeDialog,
  "confirm-reset": resetParty,
  "begin-round": beginRound,
  "advance-round": advanceRound,
  "debug-round": jumpToDebugRound,
  "mime-card": showMimeCard,
  "hide-mime": hideMimeCard,
  "start-timer": startTimer,
  "mime-correct": () => { if (state.play.seen) scoreTimed(1, "Indovinato +1"); },
  "proverb-correct": () => answerProverb(true),
  "proverb-wrong": () => answerProverb(false),
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
    actionHandlers[action](action, Number(index));
  }
});

document.addEventListener("keydown", (event) => {
  if (
    state?.phase !== "play" || roundNow().id !== "flash" || state.play.step !== "active" || dialog.open ||
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
  const input = event.target.closest("[data-round-selection]");
  if (!input || state) return;
  teamDraft = readTeamFields(app.querySelector("#team-form"));
  const index = Number(input.dataset.roundSelection);
  selectedRounds = input.checked ? [...selectedRounds, index] : selectedRounds.filter((item) => item !== index);
  render();
  app.querySelector(`[data-round-selection="${index}"]`)?.focus();
});

app.addEventListener("submit", (event) => {
  if (event.target.id !== "team-form") return;
  event.preventDefault();
  createParty(event.target);
});

dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  if (dialog.dataset.kind === "mime" && state.play.step === "active") hideMimeCard();
  else closeDialog();
});

window.addEventListener("quizboard-language", () => {
  if (!state) teamDraft = readTeamFields(app.querySelector("#team-form"));
  live.textContent = "";
  render();
  if (!dialog.open) return;
  if (dialog.dataset.kind === "quiz") showQuizCard(state.play.selected, dialog.dataset.picker);
  else if (dialog.dataset.kind === "mime") showMimeCard();
  else if (dialog.dataset.kind === "reset") askReset();
});

if (state) saveParty();
render();
if (state?.phase === "play" && roundNow().id === "quiz" && state.play.selected !== null) showQuizCard(state.play.selected);
setInterval(updateClock, 125);
