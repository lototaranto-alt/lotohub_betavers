export const injectPoisMock = (poiData: any[]) => {
  if (!poiData || !Array.isArray(poiData)) return [];

  const processedPois = poiData.map((poi: any) => {
    if (poi.name && poi.name.includes('Castello Aragonese')) {
      return {
        ...poi,
        difficulty_score: 85,
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

  return processedPois;
};
