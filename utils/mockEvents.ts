export const mockEvents = [
  { 
    id: 'ev_1', 
    title: "Sfida Templare NFC", 
    name: "Sfida Templare NFC", // per compatibilità con RouteContext che si aspetta 'name'
    category: 'event',
    type: "Competitivo", 
    icon: "nfc", 
    date: "Oggi, 18:00", 
    xp: 100, 
    desc: "Trova più tag nascosti possibili.",
    lat: 40.4735,
    lng: 17.2340
  },
  { 
    id: 'ev_2', 
    title: "Loto Clean-Up", 
    name: "Loto Clean-Up",
    category: 'event',
    type: "Cooperativo", 
    icon: "recycling", 
    date: "Domani, 09:00", 
    xp: 50, 
    desc: "Sblocca l'Arco della Sostenibilità.",
    lat: 40.4700,
    lng: 17.2450
  },
  { 
    id: 'ev_3', 
    title: "Aperitivo Partner", 
    name: "Aperitivo Partner",
    category: 'event',
    type: "Social", 
    icon: "local-bar", 
    date: "Stasera, 20:00", 
    xp: 20, 
    desc: "Sconto Zero-Friction in piazza.",
    lat: 40.4760,
    lng: 17.2300
  },
  { 
    id: 'ev_4', 
    title: "Sfida Mappatura Civica", 
    name: "Sfida Mappatura Civica",
    category: 'event',
    type: "Community", 
    icon: "groups", 
    date: "Sabato, 10:00", 
    xp: 200, 
    desc: "Segnala barriere architettoniche assieme alla Community.",
    lat: 40.4710,
    lng: 17.2350
  }
];
