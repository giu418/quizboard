# Quizboard

**Serata giochi** è un gioco da browser per 2–4 squadre. Una persona conduce la partita su uno schermo condiviso. L’ordine predefinito è Riscaldamento, Tabellone quiz, Karaoke, Vero o falso lampo e La sfida delle liste. Prima di iniziare si possono scegliere e ordinare le manche, anche per giocare a un solo gioco. Il riscaldamento assegna 2 o 0 punti direttamente in classifica. Le altre manche assegnano punti per piazzamento e ogni squadra a pari merito riceve tutti i punti del posto condiviso. I progressi si salvano nel browser.

La pagina iniziale mostra la configurazione delle squadre. **Inizia la partita** apre il benvenuto e **Cominciamo** porta alla prima manche. L’interfaccia e i contenuti di gioco sono in italiano.

Per riordinare le manche, trascina la maniglia a tre linee accanto al nome. Da tastiera, seleziona la maniglia e usa **↑** o **↓**.

## Portatile e proiettore

1. Imposta il proiettore come schermo esteso del portatile.
2. Apri Quizboard e premi **Apri schermo giocatori**. Sposta la finestra che si apre sul proiettore e premi **Schermo intero**.
3. Conduci la partita dalla finestra sul portatile. Il proiettore segue domande, video, timer e punteggi. I comandi e le risposte riservate restano nella finestra di chi conduce.

Le due finestre usano lo stesso browser e profilo. Per il Karaoke, l’audio esce una volta sola dal portatile. Se vuoi usare gli altoparlanti del proiettore, selezionali come uscita audio del portatile.

[Apri Quizboard](https://quizboard-mwmkgxy0.muddyterrapin16.chatgpt.site)

Consulta il [changelog](CHANGELOG.md) per le novità.

## Avvio in locale

Dalla radice del repository, avvia il server con Python 3 e apri [localhost:8000](http://127.0.0.1:8000/).

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

## Comandi per chi conduce

Usa **Correggi ultimo inserimento** per tornare alla risposta o al voto appena registrato e inserirlo di nuovo. Puoi farlo anche dai risultati, prima di passare alla manche successiva. Se il turno è a tempo, il conto alla rovescia resta in pausa durante la correzione. I giocatori vedono il turno e i punti aggiornati sul loro schermo.

Durante un turno di **Vero o falso lampo**, con la finestra di Quizboard attiva, registra la risposta della squadra con **V** per «Vero» o **F** per «Falso». Quizboard verifica la risposta e mostra un esito verde se è corretta o rosso se è sbagliata. Premi **P** per passare direttamente alla domanda successiva. Il timer continua durante l’esito.

Per il **Riscaldamento**, scegli **Proverbi** o **Tabelline** per tutte le squadre. Ogni squadra ha 60 secondi per rispondere correttamente a otto domande di fila. Un errore fa ripartire dalla prima domanda e il timer continua. La finestra di chi conduce mostra la risposta.

Per **La sfida delle liste**, imposta il tempo per risposta nella schermata delle squadre. Scegli la categoria, avvia il primo turno e registra le risposte nella finestra di chi conduce. Lo schermo giocatori mostra la squadra di turno, la categoria e il conto alla rovescia. Una risposta valida, un passaggio manuale o la scadenza fanno avanzare il turno e riavviano il timer.

Per **Karaoke**, seleziona uno o più file MP4 dal dispositivo e scegli quale squadra gioca. Alla fine del video si apre la schermata in cui i giudici assegnano da 0 a 5 punti. Puoi anche aprirla con **Vai al voto**. I voti si sommano per determinare il piazzamento nella manche. I video restano nella scheda corrente del browser. Se ricarichi la pagina, selezionali di nuovo.

## Tabellone quiz

Il tabellone ha 30 caselle in sei categorie. Nella **Serata giochi**, prima di mostrare una domanda, ogni squadra può usare una sola carta **Bonus** o **Malus** per manche. La modalità [Solo quiz](http://127.0.0.1:8000/quiz.html) è accessibile tramite il suo indirizzo diretto.

In entrambe le modalità, **Foto famose** ha cinque fotografie storiche, una per difficoltà. La foto appare con la domanda e il credito compare quando viene rivelata la risposta. Il [catalogo Foto famose](FOTO-FAMOSE.md) raccoglie 70 proposte, comprese le cinque foto già nel gioco, e indica lo stato di ciascuna voce.

## Modalità debug

Aggiungi `?debug=1` all’indirizzo della **Serata giochi**. Puoi aprire il [debug in locale](http://127.0.0.1:8000/?debug=1) o il [debug sul sito](https://quizboard-mwmkgxy0.muddyterrapin16.chatgpt.site/?debug=1).

1. Nella schermata delle squadre, premi **Vai a…** per aprire l’introduzione di una delle manche selezionate. Puoi lasciare vuoti i nomi delle squadre per usare quelli predefiniti.
2. Premi **Inizia la manche** oppure scegli una categoria nel **Riscaldamento**. Durante la prova, **Vai a…** permette di saltare a una manche successiva fra quelle selezionate.
3. Usa **Apri schermo giocatori** per provare la proiezione. La finestra si apre con lo stesso parametro di debug.

La modalità debug mostra il riepilogo delle manche all’avvio e l’avanzamento dove disponibile. La partita di prova ha un salvataggio separato dalla partita normale, anche dopo aver ricaricato la pagina. Per tornare alla partita normale, apri l’indirizzo senza `?debug=1`.

## Idee e fonti

Le proposte per le prossime versioni sono in [IDEE.md](IDEE.md). Una parte delle domande del tabellone è adattata dal dataset di Priyanka Sen, Alham Fikri Aji e Amir Saffari. [Mintaka](https://github.com/amazon-science/mintaka) · [Licenza CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
