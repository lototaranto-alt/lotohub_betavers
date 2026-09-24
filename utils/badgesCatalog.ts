// Catalogo UFFICIALE e UNICO dei badge LOTO.
// SSOT allineata alla tabella `badges` del DB cloud (verificata via introspection 24/09):
//   - id = `badges.id` (text)  -> la chiave vera usata anche da user_badges.badge_id
//   - requisito = `badges.req_xp`  -> metrica viva `profiles.total_xp`
// NESSUN badge fittizio: se non esiste la riga nel DB, non esiste nel catalogo.
// Nome file: badgesCatalog.ts

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

// Requisiti reali dal DB (SELECT id, name, icon, description, req_xp FROM badges)
export const ALL_BADGES: LotoBadge[] = [
  {
    id: 'eco_warrior',
    name: 'Eco Warrior',
    icon: 'eco',
    desc: 'Hai dimostrato un amore profondo per l\'ambiente urbano.',
    actionLabel: 'Vai alla Mappa',
    actionType: 'map',
    target: 500,
    unit: 'XP',
    metricKey: 'total_xp',
    color: '#4CAF50',
  },
  {
    id: 'pioniere',
    name: 'Pioniere',
    icon: 'explore',
    desc: 'Uno dei primi esploratori a tracciare la via.',
    actionLabel: 'Vai alla Mappa',
    actionType: 'map',
    target: 1000,
    unit: 'XP',
    metricKey: 'total_xp',
    color: '#FF9800',
  },
  {
    id: 'custode',
    name: 'Custode LOTO',
    icon: 'verified-user',
    desc: 'Hai sbloccato il tuo primo finanziamento civico.',
    actionLabel: 'Vedi Impatto',
    actionType: 'impact',
    target: 1500,
    unit: 'XP',
    metricKey: 'total_xp',
    color: '#2196F3',
  },
];

// Legge la metrica reale dal profilo utente per il badge dato. SSOT dei contatori.
// NB: le metriche SI allineano alle colonne REALI di `profiles` (introspection 24/09).
export const getBadgeMetric = (badge: LotoBadge, profile: any): number => {
  if (!profile) return 0;
  switch (badge.metricKey) {
    case 'total_xp':
      return profile.total_xp || 0;
    case 'pois_discovered':
      return profile.pois_discovered || 0;
    case 'total_co2':
      return profile.total_co2 || 0;
    case 'total_distance_meters':
      return profile.total_distance_meters || 0;
    default:
      return 0;
  }
};

// Progresso condiviso: tutto calcolato dal profilo reale, nessuna lista fittizia.
export const getBadgeProgress = (badge: LotoBadge, profile: any, unlockedIds: string[] = []) => {
  const current = getBadgeMetric(badge, profile);
  const isCompleted = unlockedIds.includes(badge.id) || current >= badge.target;
  const percent = isCompleted ? 100 : Math.min(100, Math.round((current / badge.target) * 100));
  return { current, isCompleted, percent };
};

export const getBadgeUnlockedIds = (userBadges: any[] = []): string[] =>
  userBadges.map(ub => ub.badge_id || ub.badge_type || ub.id).filter(Boolean);