# Quizboard

**Serata giochi** è un gioco da browser per 2–4 squadre. Una persona conduce la partita su uno schermo condiviso. Le manche attive sono Cinema muto, Tabellone quiz, Vero o falso lampo e Proverbi al volo. Al termine di ogni manche si assegnano punti per piazzamento e i progressi si salvano nel browser.

[Apri Quizboard](https://quizboard-mwmkgxy0.muddyterrapin16.chatgpt.site)

## Avvio in locale

Dalla radice del repository, avvia il server con Python 3 e apri [localhost:8000](http://127.0.0.1:8000/).

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

## Idee e fonti

Le proposte per le prossime versioni sono in [IDEE.md](IDEE.md). Le domande del tabellone sono adattate dal dataset [Mintaka](https://github.com/amazon-science/mintaka) di Priyanka Sen, Alham Fikri Aji e Amir Saffari, distribuito con licenza [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
