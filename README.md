# Quizboard

**Serata giochi** è un gioco da browser per 2–6 squadre. Una persona conduce la partita su uno schermo condiviso. I giochi disponibili sono Cinema muto, Tabellone quiz, Vero o falso lampo, Proverbi al volo e La sfida delle liste. Prima di iniziare si possono scegliere e ordinare le manche, anche per giocare a un solo gioco. Al termine di ogni manche si assegnano punti per piazzamento e i progressi si salvano nel browser.

La pagina iniziale mostra la configurazione delle squadre. **Inizia la partita** apre il benvenuto e **Cominciamo** porta alla prima manche. Il selettore **IT/EN** cambia lingua per l’interfaccia e i contenuti di gioco.

[Apri Quizboard](https://quizboard-mwmkgxy0.muddyterrapin16.chatgpt.site)

## Avvio in locale

Dalla radice del repository, avvia il server con Python 3 e apri [localhost:8000](http://127.0.0.1:8000/).

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

## Comandi per chi conduce

Durante un turno di **Vero o falso lampo**, con la finestra di Quizboard attiva, registra la risposta della squadra con **V** per «Vero» o **F** per «Falso». Quizboard verifica la risposta e mostra un esito verde se è corretta o rosso se è sbagliata. Premi **P** per passare direttamente alla domanda successiva. Il timer continua durante l’esito.

Per **Proverbi al volo**, apri [la scheda del giudice](http://127.0.0.1:8000/giudice.html) in una seconda scheda dello stesso browser e sullo stesso indirizzo della partita. Mostra il proverbio completo del turno.

## Tabellone quiz

Il tabellone ha 30 caselle in sei categorie. Nella **Serata giochi**, prima di mostrare una domanda, ogni squadra può usare una sola carta **Bonus** o **Malus** per manche. La modalità [Solo quiz](http://127.0.0.1:8000/quiz.html) è accessibile anche dalla pagina iniziale.

In entrambe le modalità, **Foto famose** ha cinque fotografie storiche, una per difficoltà. La foto appare con la domanda e il credito compare quando viene rivelata la risposta. Il [catalogo Foto famose](FOTO-FAMOSE.md) raccoglie 70 proposte, comprese le cinque foto già nel gioco, e indica lo stato di ciascuna voce.

## Modalità debug

Aggiungi `?debug=1` all’indirizzo della **Serata giochi**. Puoi aprire il [debug in locale](http://127.0.0.1:8000/?debug=1) o il [debug sul sito](https://quizboard-mwmkgxy0.muddyterrapin16.chatgpt.site/?debug=1).

1. Nella schermata delle squadre, premi **Vai a…** per aprire l’introduzione di una delle manche selezionate. Puoi lasciare vuoti i nomi delle squadre per usare quelli predefiniti.
2. Premi **Inizia la manche** per provarla. Durante la prova, **Vai a…** permette di saltare a una manche successiva fra quelle selezionate.
3. Per **Proverbi al volo**, usa il pulsante **Apri la scheda del giudice** nella manche. Il link apre la scheda con lo stesso parametro di debug.

La modalità debug mostra il riepilogo delle manche all’avvio e l’avanzamento dove disponibile. La partita di prova ha un salvataggio separato dalla partita normale, anche dopo aver ricaricato la pagina. Per tornare alla partita normale, apri l’indirizzo senza `?debug=1`.

## Idee e fonti

Le proposte per le prossime versioni sono in [IDEE.md](IDEE.md). Una parte delle domande del tabellone è adattata dal dataset di Priyanka Sen, Alham Fikri Aji e Amir Saffari. [Mintaka](https://github.com/amazon-science/mintaka) · [Licenza CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
