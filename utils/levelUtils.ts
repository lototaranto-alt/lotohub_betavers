import { getLoreForLevel } from './LevelUpLore';

// ---------------------------------------------------------------------------
// KEY_LEVELS — soglie di Progressive Disclosure (SSOT, zero numeri magici)
// I livelli chiave in cui l'utente "impara" una nuova sezione del gioco.
// Ordine deciso in sessione 20/09 (REPORT_GAMIFICATION_STATUS.md PARTE B.1):
//   1  Avvio (seme) · 2  Eventi/Community dati · 5  Community completa
//   11 Radici Sommerse · 20 Co-Experience · 21 Linfa Vitale
//   30 Soglia di apprendimento DMV · 31 Respiro Urbano · 41 Fioritura del Loto
// ---------------------------------------------------------------------------
export const KEY_LEVELS: readonly number[] = [1, 2, 5, 11, 20, 21, 30, 31, 41];

// Gate specifici per sezione/funzione. Usare SEMPRE questi, mai il numero a mano.
export const EVENTS_UNLOCK_LEVEL = 2;
export const COMMUNITY_UNLOCK_LEVEL = 5;
export const CO_EXPERIENCE_UNLOCK_LEVEL = 20;

// Rito di capstone del Tier 1: carta celebrativa di transizione (non è un gate di contenuti,
// ma una modale di passaggio; i POI sono sempre tutti consultabili — visione utente 21/09).
export const RITO_TIER1_LEVEL = 10;

// Testi SSOT delle carte REVEAL/RITO (zero numeri magici, zero stringhe sparse).
export const UNLOCK_REVEALS: Record<
  number,
  { title: string; text: string }
> = {
  [EVENTS_UNLOCK_LEVEL]: {
    title: 'LA VOCE DELLA CITTÀ',
    text: 'Eventi e itinerari si uniscono al tuo cammino: la città comincia a raccontarti la sua giornata.',
  },
  [COMMUNITY_UNLOCK_LEVEL]: {
    title: 'LA PORTA DELLA CITTÀ',
    text: 'La Community si schiude. Quel che scopri diventa memoria condivisa: senza punteggi, senza gare, solo la città che respira con te.',
  },
};

export const RITO_TIER1 = {
  title: 'IL RISVEGLIO DEL SEME',
  text: 'Il Risveglio del Seme è compiuto: la tua voce ora ha un nome. Il mare ti chiama — le Radici Sommerse attendono il tuo respiro.',
};

export interface LevelThreshold {
  level: number;
  minXp: number;
  nextXp: number;
  title: string;
  stemma: string;
  gemColor: string;
  gemName: string;
}

