# DESIGN.md — redesign di Quizboard

Stato: **Fasi 3–5 completate su questo branch**; resta la Fase 6 (verifica finale e pulizia) dopo i feedback.

Il redesign segue **due filoni paralleli**, uno per branch: `prima-serata` e `varieta`. Markup, `ui.css` e script sono identici; cambia solo `dist/theme.css` (token, font e scenografia) e il `theme-color` delle pagine.

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

Indicazioni ricevute (22/11/2026): molto più innovativo, **molto televisivo**, proiettato su una **televisione**, **molti movimenti**, **sigla a ogni manche**; la prima versione di «Prima serata» era troppo cupa. Canvas: <https://claude.ai/artifact/DV9Q43ynSfNQtRXTqdj4QR>

**Scelte comuni ai due filoni**

- *Lo schermo è il palco*: in gioco spariscono intestazione e crediti, resta solo la scena. Motivo: le squadre guardano da lontano una TV.
- *Podi delle squadre* in basso al posto della lista punti, nell'ordine delle squadre (non si spostano durante la manche); quello di turno si alza e pulsa. Nel quiz mostrano anche lo stato della carta.
- *Tabellone come videowall*, casella a tutto schermo che si apre dalla tessera scelta.
- *Comandi di chi conduce grandi* (64–72 px) e colorati per esito; una sola azione principale per scena.
- *Timer gigante* nel colore della manche; negli ultimi 10 secondi diventa rosso e batte a ogni secondo.
- *Sigla* a ogni introduzione di manche e al benvenuto; ingressi scenici a ogni cambio di scena (classe `view-enter`), mai a ogni semplice aggiornamento.
- Deroga voluta alle «Regole per le animazioni»: il movimento decorativo non è limitato a uno o due momenti e la sigla dura circa 1,2 s. Restano valide: solo `transform`/`opacity`, nessuna azione aspetta un'animazione, `prefers-reduced-motion` spegne tutto.

**Prima serata** (`prima-serata`): studio televisivo blu elettrico con oro. Barlow Condensed maiuscolo per titoli e numeri (leggibile da lontano, stile tabellone sportivo), Barlow per i testi. Fasci di luce ciano, magenta e oro che oscillano; sigla a lame di luce; tessere che si ribaltano; risposta che si gira con un lampo; forme squadrate con tagli obliqui.

**Varietà** (`varieta`): sabato sera a teatro. Velluto bordeaux, crema e oro; Shrikhand per i titoli, DM Sans per i testi. Sigla a sipario che si apre; insegna a lampadine che si rincorrono attorno al tabellone; tessere a pillola che si accendono sfarfallando; forme tonde con ombre nette.

## Token

Tutti in `dist/theme.css`, su `:root`. Valori del filone di questo branch nel file; ruoli:

| Gruppo | Variabili |
|---|---|
| Fondo e superfici | `--bg`, `--bg-mid`, `--bg-glow`, `--surface`, `--surface-2`, `--surface-3`, `--sunk`, `--line`, `--line-soft`, `--backdrop` |
| Testo | `--text`, `--muted`, `--faint` |
| Primario e stati | `--primary`, `--primary-hi`, `--on-primary`, `--focus`, `--pos*`, `--neg*` |
| Squadre e manche | `--team-0…3`, `--on-team`, `--tone-mime/quiz/flash/proverbs/list/song` |
| Tessere | `--tile-bg`, `--tile-bg-hi`, `--tile-text`, `--tile-line`, `--tile-used-*`, `--tile-inset` |
| Tipografia | `--font-display`, `--font-body`, `--display-weight/case/track/lh/shadow`, `--label-track`, scala `--fs-1…8` (0.875 rem → clamp fino a 10 rem) |
| Spazi | `--sp-1…8` (4, 8, 12, 16, 24, 32, 48, 64 px), `--gutter`, `--hit` (48 px) |
| Raggi | `--r-1`, `--r-2`, `--r-3`, `--r-tile`, `--r-btn`, `--r-pill` |
| Ombre | `--sh-1`, `--sh-2`, `--glow`, `--glow-primary` |
| Movimento | `--dur-1` 140 ms (controlli), `--dur-2` 260 ms (finestre), `--dur-3` 400 ms (scene), `--dur-show` 620 ms (sigla), `--dur-lights`, `--stagger` 55 ms, `--ease-out`, `--ease-in`, `--ease-pop` |
| Scenografia | `--stage-bg`, `--stage-lights`, `--light-a/b/c`, `--light-blur`, `--wall-bg`, `--panel-bg` |

