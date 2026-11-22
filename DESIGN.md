# DESIGN.md — redesign di Quizboard

Stato: **Fase 2 in corso** (in attesa della scelta della direzione visiva).

## Contesto

### A cosa serve

Quizboard conduce una «Serata giochi» a squadre su un unico schermo condiviso: una persona guida, 2–4 squadre giocano a voce, l'app mostra domande, timer e classifica.

### Chi la usa, dove, su cosa

- **Chi conduce** è l'unica persona che tocca l'app: clicca, usa le scorciatoie da tastiera (V/F/P nel Vero o falso), registra risposte e punti. Verificato nel README e nei testi («Chi conduce seleziona la risposta…»).
- **Le squadre** guardano lo schermo da lontano e non lo toccano. Lo dicono i testi («sullo stesso schermo», «Fate distogliere lo sguardo…») e la grafica attuale, che in gioco usa caratteri fino a 5–7 rem.
- **Chi giudica** i Proverbi tiene aperta `giudice.html` in una seconda finestra dello stesso browser.
- *Ipotesi*: serata in casa fra amici o famiglia, luce bassa, portatile collegato a TV o proiettore, pubblico a 2–4 metri. Il telefono è un caso secondario (la scheda del giudice, una prova veloce).
- *Ipotesi*: pubblico italiano adulto e misto (proverbi, film per famiglie, 25 aprile); l'inglese è un'opzione.

### Inventario di schermate e finestre