export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, minXp: 0, nextXp: 30, title: "TURISTA OCCASIONALE", stemma: 'explore', gemColor: '#D4AF37', gemName: 'Gemma 1' },
  { level: 2, minXp: 30, nextXp: 90, title: "TURISTA OCCASIONALE", stemma: 'explore', gemColor: '#D4AF37', gemName: 'Gemma 2' },
  { level: 3, minXp: 90, nextXp: 180, title: "TURISTA OCCASIONALE", stemma: 'explore', gemColor: '#D4AF37', gemName: 'Gemma 3' },
  { level: 4, minXp: 180, nextXp: 300, title: "TURISTA OCCASIONALE", stemma: 'explore', gemColor: '#D4AF37', gemName: 'Gemma 4' },
  { level: 5, minXp: 300, nextXp: 450, title: "TURISTA OCCASIONALE", stemma: 'explore', gemColor: '#D4AF37', gemName: 'Gemma 5' },
  { level: 6, minXp: 450, nextXp: 630, title: "TURISTA OCCASIONALE", stemma: 'explore', gemColor: '#D4AF37', gemName: 'Gemma 6' },
  { level: 7, minXp: 630, nextXp: 840, title: "TURISTA OCCASIONALE", stemma: 'explore', gemColor: '#D4AF37', gemName: 'Gemma 7' },
  { level: 8, minXp: 840, nextXp: 1080, title: "TURISTA OCCASIONALE", stemma: 'explore', gemColor: '#D4AF37', gemName: 'Gemma 8' },
  { level: 9, minXp: 1080, nextXp: 1350, title: "TURISTA OCCASIONALE", stemma: 'explore', gemColor: '#D4AF37', gemName: 'Gemma 9' },
  { level: 10, minXp: 1350, nextXp: 1650, title: "TURISTA OCCASIONALE", stemma: 'explore', gemColor: '#D4AF37', gemName: 'Gemma 10' },
  { level: 11, minXp: 1650, nextXp: 2080, title: "ESPLORATORE", stemma: 'shield', gemColor: '#D4AF37', gemName: 'Gemma 11' },
  { level: 12, minXp: 2080, nextXp: 2540, title: "ESPLORATORE", stemma: 'shield', gemColor: '#D4AF37', gemName: 'Gemma 12' },
  { level: 13, minXp: 2540, nextXp: 3030, title: "ESPLORATORE", stemma: 'shield', gemColor: '#D4AF37', gemName: 'Gemma 13' },
  { level: 14, minXp: 3030, nextXp: 3550, title: "ESPLORATORE", stemma: 'shield', gemColor: '#D4AF37', gemName: 'Gemma 14' },
  { level: 15, minXp: 3550, nextXp: 4100, title: "ESPLORATORE", stemma: 'shield', gemColor: '#D4AF37', gemName: 'Gemma 15' },
  { level: 16, minXp: 4100, nextXp: 4680, title: "ESPLORATORE", stemma: 'shield', gemColor: '#D4AF37', gemName: 'Gemma 16' },
  { level: 17, minXp: 4680, nextXp: 5290, title: "ESPLORATORE", stemma: 'shield', gemColor: '#D4AF37', gemName: 'Gemma 17' },
  { level: 18, minXp: 5290, nextXp: 5930, title: "ESPLORATORE", stemma: 'shield', gemColor: '#D4AF37', gemName: 'Gemma 18' },
  { level: 19, minXp: 5930, nextXp: 6600, title: "ESPLORATORE", stemma: 'shield', gemColor: '#D4AF37', gemName: 'Gemma 19' },
  { level: 20, minXp: 6600, nextXp: 7300, title: "ESPLORATORE", stemma: 'shield', gemColor: '#D4AF37', gemName: 'Gemma 20' },
  { level: 21, minXp: 7300, nextXp: 8230, title: "CUSTODE DELLA CITTÀ", stemma: 'security', gemColor: '#D4AF37', gemName: 'Gemma 21' },
  { level: 22, minXp: 8230, nextXp: 9190, title: "CUSTODE DELLA CITTÀ", stemma: 'security', gemColor: '#D4AF37', gemName: 'Gemma 22' },
  { level: 23, minXp: 9190, nextXp: 10180, title: "CUSTODE DELLA CITTÀ", stemma: 'security', gemColor: '#D4AF37', gemName: 'Gemma 23' },
  { level: 24, minXp: 10180, nextXp: 11200, title: "CUSTODE DELLA CITTÀ", stemma: 'security', gemColor: '#D4AF37', gemName: 'Gemma 24' },
  { level: 25, minXp: 11200, nextXp: 12250, title: "CUSTODE DELLA CITTÀ", stemma: 'security', gemColor: '#D4AF37', gemName: 'Gemma 25' },
  { level: 26, minXp: 12250, nextXp: 13330, title: "CUSTODE DELLA CITTÀ", stemma: 'security', gemColor: '#D4AF37', gemName: 'Gemma 26' },
  { level: 27, minXp: 13330, nextXp: 14440, title: "CUSTODE DELLA CITTÀ", stemma: 'security', gemColor: '#D4AF37', gemName: 'Gemma 27' },
  { level: 28, minXp: 14440, nextXp: 15580, title: "CUSTODE DELLA CITTÀ", stemma: 'security', gemColor: '#D4AF37', gemName: 'Gemma 28' },
  { level: 29, minXp: 15580, nextXp: 16750, title: "CUSTODE DELLA CITTÀ", stemma: 'security', gemColor: '#D4AF37', gemName: 'Gemma 29' },
  { level: 30, minXp: 16750, nextXp: 17950, title: "CUSTODE DELLA CITTÀ", stemma: 'security', gemColor: '#D4AF37', gemName: 'Gemma 30' },
  { level: 31, minXp: 17950, nextXp: 19180, title: "EROE DEL MARE", stemma: 'anchor', gemColor: '#D4AF37', gemName: 'Gemma 31' },
  { level: 32, minXp: 19180, nextXp: 20440, title: "EROE DEL MARE", stemma: 'anchor', gemColor: '#D4AF37', gemName: 'Gemma 32' },
  { level: 33, minXp: 20440, nextXp: 21730, title: "EROE DEL MARE", stemma: 'anchor', gemColor: '#D4AF37', gemName: 'Gemma 33' },
  { level: 34, minXp: 21730, nextXp: 23050, title: "EROE DEL MARE", stemma: 'anchor', gemColor: '#D4AF37', gemName: 'Gemma 34' },
  { level: 35, minXp: 23050, nextXp: 24400, title: "EROE DEL MARE", stemma: 'anchor', gemColor: '#D4AF37', gemName: 'Gemma 35' },
  { level: 36, minXp: 24400, nextXp: 25780, title: "EROE DEL MARE", stemma: 'anchor', gemColor: '#D4AF37', gemName: 'Gemma 36' },
  { level: 37, minXp: 25780, nextXp: 27190, title: "EROE DEL MARE", stemma: 'anchor', gemColor: '#D4AF37', gemName: 'Gemma 37' },
  { level: 38, minXp: 27190, nextXp: 28630, title: "EROE DEL MARE", stemma: 'anchor', gemColor: '#D4AF37', gemName: 'Gemma 38' },
  { level: 39, minXp: 28630, nextXp: 30100, title: "EROE DEL MARE", stemma: 'anchor', gemColor: '#D4AF37', gemName: 'Gemma 39' },
  { level: 40, minXp: 30100, nextXp: 31600, title: "EROE DEL MARE", stemma: 'anchor', gemColor: '#D4AF37', gemName: 'Gemma 40' },
  { level: 41, minXp: 31600, nextXp: 33130, title: "LEGGENDA L.O.T.O.", stemma: 'public', gemColor: '#D4AF37', gemName: 'Gemma 41' },
  { level: 42, minXp: 33130, nextXp: 34690, title: "LEGGENDA L.O.T.O.", stemma: 'public', gemColor: '#D4AF37', gemName: 'Gemma 42' },
  { level: 43, minXp: 34690, nextXp: 36280, title: "LEGGENDA L.O.T.O.", stemma: 'public', gemColor: '#D4AF37', gemName: 'Gemma 43' },
  { level: 44, minXp: 36280, nextXp: 37900, title: "LEGGENDA L.O.T.O.", stemma: 'public', gemColor: '#D4AF37', gemName: 'Gemma 44' },
  { level: 45, minXp: 37900, nextXp: 39550, title: "LEGGENDA L.O.T.O.", stemma: 'public', gemColor: '#D4AF37', gemName: 'Gemma 45' },
  { level: 46, minXp: 39550, nextXp: 41230, title: "LEGGENDA L.O.T.O.", stemma: 'public', gemColor: '#D4AF37', gemName: 'Gemma 46' },
  { level: 47, minXp: 41230, nextXp: 42940, title: "LEGGENDA L.O.T.O.", stemma: 'public', gemColor: '#D4AF37', gemName: 'Gemma 47' },
  { level: 48, minXp: 42940, nextXp: 44680, title: "LEGGENDA L.O.T.O.", stemma: 'public', gemColor: '#D4AF37', gemName: 'Gemma 48' },
  { level: 49, minXp: 44680, nextXp: 46450, title: "LEGGENDA L.O.T.O.", stemma: 'public', gemColor: '#D4AF37', gemName: 'Gemma 49' },
  { level: 50, minXp: 46450, nextXp: 48250, title: "LEGGENDA L.O.T.O.", stemma: 'public', gemColor: '#D4AF37', gemName: 'Gemma 50' }
];

