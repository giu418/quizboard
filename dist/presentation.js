const presentationDebug = new URLSearchParams(location.search).get("debug") === "1";
const presentationPrefix = presentationDebug ? "quizboard-display-debug" : "quizboard-display";
const presenterStorage = `${presentationPrefix}-presenter`;
const playerStorage = `${presentationPrefix}-view`;
