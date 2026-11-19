const languageStorage = "quizboard-language";
let language = "it";
try {
  if (localStorage.getItem(languageStorage) === "en") language = "en";
} catch {
  // The selector still works if browser storage is unavailable.
}

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
