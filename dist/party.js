const app = document.getElementById("app");
const dialog = document.getElementById("card-dialog");
const live = document.getElementById("live");
const partyStorage = "quizboard-party-v1";
const minTeams = 2;
const maxTeams = 4;
const quizTurns = 2;
const lookup = new Map(partyRounds.map((round) => [round.id, round]));
const flashCards = [
  ...flashTrue.map((prompt) => [prompt, true]),
  ...flashFalse.map((prompt) => [prompt, false]),
];
const timedBanks = { mime: mimeCards, flash: flashCards, proverbs: proverbCards };
const italianNumber = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 });
const formatNumber = (value) => italianNumber.format(value);
const teamClass = (index) => `team-${index}`;
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]
));

let state = readParty();
let teamDraft = ["", ""];
let stageFocus = false;

function readParty() {
  try {
    const saved = JSON.parse(localStorage.getItem(partyStorage));
    if (
      saved?.version === 1 && Array.isArray(saved.teams) &&
      saved.teams.length >= minTeams && saved.teams.length <= maxTeams &&
      saved.teams.every((name) => typeof name === "string") &&
      Number.isInteger(saved.round) && partyRounds[saved.round] &&
      ["intro", "play", "results", "final"].includes(saved.phase) &&
      Array.isArray(saved.scores) && Array.isArray(saved.history) &&
      saved.draw && saved.play
    ) return saved;
  } catch {
    // A blocked or unavailable storage does not prevent play.
  }
  return null;
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
    song: Math.floor(Math.random() * songCards.length),
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
  return (state.round + state.play.turn) % state.teams.length;
}

function timedCard() {
  const { id, hand } = roundNow();
  return timedBanks[id][state.draw[id][state.play.turn * hand + state.play.card]];
}

function quizClue(index) {
  const rowSize = mintakaCategories[0].clues.length;
  const column = Math.floor(index / rowSize);
  const row = index % rowSize;
  const category = mintakaCategories[column];
  const [question, answer] = state.draw.quiz[column][row] ? quizAlternates[column][row] : category.clues[row];
  return { category: category.name, value: row + 1, question, answer };
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
    for (const entry of ranked(scores)) totals[entry.team] += entry.points;
  }
  return totals;
}

function icon(round) {
  return `<span class="round-icon tone-${round.id}" aria-hidden="true">${round.icon}</span>`;
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
            <i class="team-dot" aria-hidden="true"></i>
            <input type="text" maxlength="40" autocomplete="off" aria-label="Nome della squadra ${index + 1}" placeholder="Squadra ${index + 1}" value="${esc(name)}">
            ${teamDraft.length > minTeams ? `<button type="button" class="remove-team" data-action="remove-team" data-index="${index}" aria-label="Rimuovi squadra ${index + 1}">×</button>` : ""}
          </div>`).join("")}
      </div>
      ${teamDraft.length < maxTeams ? '<button type="button" class="button ghost" data-action="add-team"><span aria-hidden="true">＋</span> Aggiungi squadra</button>' : ""}
      <button class="button primary" type="submit">Inizia la serata</button>
    </form>`;
}

function setupView() {
  return `
    <section class="hero">
      <div class="hero-copy">
        <p class="kicker">Quizboard a squadre</p>
        <h1>Serata <span>giochi.</span></h1>
        <p>Cinque manche, un’unica classifica. Riunisci gli amici e giocate sullo stesso schermo.</p>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="art-orb"></div>
        <div class="art-card art-one">✦</div>
        <div class="art-card art-two">♫</div>
        <div class="art-card art-three">▦</div>
      </div>
    </section>
    <div class="columns setup-columns">
      <section class="panel">
        <h2 class="panel-title">Le manche</h2>
        <ol class="round-list">
          ${partyRounds.map((round) => `
            <li>
              ${icon(round)}
              <div class="round-info"><strong>${round.title}</strong><small>${round.summary}</small></div>
              <span class="round-format">${round.format}</span>
            </li>`).join("")}
        </ol>
      </section>
      <section class="panel team-panel">
        <h2 class="panel-title" id="setup-title" tabindex="-1">Prepara le squadre</h2>
        <p class="panel-note">Da 2 a 4 squadre. Una persona conduce dal browser.</p>
        ${teamForm()}
      </section>
    </div>`;
}