export const calculateLevel = (totalXp: number): number => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i].minXp) {
      return LEVEL_THRESHOLDS[i].level;
    }
  }
  return 1;
};

export interface RankInfo {
  rankName: string;
  nextRank: string;
  color: string;
  requiredLvl: number;
}

export const getRankInfo = (lvl: number): RankInfo => {
  if (lvl < 11) {
    return { rankName: 'TURISTA OCCASIONALE', nextRank: 'ESPLORATORE', color: '#8D6E63', requiredLvl: 11 };
  } else if (lvl < 21) {
    return { rankName: 'ESPLORATORE', nextRank: 'CUSTODE DELLA CITTÀ', color: '#2A9D8F', requiredLvl: 21 };
  } else if (lvl < 31) {
    return { rankName: 'CUSTODE DELLA CITTÀ', nextRank: 'EROE DEL MARE', color: '#D4AF37', requiredLvl: 31 };
  } else if (lvl < 41) {
    return { rankName: 'EROE DEL MARE', nextRank: 'LEGGENDA L.O.T.O.', color: '#00CED1', requiredLvl: 41 };
  } else {
    return { rankName: 'LEGGENDA L.O.T.O.', nextRank: 'MAX', color: '#FF69B4', requiredLvl: 99 };
  }
};

export interface LevelProgress {
  currentLevel: number;
  levelTitle: string;
  stemma: string;
  color: string;
  gemColor: string;
  gemName: string;
  minXp: number;
  nextXp: number;
  xpInLevel: number;
  xpNeededForNext: number;
  percent: number; // 0 a 100
  isMaxLevel: boolean;
  rankInfo: RankInfo;
  // Progresso verso il PROSSIMO rank (blocco da 10 livelli: 1, 11, 21, 31, 41)
  rankStartMinXp: number;
  rankNextMinXp: number;
  rankXpInBlock: number;
  rankXpBlockSpan: number;
  rankPercent: number; // 0 a 100, % verso il prossimo rank (no salti visivi)
}

