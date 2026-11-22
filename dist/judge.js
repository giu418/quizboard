const judgeStatus = document.getElementById("judge-status");
const judgeCard = document.getElementById("judge-card");
const judgePosition = document.getElementById("judge-position");
const judgeProverb = document.getElementById("judge-proverb");

function updateJudge() {
  let party;
  try {
    party = JSON.parse(localStorage.getItem(partyStorage));
  } catch {
    judgeStatus.textContent = t("Apri la scheda nello stesso browser della partita, con la memorizzazione locale attiva.");
    judgeCard.hidden = true;
    return;
  }

  const round = partyRounds[party?.round];
  const step = party?.play?.step;
  const canJudge = party?.version === partyVersion && party.phase === "play" &&
    round?.id === "proverbs" && ["ready", "active"].includes(step);
  const card = canJudge ? timedPartyCard(party, tr(proverbCards, englishProverbCards)) : null;

  judgeCard.hidden = !card;
  if (card) {
    const activeTeam = party.teams[activePartyTeam(party)];
    judgeStatus.textContent = step === "ready"
      ? tr(`${activeTeam} si prepara.`, `${activeTeam} is getting ready.`)
      : tr(`Tocca a ${activeTeam}.`, `${activeTeam}’s turn.`);
    judgePosition.textContent = `${tr("Proverbio", "Proverb")} ${progressCount(party.play.card + 1, partyHand(round, party.teams.length))}`;
    judgeProverb.textContent = `${card[0].replace(/…$/u, "")} ${card[1]}`;
  } else {
    judgeStatus.textContent = t("In attesa del prossimo turno di Proverbi al volo.");
    judgeProverb.textContent = "";
  }
}

window.addEventListener("storage", (event) => {
  if (event.key === partyStorage || event.key === null) updateJudge();
});
window.addEventListener("quizboard-language", updateJudge);

updateJudge();
