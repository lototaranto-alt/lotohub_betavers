// Whisper L.O.T.O. HUB - SSOT narrativo.
// Regole (skill gamification_designer):
//  - Crescita e sblocco Whisper dipendono SOLO dall'XP (esplorazione anticongestione).
//  - VIETATO: Bronzo/Argento/Oro e ogni riferimento ai PTI come leva di crescita.
//  - Nessun Prestigio: max 50 livelli, mai azzerare.
//  - Tier: 1-10 Il Risveglio del Seme, 11-20 Le Radici Sommerse, 21-30 La Linfa Vitale,
//          31-40 Il Respiro Urbano, 41-50 La Fioritura del Loto.
export type LocalizedLore = {
  it: string;
  en: string;
};

export const LEVEL_UP_LORE: Record<number, LocalizedLore> = {
  1: {
    it: "Benvenuto a Taranto. Il tuo primo passo non è un semplice tracciato sulla mappa: è il seme che sto per affidare alla terra. Da oggi ogni scansione è un germoglio: inizia a esplorare ciò che ti circonda.",
    en: "Welcome to Taranto. Your first step is not a simple track on the map: it is the seed I am about to entrust to the earth. From today every scan is a sprout: begin to explore what surrounds you."
  },
  2: {
    it: "La città ha aperto la sua voce. Eventi e Comunità ora ti appartengono: le voci degli altri viaggiatori si uniscono alla tua, come acque che imparano a scorrere insieme.",
    en: "The city has opened its voice. Events and Community now belong to you: the voices of other travelers join yours, like waters learning to flow together."
  },
  3: {
    it: "Ogni rotta è una firma sul territorio. Hai sbloccato la creazione di percorsi: disegnali lontano dalla folla e quel che troverai lungo il cammino non lo troverà nessun altro.",
    en: "Every route is a signature on the territory. You have unlocked route creation: draw them far from the crowds and what you find along the way no one else will find."
  },
  4: {
    it: "L'acqua è la memoria di questo golfo. Cerca la tua prima fontanella: compiere un Refill è il primo patto di rispetto con il mare, e le sue sorgenti lo ricorderanno.",
    en: "Water is the memory of this gulf. Seek your first drinking fountain: making a Refill is the first pact of respect with the sea, and its springs will remember."
  },
  5: {
    it: "Hai registrato la prima metrica di CO₂ risparmiata. Non è un numero: è la prova che la città respira in modo diverso quando scegli di muoverti in leggerezza.",
    en: "You have recorded your first metric of saved CO₂. It is not a number: it is the proof that the city breathes differently when you choose to move lightly."
  },
  6: {
    it: "I lucchetti che vedi sui luoghi storici non sono limiti, ma promesse. Ogni traguardo sblocca una nuova pagina della nostra memoria: continua a cercare, le porte si aprono a chi bussa con costanza.",
    en: "The locks you see on historical sites are not limits, but promises. Every milestone unlocks a new page of our memory: keep seeking, doors open to those who knock with constancy."
  },
  7: {
    it: "Sotto la superficie la tua identità si sta tessendo, filo dopo filo. Ogni esplorazione lascia un'eco visibile nella rete del progetto: i tuoi traguardi ci stanno già rendendo riconoscibili l'uno all'altro.",
    en: "Just beneath the surface your identity is weaving itself, thread after thread. Every exploration leaves a visible echo in the project's network: your milestones are already making us recognizable to one another."
  },
  8: {
    it: "Esplora, mappa, proteggi. Con i tuoi traguardi è compiuto il passaggio da semplice visitatore a custode attivo del nostro ecosistema: ora il territorio sa il tuo nome.",
    en: "Explore, map, protect. With your milestones, the passage from simple visitor to active guardian of our ecosystem is complete: now the territory knows your name."
  },
  9: {
    it: "Il primo grande traguardo è vicino e la tua rotta lo ha già alleggerito. Hai scelto percorsi meno battuti e la città se n'è accorta: preparati a distinguerti tra i fondatori di questa mappa.",
    en: "The first great milestone is near and your route has already lightened it. You chose less beaten paths and the city noticed: prepare to stand out among the founders of this map."
  },
  10: {
    it: "Il Risveglio del Seme è compiuto: hai attraversato i primi dieci livelli di esperienza e la tua voce ora ha un nome. Il mare ti chiama: le Radici Sommerse aspettano il tuo respiro.",
    en: "The Awakening of the Seed is complete: you have crossed the first ten levels of experience and your voice now has a name. The sea is calling you: the Hidden Roots await your breath."
  },
  11: {
    it: "Le Radici Sommerse ti accolgono. Taranto respira attraverso i suoi due mari e tu hai imparato il ritmo del suo respiro. Ora il viaggio scende in profondità, verso la nostra risorsa più preziosa.",
    en: "The Hidden Roots welcome you. Taranto breathes through its two seas and you have learned the rhythm of its breath. Now the journey dives deep, toward our most precious resource."
  },
  12: {
    it: "Cammina con rispetto sulla terra degli Iapigi. La bellezza millenaria di questo territorio si difende riducendo l'impatto di ogni passo: la vera grandezza risiede nella cura.",
    en: "Walk with respect through the land of the Iapigi. The ancient beauty of this territory is defended by reducing the impact of every step: true greatness lies in care."
  },
  13: {
    it: "Segui la tua bussola interiore come l'Oracolo guidò i coloni verso Taras. Ogni tua esplorazione, ogni scelta quotidiana, diventa una meta precisa: la rotta sei tu.",
    en: "Follow your inner compass as the Oracle once guided the colonists toward Taras. Every exploration, every daily choice, becomes a precise destination: you are the route."
  },
  14: {
    it: "Cammina con la determinazione di chi riscrive la storia. Come gli antichi coloni, non temere di deviare dalle rotte comuni: le leggende nascono sempre fuori strada.",
    en: "Walk with the determination of those who rewrite history. Like the ancient colonists, do not fear straying from common routes: legends are always born off the beaten path."
  },
  15: {
    it: "I Parteni scelsero il coraggio di ricominciare da zero quando la patria voltò loro le spalle. Anche tu puoi trovare la tua strada oltre i limiti e tracciare una nuova rotta di impatto.",
    en: "The Partenians chose the courage to start over when their homeland turned its back on them. You too can find your way beyond limits and chart a new route of impact."
  },
  16: {
    it: "Hai scoperto la forza dei Citri, le sorgenti nascoste che nutrono il golfo. Come loro, ogni tua scelta sostenibile porta linfa vitale all'economia della nostra comunità.",
    en: "You have discovered the strength of the Citri, the hidden springs that nourish the gulf. Like them, your every sustainable choice brings vital energy to the economy of our community."
  },
  17: {
    it: "Ogni Refill è uno scudo forgiato contro la plastica. Dissetati alle nostre storiche fontanelle: è il gesto di una comunità che ha scelto, insieme, la purezza.",
    en: "Every Refill is a shield forged against plastic. Quench your thirst at our historic fountains: it is the gesture of a community that has chosen, together, purity."
  },
  18: {
    it: "Non seguire la corrente: guidala. Le tue esplorazioni si stanno trasformando in un impatto reale e misurabile per la città. Continua a tracciare rotte lontane dalla folla.",
    en: "Do not follow the current: guide it. Your explorations are transforming into a real, measurable impact for the city. Keep charting routes far from the crowds."
  },
  19: {
    it: "Tra il Mar Grande e il Mar Piccolo regna un equilibrio perfetto. È lo stesso che stai creando tu: bilanciando i flussi, rispettando i ritmi, rendendo leggero ogni tuo spostamento.",
    en: "Between the Mar Grande and the Mar Piccolo there reigns a perfect balance. It is the same one you are creating: balancing flows, respecting rhythms, making every move of yours light."
  },
  20: {
    it: "Come gli artigiani della Magna Grecia, ogni tuo gesto virtuoso è un piccolo capolavoro che arricchisce la comunità. La Linfa Vitale comincia a scorrere: la tua maestria serve la città.",
    en: "Like the artisans of Magna Graecia, your every virtuous gesture is a small masterpiece that enriches the community. The Vital Sap begins to flow: your mastery now serves the city."
  },
  21: {
    it: "Sotto la superficie qualcosa di luminoso si sta destando. Metà del percorso è compiuta: le tue metriche di CO₂ risparmiata sono un tributo tangibile e silenzioso al nostro mare.",
    en: "Beneath the surface something luminous is waking. Half the journey is complete: your metrics of saved CO₂ are a tangible, silent tribute to our sea."
  },
  22: {
    it: "Un vero esploratore non lascia tracce, lascia un'eredità. La tua presenza silente sta alzando lo standard dell'accoglienza tarantina, come un faro acceso che non chiede nulla in cambio.",
    en: "A true explorer leaves no traces, but a legacy. Your silent presence is raising the standard of Taranto's hospitality, like a lit beacon that asks for nothing back."
  },
  23: {
    it: "Le Radici Sommerse sono ormai parte di te. Sai leggere la città non come una semplice mappa, ma come un ecosistema vivente che respira e chiede di essere custodito.",
    en: "The Hidden Roots are now part of you. You know how to read the city not as a simple map, but as a living ecosystem that breathes and asks to be guarded."
  },
  24: {
    it: "La Linfa Vitale attraversa ogni vicolo e ogni tua scelta diventa un ramo che si estende. La transizione è imminente: sta per iniziare il tuo dialogo più profondo con la città.",
    en: "The Vital Sap runs through every alley and each of your choices becomes a branch reaching out. The transition is imminent: your deepest dialogue with the city is about to begin."
  },
  25: {
    it: "Tesoro dopo tesoro, il tuo cammino illumina le acque. Hai protetto le nostre radici e le nostre onde: la Linfa Vitale ti ha reso custode di ciò che non si vede ma sostiene tutto.",
    en: "Treasure after treasure, your path lights up the waters. You have protected our roots and our waves: the Vital Sap has made you the guardian of what cannot be seen yet sustains everything."
  },
  26: {
    it: "Sotto i tuoi piedi pulsa una città invisibile. Il Borgo Nuovo sorge sui segreti della necropoli magnogreca: discendi nel silenzio di cripte e tombe millenarie per svelare l'antico cuore nascosto di Taras.",
    en: "Beneath your feet pulses an invisible city. The Borgo Nuovo stands on the secrets of the Magna Graecia necropolis: descend into the silence of ancient crypts and tombs to unveil the hidden, ancient heart of Taras."
  },
  27: {
    it: "Il tempo si stratifica nel buio delle tue ricerche. Ma la chiave del cambio di rango non sta nelle medaglie: sta nella costanza con cui hai attraversato ogni livello, e la città lo ha riconosciuto.",
    en: "Time layers in the darkness of your researches. But the key to the change of rank lies not in medals: it lies in the constancy with which you have crossed every level, and the city has recognized it."
  },
  28: {
    it: "Via Cava custodisce i sessanta ipogei da cui fu estratta la pietra della città. Anche il tuo rango si è formato scavando: non premi, ma tufo vivo, sostanza che regge le fondamenta di ciò che costruiamo.",
    en: "Via Cava guards the sixty hypogea from which the city's stone was quarried. Your rank too was formed by digging: not awards, but living tuff, the substance that holds the foundations of what we build."
  },
  29: {
    it: "Al civico 99 di Via Cava un frantoio dell'XI secolo custodisce le sue macine intatte. Macina la tua esperienza in gesto puro: la ricchezza che porti alla comunità si misura in linfa, mai in metallo.",
    en: "At number 99 of Via Cava an 11th-century oil mill guards its millstones intact. Grind your experience into pure gesture: the wealth you bring to the community is measured in sap, never in metal."
  },
  30: {
    it: "Dietro le quinte del Teatro Fusco dorme un'antica fornace dove l'argilla diventava arte quotidiana. Come lei, trasformi ogni tuo passo in qualcosa che scalda e che resta: la Linfa Vitale è compiuta.",
    en: "Behind the scenes of the Teatro Fusco sleeps an ancient furnace where clay became everyday art. Like it, you turn every step into something that warms and remains: the Vital Sap is complete."
  },
  31: {
    it: "Il Respiro Urbano ti accoglie. Hai attraversato la linfa e ora la città respira con te: ponti, vicoli, voci. Sei diventato Eroe del Mare e della Sua Città, senza bisogno di alcun ornamento.",
    en: "The Urban Breath welcomes you. You have crossed the sap and now the city breathes with you: bridges, alleys, voices. You have become a Hero of the Sea and of its City, with no need of any ornament."
  },
  32: {
    it: "Il Castello Aragonese veglia dove i due mari si stringono. Come lui, unisci ciò che sembra diviso: ogni tua esplorazione è un ponte gettato tra il passato e il futuro della nostra terra.",
    en: "The Aragonese Castle watches where the two seas embrace. Like it, you unite what seems divided: every exploration of yours is a bridge thrown between the past and the future of our land."
  },
  33: {
    it: "Il MarTa custodisce le memorie che hai imparato a leggere. Le corone della memoria tornano a brillare grazie ai tuoi passi: nulla di ciò che hai scoperto cadrà mai nell'oblio.",
    en: "The MarTa guards the memories you have learned to read. The crowns of memory shine again thanks to your steps: nothing you have discovered will ever fall into oblivion."
  },
  34: {
    it: "Leggi la città come un palinsesto: chiese, cortili, luci segrete. Ogni angolo che sveli è una pagina che nessuno aveva ancora sfogliato, e tu la restituisci a tutti.",
    en: "Read the city like a palimpsest: churches, courtyards, secret lights. Every corner you unveil is a page no one had turned yet, and you give it back to everyone."
  },
  35: {
    it: "Le tue metriche di CO₂ risparmiata si trasformano in ombra per chi verrà, in vicoli più freschi d'estate. Il verde che proteggi diventa il polmone di chi ti seguirà.",
    en: "Your metrics of saved CO₂ turn into shade for those to come, into cooler alleys in summer. The green you protect becomes the lung of those who will follow you."
  },
  36: {
    it: "Il porto vive di storie che partono e ritornano. Anche il tuo viaggio obbedisce alle maree della città: chi rispetta il mare non naviga mai da solo.",
    en: "The port lives on stories that depart and return. Your journey too obeys the city's tides: whoever respects the sea never sails alone."
  },
  37: {
    it: "Dall'alto del lungomare il Mar Grande riflette ogni tua scelta. Guarda quanto lontano è arrivato il tuo cammino: ogni onda che vedi è un'azione che hai reso possibile.",
    en: "From the seafront the Mar Grande reflects every choice of yours. Look how far your path has come: every wave you see is an action you made possible."
  },
  38: {
    it: "La città che ha curato i tuoi traguardi ora cura quelli degli altri. I giardini urbani e le reti civiche si alimentano dei tuoi gesti: sei un nodo, non un passante.",
    en: "The city that nurtured your milestones now nurtures those of others. Urban gardens and civic networks feed on your gestures: you are a node, not a passerby."
  },
  39: {
    it: "Due ponti, due mari, una sola volontà. Le tue azioni attraversano la città come le sue vie d'acqua: da ogni sponda che raggiungi ne nasce una nuova da attraversare.",
    en: "Two bridges, two seas, one single will. Your actions cross the city like its waterways: from every shore you reach, a new one is born to be crossed."
  },
  40: {
    it: "Il Respiro Urbano ti ha reso voce della città. Trenta livelli di cammino, eppure il tuo viaggio è solo diventato parte del ritmo collettivo del golfo: il Loto sta per fiorire.",
    en: "The Urban Breath has made you the voice of the city. Thirty levels of walking, and yet your journey has just become part of the gulf's collective rhythm: the Lotus is about to bloom."
  },
  41: {
    it: "La Fioritura del Loto comincia. Dal limo più profondo nasce il fiore più luminoso: tu sei la prova che ogni traguardo nasce dai gesti semplici e silenziosi. Sei Leggenda di Taranto.",
    en: "The Blossoming of the Lotus begins. From the deepest mud is born the brightest flower: you are the proof that every milestone is born from simple, silent gestures. You are a Legend of Taranto."
  },
  42: {
    it: "Guida chi parte per la prima volta, come una volta guidavi te stesso. Le tue tracce diventano insegnamento: il vero rango non si indossa, si tramanda.",
    en: "Guide those who set out for the first time, as you once guided yourself. Your tracks become teaching: true rank is not worn, it is passed on."
  },
  43: {
    it: "Le corone del Loto si intrecciano: ogni petalo è una persona che hai ispirato. La città fiorisce perché qualcuno, prima di tutti, ha scelto di custodire il seme.",
    en: "The crowns of the Lotus intertwine: every petal is a person you have inspired. The city blooms because someone, before everyone else, chose to guard the seed."
  },
  44: {
    it: "La tua voce ora è l'eco delle voci di tutti. L'eredità che lasci non è un oggetto da esibire: è la capacità, in chi verrà, di riconoscersi parte della stessa fioritura.",
    en: "Your voice is now the echo of everyone's voices. The legacy you leave is not an object to display: it is the ability, in those who will come, to recognize themselves as part of the same blossom."
  },
  45: {
    it: "Ogni livello raggiunto è un petalo aperto sul golfo. Sei la prova vivente che la vera ricchezza di Taranto non sta nei metalli stampati, ma nella luce che muovi attraversando la città.",
    en: "Every level reached is a petal opened over the gulf. You are the living proof that Taranto's true wealth lies not in stamped medals, but in the light you move by crossing the city."
  },
  46: {
    it: "I due mari riflettono la tua luce e la restituiscono ai nuovi esploratori. La Fioritura è contagiosa: ogni tua esplorazione accende una stella su una rotta che nessuno aveva tracciato.",
    en: "The two seas reflect your light and return it to new explorers. The Blossoming is contagious: every exploration of yours lights a star on a route no one had charted."
  },
  47: {
    it: "La maestria non ha bisogno di ostentazione: è già un messaggio. Chi ti osserva capisce che il rispetto per la città non si mostra, si vive, gesto dopo gesto, livello dopo livello.",
    en: "Mastery needs no ostentation: it is already a message. Those who watch you understand that respect for the city is not shown, it is lived, gesture after gesture, level after level."
  },
  48: {
    it: "Il respiro del golfo è il tuo. Hai attraversato la città intera senza mai abitarla da passante: sei il custode silenzioso che la rende viva agli occhi di chi arriva.",
    en: "The breath of the gulf is yours. You have crossed the whole city without ever inhabiting it as a passerby: you are the silent guardian who makes it alive in the eyes of those who arrive."
  },
  49: {
    it: "L'ultimo svolto si avvicina e la costa si fa più chiara. I tuoi quarantotto livelli di esperienza sono la bussola di chi verrà: manca un solo passo alla piena Fioritura.",
    en: "The last bend approaches and the coast grows clearer. Your forty-eight levels of experience are the compass of those who will come: only one step remains to the full Blossoming."
  },
  50: {
    it: "La Fioritura del Loto è compiuta. Hai toccato il livello più alto dell'esperienza di Taranto: da qui, ogni tua esplorazione è un regalo alla città. Sarai la guida del Risveglio delle generazioni a venire, perché le leggende non finiscono: si tramandano.",
    en: "The Blossoming of the Lotus is complete. You have reached the highest level of Taranto's experience: from here, every exploration of yours is a gift to the city. You will be the guide of the Awakening of generations to come, because legends do not end: they are passed on."
  }
};

export const getLoreForLevel = (
  level: number,
  language: 'it' | 'en' = 'it'
): string | null => {
  const lore = LEVEL_UP_LORE[level];
  if (!lore) return null;
  return lore[language] || lore.it;
};