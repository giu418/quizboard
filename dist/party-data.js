const partyRounds = [
  { id: "mime", title: "Cinema muto", short: "Mima", icon: "✦", format: "45 secondi", summary: "Mima il titolo di un film.", rules: "A turno, un giocatore guarda il titolo in privato e lo mima senza parlare. La squadra ha 45 secondi per indovinare più film possibile. Ogni titolo indovinato vale un punto.", seconds: 45, hand: 8 },
  { id: "quiz", title: "Tabellone quiz", short: "Quiz", icon: "▦", format: "1–5 punti", summary: "Scegli una categoria e una casella.", rules: "Ogni squadra sceglie due caselle, una per giro. Scegli una casella da 1 a 5 punti. Una risposta esatta aggiunge il valore, una sbagliata lo sottrae." },
  { id: "song", title: "La parola mancante", short: "Musica", icon: "♫", format: "5 parole", summary: "Ascolta e completa il testo.", rules: "Tutte le squadre ascoltano lo stesso estratto. Scrivono su carta le cinque parole mancanti, numerate. Quando hanno consegnato, chi conduce rivela le risposte e segna un punto per ogni parola giusta." },
  { id: "flash", title: "Vero o falso lampo", short: "Lampo", icon: "ϟ", format: "60 secondi", summary: "Rispondi prima che scada il tempo.", rules: "Ogni squadra ha 60 secondi. Una risposta corretta vale +1, una sbagliata −1. Si può passare senza perdere punti.", seconds: 60, hand: 16 },
  { id: "proverbs", title: "Proverbi al volo", short: "Proverbi", icon: "❞", format: "45 secondi", summary: "Finisci un proverbio dopo l’altro.", rules: "Completa a voce più proverbi possibile in 45 secondi. Chi conduce può mostrare la soluzione e accettare le varianti comuni. Ogni proverbio completato vale un punto.", seconds: 45, hand: 10 },
];

const mimeCards = [
  "Titanic", "Il re leone", "Jurassic Park", "Alla ricerca di Nemo", "Spider-Man", "Frozen", "Ghostbusters", "King Kong",
  "Ritorno al futuro", "Edward mani di forbice", "Harry Potter e la pietra filosofale", "Ratatouille", "Rocky", "Shrek", "Il gladiatore", "Pirati dei Caraibi",
  "E.T. l’extra-terrestre", "Mamma, ho perso l’aereo", "Madagascar", "WALL·E", "La sirenetta", "Kung Fu Panda", "Jumanji", "Indiana Jones e i predatori dell’arca perduta",
  "Toy Story", "Il pianeta delle scimmie", "Lo squalo", "La bella e la bestia", "Mary Poppins", "Alice nel Paese delle meraviglie", "Il libro della giungla", "Monsters & Co.",
  "La fabbrica di cioccolato", "Cars - Motori ruggenti", "Cenerentola", "Il mago di Oz", "Il Grinch", "Mission: Impossible", "Hunger Games",
];

const flashTrue = [
  "La capitale del Portogallo è Lisbona.",
  "L’acqua allo stato solido è ghiaccio.",
  "Il centro della Terra si chiama nucleo.",
  "Gli squali sono pesci.",
  "Saturno ha un sistema di anelli.",
  "L’alfabeto greco inizia con alfa.",
  "Una partita di pallavolo si può vincere in tre set.",
  "La clorofilla contribuisce al colore verde delle foglie.",
  "La Tour Eiffel si trova a Parigi.",
  "Oslo è la capitale della Norvegia.",
  "L’oceano Atlantico bagna il Portogallo.",
  "Un polpo ha otto braccia.",
  "Le api comunicano anche tramite danze.",
  "Il simbolo chimico dell’oro è Au.",
  "Dante ha scritto la Divina Commedia.",
  "I fulmini possono colpire due volte lo stesso punto.",
  "La tastiera di un pianoforte comprende tasti neri.",
  "La Terra impiega circa un anno a orbitare intorno al Sole.",
  "Frida Kahlo era messicana.",
  "Le giraffe sono mammiferi.",
  "In Italia, il 25 aprile si celebra la Liberazione.",
  "Il Cile confina con l’Argentina.",
  "Il Colosseo si trova a Roma.",
  "Una dozzina corrisponde a dodici unità.",
  "Una calamita ha un polo nord e un polo sud.",
  "I canguri appartengono ai marsupiali.",
  "La Gioconda è esposta al Louvre.",
  "La Sicilia è più grande della Sardegna.",
  "La luce arriva prima del suono durante un temporale.",
  "Un quadrato ha quattro angoli retti.",
  "L’Adige passa per Verona.",
  "Nel semaforo stradale italiano il verde viene dopo il rosso.",
  "Mercurio è il pianeta più vicino al Sole.",
  "Pablo Picasso è nato in Spagna.",
  "Il guacamole si prepara con l’avocado.",
  "Nel gioco degli scacchi si inizia con otto pedoni per lato.",
];

