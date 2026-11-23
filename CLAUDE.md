# Redesign grafico della web app

## Obiettivo

La parte grafica di questa web app va rifatta da zero: tutte le schermate, le finestre (modali, pannelli, menu, popup, notifiche) e le animazioni. Il comportamento resta identico: cambia come l'app appare e si muove, non cosa fa.

Non esiste un brief di design. Il design deve nascere dal contesto dell'app (a cosa serve, chi la usa, in quale situazione) e quel contesto lo ricavi tu, dal codice e dall'app in esecuzione. Le scelte di stile le faccio guardando proposte concrete, non rispondendo a domande astratte.

Se ti chiedo altro, per esempio di correggere un bug, fai quello che chiedo: i confini descritti più sotto valgono solo per il redesign.

## Memoria del lavoro: `DESIGN.md`

Il redesign procede per fasi e può occupare più sessioni. `DESIGN.md`, nella radice del progetto, è il documento che lo tiene insieme. Crealo nella Fase 1 con queste sezioni:

- **Contesto**: cosa hai capito dell'app.
- **Direzione**: lo stile approvato e il motivo di ogni scelta principale.
- **Token**: valori di colori, tipografia, spazi, raggi, ombre e movimento.
- **Schermate**: elenco di schermate e finestre, ognuna con i suoi stati e una casella da spuntare.
- **Decisioni e ipotesi**: ciò che hai assunto senza poterlo verificare e le proposte rimaste in sospeso.

A inizio sessione, se `DESIGN.md` esiste, leggilo e riprendi dalla prima voce non completata. Se non esiste, parti dalla Fase 1. Aggiornalo alla fine di ogni fase e di ogni schermata.

## Fasi

### Fase 1: capire l'app (senza modificare il codice)