export const getLevelProgress = (totalXp: number, theme?: any): LevelProgress => {
  const safeXp = Math.max(0, totalXp || 0);
  const currentLevel = calculateLevel(safeXp);
  const currentThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel) || LEVEL_THRESHOLDS[0];
  const isMaxLevel = currentLevel >= LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].level;

  const minXp = currentThreshold.minXp;
  const nextXp = currentThreshold.nextXp;
  const span = Math.max(1, nextXp - minXp);
  const xpInLevel = Math.min(span, Math.max(0, safeXp - minXp));
  const percent = Math.min(100, Math.max(0, (xpInLevel / span) * 100));
  const rankInfo = getRankInfo(currentLevel);

  // Blocco rank corrente (ogni 10 livelli): inizia a 1, 11, 21, 31, 41
  const rankStartLevel = (Math.floor((currentLevel - 1) / 10) * 10) + 1;
  const rankEndLevel = Math.min(rankStartLevel + 10, LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].level);
  const rankStartThreshold = LEVEL_THRESHOLDS.find(t => t.level === rankStartLevel) || LEVEL_THRESHOLDS[0];
  const rankEndThreshold = LEVEL_THRESHOLDS.find(t => t.level === rankEndLevel) || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const rankStartMinXp = rankStartThreshold.minXp;
  const rankNextMinXp = rankEndThreshold.nextXp;
  const rankXpBlockSpan = Math.max(1, rankNextMinXp - rankStartMinXp);
  const rankXpInBlock = isMaxLevel ? rankXpBlockSpan : Math.min(rankXpBlockSpan, Math.max(0, safeXp - rankStartMinXp));
  const rankPercent = isMaxLevel ? 100 : Math.min(100, Math.max(0, (rankXpInBlock / rankXpBlockSpan) * 100));

  return {
    currentLevel,
    levelTitle: currentThreshold.title,
    stemma: currentThreshold.stemma,
    color: currentThreshold.gemColor,
    gemColor: currentThreshold.gemColor,
    gemName: currentThreshold.gemName,
    minXp,
    nextXp,
    xpInLevel,
    xpNeededForNext: span,
    percent,
    isMaxLevel,
    rankInfo,
    rankStartMinXp,
    rankNextMinXp,
    rankXpInBlock,
    rankXpBlockSpan,
    rankPercent
  };
};

export const getLevelInfo = (level: number, theme?: any) => {
  const threshold = LEVEL_THRESHOLDS.find(t => t.level === level) || LEVEL_THRESHOLDS[0];
  return {
    title: threshold.title,
    color: threshold.gemColor,
    stemma: threshold.stemma,
    gemColor: threshold.gemColor,
    gemName: threshold.gemName,
    rankInfo: getRankInfo(level)
  };
};