const flashFalse = [
  "Il Monte Bianco si trova sugli Appennini.",
  "Il simbolo chimico del ferro è F.",
  "Il Marocco si trova in Asia.",
  "Un triangolo ha quattro lati.",
  "La capitale della Svizzera è Zurigo.",
  "I pipistrelli sono uccelli.",
  "Il ghiaccio è più denso dell’acqua liquida.",
  "Il violino ha di norma sei corde.",
  "Londra è attraversata dalla Senna.",
  "Il treno fu inventato dopo l’aeroplano.",
  "La tigre è originaria dell’Antartide.",
  "Novembre ha 31 giorni.",
  "Per fare il pane, il lievito serve a raffreddare l’impasto.",
  "Madrid è una città costiera.",
  "Nella pallacanestro un tiro libero vale tre punti.",
  "La balenottera azzurra è un pesce.",
  "Una settimana dura otto giorni.",
  "Gli esagoni hanno sette lati.",
  "L’Everest si trova nelle Alpi.",
  "Il capoluogo della Puglia è Lecce.",
  "Le tartarughe sono anfibi.",
  "Il caffè decaffeinato si ottiene con semi di cacao.",
  "La Guinness è una birra originaria del Belgio.",
  "Il tasto Invio si usa per scrivere le lettere maiuscole.",
  "Il violoncello si suona soffiando in un bocchino.",
  "Il rosmarino è un cereale.",
  "Il Lago di Garda bagna la Toscana.",
  "Nell’emisfero nord, agosto cade in inverno.",
  "Il pinguino imperatore sa volare.",
  "In un orologio di 12 ore, le lancette coincidono alle tre in punto.",
  "La capitale del Giappone è Kyoto.",
  "Il panda gigante si nutre soprattutto di eucalipto.",
  "Il Foro Romano si trova a Milano.",
  "La parola «radar» perde la lettera iniziale se la si legge al contrario.",
  "La gomma arabica si ricava dalle alghe.",
  "Un’ottava musicale abbraccia tre semitoni.",
];

const proverbCards = [
  ["Chi dorme…", "non piglia pesci"], ["Tra il dire e il fare…", "c’è di mezzo il mare"],
  ["Meglio soli…", "che male accompagnati"], ["Chi la fa…", "l’aspetti"],
  ["Il lupo perde il pelo…", "ma non il vizio"], ["A caval donato…", "non si guarda in bocca"],
  ["Chi va piano…", "va sano e va lontano"], ["Gallina vecchia…", "fa buon brodo"],
  ["Ride bene…", "chi ride ultimo"], ["Una rondine…", "non fa primavera"],
  ["Chi trova un amico…", "trova un tesoro"], ["Non è tutto oro…", "quel che luccica"],
  ["L’unione…", "fa la forza"], ["L’erba del vicino…", "è sempre più verde"],
  ["Il mattino…", "ha l’oro in bocca"], ["Chi di spada ferisce…", "di spada perisce"],
  ["Gatto scottato…", "teme l’acqua fredda"], ["Tanto va la gatta al lardo…", "che ci lascia lo zampino"],
  ["Chi semina vento…", "raccoglie tempesta"], ["Sbagliando…", "s’impara"],
  ["La gatta frettolosa…", "fa i gattini ciechi"], ["A buon intenditor…", "poche parole"],
  ["Paese che vai…", "usanza che trovi"], ["Chi troppo vuole…", "nulla stringe"],
  ["Occhio per occhio…", "dente per dente"], ["Acqua passata…", "non macina più"],
  ["Una mela al giorno…", "toglie il medico di torno"], ["Finché c’è vita…", "c’è speranza"],
  ["Tutte le strade…", "portano a Roma"], ["Il tempo…", "è denaro"],
  ["Rosso di sera…", "bel tempo si spera"], ["Finito il gioco…", "il re e il pedone tornano nella stessa scatola"],
  ["Chi fa da sé…", "fa per tre"], ["A mali estremi…", "estremi rimedi"],
  ["Batti il ferro…", "finché è caldo"], ["La lingua batte…", "dove il dente duole"],
  ["Quando il gatto non c’è…", "i topi ballano"], ["Meglio un uovo oggi…", "che una gallina domani"],
  ["Chi non risica…", "non rosica"], ["L’abito…", "non fa il monaco"],
  ["Fidarsi è bene…", "non fidarsi è meglio"], ["Buon sangue…", "non mente"],
  ["Non c’è due…", "senza tre"], ["L’ospite è come il pesce…", "dopo tre giorni puzza"],
  ["La notte…", "porta consiglio"], ["Patti chiari…", "amicizia lunga"],
  ["Campa cavallo…", "che l’erba cresce"], ["Chi disprezza…", "compra"],
];

