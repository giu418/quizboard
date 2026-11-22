const get = (id) => document.getElementById(id);
const clueDialog = get("clue-dialog");
const resetDialog = get("reset-dialog");
const teamInputs = get("team-inputs");
const storageKey = "quizboard-game-v1";

const questionSets = {
  original: [...originalCategories, famousPhotos],
  mintaka: [...mintakaCategories, famousPhotos],
};
const defaultQuestionSet = "mintaka";

let game = loadGame();
let activeClue = null;
let revealed = false;
let clues;
let tiles;

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    const questionSet = saved?.questionSet ?? "original";
    if (saved && Object.hasOwn(questionSets, questionSet) &&
      Array.isArray(saved.teams) && saved.teams.length &&
      saved.teams.every((team) => team && typeof team.name === "string" && Number.isInteger(team.score)) &&
      Number.isInteger(saved.turn) && saved.turn >= 0 && saved.turn < saved.teams.length &&
      Array.isArray(saved.played) && new Set(saved.played).size === saved.played.length) {
      const clueCount = questionSets[questionSet].reduce((total, category) => total + category.clues.length, 0);
      if (saved.played.every((id) => Number.isInteger(id) && id >= 0 && id < clueCount)) {
        return { ...saved, questionSet };
      }
    }
  } catch {
    // Keep the game playable when browser storage is unavailable.
  }
  return null;
}

function saveGame() {
  try {
    if (game) localStorage.setItem(storageKey, JSON.stringify(game));
    else localStorage.removeItem(storageKey);
  } catch {
    // The active game continues in memory.
  }
}

function buildBoard() {
  const board = get("board");
  const questionSet = game?.questionSet ?? defaultQuestionSet;
  board.replaceChildren();
  board.classList.add("board-enter");
  clues = [];
  tiles = [];
  for (const [columnIndex, category] of questionSets[questionSet].entries()) {
    const categoryName = quizCategoryName(category.name);
    const column = document.createElement("section");
    column.className = "category";
    const heading = document.createElement("h2");
    heading.append(categoryName);
    column.append(heading);

    category.clues.forEach((pair, row) => {
      const [question, answer] = tr(pair, (category.englishClues ?? englishQuizClues[questionSet][columnIndex])[row]);
      const photo = category.photos?.[row];
      const clue = { id: clues.length, category: categoryName, value: (row + 1) * 100, question, answer, photo };
      clues.push(clue);
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "tile";
      tile.style.setProperty("--i", columnIndex + row);
      tile.addEventListener("click", () => {
        // La finestra si apre dalla casella scelta.
        const box = tile.getBoundingClientRect();
        clueDialog.style.setProperty("--ox", `${box.left + box.width / 2}px`);
        clueDialog.style.setProperty("--oy", `${box.top + box.height / 2}px`);
        openClue(clue);
      });
      tiles.push(tile);
      column.append(tile);
    });
    board.append(column);
  }
  get("mintaka-credit").hidden = questionSet !== "mintaka";
}

function refreshTeamFields() {
  const rows = [...teamInputs.children];
  rows.forEach((row, index) => {
    const number = index + 1;
    const input = row.querySelector("input");
    input.setAttribute("aria-label", tr(`Nome della squadra ${number}`, `Team ${number} name`));
    input.placeholder = teamName(index);
    const remove = row.querySelector("button");
    remove.hidden = rows.length === 1;
    remove.setAttribute("aria-label", tr(`Rimuovi la squadra ${number}`, `Remove team ${number}`));
  });
}

function addTeamField(name = "", focus = false) {
  const row = document.createElement("div");
  row.className = "team-row";
  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = 40;
  input.autocomplete = "off";
  input.value = name;
  const remove = document.createElement("button");
  remove.className = "icon-button remove";
  remove.type = "button";
  remove.innerHTML = ico("close");
  remove.addEventListener("click", () => {
    const neighbor = row.nextElementSibling ?? row.previousElementSibling;
    row.remove();
    refreshTeamFields();
    neighbor.querySelector("input").focus();
  });
  row.append(input, remove);
  teamInputs.append(row);
  refreshTeamFields();
  if (focus) input.focus();
}