export const getAvatarFrameStyle = (level: number) => {
  // Calcoliamo quanto siamo vicini al prossimo Rank (da 1 a 10)
  // Esempio: Livello 14 -> progress = 4. Livello 20 -> progress = 10.
  const progressInRank = ((level - 1) % 10) + 1;
  
  // L'anello attorno all'avatar "scatta" e cresce a ogni singolo livello! (da 2 a 6.5)
  const dynamicBorderWidth = 1.5 + (progressInRank * 0.5);
  // Anche l'Aura (shadow) pulsa diventando più intensa a ogni livello
  const dynamicGlowOpacity = 0.2 + (progressInRank * 0.07);

  // Tier 5: L'Aura Dorata (Liv 41+)
  if (level >= 41) {
    return {
      borderWidth: dynamicBorderWidth + 1,
      borderColor: '#FFD700',
      shadowColor: '#FFD700',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: dynamicGlowOpacity + 0.1,
      shadowRadius: 5 + progressInRank,
      elevation: 5 + (progressInRank / 2),
    };
  }
  // Tier 4: La Fioritura del Loto (Liv 31-40)
  if (level >= 31) {
    return {
      borderWidth: dynamicBorderWidth,
      borderColor: '#00CED1',
      shadowColor: '#00CED1',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: dynamicGlowOpacity,
      shadowRadius: 4 + progressInRank,
      elevation: 4 + (progressInRank / 2),
    };
  }
  // Tier 3: La Linfa Vitale (Liv 21-30)
  if (level >= 21) {
    return {
      borderWidth: dynamicBorderWidth,
      borderColor: '#D4AF37',
      shadowColor: '#D4AF37',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: dynamicGlowOpacity,
      shadowRadius: 3 + progressInRank,
      elevation: 3 + (progressInRank / 2),
    };
  }
  // Tier 2: Le Radici Antiche (Liv 11-20)
  if (level >= 11) {
    return {
      borderWidth: dynamicBorderWidth,
      borderColor: '#2A9D8F',
      shadowColor: '#2A9D8F',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: dynamicGlowOpacity,
      shadowRadius: 2 + progressInRank,
      elevation: 2 + (progressInRank / 2),
    };
  }
  // Tier 1: Il Risveglio del Seme (Liv 1-10)
  return {
    borderWidth: dynamicBorderWidth,
    borderColor: '#8D6E63',
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: dynamicGlowOpacity,
    shadowRadius: 1 + progressInRank,
    elevation: 1 + (progressInRank / 2),
  };
};

import { GamificationEvent } from '../components/GamificationTransitionManager';
export const buildLevelUpEvents = (oldLevel: number, newLevel: number, lang: 'it' | 'en' = 'it'): GamificationEvent[] => {
  if (newLevel <= oldLevel) return [];

  const events: GamificationEvent[] = [];
  const jumpedMultiple = newLevel - oldLevel > 1;

  // 1) Una SOLA carta LEVEL_UP aggregata al livello finale (anti-flood su jump multipli)
  events.push({ type: 'LEVEL_UP', level: newLevel });

  // 2) WHISPER: solo per il livello raggiunto (salto singolo) o per i KEY_LEVELS attraversati (jump)
  const crossedKeyLevels = KEY_LEVELS.filter(lvl => lvl > oldLevel && lvl <= newLevel);
  const whisperLevels = jumpedMultiple
    ? (crossedKeyLevels.length > 0 ? crossedKeyLevels : [newLevel])
    : [newLevel];

  for (const lvl of whisperLevels) {
    const loreText = getLoreForLevel(lvl, lang);
    if (loreText) {
      events.push({
        type: 'WHISPER',
        title: `Pillola del Livello ${lvl}`,
        text: loreText,
        level: lvl,
      });
    }
  }

  // 3) REVEAL sulle sezioni che si sbloccano attraversando una soglia chiave (Eventi LV2, Community LV5)
  const revealLevels = [EVENTS_UNLOCK_LEVEL, COMMUNITY_UNLOCK_LEVEL].filter(
    lvl => oldLevel < lvl && newLevel >= lvl
  );
  for (const lvl of revealLevels) {
    const reveal = UNLOCK_REVEALS[lvl];
    if (reveal) {
      events.push({ type: 'REVEAL', level: lvl, title: reveal.title, text: reveal.text });
    }
  }

  // 4) RITO di capstone Tier 1 quando si attraversa LV10
  if (oldLevel < RITO_TIER1_LEVEL && newLevel >= RITO_TIER1_LEVEL) {
    events.push({ type: 'RITO', level: RITO_TIER1_LEVEL, title: RITO_TIER1.title, text: RITO_TIER1.text });
  }

  return events;
};