const songCards = [
  {
    recording: "audio/estratto-1.mp3",
    title: "La donna è mobile",
    attribution: "Enrico Caruso, 1908 · Giuseppe Verdi e Francesco Maria Piave",
    source: "https://commons.wikimedia.org/wiki/File:La_Donna_E_Mobile_Rigoletto.ogg",
    lines: ["La # è #", "Qual # al #", "Muta #"],
    answers: ["donna", "mobile", "piuma", "vento", "d’accento"],
  },
  {
    recording: "audio/estratto-2.mp3",
    title: "Una furtiva lagrima",
    attribution: "Enrico Caruso e Salvatore Cottone, 1902 · Gaetano Donizetti e Felice Romani",
    source: "https://commons.wikimedia.org/wiki/File:Una_furtiva_lagrima_(1902).opus",
    lines: ["Una # #", "negli # suoi #", "quelle # giovani…"],
    answers: ["furtiva", "lagrima", "occhi", "spuntò", "festose"],
  },
];

// Adapted from the Italian Mintaka train split (CC BY 4.0). Source IDs follow each clue.
const quizAlternates = [
  [
    ["In quale Paese si trova Parigi?", "Francia"], // cbc2ab99
    ["Quale catena montuosa fa da confine naturale tra Francia e Italia?", "Le Alpi"], // 9b586b9c
    ["Qual è la montagna più alta del Giappone?", "Il monte Fuji"], // a1669d51
    ["Dopo il Volga, qual è il secondo fiume più lungo d’Europa?", "Il Danubio"], // 83ba2958
    ["Qual è la vetta più alta della Germania, al confine con l’Austria?", "Lo Zugspitze"], // a9d76f10
  ],
  [
    ["In che anno finì la Seconda guerra mondiale?", "1945"], // 440191d2
    ["Chi fu l’ultima sovrana della dinastia tolemaica in Egitto?", "Cleopatra"], // ff2fd46f
    ["Chi era il primo ministro britannico per gran parte della Seconda guerra mondiale?", "Winston Churchill"], // e5b27973
    ["Chi conquistò l’Egitto nel 332 a.C.?", "Alessandro Magno"], // 9a46a2e8
    ["In che anno Giulio Cesare attraversò il Rubicone?", "49 a.C."], // c001421b
  ],
  [
    ["Chi interpreta Rocky Balboa nella saga «Rocky»?", "Sylvester Stallone"], // f2cdb7d1
    ["Come si chiama il personaggio di Keanu Reeves in «Matrix»?", "Neo"], // a60a4310
    ["Chi ha diretto i tre film di «Ritorno al futuro»?", "Robert Zemeckis"], // 4ed5001f
    ["Quale film in bianco e nero di Steven Spielberg ha Liam Neeson nel ruolo di Oskar Schindler?", "Schindler’s List - La lista di Schindler"], // c45b0110
    ["Come si chiama la costumista della trilogia originale di «Matrix»?", "Kym Barrett"], // d9dbe6d7
  ],
  [
    ["Chi è la voce storica dei Rolling Stones?", "Mick Jagger"], // 7f3a6a83
    ["Quale genere musicale hanno contribuito a definire i Black Sabbath?", "Heavy metal"], // 61313bf8
    ["Quale supereroe dà il titolo a un film del 1989 per cui Prince ha inciso un album?", "Batman"], // 1cf7a1ec
    ["Quale album di David Bowie è uscito nel 2016, poco prima della sua morte?", "Blackstar"], // e54053ff
    ["Quale musicista dei Rolling Stones compare nel film «Pirati dei Caraibi - Ai confini del mondo»?", "Keith Richards"], // 12cfbc52
  ],
  [
    ["In quale città vive Sherlock Holmes?", "Londra"], // de8a5f4e
    ["Chi ha scritto «Moby Dick»?", "Herman Melville"], // 8ae9625d
    ["In quale romanzo George Orwell racconta la ribellione degli animali di una fattoria?", "La fattoria degli animali"], // 67efb0d5
    ["Quale albero il Piccolo Principe teme possa invadere il suo pianeta?", "Il baobab"], // 4d5e184a
    ["In quale anno uscì il primo romanzo del ciclo di «Dune»?", "1965"], // 78e14eee
  ],
];
