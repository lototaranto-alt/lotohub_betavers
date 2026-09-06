export const LEVEL_UP_LORE: Record<number, { title: string; text: string }> = {
  2: { title: "IL PRIMO RESPIRO", text: "Hai mosso i tuoi primi passi. Il seme inizia a percepire la luce del mattino tarantino." },
  3: { title: "TERRA SMOSSA", text: "La crosta si spezza. Ogni tua scelta lenta nutre il suolo invisibile della citt\u00e0." },
  4: { title: "FIBRA SOTTILE", text: "Un filo verde si spinge verso l'alto. La tua attenzione per i luoghi dimenticati inizia a farsi viva." },
  5: { title: "RUGIADA SALMASTRA", text: "L'umidit\u00e0 dei due mari bagna il tuo cammino. Stai imparando a respirare al ritmo delle maree." },
  6: { title: "IL RICHIAMO DEL VENTO", text: "Le brezze dello scirocco sussurrano vecchie storie. Inizi a percepire ci\u00f2 che gli altri ignorano." },
  7: { title: "GEMMA NASCOSTA", text: "Una piccola promessa di vita. Il tuo passaggio lascia un'impronta leggera, ma indelebile nel tessuto urbano." },
  8: { title: "FOGLIA INVISIBILE", text: "La prima vera espansione. Cogli la bellezza nelle crepe dell'asfalto e nei vicoli lasciati in ombra." },
  9: { title: "RADICE SUPERFICIALE", text: "Ti ancori alla storia. I tuoi passi calmi e attenti riconnettono i fili strappati della memoria." },
  10: { title: "IL SEME DISCHIUSO", text: "Il guscio \u00e8 ormai alle spalle. Sei diventato parte organica del respiro segreto di questa terra antica." },
  11: { title: "TUFO E SANGUE", text: "Scendi pi\u00f9 a fondo. Senti le vene di pietra e le storie sommerse che pulsano sotto la Citt\u00e0 Vecchia." },
  12: { title: "ACQUA DI FALDA", text: "Le tue radici toccano correnti antiche. Il tuo viaggio si alimenta ora di pura e silenziosa consapevolezza." },
  13: { title: "CORDA DI CANAPA", text: "Intrecci il tuo percorso con quello dei vecchi pescatori. La tua presenza \u00e8 un nodo saldo per la comunit\u00e0." },
  14: { title: "OMBRA DEL FRANTOIO", text: "L'oscurit\u00e0 sotterranea ti accoglie benevola. Comprendi che la vera luce si trova esplorando le profondit\u00e0." },
  15: { title: "RESINA E SALE", text: "Il sudore della terra diventa prezioso. Le tue azioni silenziose leniscono le antiche ferite dei luoghi." },
  16: { title: "CUSTODE DEL SILENZIO", text: "Non hai bisogno di clamore. Il tuo esplorare \u00e8 un rito di profondo rispetto e scoperta autentica." },
  17: { title: "ECO NELLA CISTERNA", text: "Le tue scelte risuonano nei vuoti dimenticati e li riempiono di significato. \u00c8 l'eco del tuo impatto positivo." },
  18: { title: "ALGA LUMINOSA", text: "Illumini i fondali oscuri. Anche nelle aree pi\u00f9 trascurate, sai trovare, preservare e irradiare bellezza." },
  19: { title: "NODO DI RADICI", text: "Sei ormai intrecciato all'anima di Taranto. Non sei pi\u00f9 un semplice visitatore, ma un alleato fedele e silente." },
  20: { title: "ANCORA DELLA TERRA", text: "Le tue radici hanno fatto presa permanente. Sostieni la superficie con una forza invisibile, pacifica e costante." },
  21: { title: "FLUSSO ARGENTATO", text: "La linfa inizia a scorrere potente in te. Sei un vettore di energia pulita e di rigenerazione urbana." },
  22: { title: "SANGUE DI ULIVO", text: "Denso e millenario, il tuo spirito viaggiatore si fonde con l'atavica saggezza della natura pugliese." },
  23: { title: "RESPIRO CORALE", text: "Non cammini pi\u00f9 da solo. Ogni tuo passo muove l'aria in perfetta sincronia con gli spiriti custodi dei luoghi." },
  24: { title: "VENTO TRA I RAMI", text: "Ti estendi verso l'esterno. Le tue scoperte ispirano, sussurrando la via per un movimento silenzioso e vitale." },
  25: { title: "CRISTALLO DI MARE", text: "La tua linfa purifica. La tua sola attenzione trasforma gli spazi degradati in santuari sacri della memoria." },
  26: { title: "CANTO DEL CITRO", text: "Hai ascoltato la sorgente sottomarina. La tua energia ora sgorga fresca e inarrestabile, navigando controcorrente." },
  27: { title: "FOGLIAME DORATO", text: "La tua consapevolezza risplende placida. Assorbi il caos cittadino per restituire pura e incontaminata armonia." },
  28: { title: "TRONCO INDISTRUTTIBILE", text: "Nessun vento dell'incuria pu\u00f2 sradicare la tua missione. Sei un pilastro fondante del turismo rigenerativo." },
  29: { title: "FRUTTO CONDIVISO", text: "Il risultato della tua devozione nutre l'intero ecosistema. Stai lasciando il mondo migliore di come lo hai trovato." },
  30: { title: "L'ALBERO SECOLARE", text: "Sei un faro nell'ecosistema di L.O.T.O. La tua ombra protegge, le tue radici curano, la tua linfa \u00e8 pura vita." }
};

export const getLoreForLevel = (level: number, language: 'it' | 'en' = 'it'): { title: string; text: string } | null => {
  const lore = LEVEL_UP_LORE[level];
  return lore ? lore : null;
};
