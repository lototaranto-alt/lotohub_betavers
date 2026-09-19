// Catalogo UFFICIALE e UNICO dei badge LOTO.
// I badge si sbloccano SOLO per azioni specifiche sul territorio (mai per il livello/rank).
// Nome file: badgesCatalog.ts - SSOT anche per il calcolo del progresso reale.

export type LotoBadge = {
  id: string;
  name: string;
  icon: string;
  desc: string;
  actionLabel: string;
  actionType: string;
  target: number;
  unit: string;
  metricKey: string;
  color: string;
};

export const ALL_BADGES: LotoBadge[] = [
  {
    id: 'badge_first_scan',
    name: 'Battesimo del Loto',
    icon: 'location-on',
    desc: 'Effettua il tuo primo check-in o scansione NFC in un Luogo o Monumento LOTO.',
    actionLabel: 'Vai alla Mappa',
    actionType: 'map',
    target: 1,
    unit: 'POI',
    metricKey: 'pois_discovered',
    color: '#2ECC71',
  },
  {
    id: 'badge_civic_3',
    name: 'Sentinella Civica',
    icon: 'security',
    desc: 'Invia almeno 3 segnalazioni civiche con geolocalizzazione per preservare il decoro urbano.',
    actionLabel: 'Fai Segnalazione',
    actionType: 'report',
    target: 3,
    unit: 'Segnalazioni',
    metricKey: 'reports_count',
    color: '#2196F3',
  },
  {
    id: 'badge_eco_5kg',
    name: 'Eco-Sostenitore',
    icon: 'eco',
    desc: 'Risparmia 5.0 kg di CO₂ muovendoti a piedi, in bici o con mezzi sostenibili.',
    actionLabel: 'Monitora CO₂',
    actionType: 'co2',
    target: 5.0,
    unit: 'kg CO₂',
    metricKey: 'total_co2',
    color: '#4CAF50',
  },
  {
    id: 'badge_marathon_3',
    name: 'Maratoneta Jonico',
    icon: 'directions-run',
    desc: 'Completa 3 itinerari culturali integrali tra i vicoli e i monumenti della città.',
    actionLabel: 'Scegli Itinerario',
    actionType: 'itinerary',
    target: 3,
    unit: 'Itinerari',
    metricKey: 'itineraries_count',
    color: '#FF9800',
  },
  {
    id: 'badge_partner',
    name: 'Amico delle Botteghe',
    icon: 'storefront',
    desc: 'Visita e sostieni le botteghe artigiane e le boutique partner del territorio.',
    actionLabel: 'Vedi Botteghe',
    actionType: 'boutiques',
    target: 2,
    unit: 'Check-in',
    metricKey: 'partner_checkins',
    color: '#9B59B6',
  },
];

// Legge la metrica reale dal profilo utente per il badge dato. SSOT dei contatori.
export const getBadgeMetric = (badge: LotoBadge, profile: any): number => {
  if (!profile) return 0;
  switch (badge.metricKey) {
    case 'pois_discovered':
      return profile.pois_discovered || 0;
    case 'total_co2':
      return profile.total_co2 || 0;
    case 'reports_count':
      return profile.reports_count || 0;
    case 'itineraries_count':
      return profile.itineraries_count || 0;
    case 'partner_checkins':
      return profile.partner_checkins || 0;
    default:
      return 0;
  }
};

// Progresso condiviso: niente liste fittizie, tutto calcolato dal profilo reale.
export const getBadgeProgress = (badge: LotoBadge, profile: any, unlockedIds: string[] = []) => {
  const current = getBadgeMetric(badge, profile);
  const isCompleted = unlockedIds.includes(badge.id) || current >= badge.target;
  const percent = isCompleted ? 100 : Math.min(100, Math.round((current / badge.target) * 100));
  return { current, isCompleted, percent };
};

export const getBadgeUnlockedIds = (userBadges: any[] = []): string[] =>
  userBadges.map(ub => ub.badge_id || ub.badge_type || ub.id).filter(Boolean);