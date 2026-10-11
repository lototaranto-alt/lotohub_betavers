import { supabase } from './supabase';

export interface CommunityFeedItem {
  id: string;
  user: string;
  action: string;
  time: string;
  timestamp: number;
  icon: string;
  color: string;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'adesso';
  if (min < 60) return `${min} min fa`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ora${h > 1 ? 'e' : ''} fa`;
  const d = Math.floor(h / 24);
  return `${d} giorno${d > 1 ? 'i' : ''} fa`;
}

export async function fetchCommunityFeed(limit = 10): Promise<CommunityFeedItem[]> {
  try {
    const [poisRes, badgesRes, txRes] = await Promise.all([
      supabase.from('user_pois')
        .select('id, profile_id, visited_at, pois(name), profiles(nickname)')
        .order('visited_at', { ascending: false })
        .limit(limit),
      supabase.from('user_badges')
        .select('id, badge_id, awarded_at, badges(name), profiles(nickname)')
        .order('awarded_at', { ascending: false })
        .limit(limit),
      supabase.from('impact_transactions')
        .select('id, profile_id, created_at, co2_saved, tokens_earned, profiles(nickname)')
        .order('created_at', { ascending: false })
        .limit(limit),
    ]);

    const items: CommunityFeedItem[] = [];

    (poisRes.data || []).forEach((p: any) => {
      if (!p.visited_at) return;
      items.push({
        id: `poi_${p.id}`,
        user: p.profiles?.nickname || 'Un Viaggiatore',
        action: `ha scoperto ${p.pois?.name || 'un nuovo luogo'}`,
        time: relativeTime(p.visited_at),
        timestamp: new Date(p.visited_at).getTime(),
        icon: 'location-on',
        color: '#2ECC71',
      });
    });

    (badgesRes.data || []).forEach((b: any) => {
      if (!b.awarded_at) return;
      items.push({
        id: `badge_${b.id}`,
        user: b.profiles?.nickname || 'Un Viaggiatore',
        action: `ha sbloccato il badge ${b.badges?.name || 'esclusivo'}`,
        time: relativeTime(b.awarded_at),
        timestamp: new Date(b.awarded_at).getTime(),
        icon: 'emoji-events',
        color: '#D4AF37',
      });
    });

    (txRes.data || []).forEach((tx: any) => {
      if (!tx.created_at) return;
      if ((!tx.tokens_earned || tx.tokens_earned <= 0) && (!tx.co2_saved || tx.co2_saved <= 0)) return;
      const hasTokens = tx.tokens_earned && tx.tokens_earned > 0;
      items.push({
        id: `tx_${tx.id}`,
        user: tx.profiles?.nickname || 'Un Viaggiatore',
        action: hasTokens
          ? `ha guadagnato ${tx.tokens_earned} PTI`
          : `ha risparmiato ${tx.co2_saved.toFixed(1)} kg di CO₂`,
        time: relativeTime(tx.created_at),
        timestamp: new Date(tx.created_at).getTime(),
        icon: hasTokens ? 'toll' : 'eco',
        color: hasTokens ? '#D4AF37' : '#2ECC71',
      });
    });

    return items
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  } catch (e) {
    console.log('Errore feed community:', e);
    return [];
  }
}