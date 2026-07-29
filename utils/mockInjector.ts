export const injectPoisMock = (poiData: any[]) => {
  if (!poiData || !Array.isArray(poiData)) return [];

  const processedPois = poiData.map((poi: any) => {
    if (poi.name && poi.name.includes('Castello Aragonese')) {
      return {
        ...poi,
        lat: 40.4750,
        lng: 17.2280,
        difficulty_score: 10,
        crowd_level: 40,
        media: [
          { id: 'm1', title: 'Audioguida Storica', media_type: 'audio', required_level: 2 },
          { id: 'm2', title: 'Planimetria Antica HR', media_type: 'digital_file', required_level: 4 },
          { id: 'm3', title: 'Archivio Segreto Aragonese', media_type: 'digital_file', required_level: 6, is_premium: true }
        ]
      };
    }
    if (poi.name && poi.name.includes('Borgo Valle Rita')) {
      return { ...poi, crowd_level: 20 };
    }
    if (poi.name && poi.name.includes('Canneto Beach')) {
      return { ...poi, crowd_level: 95 };
    }
    return poi;
  });

  const firstPartnerIndex = processedPois.findIndex((p: any) => p.category === 'partner');
  if (firstPartnerIndex !== -1) {
    processedPois[firstPartnerIndex] = {
      ...processedPois[firstPartnerIndex],
      events: [
        { id: 'e1', title: 'Aperitivo Ecosostenibile', date: '2026-07-01T18:00:00Z', is_premium: false },
        { id: 'e2', title: 'Tramonto DJ Set VIP', date: '2026-07-02T20:00:00Z', is_premium: true }
      ]
    };
  } else {
    processedPois.push({
      id: 'mock-partner-1',
      name: 'Lido LOTO (Partner)',
      category: 'partner',
      type: 'lido',
      lat: 40.4500,
      lng: 17.2500,
      base_tokens: 30,
      difficulty_score: 10,
      image_url: null,
      events: [
        { id: 'e1', title: 'Aperitivo Ecosostenibile', date: '2026-07-01T18:00:00Z', is_premium: false },
        { id: 'e2', title: 'Tramonto DJ Set VIP', date: '2026-07-02T20:00:00Z', is_premium: true }
      ]
    });
  }

  // Inject Mena Mena Mè as an F&B Partner on the map
  const hasMena = processedPois.some((p: any) => p.name === 'Mena Mena Mè');
  if (!hasMena) {
    processedPois.unshift({
      id: 'mena',
      name: 'Mena Mena Mè',
      category: 'partner',
      type: 'f&b',
      is_recommended: true,
      lat: 40.4725, 
      lng: 17.2300,
      base_tokens: 70,
      difficulty_score: 5,
      image: require('../assets/images/mena_logo.jpg'),
      recommended_parking_id: 'park_porto_antico',
      description: 'Locale accogliente nel cuore di Taranto vecchia. Oggi ospita un incontro speciale con i ragazzi di Plasticaqquà e TGT per discutere i prossimi interventi sul territorio.',
      events: [
        { id: 'ev_mena1', title: 'Incontro Plasticaqquà & TGT', date: 'Oggi, 19:00', is_premium: false }
      ]
    });
  }

  // Inject Diseducation as a Free/Cultural POI on the map
  const hasDiseducation = processedPois.some((p: any) => p.name === 'Diseducation');
  if (!hasDiseducation) {
    processedPois.unshift({
      id: 'diseducation',
      name: 'Diseducation',
      category: 'free',
      type: 'social',
      lat: 40.4700, 
      lng: 17.2310,
      base_tokens: 150, // Bonus Dinamico
      difficulty_score: 5,
      is_dynamic: true,
      crowd_level: 15,
      image: require('../assets/images/diseducation_logo.jpg'),
      recommended_parking_id: 'park_porto_antico',
      description: 'Punto di ritrovo del Nodo Civico per l\'accessibilità. Da qui partono le missioni collettive per tracciare percorsi accessibili in città.',
      events: [
        { id: 'ev_dis1', title: 'Passeggiata Scan: Inaccessibilità', date: 'Domani, 10:00', is_premium: false }
      ]
    });
  }

  // Inject Castello Aragonese as a Free POI if it doesn't exist
  const hasCastello = processedPois.some((p: any) => p.name && p.name.includes('Castello Aragonese'));
  if (!hasCastello) {
    processedPois.unshift({
      id: 'castello',
      name: 'Castello Aragonese',
      category: 'free',
      type: 'storia',
      is_recommended: true,
      lat: 40.4750, 
      lng: 17.2280,
      base_tokens: 100,
      difficulty_score: 10,
      crowd_level: 25,
      image: require('../assets/images/castello_aragonese.jpg'),
      recommended_parking_id: 'park_porto_antico',
      events: [],
      media: [
        { id: 'm1', title: 'Audioguida Storica', media_type: 'audio', required_level: 2 },
        { id: 'm2', title: 'Planimetria Antica HR', media_type: 'digital_file', required_level: 4 },
        { id: 'm3', title: 'Archivio Segreto Aragonese', media_type: 'digital_file', required_level: 5, is_premium: true }
      ]
    });
  }

  // Inject Museo MuDi as a Free/Cultural POI
  const hasMudi = processedPois.some((p: any) => p.name === 'Museo MuDi');
  if (!hasMudi) {
    processedPois.unshift({
      id: 'mudi',
      name: 'Museo MuDi',
      category: 'free',
      type: 'storia',
      description: 'Il Museo Diocesano di Taranto (MuDi) è ospitato in un antico palazzo nel cuore del borgo antico. Conserva preziosi manufatti, opere d\'arte sacra e reliquie che raccontano la storia millenaria della città, incrociando le rotte bizantine, normanne e aragonesi.',
      lat: 40.4740, 
      lng: 17.2300,
      base_tokens: 80,
      difficulty_score: 7,
      crowd_level: 15,
      image: require('../assets/images/poi_mudi.jpg'),
      recommended_parking_id: 'park_porto_antico',
      website_url: 'https://museodiocesanotaranto.it/',
      events: [],
      media: [
        { id: 'm4', title: 'Audioguida Sala 1', media_type: 'audio', required_level: 2 },
        { id: 'm5', title: 'Manoscritto Digitalizzato', media_type: 'digital_file', required_level: 3, is_premium: false }
      ]
    });
  }

  // Inject Plasticaqquà as a Cultural/Social POI on the map
  const hasPlastica = processedPois.some((p: any) => p.name === 'Plasticaqquà');
  if (!hasPlastica) {
    processedPois.unshift({
      id: 'plasticaqqua',
      name: 'Plasticaqquà',
      category: 'free',
      type: 'social',
      lat: 40.4680, 
      lng: 17.2320,
      base_tokens: 120, 
      difficulty_score: 8,
      is_dynamic: true,
      crowd_level: 60,
      image: require('../assets/images/plasticaqquà.png'),
      recommended_parking_id: 'park_porto_antico',
      description: 'Associazione di volontariato attiva nella pulizia delle spiagge e sensibilizzazione ambientale. Unisciti a noi per fare la differenza.',
      events: [
        { id: 'ev_plas1', title: 'Clean-up Litoranea', date: 'Sabato, 09:00', is_premium: false }
      ]
    });
  }

  // Inject Gruppo Tracce
  const hasTracce = processedPois.some((p: any) => p.name === 'Gruppo Tracce');
  if (!hasTracce) {
    processedPois.unshift({
      id: 'tracce',
      name: 'Gruppo Tracce',
      category: 'free',
      type: 'storia',
      lat: 40.4715, 
      lng: 17.2295,
      base_tokens: 60, 
      difficulty_score: 6,
      image: require('../assets/images/tracce.png'),
      description: 'Associazione culturale dedita alla riscoperta delle tradizioni e delle radici storiche.',
      events: []
    });
  }

  // Inject Casa Viola (Demo Hub)
  const hasCasaViola = processedPois.some((p: any) => p.name === 'Casa Viola (Hub Civico)');
  if (!hasCasaViola) {
    processedPois.unshift({
      id: 'casaviola',
      name: 'Casa Viola (Hub Civico)',
      category: 'free',
      type: 'social',
      is_recommended: true,
      lat: 40.4735, // Vicino al centro mockato per comodità
      lng: 17.2325,
      base_tokens: 20, 
      difficulty_score: 6, // Rende esattamente 50 EXP (20 + 6*5)
      image: require('../assets/images/casa_viola.png'),
      description: 'Punto di riferimento per l\'innovazione civica. Scansiona il nodo NFC per confermare la tua presenza al Pitch!',
      events: [
        { id: 'ev_cv1', title: 'Pitch LOTO Hub Demo', date: 'Oggi, Adesso!', is_premium: false }
      ]
    });
  }

  return processedPois;
};