function roadmap() {
  return `<ol class="roadmap" aria-label="Avanzamento delle manche">
    ${partyRounds.map((round, index) => {
      const done = index < state.history.length;
      return `<li class="tone-${round.id}${done ? " done" : ""}" ${index === state.round && state.phase !== "final" ? 'aria-current="step"' : ""}><span aria-hidden="true">${done ? "✓" : round.icon}</span>${round.short}${done ? '<span class="sr-only"> completata</span>' : ""}</li>`;
    }).join("")}
  </ol>`;
}

function roundTitle(title, end = "") {
  const round = roundNow();
  return `<div class="stage-header">
    <div>
      <p class="kicker">${state.phase === "final" ? `${partyRounds.length} manche completate` : `Manche ${state.round + 1} di ${partyRounds.length}`}</p>
      <h1 id="stage-title" tabindex="-1">${title}</h1>
    </div>
    ${end || icon(round)}
  </div>`;
}

function standings() {
  const totals = totalScores();
  const individualTurn = state.phase === "play" && roundNow().id !== "song" && state.play.step !== "done";
  return `<h2 class="panel-title">Classifica serata</h2>
    <p class="panel-note">Ogni manche assegna punti per piazzamento.</p>
    <ol class="standings">
      ${ranked(totals).map(({ team }) => `<li class="${teamClass(team)}${individualTurn && team === teamOnTurn() ? " current" : ""}">
        ${teamChip(team)}<strong class="total">${formatNumber(totals[team])} pt</strong>
        ${state.phase === "play" ? `<span class="round-score">${formatNumber(state.scores[team])} nella manche</span>` : ""}
      </li>`).join("")}
    </ol>`;
}

function turnLine(label) {
  const index = teamOnTurn();
  return `<div class="turn-box"><div class="turn-line"><span>${label}</span>${teamChip(index)}</div></div>`;
}

function timer() {
  const { seconds } = roundNow();
  return `<div class="timer" aria-label="Tempo rimanente">
    <span class="timer-output" id="timer-display">0:${seconds}</span>
    <progress id="timer-bar" max="${seconds}" value="${seconds}" aria-label="Tempo rimanente"></progress>
  </div>`;
}

function introView() {
  const round = roundNow();
  return `${roundTitle(round.title)}
    <p class="stage-copy">${round.rules}</p>
    ${round.id === "mime" ? '<p class="stage-copy">Fate distogliere lo sguardo alle altre persone mentre viene mostrata la carta.</p>' : ""}
    <div class="actions spaced"><button type="button" class="button primary" data-action="begin-round">Inizia la manche</button></div>`;
}