function renderGame() {
  const played = game?.played ?? [];
  const finished = played.length === clues.length;
  get("setup").hidden = Boolean(game);
  get("scoreboard").hidden = !game;
  get("new-game").hidden = !game;
  get("progress").value = played.length;
  get("progress").max = clues.length;
  get("progress-label").textContent = `${played.length} / ${clues.length} ${tr("caselle giocate", "tiles played")}`;

  for (const clue of clues) {
    const tile = tiles[clue.id];
    const used = played.includes(clue.id);
    tile.disabled = !game || used;
    tile.classList.toggle("played", used);
    if (used) tile.innerHTML = ico("check");
    else tile.textContent = clue.value;
    tile.setAttribute("aria-label", `${clue.category}, ${clue.value} ${pointLabel(clue.value)}${used ? t(", già giocata") : ""}`);
  }
  if (!game) return;

  if (finished) {
    const highest = Math.max(...game.teams.map((team) => team.score));
    const leaders = game.teams.filter((team) => team.score === highest).map((team) => team.name);
    const names = new Intl.ListFormat(language).format(leaders);
    get("turn").textContent = leaders.length === 1 ? tr(`Vince ${names}!`, `${names} wins!`) : `${tr("Parità tra", "Tie between")} ${names}`;
  } else {
    const team = game.teams[game.turn].name;
    get("turn").textContent = tr(`Tocca a ${team}`, `${team}’s turn`);
  }

  get("scores").replaceChildren(...game.teams.map((team, index) => {
    const row = document.createElement("li");
    row.className = "score";
    if (!finished && index === game.turn) row.classList.add("active");
    const name = document.createElement("span");
    const score = document.createElement("strong");
    name.textContent = team.name;
    score.textContent = team.score;
    row.append(name, score);
    return row;
  }));
}

function openClue(clue) {
  if (!game || activeClue || game.played.includes(clue.id)) return;
  activeClue = clue;
  revealed = false;
  renderClue();
  clueDialog.showModal();
  get("clue-target").focus();
}

function revealAnswer() {
  if (!activeClue || revealed) return;
  revealed = true;
  renderClue();
  get("answer-heading").focus();
}

function renderClue() {
  const { category, value, question, answer, photo } = activeClue;
  const team = game.teams[game.turn].name;
  get("clue-category").textContent = category;
  get("clue-value").textContent = `${value} ${pointLabel(value)}`;
  get("clue-team").textContent = tr(`In gioco: ${team}`, `${team}’s turn`);
  get("clue-photo").hidden = !photo;
  get("clue-photo-credit").hidden = !revealed;
  if (photo) {
    const image = get("clue-image");
    image.src = photo.src;
    image.alt = tr(...photo.alt);
    const source = get("clue-photo-source");
    source.href = photo.source;
    source.textContent = photo.credit;
  }
  get("question").textContent = question;
  get("revealed-question").textContent = revealed ? question : "";
  get("answer").textContent = revealed ? answer : "";
  get("wrong").textContent = `${t("Sbagliata")} −${value}`;
  get("correct").textContent = `${t("Esatta")} +${value}`;
  get("clue-target").hidden = revealed;
  get("revealed").hidden = !revealed;
  get("score-actions").hidden = !revealed;
  clueDialog.setAttribute("aria-labelledby", revealed ? "answer-heading" : "clue-heading");
}

function scoreClue(multiplier) {
  if (!activeClue || !revealed) return;
  const team = game.teams[game.turn];
  const value = activeClue.value;
  team.score += value * multiplier;
  game.played.push(activeClue.id);
  game.turn = (game.turn + 1) % game.teams.length;
  activeClue = null;
  saveGame();
  renderGame();
  clueDialog.close();
  const verb = multiplier > 0 ? tr("guadagna", "gains") : tr("perde", "loses");
  get("announcement").textContent = `${team.name} ${verb} ${value} ${pointLabel(value)}. ${get("turn").textContent}`;
  (tiles.find((tile) => !tile.disabled) ?? get("turn")).focus();
}

get("add-team").addEventListener("click", () => addTeamField("", true));
get("team-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const teams = [...teamInputs.querySelectorAll("input")].map((input) => ({
    name: input.value.trim() || input.placeholder,
    score: 0,
  }));
  game = { teams, turn: 0, played: [], questionSet: defaultQuestionSet };
  saveGame();
  renderGame();
  get("announcement").textContent = get("turn").textContent;
  tiles[0].focus();
});

get("clue-target").addEventListener("click", revealAnswer);
get("wrong").addEventListener("click", () => scoreClue(-1));
get("correct").addEventListener("click", () => scoreClue(1));
get("close-clue").addEventListener("click", () => clueDialog.close());
clueDialog.addEventListener("close", () => {
  if (!clueDialog.open) activeClue = null;
});
get("new-game").addEventListener("click", () => resetDialog.showModal());
get("cancel-reset").addEventListener("click", () => resetDialog.close());
get("confirm-reset").addEventListener("click", () => {
  game = null;
  saveGame();
  buildBoard();
  renderGame();
  resetDialog.close();
  get("setup-title").focus();
});

window.addEventListener("quizboard-language", () => {
  buildBoard();
  refreshTeamFields();
  renderGame();
  get("announcement").textContent = "";
  if (activeClue && clueDialog.open) {
    activeClue = clues[activeClue.id];
    renderClue();
  }
});

buildBoard();
if (game) {
  game.teams.forEach((team) => addTeamField(team.name));
} else {
  addTeamField();
  addTeamField();
}
renderGame();
