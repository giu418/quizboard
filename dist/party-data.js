const partyDebug = new URLSearchParams(window.location.search).get("debug") === "1";
const partyStorage = partyDebug ? "quizboard-party-debug-v1" : "quizboard-party-v1";
const partyVersion = 2;
const partyRounds = [
  { id: "mime", title: "Cinema muto", short: "Mima", icon: "✦", format: "45 secondi", summary: "Mima il titolo di un film.", rules: "A turno, un giocatore guarda il titolo in privato e lo mima senza parlare. La squadra ha 45 secondi per indovinare più film possibile. Ogni titolo indovinato vale un punto.", seconds: 45, hand: 8 },
  { id: "quiz", title: "Tabellone quiz", short: "Quiz", icon: "▦", format: "1–5 punti", summary: "Gioca tutte le caselle del tabellone.", rules: "Le squadre scelgono a turno una casella da 1 a 5 punti, fino a esaurire il tabellone. Una risposta esatta aggiunge il valore, una sbagliata lo sottrae." },
  { id: "song", title: "La parola mancante", short: "Musica", icon: "♫", suspended: true },
  { id: "flash", title: "Vero o falso lampo", short: "Lampo", icon: "ϟ", format: "60 secondi", summary: "Rispondi prima che scada il tempo.", rules: "Ogni squadra ha 60 secondi. Una risposta corretta vale +1, una sbagliata −1. Si può passare senza perdere punti.", seconds: 60, hand: 16 },
  { id: "proverbs", title: "Proverbi al volo", short: "Proverbi", icon: "❞", format: "60 secondi", summary: "Completa otto proverbi di fila.", rules: "La squadra ha 60 secondi per completare otto proverbi di fila. Al primo errore ricomincia dal primo proverbio con il tempo che resta. L’intera sequenza vale 8 punti.", seconds: 60, hand: 8 },
  { id: "list", title: "La sfida delle liste", short: "Liste", icon: "☷", format: "20 risposte", summary: "Trova risposte alla categoria.", rules: "Le squadre si alternano e nominano una risposta valida non ancora data oppure passano. Ogni risposta valida vale un punto. La manche termina quando tutte le risposte sono state trovate o tutte le squadre passano consecutivamente." },
];

const listCategories = [
  { it: "Capitali europee", en: "European capitals", answers: [
    ["Roma","Rome"],["Parigi","Paris"],["Londra","London"],["Berlino","Berlin"],["Madrid","Madrid"],["Lisbona","Lisbon"],["Vienna","Vienna"],["Praga","Prague"],["Varsavia","Warsaw"],["Atene","Athens"],["Dublino","Dublin"],["Oslo","Oslo"],["Stoccolma","Stockholm"],["Helsinki","Helsinki"],["Copenaghen","Copenhagen"],["Bruxelles","Brussels"],["Amsterdam","Amsterdam"],["Budapest","Budapest"],["Bucarest","Bucharest"],["Zagabria","Zagreb"]
  ] },
  { it: "Elementi chimici", en: "Chemical elements", answers: [
    ["Idrogeno","Hydrogen"],["Elio","Helium"],["Litio","Lithium"],["Carbonio","Carbon"],["Azoto","Nitrogen"],["Ossigeno","Oxygen"],["Fluoro","Fluorine"],["Neon","Neon"],["Sodio","Sodium"],["Magnesio","Magnesium"],["Alluminio","Aluminium"],["Silicio","Silicon"],["Fosforo","Phosphorus"],["Zolfo","Sulfur"],["Cloro","Chlorine"],["Argon","Argon"],["Potassio","Potassium"],["Calcio","Calcium"],["Ferro","Iron"],["Rame","Copper"]
  ] },
  { it: "Animali mammiferi", en: "Mammals", answers: [
    ["Cane","Dog"],["Gatto","Cat"],["Cavallo","Horse"],["Mucca","Cow"],["Pecora","Sheep"],["Capra","Goat"],["Maiale","Pig"],["Leone","Lion"],["Tigre","Tiger"],["Elefante","Elephant"],["Giraffa","Giraffe"],["Zebra","Zebra"],["Orso","Bear"],["Lupo","Wolf"],["Volpe","Fox"],["Delfino","Dolphin"],["Balena","Whale"],["Pipistrello","Bat"],["Canguro","Kangaroo"],["Koala","Koala"]
  ] },
];

function activePartyTeam(party) {
  return (party.round + party.play.turn) % party.teams.length;
}

// I mazzi sono finiti: con molte squadre la mano di ciascuna si accorcia,
// così nessuna carta esce due volte nella stessa serata.
function partyHand(round, teams) {
  if (round.id === "mime") return Math.min(round.hand, Math.floor(mimeCards.length / teams));
  if (round.id === "flash") return Math.min(round.hand, 2 * Math.floor(Math.min(flashTrue.length, flashFalse.length) / teams));
  if (round.id === "proverbs") return Math.min(round.hand, Math.floor(proverbCards.length / teams));
  return round.hand;
}

function timedPartyCard(party, bank) {
  const round = partyRounds[party.round];
  return bank[party.draw[round.id][party.play.turn * partyHand(round, party.teams.length) + party.play.card]];
}

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