function timedView() {
  const round = roundNow();
  const play = state.play;
  const output = [` ${roundTitle(round.title, timer())} `];
  if (play.step === "ready") {
    output.push(turnLine("Si prepara"));
    output.push(`<p class="turn-count">Turno ${play.turn + 1} di ${state.teams.length}</p>`);
    if (round.id === "mime") {
      output.push('<p class="stage-copy">Mostra la carta solo a chi mima. Il tempo parte quando la carta viene nascosta.</p>');
      output.push('<div class="actions spaced"><button type="button" class="button primary" data-action="mime-card">Mostra primo titolo</button></div>');
    } else {
      output.push(`<div class="actions spaced"><button type="button" class="button primary" data-action="start-timer">Avvia ${round.seconds} secondi</button></div>`);
    }
    return output.join("");
  }

  if (play.step === "done") {
    const score = state.scores[teamOnTurn()];
    const label = play.endedBy === "time" ? "Tempo scaduto" : "Turno concluso";
    output.push(turnLine(label));
    output.push(`<div class="prompt-card"><p class="prompt">${formatNumber(score)} ${score === 1 ? "punto" : "punti"}</p></div>`);
    const last = play.turn + 1 === state.teams.length;
    output.push(`<div class="actions"><button type="button" class="button primary" data-action="next-turn">${last ? "Vedi risultati" : "Prossima squadra"}</button></div>`);
    return output.join("");
  }

  const card = timedCard();
  output.push(turnLine("Tocca a"));
  const count = `<span class="prompt-note">Carta ${play.card + 1} di ${round.hand}</span>`;
  if (round.id === "mime") {
    output.push(`<div class="prompt-card">${count}<p class="prompt">Titolo nascosto</p></div>
      <div class="actions">
        <button type="button" class="button secondary" data-action="mime-card">Mostra titolo in privato</button>
        <button type="button" class="button positive" data-action="mime-correct" ${play.seen ? "" : "disabled"}>Indovinato +1</button>
        <button type="button" class="button ghost" data-action="pass">Passa</button>
      </div>`);
  } else if (round.id === "flash") {
    output.push(`<div class="prompt-card">${count}<p class="prompt">${esc(card[0])}</p></div>
      <div class="actions">
        <button type="button" class="button primary" data-action="flash-true">Vero</button>
        <button type="button" class="button secondary" data-action="flash-false">Falso</button>
        <button type="button" class="button ghost" data-action="pass">Passa</button>
      </div>`);
  } else {
    output.push(`<div class="prompt-card">${count}<p class="prompt">${esc(card[0])}</p>
      ${play.revealed ? `<p class="answer-key">${esc(card[1])}</p>` : ""}</div>
      <div class="actions">
        <button type="button" class="button positive" data-action="proverb-correct">Completato +1</button>
        <button type="button" class="button ghost" data-action="pass">Passa</button>
        ${play.revealed ? "" : '<button type="button" class="button secondary" data-action="proverb-reveal">Mostra soluzione</button>'}
      </div>`);
  }
  output.push(`<p class="feedback" aria-hidden="true">${esc(play.feedback || "")}</p>`);
  output.push('<div class="actions"><button type="button" class="button ghost" data-action="end-turn">Termina turno</button></div>');
  return output.join("");
}

function quizView() {
  const taken = state.play.used;
  return `${roundTitle("Tabellone quiz")}
    ${turnLine("Sceglie")}
    <p class="turn-count">Scelta ${state.play.turn + 1} di ${quizTurns * state.teams.length}</p>
    <div class="quiz-grid" aria-label="Categorie del quiz">
      ${mintakaCategories.map((category, column) => `
        <section class="quiz-column">
          <h2>${category.name}</h2>
          ${category.clues.map((_, row) => {
            const i = column * category.clues.length + row;
            const used = taken.includes(i);
            const value = row + 1;
            return `<button type="button" class="quiz-tile${used ? " used" : ""}" data-action="quiz-open" data-index="${i}" aria-label="${esc(category.name)}, ${value} ${value === 1 ? "punto" : "punti"}${used ? ", già giocata" : ""}" ${used ? "disabled" : ""}>${used ? "✓" : value}</button>`;
          }).join("")}
        </section>`).join("")}
    </div>`;
}