1. Leggi README, dipendenze e configurazione, punti di ingresso, pagine o route, componenti o template, fogli di stile.
2. Avvia l'app in locale e percorrila come farebbe un utente, schermata per schermata. Se hai un browser o uno strumento per gli screenshot, usalo per vedere com'è oggi. Se non riesci ad avviarla, fermati e dimmi cosa manca.
3. Scrivi la sezione «Contesto» di `DESIGN.md`:
   - a cosa serve l'app, in una frase;
   - chi la usa, in quale situazione e su quale dispositivo (deducilo da testi, funzioni e dati, e segna ciò che è un'ipotesi);
   - inventario completo di schermate e finestre, con gli stati di ognuna (vuoto, caricamento, errore, successo);
   - i flussi principali, dal più usato al meno usato;
   - tecnologie, posizione e meccanismo degli stili, comandi per avviare l'app e per eseguire i test;
   - cosa non funziona nella grafica attuale.

### Fase 2: direzione visiva (l'unica sosta prevista)

1. Dal contesto ricava due o tre direzioni visive davvero diverse fra loro per tono, palette, tipografia, densità, forma degli elementi e carattere del movimento. Ogni direzione ha una riga di motivazione che la collega a qualcosa trovato nella Fase 1. Se l'app ha già un logo o colori riconoscibili, ogni direzione deve conviverci.
2. Mostramele con Claude Design: pubblica un canvas di artboard come artifact Design (è ciò che fa il comando `/design`). Per ogni direzione disegna la schermata principale e, se l'app ne ha, una finestra, con i contenuti reali dell'app al posto di testo segnaposto.
3. Se Claude Design non è disponibile in questa sessione, dimmelo e mostra le stesse proposte affiancate in una pagina HTML: come artifact se puoi pubblicarne, altrimenti nel file `design-preview.html`, da eliminare a fine lavoro.
4. Scrivimi un solo messaggio con: il link, un riassunto in cinque righe del contesto che hai ricavato (così ti correggo se hai frainteso l'app) e al massimo tre domande su ciò che il codice non può dirti e che cambierebbe il design. Poi fermati e aspetta la mia scelta.
5. Dopo la mia scelta rileggi il canvas, perché potrei aver ritoccato l'artboard, e scrivi la sezione «Direzione» di `DESIGN.md`. Da qui in poi prosegui fino alla Fase 6 senza altre soste.

### Fase 3: fondamenta

- Definisci i token in un unico punto, con il meccanismo che il progetto usa già (variabili CSS, tema del framework). Se non ne ha uno, usa variabili CSS su `:root`. Servono: colori con ruoli (sfondo, superficie, testo, bordo, primario, stati), scala tipografica, spaziature, raggi, ombre, durate e curve del movimento.
- Riporta i valori nella sezione «Token» di `DESIGN.md`.
- Ricostruisci prima gli elementi condivisi: pulsanti, campi, link, card, intestazioni e la cornice comune delle finestre (sfondo oscurato, contenitore, titolo, chiusura). Le schermate li riusano.

### Fase 4: schermate e finestre

Una alla volta, nell'ordine dei flussi. Quelle che non erano nel canvas derivano dagli stessi token e componenti. Per ognuna:

- copri tutti gli stati dell'inventario, più hover, focus, premuto e disabilitato degli elementi interattivi;
- verifica a 360, 768 e 1280 px di larghezza;
- guardala renderizzata nel browser e ripeti il flusso che la attraversa, per confermare che funziona come prima e che la console non mostra errori;
- spunta la voce in `DESIGN.md`.

Non considerare finita una schermata che non hai visto renderizzata. Se non hai modo di vederla, dillo e indicami cosa controllare.

### Fase 5: animazioni

Si aggiungono quando layout e stile sono stabili, seguendo le «Regole per le animazioni». Da coprire:

- passaggio da una schermata all'altra;
- apertura e chiusura di ogni finestra;
- elementi che entrano, escono o cambiano posto in elenchi e griglie;
- risposta di pulsanti, campi e controlli;
- caricamenti, conferme ed errori;
- uno o due momenti distintivi nei punti più importanti dell'app, per esempio il completamento dell'azione principale.

### Fase 6: verifica e chiusura

- Ripercorri tutti i flussi dall'inizio alla fine ed esegui i test, se esistono.
- Ricontrolla ogni schermata con `prefers-reduced-motion: reduce` attivo e usando solo la tastiera.
- Elimina stili, classi e risorse rimasti inutilizzati.
- Scrivimi un resoconto: cosa è cambiato, come vederlo, ipotesi fatte, proposte in sospeso.
- Proponimi una versione ridotta di questo file che tenga solo le due sezioni di regole, aggiunga i comandi del progetto e importi `DESIGN.md` con la riga `@DESIGN.md`.

## Regole per la grafica

- Ogni scelta deve avere un motivo nel contesto dell'app. Se una soluzione andrebbe bene identica per un'app qualsiasi, cercane una più specifica.
- Ogni schermata ha una sola azione principale, riconoscibile a colpo d'occhio. Il resto è visivamente secondario.
- Colori, misure e tempi vengono dai token: nessun valore scritto a mano nei singoli componenti.
- Al massimo due famiglie di caratteri. I campi di input non scendono sotto i 16 px, altrimenti iOS ingrandisce la pagina al tocco.
- Contrasto minimo 4.5:1 per il testo, 3:1 per testo grande, icone e bordi dei controlli.
- Focus da tastiera sempre visibile. Aree toccabili di almeno 44 × 44 px.
- Ogni finestra si chiude con Esc e con un controllo visibile, e restituisce il focus all'elemento che l'ha aperta.
- Stati vuoti ed errori dicono cosa fare dopo e offrono l'azione per farlo.
- Una sola famiglia di icone, in SVG.
- Layout fluido da 360 px in su, senza scorrimento orizzontale.

## Regole per le animazioni

- Ogni animazione serve a una di queste cose: mostrare da dove arriva o dove va un elemento, confermare un'azione, accompagnare un cambio di stato, attirare l'attenzione una volta sola. Il movimento solo decorativo è riservato ai momenti distintivi.
- Il carattere del movimento (sobrio, morbido, energico) deriva dalla direzione approvata e si esprime nelle curve, non allungando i tempi.
- Durate: 100–200 ms per le risposte dei controlli, 200–350 ms per finestre e pannelli, fino a 400 ms per i passaggi tra schermate. L'uscita dura meno dell'entrata.
- Curve: decelerazione per ciò che entra, accelerazione per ciò che esce, lineare solo per avanzamenti continui.
- Una finestra si apre dal punto che l'ha generata (il menu dal suo pulsante, il pannello dal suo bordo) e si chiude lungo lo stesso percorso.
- Per spostamenti e ridimensionamenti anima `transform` e `opacity`; i cambi di colore vanno bene. Larghezza, altezza, margini e posizione ricalcolano il layout a ogni fotogramma e scattano sui dispositivi lenti: non animarli.
- L'interfaccia resta utilizzabile mentre qualcosa si muove: nessuna azione aspetta la fine di un'animazione.
- Caricamenti: nessun indicatore sotto i 300 ms di attesa; oltre, uno scheletro con la forma del contenuto in arrivo.
- Con `prefers-reduced-motion: reduce` gli spostamenti diventano dissolvenze brevi o spariscono.
- Usa transizioni e animazioni CSS, e la View Transitions API dove il browser la supporta. Una libreria di animazione si usa solo se il progetto la include già.

## Confini del redesign

Rientra nel redesign, fallo senza chiedere:

- modificare markup, struttura dei componenti e fogli di stile quanto serve;
- ridisporre gli elementi di una schermata o spostarli in schede, pannelli e finestre, purché ogni funzione resti raggiungibile;
- sostituire `alert`, `confirm` e `prompt` nativi del browser con finestre disegnate che danno lo stesso esito, usando l'elemento `<dialog>` o il componente per le finestre che il progetto ha già;
- aggiungere gli stati visivi mancanti (vuoto, caricamento, errore, conferma);
- aggiungere font web, al massimo due famiglie, con `font-display: swap`.

Non rientra: non farlo, annota la proposta in «Decisioni e ipotesi» e riportala nel resoconto finale:

- cambiare logica, dati, chiamate di rete, indirizzi delle pagine, nomi dei campi, validazioni;
- aggiungere funzioni (tema scuro, impostazioni, pagine nuove);
- aggiungere dipendenze di codice, cambiare framework o sistema di stili;
- riscrivere i testi dell'interfaccia, che restano nella lingua e nel contenuto attuali.

Sempre:

- mantieni id, attributi `data-*` e classi a cui si agganciano script o test;
- se il progetto è sotto git, lavora su un branch `redesign`, fai un commit alla fine di ogni fase e di ogni schermata e non fare push. Se non è sotto git, segnalalo nel messaggio della Fase 2: senza cronologia le modifiche non si possono annullare.