In fondo a `theme.css` c'è la scenografia propria del tema: `.sigla`, `.bulbs`, e i keyframe `tile-in`, `answer-in`, `title-in`.

## Schermate

- [x] Elementi condivisi (pulsanti, campi, link, card, intestazioni, cornice finestre)
- [x] 1 · Configurazione squadre e manche
- [x] 2 · Benvenuto
- [x] 3 · Introduzione manche
- [x] 4 · Turno a tempo · si prepara
- [x] D1 · Carta del mimo
- [x] 5 · Turno a tempo · attivo (mime, flash, proverbs)
- [x] 6 · Turno a tempo · concluso
- [x] 9 · Tabellone quiz
- [x] D2 · Casella del quiz (tutti gli stati)
- [x] 7–8 · Sfida delle liste
- [x] 10 · Risultati manche
- [x] 11 · Classifica finale
- [x] 12 · HUD di gioco
- [x] D3 · Conferma «Nuova serata»
- [x] 13 · Solo quiz (configurazione, gioco, finito)
- [x] D4 · Domanda (solo quiz)
- [x] D5 · Conferma «Nuova partita»
- [x] 14 · Scheda del giudice
- [x] Modalità debug (barra «Vai a…», roadmap, elenco manche)
- [x] Animazioni (Fase 5)
- [ ] Verifica finale (Fase 6): tastiera completa, pulizia finale, resoconto

## Decisioni e ipotesi

- **Ipotesi**: uso principale su schermo grande condiviso (TV/proiettore), in una stanza con luce bassa; telefono secondario.
- **Ipotesi**: il logo attuale (quadrato oro con quattro punti, uno attenuato) e il nome «Quizboard» restano.
- **Ipotesi**: i quattro colori squadra restano distinguibili fra loro e sempre accompagnati dal nome (mai solo colore).
- `dist/audio/estratto-*.mp3` e la manche «La parola mancante» sono sospesi: non compaiono nel gioco e non vengono ridisegnati.
- I font sono copiati in `dist/fonts` (woff2, sottoinsiemi latin e latin-ext, `font-display: swap`): l'app non ha bisogno di rete.
- **Effetti sonori** (richiesti il 22/11/2026, fuori dal redesign grafico): `dist/sound.js` li sintetizza con la Web Audio API, senza file audio. Sigla a benvenuto e inizio manche, battito negli ultimi 10 secondi e segnale di tempo scaduto, rivelazione della risposta ed esito. Il timbro segue il tema tramite `--sound-theme` in `theme.css`. Lo script osserva la pagina e non modifica la logica. Non c'è un comando per silenziarli: il volume si regola dalla TV.
- Modifiche agli script, solo di presentazione: icone SVG (`icons`/`ico()` in `language.js`), classi `view-enter`/`card-enter`/`bump`/`urgent`, attributo `data-look` e origine `--ox/--oy` delle finestre, podi con stato della carta, pulsante di chiusura nella casella del quiz, focus che torna alla casella. Nessuna modifica a regole, punteggi, salvataggi, testi.
- In «Solo quiz» i simboli Unicode delle categorie non vengono più mostrati (una sola famiglia di icone, in SVG).
- I commit sono firmati `bskenzo` con l'email dell'utente perché git non ha un'identità configurata.
- **Proposte in sospeso (fuori dai confini del redesign)**:
  - effetti sonori (già in `IDEE.md`);
  - favicon: oggi manca (404 in console);
  - unificare `party.css` e `styles.css` in un solo foglio di token condiviso rientra nel redesign; unificare i *valori* del tabellone (1–5 contro 100–500) no, è logica.