**Serata giochi — `index.html` (rendering in `party.js`, un'unica `<main id="app">`)**

| # | Schermata | Stati |
|---|---|---|
| 1 | Configurazione squadre e manche | 2/3/4 squadre; campo vuoto (usa «Squadra N»); manche attiva/disattiva; ultima manche attiva non disattivabile; Su/Giù disabilitati agli estremi; variante debug con barra «Vai a…» ed elenco «Le manche» |
| 2 | Benvenuto | unico |
| 3 | Introduzione manche | 5 manche (tono diverso); nota aggiuntiva per Cinema muto; debug: roadmap + «Vai a…» |
| 4 | Turno a tempo · «Si prepara» | mime / flash / proverbs (testo e pulsanti diversi, link giudice) |
| 5 | Turno a tempo · attivo | **mime**: titolo nascosto, «Indovinato» disabilitato finché la carta non è vista, feedback · **flash**: domanda, esito verde/rosso per 850 ms, avanzamento carte · **proverbs**: proverbio, corretto/errore, avanzamento, feedback |
| 6 | Turno a tempo · concluso | tempo scaduto / sequenza completata / turno concluso; ultimo turno → «Vedi risultati» |
| 7 | Sfida delle liste · scelta categoria | unico |
| 8 | Sfida delle liste · gioco | risposte disponibili/usate, contatori |
| 9 | Tabellone quiz | caselle disponibili/giocate/bloccate (carta attiva), stato carte per squadra |
| 10 | Risultati manche | con o senza «Classifica a metà serata»; parità |
| 11 | Classifica finale | vincitore unico / parità |
| 12 | HUD di gioco (punti manche, «Nuova serata», selettore lingua) | squadra di turno evidenziata |

Finestre (`<dialog id="card-dialog">`, `data-kind`):

| # | Finestra | Stati |
|---|---|---|
| D1 | Carta del mimo (`mime`) | prima del timer («Nascondi e avvia») / a timer attivo («Nascondi titolo») |
| D2 | Casella del quiz (`quiz`), a tutto schermo | prima della domanda · scelta bonus · scelta malus · carta attiva · domanda · domanda con foto · risposta (con credito foto) |
| D3 | Conferma «Nuova serata» (`reset`) | unico |

**Solo quiz — `quiz.html` (`game.js`)**

| # | Schermata / finestra | Stati |
|---|---|---|
| 13 | Tabellone + pannello squadre | configurazione (1+ squadre, aggiungi/rimuovi) · in gioco (turno, punteggi, avanzamento) · finito (vincitore/parità) |
| D4 | Domanda (`#clue-dialog`) | domanda · con foto · risposta rivelata |
| D5 | Conferma «Nuova partita» (`#reset-dialog`) | unico |

**Scheda del giudice — `giudice.html` (`judge.js`)**

| # | Schermata | Stati |
|---|---|---|
| 14 | Scheda del giudice | in attesa · «si prepara» · proverbio completo · errore di memorizzazione locale |

Non esistono stati di caricamento: tutto è locale e sincrono (dati in file JS, stato in `localStorage`). L'unico contenuto asincrono sono le 5 foto.

### Flussi, dal più usato al meno usato

1. **Serata completa**: squadre → benvenuto → per ogni manche: introduzione → gioco → risultati → classifica finale.
2. **Turno a tempo** (Cinema muto, Vero o falso, Proverbi): si prepara → timer → esiti → fine turno → squadra successiva.
3. **Casella del tabellone**: casella → (bonus/malus) → domanda → risposta → esatta/sbagliata.
4. **Sfida delle liste**: categoria → risposte a turno o passa.
5. **Solo quiz** (`quiz.html`): squadre → tabellone → domanda → punti.
6. **Scheda del giudice** in seconda finestra.
7. **Nuova serata** / cambio lingua / modalità debug (`?debug=1`).

### Tecnologie e comandi

- Sito statico senza build: HTML + JS classico (script `defer`, variabili globali condivise) + CSS scritto a mano. Nessuna dipendenza, nessun framework, nessun `package.json`.
- Stili: `dist/party.css` (serata e giudice), `dist/styles.css` (solo quiz), `dist/language.css` (selettore lingua). Variabili CSS su `:root`, duplicate fra i due fogli con nomi diversi.
- `party.js` genera l'HTML con template string e `innerHTML`; gli script si agganciano a `data-action`, `data-index`, `data-round-selection`, `data-kind`, `data-i18n*`, `data-language-toggle` e agli id (`#app`, `#card-dialog`, `#live`, `#team-form`, `#team-name-N`, `#stage-title`, `#setup-title`, `#timer-display`, `#timer-bar`, `#reset-button`; in `quiz.html` tutti gli id letti da `game.js`).
- Traduzioni: `t()` usa il testo italiano come chiave → **i testi non vanno toccati**.
- Avvio: `python3 -m http.server 8000 --bind 127.0.0.1 --directory dist` → <http://127.0.0.1:8000/>. Debug: `/?debug=1`.
- Test: **non esistono**. La verifica è manuale, con screenshot via Playwright (Chromium di sistema).
- Hosting: `.openai/hosting.json` pubblica la cartella `dist`.
- Git: branch `redesign`, nessun push.

### Cosa non funziona nella grafica attuale

1. **Due app in una**: `party.css` e `styles.css` hanno token, pulsanti, header e finestre diversi (tabellone 1–5 viola contro 100–500 oro).
2. **Gerarchia dei pulsanti capovolta in gioco**: i comandi di chi conduce («Indovinato +1», «Esatta», «Sbagliata», «Corretto») sono pulsantini da 0.94 rem persi sotto card enormi; l'azione principale non si riconosce.
3. **Schermo sprecato**: tabellone, «Titolo nascosto», fine turno e sfida delle liste lasciano metà schermo vuota o riempita da card senza contenuto.
4. **Il timer, l'elemento più teso della serata, sta in un angolo** con una barra da 6 px.
5. **Finestra della casella quiz**: «Prima della domanda» come titolo gigante, bonus/malus poco spiegati, nessun controllo di chiusura evidente oltre «Torna al tabellone».
6. **Identità generica**: blu notte + cerchi concentrici + system-ui; le icone sono caratteri Unicode (✦ ▦ ϟ ❞ ☷ ×) resi in modo diverso da ogni sistema.
7. **Nessun movimento**: l'unica animazione è il lampo dell'esito; cambi di schermata e finestre scattano.
8. **Mobile**: header che va a capo, elenco manche stretto, etichette categoria spezzate («Geografi-a»).
9. **Stati mancanti**: focus poco coerente, disabilitato solo come opacità, nessuna celebrazione nei risultati e nella classifica finale.
10. Colori e misure scritti a mano ovunque (decine di esadecimali fuori dai token).

## Direzione

*Da scrivere dopo la scelta (Fase 2).*

## Token

*Da definire in Fase 3.*

## Schermate

- [ ] Elementi condivisi (pulsanti, campi, link, card, intestazioni, cornice finestre)
- [ ] 1 · Configurazione squadre e manche
- [ ] 2 · Benvenuto
- [ ] 3 · Introduzione manche
- [ ] 4 · Turno a tempo · si prepara
- [ ] D1 · Carta del mimo
- [ ] 5 · Turno a tempo · attivo (mime, flash, proverbs)
- [ ] 6 · Turno a tempo · concluso
- [ ] 9 · Tabellone quiz
- [ ] D2 · Casella del quiz (tutti gli stati)
- [ ] 7–8 · Sfida delle liste
- [ ] 10 · Risultati manche
- [ ] 11 · Classifica finale
- [ ] 12 · HUD di gioco
- [ ] D3 · Conferma «Nuova serata»
- [ ] 13 · Solo quiz (configurazione, gioco, finito)
- [ ] D4 · Domanda (solo quiz)
- [ ] D5 · Conferma «Nuova partita»
- [ ] 14 · Scheda del giudice
- [ ] Modalità debug (barra «Vai a…», roadmap, elenco manche)
- [ ] Animazioni (Fase 5)
- [ ] Verifica finale (Fase 6)

## Decisioni e ipotesi

- **Ipotesi**: uso principale su schermo grande condiviso (TV/proiettore), in una stanza con luce bassa; telefono secondario.
- **Ipotesi**: il logo attuale (quadrato oro con quattro punti, uno attenuato) e il nome «Quizboard» restano.
- **Ipotesi**: i quattro colori squadra restano distinguibili fra loro e sempre accompagnati dal nome (mai solo colore).
- `dist/audio/estratto-*.mp3` e la manche «La parola mancante» sono sospesi: non compaiono nel gioco e non vengono ridisegnati.
- **Proposte in sospeso (fuori dai confini del redesign)**:
  - effetti sonori (già in `IDEE.md`);
  - favicon: oggi manca (404 in console);
  - unificare `party.css` e `styles.css` in un solo foglio di token condiviso rientra nel redesign; unificare i *valori* del tabellone (1–5 contro 100–500) no, è logica.
