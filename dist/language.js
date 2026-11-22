const languageStorage = "quizboard-language";
let language = "it";
try {
  if (localStorage.getItem(languageStorage) === "en") language = "en";
} catch {
  // The selector still works if browser storage is unavailable.
}

// Unica famiglia di icone dell'interfaccia, in SVG.
const icons = {
  mime: "M4 10h16v9H4zM4 10l2-5 3 5M9.5 5l3 5M14 5l3 5",
  quiz: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  song: "M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  flash: "M13 3 5 14h6l-1 7 8-11h-6z",
  proverbs: "M5 17c3 0 4-2 4-5V7H4v5h3M15 17c3 0 4-2 4-5V7h-5v5h3",
  list: "M9 6h11M9 12h11M9 18h11M4 6h1M4 12h1M4 18h1",
  check: "M5 12.5 10 17.5 19 7",
  close: "M6 6l12 12M18 6 6 18",
  plus: "M12 5v14M5 12h14",
  restart: "M4 12a8 8 0 1 0 2.6-5.9M4 4v5h5",
};
const ico = (name) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[name]}"/></svg>`;

const tr = (italian, english) => language === "en" ? english : italian;
const t = (italian) => tr(italian, Object.hasOwn(englishText, italian) ? englishText[italian] : italian);
const displayNumbers = {
  it: new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 }),
  en: new Intl.NumberFormat("en", { maximumFractionDigits: 1 }),
};
const formatNumber = (value) => displayNumbers[language].format(value);
const teamName = (index) => tr(`Squadra ${index + 1}`, `Team ${index + 1}`);
const pointLabel = (count) => count === 1 ? t("punto") : t("punti");

const staticTranslations = [];
for (const node of document.querySelectorAll("[data-i18n]")) {
  staticTranslations.push([node, null, node.textContent.trim()]);
}
for (const node of document.querySelectorAll("[data-i18n-attrs]")) {
  for (const attribute of node.dataset.i18nAttrs.split(" ")) {
    staticTranslations.push([node, attribute, node.getAttribute(attribute)]);
  }
}

function renderLanguage() {
  document.documentElement.lang = language;
  for (const [node, attribute, italian] of staticTranslations) {
    if (attribute) node.setAttribute(attribute, t(italian));
    else node.textContent = t(italian);
  }
  for (const button of document.querySelectorAll("[data-language-toggle]")) {
    button.textContent = tr("EN", "IT");
    button.lang = tr("en", "it");
    button.setAttribute("aria-label", tr("Switch to English", "Passa all’italiano"));
  }
}

function setLanguage(next) {
  if (language === next) return;
  language = next;
  renderLanguage();
  window.dispatchEvent(new Event("quizboard-language"));
}

document.querySelector("[data-language-toggle]").addEventListener("click", () => {
  setLanguage(tr("en", "it"));
  try {
    localStorage.setItem(languageStorage, language);
  } catch {
    // Keep the selected language for this page.
  }
});

window.addEventListener("storage", (event) => {
  if (event.key === languageStorage) setLanguage(event.newValue === "en" ? "en" : "it");
});

renderLanguage();

const progressCount = (position, total) => tr(`${position} di ${total}`, `${position} of ${total}`);
const quizCategoryName = (italian) => tr(italian, englishQuizCategories[italian] ?? italian);