function songView() {
  const song = songCards[state.draw.song];
  let blank = 0;
  return `${roundTitle("La parola mancante")}
    <p class="stage-copy">${state.play.revealed ? "Spunta una parola per ogni risposta corretta di ciascuna squadra." : "Ascoltate l’estratto e scrivete le cinque parole mancanti. Potete riascoltarlo prima di consegnare."}</p>
    <audio class="audio" controls preload="metadata" src="${song.recording}" aria-label="Estratto musicale"></audio>
    <div class="prompt-card song-lines">
      ${song.lines.map((line) => `<p class="prompt">${esc(line).replace(/#/g, () => `<span class="blank" aria-label="Parola ${++blank}">${blank}</span>`)}</p>`).join("")}
    </div>
    ${state.play.revealed ? `
      <p class="answer-key">${esc(song.title)}</p>
      <ol class="word-list" aria-label="Parole mancanti">${song.answers.map((answer) => `<li>${esc(answer)}</li>`).join("")}</ol>
      <div class="song-teams">
        ${state.teams.map((name, index) => `<fieldset>
          <legend>${esc(name)} <span id="song-score-${index}">(${state.scores[index]}/5)</span></legend>
          ${song.answers.map((word, wordIndex) => `<label><input type="checkbox" data-team="${index}" data-word="${wordIndex}" ${state.play.checks[index][wordIndex] ? "checked" : ""}>${esc(word)}</label>`).join("")}
        </fieldset>`).join("")}
      </div>
      <p class="sources"><a href="${song.source}">Registrazione su Wikimedia Commons</a> · ${esc(song.attribution)}</p>
    ` : ""}
    <div class="actions spaced">
      <button type="button" class="button primary" data-action="${state.play.revealed ? "song-finish" : "song-reveal"}">${state.play.revealed ? "Conferma punteggi" : "Svela le parole"}</button>
    </div>`;
}

function resultsView(final = false) {
  const entries = ranked(final ? totalScores() : state.history.at(-1));
  const winners = entries.filter((entry) => entry.place === 1).map(({ team }) => state.teams[team]);
  const title = final ? "Classifica finale" : `Risultati · ${roundNow().title}`;
  const outcome = winners.length > 1
    ? `Parità tra ${esc(new Intl.ListFormat("it").format(winners))}.`
    : `Vince ${esc(winners[0])}!`;
  return `${roundTitle(title)}
    <p class="stage-copy">${final ? outcome : "I punti della serata dipendono dal piazzamento in questa manche. Le squadre a pari merito si dividono i punti dei posti occupati."}</p>
    <ol class="result-table ${final ? "final-table" : ""}">
      ${entries.map(({ score, team, place, points }) => `<li class="result-row">
        <span class="result-place" aria-label="Posizione ${place}">${place}°</span>
        ${teamChip(team)}
        <div class="result-values"><strong class="total">${final ? formatNumber(score) : `+${formatNumber(points)}`} pt</strong>
        ${final ? "" : `<small>${formatNumber(score)} nella manche</small>`}</div>
      </li>`).join("")}
    </ol>
    <div class="actions spaced">
      <button type="button" class="button primary" data-action="${final ? "ask-reset" : "advance-round"}">${final ? "Nuova serata" : state.round + 1 === partyRounds.length ? "Vedi classifica finale" : "Prossima manche"}</button>
    </div>`;
}

function render() {
  document.getElementById("reset-button").hidden = !state;
  const previousAction = document.activeElement?.dataset.action;
  if (!state) {
    app.innerHTML = setupView();
    if (stageFocus) app.querySelector("#setup-title").focus();
  } else {
    const id = roundNow().id;
    let view;
    if (state.phase === "intro") view = introView();
    else if (state.phase === "results") view = resultsView();
    else if (state.phase === "final") view = resultsView(true);
    else if (id === "quiz") view = quizView();
    else if (id === "song") view = songView();
    else view = timedView();
    app.innerHTML = `
      ${roadmap()}
      <div class="columns">
        <section class="panel stage tone-${id}" aria-labelledby="stage-title">${view}</section>
        <aside class="panel" aria-label="Classifica" id="standings">${standings()}</aside>
      </div>`;
    updateClock();
    if (stageFocus) app.querySelector("#stage-title").focus();
    else if (previousAction && !dialog.open) {
      app.querySelector(`button[data-action="${previousAction}"]:not(:disabled)`)?.focus({ preventScroll: true });
    }
  }
  stageFocus = false;
}

function refresh(focus = false) {
  saveParty();
  stageFocus = focus;
  render();
}

function createParty(form) {
  const teams = Array.from(form.querySelectorAll("input"), (input, index) => input.value.trim() || `Squadra ${index + 1}`);
  state = {
    version: 1, teams, round: 0, phase: "intro", history: [], scores: teams.map(() => 0),
    draw: drawCards(teams.length), play: {},
  };
  refresh(true);
}

function beginRound() {
  const id = roundNow().id;
  state.phase = "play";
  if (id === "quiz") state.play = { turn: 0, used: [], selected: null, revealed: false };
  else if (id === "song") state.play = { revealed: false, checks: state.teams.map(() => Array(5).fill(false)) };
  else prepareTimedTurn(0);
  refresh(true);
}

function prepareTimedTurn(turn) {
  state.play = { turn, step: "ready", card: 0, deadline: null, seen: false, revealed: false, feedback: "" };
}

function openDialog(kind, markup) {
  dialog.dataset.kind = kind;
  dialog.className = `tone-${state ? roundNow().id : "quiz"}`;
  dialog.innerHTML = markup;
  if (!dialog.open) dialog.showModal();
  (dialog.querySelector("[autofocus]") || dialog.querySelector("button"))?.focus();
}

function hideDialog() {
  dialog.dataset.kind = "";
  if (dialog.open) dialog.close();
}

function closeDialog() {
  if (dialog.dataset.kind === "quiz") {
    state.play.selected = null;
    state.play.revealed = false;
    saveParty();
  }
  hideDialog();
}

function showMimeCard() {
  const ready = state.play.step === "ready";
  if (!ready && !hasTime()) return;
  state.play.seen = true;
  saveParty();
  openDialog("mime", `
    <p class="kicker">Solo per chi mima</p>
    <h2 id="card-title">${esc(timedCard())}</h2>
    <p class="stage-copy">Memorizza il titolo, poi nascondi la carta.</p>
    <div class="actions spaced">
      <button type="button" class="button primary" data-action="${ready ? "start-timer" : "hide-mime"}">${ready ? "Nascondi e avvia" : "Nascondi titolo"}</button>
    </div>`);
}

function startTimer() {
  if (state.play.step !== "ready") return;
  hideDialog();
  state.play.step = "active";
  state.play.deadline = Date.now() + roundNow().seconds * 1000;
  live.textContent = `Timer avviato. ${roundNow().seconds} secondi.`;
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
  const seconds = step === "ready" ? duration : step === "done" ? 0 : Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  const formatted = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  if (output.textContent !== formatted) output.textContent = formatted;
  document.getElementById("timer-bar").value = seconds;
  if (step === "active" && seconds === 0) finishTurn("time");
}

function hasTime() {
  if (state.play.step !== "active") return false;
  if (Date.now() < state.play.deadline) return true;
  finishTurn("time");
  return false;
}

function finishTurn(reason) {
  hideDialog();
  state.play.step = "done";
  state.play.endedBy = reason;
  live.textContent = reason === "time" ? "Tempo scaduto." : "Turno concluso.";
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
  state.play.revealed = false;
  state.play.feedback = feedback;
  live.textContent = feedback;
  refresh();
}

function answerFlash(guess) {
  if (!hasTime()) return;
  const truth = timedCard()[1];
  const correct = guess === truth;
  scoreTimed(correct ? 1 : -1, correct ? "Risposta esatta +1" : `Risposta sbagliata −1 · Era ${truth ? "vero" : "falso"}`);
}

function nextTimedTurn() {
  const next = state.play.turn + 1;
  if (next === state.teams.length) finishRound();
  else {
    prepareTimedTurn(next);
    refresh(true);
  }
}

function showQuizCard(index) {
  if (state.play.used.includes(index)) return;
  if (state.play.selected !== index) {
    state.play.selected = index;
    state.play.revealed = false;
  }
  const clue = quizClue(index);
  const points = clue.value === 1 ? "punto" : "punti";
  saveParty();
  openDialog("quiz", `
    <p class="kicker">${esc(clue.category)} · ${clue.value} ${points}</p>
    <h2 id="card-title">${esc(clue.question)}</h2>
    <p class="stage-copy">Tocca a ${esc(state.teams[teamOnTurn()])}.</p>
    ${state.play.revealed ? `
      <div class="prompt-card"><p class="prompt-note">Risposta</p><p class="prompt">${esc(clue.answer)}</p></div>
      <div class="actions">
        <button type="button" class="button positive" data-action="quiz-correct">Esatta +${clue.value}</button>
        <button type="button" class="button negative" data-action="quiz-wrong">Sbagliata −${clue.value}</button>
        <button type="button" class="button ghost" data-action="close-dialog">Torna al tabellone</button>
      </div>
    ` : `
      <div class="actions spaced">
        <button type="button" class="button primary" data-action="quiz-reveal">Mostra la risposta</button>
        <button type="button" class="button ghost" data-action="close-dialog">Torna al tabellone</button>
      </div>
    `}`);
}

function scoreQuiz(sign) {
  const play = state.play;
  if (play.selected === null || !play.revealed) return;
  state.scores[teamOnTurn()] += sign * quizClue(play.selected).value;
  play.used.push(play.selected);
  play.selected = null;
  play.revealed = false;
  play.turn++;
  hideDialog();
  if (play.turn === quizTurns * state.teams.length) finishRound();
  else refresh(true);
}

function finishRound() {
  state.history.push([...state.scores]);
  state.phase = "results";
  refresh(true);
}

function advanceRound() {
  if (state.round + 1 === partyRounds.length) state.phase = "final";
  else {
    state.round++;
    state.phase = "intro";
    state.play = {};
    state.scores = state.teams.map(() => 0);
  }
  refresh(true);
}

function askReset() {
  openDialog("reset", `
    <h2 id="card-title">Iniziare una nuova serata?</h2>
    <p class="stage-copy">La classifica e i progressi di questa serata verranno azzerati.</p>
    <div class="actions spaced">
      <button type="button" class="button ghost" data-action="close-dialog" autofocus>Continua a giocare</button>
      <button type="button" class="button primary" data-action="confirm-reset">Nuova serata</button>
    </div>`);
}

function resetParty() {
  hideDialog();
  teamDraft = [...state.teams];
  state = null;
  refresh(true);
}

function changeTeamFields(action, index) {
  const fields = app.querySelectorAll("#team-form input");
  teamDraft = Array.from(fields, (field) => field.value);
  if (action === "add-team" && teamDraft.length < maxTeams) {
    index = teamDraft.length;
    teamDraft.push("");
  } else if (action === "remove-team" && teamDraft.length > minTeams) {
    teamDraft.splice(index, 1);
    index = Math.min(index, teamDraft.length - 1);
  }
  render();
  app.querySelectorAll("#team-form input")[index]?.focus();
}

const actionHandlers = {
  "add-team": changeTeamFields,
  "remove-team": changeTeamFields,
  "ask-reset": askReset,
  "close-dialog": closeDialog,
  "confirm-reset": resetParty,
  "begin-round": beginRound,
  "advance-round": advanceRound,
  "mime-card": showMimeCard,
  "hide-mime": hideMimeCard,
  "start-timer": startTimer,
  "mime-correct": () => { if (state.play.seen) scoreTimed(1, "Indovinato +1"); },
  "flash-true": () => answerFlash(true),
  "flash-false": () => answerFlash(false),
  "proverb-correct": () => scoreTimed(1, "Proverbio completato +1"),
  "proverb-reveal": () => {
    if (!hasTime()) return;
    state.play.revealed = true;
    live.textContent = timedCard()[1];
    refresh();
  },
  "pass": () => scoreTimed(0, "Carta saltata"),
  "end-turn": () => { if (hasTime()) finishTurn("manual"); },
  "next-turn": nextTimedTurn,
  "quiz-open": (_, index) => showQuizCard(index),
  "quiz-reveal": () => {
    state.play.revealed = true;
    showQuizCard(state.play.selected);
  },
  "quiz-correct": () => scoreQuiz(1),
  "quiz-wrong": () => scoreQuiz(-1),
  "song-reveal": () => {
    state.play.revealed = true;
    refresh(true);
  },
  "song-finish": finishRound,
};

document.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (button && !button.disabled) {
    const { action, index } = button.dataset;
    actionHandlers[action](action, Number(index));
  }
});

app.addEventListener("submit", (event) => {
  if (event.target.id !== "team-form") return;
  event.preventDefault();
  createParty(event.target);
});

app.addEventListener("change", (event) => {
  const input = event.target;
  if (!input.matches('input[type="checkbox"][data-team]')) return;
  const { team, word } = input.dataset;
  state.play.checks[team][word] = input.checked;
  state.scores[team] = state.play.checks[team].filter(Boolean).length;
  document.getElementById(`song-score-${team}`).textContent = `(${state.scores[team]}/5)`;
  document.getElementById("standings").innerHTML = standings();
  saveParty();
});

dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  if (dialog.dataset.kind === "mime" && state.play.step === "active") hideMimeCard();
  else closeDialog();
});

render();
if (state?.phase === "play" && roundNow().id === "quiz" && state.play.selected !== null) showQuizCard(state.play.selected);
setInterval(updateClock, 125);
