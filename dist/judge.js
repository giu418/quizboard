const judgeStatus = document.getElementById("judge-status");
const judgeCard = document.getElementById("judge-card");
const judgePosition = document.getElementById("judge-position");
const judgeAnswer = document.getElementById("judge-answer");
const judgeNote = document.getElementById("judge-note");
const judgeList = document.getElementById("judge-list");
const judgeListTitle = document.getElementById("judge-list-title");
const judgeListAnswers = document.getElementById("judge-list-answers");

function showJudgeList(party, category) {
  const { step, turn, deadline, used } = party.play;
  judgeListTitle.textContent = category[language];
  judgeListAnswers.replaceChildren(...category.answers.map((answer, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button secondary";
    const alreadyUsed = used.includes(index);
    button.textContent = answer[language === "en" ? 1 : 0];
    if (alreadyUsed) button.insertAdjacentHTML("beforeend", ` ${ico("check")}`);
    button.disabled = alreadyUsed || step !== "active";
    button.addEventListener("click", () => {
      try {
        localStorage.setItem(listAnswerStorage, JSON.stringify({ turn, deadline, index }));
      } catch {
        judgeStatus.textContent = t("Apri la scheda nello stesso browser della partita, con la memorizzazione locale attiva.");
      }
    });
    return button;
  }));
}

function updateJudge() {
  judgeCard.hidden = true;
  judgeList.hidden = true;
  judgeNote.hidden = true;
  let party;
  try {
    party = JSON.parse(localStorage.getItem(partyStorage));
  } catch {
    judgeStatus.textContent = t("Apri la scheda nello stesso browser della partita, con la memorizzazione locale attiva.");
    return;
  }

  const round = partyRounds[party?.round];
  const step = party?.play?.step;
  const canJudge = party?.version === partyVersion && party.phase === "play" && ["ready", "active"].includes(step);
  const card = canJudge && round?.id === "proverbs" ? warmupCard(party) : null;
  const list = canJudge && round?.id === "list" ? listCategories[party.play.category] : null;

  if (card || list) {
    const activeTeam = party.teams[activePartyTeam(party)];
    judgeStatus.textContent = step === "ready"
      ? tr(`${activeTeam} si prepara.`, `${activeTeam} is getting ready.`)
      : tr(`Tocca a ${activeTeam}.`, `${activeTeam}’s turn.`);
  } else {
    judgeStatus.textContent = t("In attesa del prossimo turno del Riscaldamento o della Sfida delle liste.");
  }

  if (card) {
    const category = warmupCategories[party.play.category ?? 0];
    judgePosition.textContent = `${t(category.label)} · ${progressCount(party.play.card + 1, round.hand)}`;
    judgeAnswer.textContent = `${card[0].replace(/\s*…$/u, "")} ${card[1]}`;
    judgeCard.hidden = false;
    judgeNote.hidden = false;
  } else if (list) {
    showJudgeList(party, list);
    judgeList.hidden = false;
  }
}

window.addEventListener("storage", (event) => {
  if (event.key === partyStorage || event.key === null) updateJudge();
});
window.addEventListener("quizboard-language", updateJudge);

updateJudge();
