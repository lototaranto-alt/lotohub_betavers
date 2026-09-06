import { getLoreForLevel } from './LevelUpLore';
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
  { level: 1, minXp: 0, nextXp: 30, title: "TURISTA CURIOSO", stemma: 'explore', gemColor: '#D4AF37', gemName: 'Gemma 1' },
  { level: 2, minXp: 30, nextXp: 90, title: "TURISTA CURIOSO", stemma: 'explore', gemColor: '#D4AF37', gemName: 'Gemma 2' },
  { level: 3, minXp: 90, nextXp: 180, title: "TURISTA CURIOSO", stemma: 'explore', gemColor: '#D4AF37', gemName: 'Gemma 3' },
  { level: 4, minXp: 180, nextXp: 300, title: "TURISTA CURIOSO", stemma: 'explore', gemColor: '#D4AF37', gemName: 'Gemma 4' },
  { level: 5, minXp: 300, nextXp: 450, title: "TURISTA CURIOSO", stemma: 'explore', gemColor: '#D4AF37', gemName: 'Gemma 5' },
  { level: 6, minXp: 450, nextXp: 630, title: "TURISTA CURIOSO", stemma: 'explore', gemColor: '#D4AF37', gemName: 'Gemma 6' },
  { level: 7, minXp: 630, nextXp: 840, title: "TURISTA CURIOSO", stemma: 'explore', gemColor: '#D4AF37', gemName: 'Gemma 7' },
  { level: 8, minXp: 840, nextXp: 1080, title: "TURISTA CURIOSO", stemma: 'explore', gemColor: '#D4AF37', gemName: 'Gemma 8' },
  { level: 9, minXp: 1080, nextXp: 1350, title: "TURISTA CURIOSO", stemma: 'explore', gemColor: '#D4AF37', gemName: 'Gemma 9' },
  { level: 10, minXp: 1350, nextXp: 1650, title: "TURISTA CURIOSO", stemma: 'explore', gemColor: '#D4AF37', gemName: 'Gemma 10' },
  { level: 11, minXp: 1650, nextXp: 2080, title: "CITTADINO ATTIVO", stemma: 'shield', gemColor: '#D4AF37', gemName: 'Gemma 11' },
  { level: 12, minXp: 2080, nextXp: 2540, title: "CITTADINO ATTIVO", stemma: 'shield', gemColor: '#D4AF37', gemName: 'Gemma 12' },
  { level: 13, minXp: 2540, nextXp: 3030, title: "CITTADINO ATTIVO", stemma: 'shield', gemColor: '#D4AF37', gemName: 'Gemma 13' },
  { level: 14, minXp: 3030, nextXp: 3550, title: "CITTADINO ATTIVO", stemma: 'shield', gemColor: '#D4AF37', gemName: 'Gemma 14' },
  { level: 15, minXp: 3550, nextXp: 4100, title: "CITTADINO ATTIVO", stemma: 'shield', gemColor: '#D4AF37', gemName: 'Gemma 15' },
  { level: 16, minXp: 4100, nextXp: 4680, title: "CITTADINO ATTIVO", stemma: 'shield', gemColor: '#D4AF37', gemName: 'Gemma 16' },
  { level: 17, minXp: 4680, nextXp: 5290, title: "CITTADINO ATTIVO", stemma: 'shield', gemColor: '#D4AF37', gemName: 'Gemma 17' },
  { level: 18, minXp: 5290, nextXp: 5930, title: "CITTADINO ATTIVO", stemma: 'shield', gemColor: '#D4AF37', gemName: 'Gemma 18' },
  { level: 19, minXp: 5930, nextXp: 6600, title: "CITTADINO ATTIVO", stemma: 'shield', gemColor: '#D4AF37', gemName: 'Gemma 19' },
  { level: 20, minXp: 6600, nextXp: 7300, title: "CITTADINO ATTIVO", stemma: 'shield', gemColor: '#D4AF37', gemName: 'Gemma 20' },
  { level: 21, minXp: 7300, nextXp: 8230, title: "CUSTODE URBANO", stemma: 'security', gemColor: '#D4AF37', gemName: 'Gemma 21' },
  { level: 22, minXp: 8230, nextXp: 9190, title: "CUSTODE URBANO", stemma: 'security', gemColor: '#D4AF37', gemName: 'Gemma 22' },
  { level: 23, minXp: 9190, nextXp: 10180, title: "CUSTODE URBANO", stemma: 'security', gemColor: '#D4AF37', gemName: 'Gemma 23' },
  { level: 24, minXp: 10180, nextXp: 11200, title: "CUSTODE URBANO", stemma: 'security', gemColor: '#D4AF37', gemName: 'Gemma 24' },
  { level: 25, minXp: 11200, nextXp: 12250, title: "CUSTODE URBANO", stemma: 'security', gemColor: '#D4AF37', gemName: 'Gemma 25' },
  { level: 26, minXp: 12250, nextXp: 13330, title: "CUSTODE URBANO", stemma: 'security', gemColor: '#D4AF37', gemName: 'Gemma 26' },
  { level: 27, minXp: 13330, nextXp: 14440, title: "CUSTODE URBANO", stemma: 'security', gemColor: '#D4AF37', gemName: 'Gemma 27' },
  { level: 28, minXp: 14440, nextXp: 15580, title: "CUSTODE URBANO", stemma: 'security', gemColor: '#D4AF37', gemName: 'Gemma 28' },
  { level: 29, minXp: 15580, nextXp: 16750, title: "CUSTODE URBANO", stemma: 'security', gemColor: '#D4AF37', gemName: 'Gemma 29' },
  { level: 30, minXp: 16750, nextXp: 17950, title: "CUSTODE URBANO", stemma: 'security', gemColor: '#D4AF37', gemName: 'Gemma 30' },
  { level: 31, minXp: 17950, nextXp: 19180, title: "EROE JONICO", stemma: 'anchor', gemColor: '#D4AF37', gemName: 'Gemma 31' },
  { level: 32, minXp: 19180, nextXp: 20440, title: "EROE JONICO", stemma: 'anchor', gemColor: '#D4AF37', gemName: 'Gemma 32' },
  { level: 33, minXp: 20440, nextXp: 21730, title: "EROE JONICO", stemma: 'anchor', gemColor: '#D4AF37', gemName: 'Gemma 33' },
  { level: 34, minXp: 21730, nextXp: 23050, title: "EROE JONICO", stemma: 'anchor', gemColor: '#D4AF37', gemName: 'Gemma 34' },
  { level: 35, minXp: 23050, nextXp: 24400, title: "EROE JONICO", stemma: 'anchor', gemColor: '#D4AF37', gemName: 'Gemma 35' },
  { level: 36, minXp: 24400, nextXp: 25780, title: "EROE JONICO", stemma: 'anchor', gemColor: '#D4AF37', gemName: 'Gemma 36' },
  { level: 37, minXp: 25780, nextXp: 27190, title: "EROE JONICO", stemma: 'anchor', gemColor: '#D4AF37', gemName: 'Gemma 37' },
  { level: 38, minXp: 27190, nextXp: 28630, title: "EROE JONICO", stemma: 'anchor', gemColor: '#D4AF37', gemName: 'Gemma 38' },
  { level: 39, minXp: 28630, nextXp: 30100, title: "EROE JONICO", stemma: 'anchor', gemColor: '#D4AF37', gemName: 'Gemma 39' },
  { level: 40, minXp: 30100, nextXp: 31600, title: "EROE JONICO", stemma: 'anchor', gemColor: '#D4AF37', gemName: 'Gemma 40' },
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
  if (lvl <= 4) {
    return { rankName: 'TURISTA CURIOSO', nextRank: 'CITTADINO ATTIVO', color: '#8D6E63', requiredLvl: 5 };
  } else if (lvl <= 8) {
    return { rankName: 'CITTADINO ATTIVO', nextRank: 'CUSTODE URBANO', color: '#2A9D8F', requiredLvl: 9 };
  } else if (lvl <= 12) {
    return { rankName: 'CUSTODE URBANO', nextRank: 'EROE JONICO', color: '#D4AF37', requiredLvl: 13 };
  } else if (lvl <= 16) {
    return { rankName: 'EROE JONICO', nextRank: 'LEGGENDA L.O.T.O.', color: '#00CED1', requiredLvl: 17 };
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
    rankInfo
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
  if (level >= 10) {
    return {
      borderWidth: 4,
      borderColor: '#00F0FF',
      shadowColor: '#00F0FF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 12,
      elevation: 10,
    };
  }
  if (level >= 5) {
    return {
      borderWidth: 3.5,
      borderColor: '#FFD700',
      shadowColor: '#FFD700',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 8,
      elevation: 8,
    };
  }
  if (level >= 3) {
    return {
      borderWidth: 3,
      borderColor: '#C0C0C0',
      shadowColor: '#FFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
      elevation: 6,
    };
  }
  if (level >= 2) {
    return {
      borderWidth: 2.5,
      borderColor: '#BCA37F',
      elevation: 4,
    };
  }
  return {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    elevation: 3,
  };
};

export const buildLevelUpEvents = (oldLevel: number, newLevel: number, lang: 'it' | 'en' = 'it') => {
  if (newLevel <= oldLevel) return [];

  const events = [];
  
  for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
    events.push({
      type: 'LEVEL_UP',
      level: lvl
    });

    const loreText = getLoreForLevel(lvl, lang);
    if (loreText) {
      events.push({
        type: 'WHISPER',
        title: `Pillola del Livello ${lvl}`,
        text: loreText
      });
    }
  }

  return events;
};
