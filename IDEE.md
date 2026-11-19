# Idee per Serata giochi

## Flusso della serata

- [x] All’avvio di una nuova serata, mostra subito la configurazione delle squadre.
- [x] Permetti a chi conduce di scegliere e ordinare le manche, anche per giocare a una sola.
- [x] Apri il benvenuto con «Inizia la partita» e passa alla prima manche con «Cominciamo».
- [x] Dedica la finestra all’area di gioco durante la manche. Mostra il nome e l’avanzamento all’ingresso e i risultati prima del passaggio alla manche successiva.

## Lingua e conduzione

- [x] Aggiungi il selettore italiano/inglese con le traduzioni dei contenuti di gioco.
- [x] Aggiungi i comandi da tastiera per Vero o falso lampo e le scorciatoie di debug per aprire le manche.
- [x] Mostra il proverbio completo del turno in una scheda separata per chi conduce.

## La sfida delle liste

Manche disponibile tra i giochi della serata. Ogni domanda ha una categoria e una lista di 20 risposte valide. Per esempio, «Paesi con la M».

Le squadre si alternano. Al proprio turno, ciascuna dice una risposta valida che non sia già stata data oppure passa. Il gioco finisce quando si esauriscono le risposte della categoria o quando tutte le squadre passano nello stesso giro.

## Foto famose

- [x] Aggiungi la categoria al tabellone della serata e a Solo quiz con cinque foto, una per difficoltà.
- [x] Prepara il [catalogo da 70 voci](FOTO-FAMOSE.md), con 14 proposte per livello e una selezione di cultura pop italiana. Per le caselle da 4 e 5 punti, usa immagini riconoscibili e domande che possono riguardare il loro contesto.
- [ ] Individua e aggiungi i file per le 65 immagini mancanti.
- [ ] Inserisci le domande del catalogo, comprese le due revisioni per le foto già nel gioco, e prepara le versioni inglesi.
- [ ] Estrai una foto per livello all’avvio e conserva le estrazioni quando si riprende la partita.

## Animazioni e suoni

Aggiungere animazioni ed effetti sonori durante la serata, per esempio quando si apre una casella, scade il timer o si passa alla manche successiva.

## Eventi a sorpresa nel quiz

- [ ] Prevedi eventi casuali che possono aiutare o penalizzare una squadra.

### Carte segrete

- [x] Consenti a ogni squadra di giocare una carta una sola volta, dopo la scelta della casella e prima che venga mostrata la domanda.
- [ ] Valuta un’estrazione privata delle carte a inizio manche.

| Carta | Effetto |
| --- | --- |
| **Sprint** | Sul proprio turno, una risposta esatta vale 2 punti in più. |
| **Scudo** | Sul proprio turno, una risposta sbagliata costa fino a 2 punti in meno. La penalità può scendere a zero. |
| **Pressione** | Sul turno di un’avversaria, se sbaglia perde 2 punti in più. |
| **Freno** | Sul turno di un’avversaria, se indovina guadagna fino a 2 punti in meno. Il guadagno può scendere a zero. |

Si può giocare una sola carta per casella. Se più squadre vogliono giocare una carta, ha la precedenza quella di turno. Chi conduce usa **Bonus** per attivare Sprint o Scudo e consumare la carta della squadra di turno. Usa **Malus** per selezionare l’altra squadra che ha chiamato Pressione o Freno e consumare la carta di quella squadra. L’effetto si applica sempre alla squadra di turno. Il tabellone indica per ogni squadra se la carta è disponibile o quale carta ha usato. Quizboard salva l’uso della carta e calcola il punteggio dopo la risposta.

**Esempio.** Le Comete scelgono una casella da 4 punti. Le Orbite giocano **Pressione**. Se le Comete indovinano, guadagnano 4 punti. Se sbagliano, ne perdono 6.
