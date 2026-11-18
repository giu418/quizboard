// Selected and adapted from Mintaka by Priyanka Sen, Alham Fikri Aji, and
// Amir Saffari (2022). Source IDs from mintaka_train.json appear beside each clue.
// Dataset: https://github.com/amazon-science/mintaka
// License: https://creativecommons.org/licenses/by/4.0/
const mintakaCategories = [
  {
    name: "Geografia",
    symbol: "◎",
    clues: [
      ["Qual è l’oceano più esteso della Terra?", "Oceano Pacifico"], // 65ca020e
      ["Qual è la capitale dell’Australia?", "Canberra"], // 04d34a11
      ["Quale grande isola al largo dell’Africa sudorientale è famosa per i suoi lemuri?", "Madagascar"], // 0feb53b9
      ["Quale fiume attraversa la Russia ed è il più lungo d’Europa?", "Volga"], // e0f8c56d
      ["Dopo Sicilia e Sardegna, qual è la terza isola del Mediterraneo per superficie?", "Cipro"], // 14b9185d
    ],
  },
  {
    name: "Storia",
    symbol: "◷",
    clues: [
      ["Chi fu il primo re di Roma secondo la tradizione?", "Romolo"], // a0e0afee
      ["In quale anno iniziò la Seconda guerra mondiale in Europa?", "1939"], // 19b478f0
      ["Come si chiamava la nave ammiraglia del primo viaggio di Cristoforo Colombo verso le Americhe?", "Santa María"], // 301f5f5e
      ["Quale imperatore romano ordinò la costruzione di un vallo nel nord della Britannia nel II secolo d.C.?", "Adriano"], // dc2e80b8
      ["In che anno cadde Costantinopoli, segnando la fine dell’Impero bizantino?", "1453"], // 90fa8dde
    ],
  },
  {
    name: "Cinema",
    symbol: "✦",
    clues: [
      ["Quale attore interpreta Jack Dawson in «Titanic»?", "Leonardo DiCaprio"], // 2723bb1b
      ["Quale film di Steven Spielberg è tratto dal romanzo sui dinosauri pubblicato da Michael Crichton nel 1990?", "Jurassic Park"], // 4dea8142
      ["In quale capitolo cinematografico del «Signore degli Anelli» muore Gollum?", "Il Signore degli Anelli - Il ritorno del re"], // 15e8a708
      ["Come si intitola l’horror del 1980 diretto da Stanley Kubrick e tratto da un romanzo di Stephen King?", "Shining"], // d31367c1
      ["In quale film di Christopher Nolan Guy Pearce interpreta un uomo che non riesce a formare nuovi ricordi?", "Memento"], // 45ef8aa9
    ],
  },
  {
    name: "Musica",
    symbol: "♫",
    clues: [
      ["Come si chiamava il cantante dei Nirvana?", "Kurt Cobain"], // 0bc96541
      ["Qual è il vero cognome della cantante Madonna?", "Ciccone"], // 680980e3
      ["In che anno è uscito l’album «Thriller» di Michael Jackson?", "1982"], // 07ece6d3
      ["Quale musicista è stato il batterista dei Nirvana e ha fondato i Foo Fighters?", "Dave Grohl"], // e6cab91e
      ["Come si intitola il primo singolo pubblicato dai Beatles nel Regno Unito?", "Love Me Do"], // 75dc5d11
    ],
  },
  {
    name: "Letteratura",
    symbol: "¶",
    clues: [
      ["Chi ha scritto la saga di «Harry Potter»?", "J. K. Rowling"], // 95656d76
      ["Chi ha scritto il romanzo «Frankenstein»?", "Mary Shelley"], // 76b59a03
      ["Qual è il nome del cavallo di Don Chisciotte?", "Ronzinante"], // d0b7a115
      ["Come si chiama il protagonista della «Metamorfosi» di Franz Kafka?", "Gregor Samsa"], // a6a9024e
      ["In quale opera teatrale di Shakespeare compare il mago Prospero?", "La tempesta"], // 11ae02ba
    ],
  },
];
