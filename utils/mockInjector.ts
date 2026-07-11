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
          { id: 'm1', title: 'Audioguida Storica', media_type: 'audio', loto_cost: 0 },
          { id: 'm2', title: 'Planimetria Antica HR', media_type: 'digital_file', loto_cost: 50 },
          { id: 'm3', title: 'Archivio Segreto Aragonese', media_type: 'digital_file', loto_cost: 0, is_premium: true }
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
    processedPois.push({
      id: 'mena',
      name: 'Mena Mena Mè',
      category: 'partner',
      type: 'f&b',
      lat: 40.4725, // Coordinate fittizie in Città Vecchia
      lng: 17.2345,
      base_tokens: 50,
      difficulty_score: 5,
      image_url: null,
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
    processedPois.push({
      id: 'diseducation',
      name: 'Diseducation',
      category: 'free',
      type: 'social',
      lat: 40.4700, 
      lng: 17.2310,
      base_tokens: 60,
      difficulty_score: 5,
      image_url: null,
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
    processedPois.push({
      id: 'castello',
      name: 'Castello Aragonese',
      category: 'free',
      type: 'storia',
      lat: 40.4750, 
      lng: 17.2280,
      base_tokens: 100,
      difficulty_score: 10,
      crowd_level: 25,
      image_url: null,
      recommended_parking_id: 'park_porto_antico',
      events: [],
      media: [
        { id: 'm1', title: 'Audioguida Storica', media_type: 'audio', loto_cost: 0 },
        { id: 'm2', title: 'Planimetria Antica HR', media_type: 'digital_file', loto_cost: 50 },
        { id: 'm3', title: 'Archivio Segreto Aragonese', media_type: 'digital_file', loto_cost: 0, is_premium: true }
      ]
    });
  }

  // Inject Museo MuDi as a Free/Cultural POI
  const hasMudi = processedPois.some((p: any) => p.name === 'Museo MuDi');
  if (!hasMudi) {
    processedPois.push({
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
      image_url: null,
      recommended_parking_id: 'park_porto_antico',
      website_url: 'https://museodiocesanotaranto.it/',
      events: [],
      media: [
        { id: 'm4', title: 'Audioguida Sala 1', media_type: 'audio', loto_cost: 0 },
        { id: 'm5', title: 'Manoscritto Digitalizzato', media_type: 'digital_file', loto_cost: 10, is_premium: false }
      ]
    });
  }

  return processedPois;
};
