// Assegnazione badge "viva": quando le metriche REALI del profilo raggiungono
// il requisito del badge, lo scriviamo in user_badges (una sola volta, upsert).
// Non ci si fida di trigger/vecchie migration: l'unica verità è il DB cloud.
import { ALL_BADGES, getBadgeMetric } from './badgesCatalog';

export const ensureEarnedBadges = async (supabase: any, profile: any, existingUserBadges: any[] | null = []) => {
  if (!supabase || !profile?.id) return [];
  const existingIds = new Set(
    (existingUserBadges || []).map(ub => ub.badge_id || ub.badge_type || ub.id).filter(Boolean)
  );

  const toAssign = ALL_BADGES.filter(b => {
    if (existingIds.has(b.id)) return false;
    const metric = getBadgeMetric(b, profile);
    return metric >= b.target;
  });

  const assignedIds: string[] = [];
  for (const badge of toAssign) {
    const { error } = await supabase
      .from('user_badges')
      .upsert(
        { user_id: profile.id, badge_id: badge.id, awarded_at: new Date().toISOString() },
        { onConflict: undefined }
      );
    if (!error) assignedIds.push(badge.id);
  }
  return assignedIds;
};