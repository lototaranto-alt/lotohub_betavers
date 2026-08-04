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
  { level: 1, minXp: 0, nextXp: 30, title: "TURISTA CURIOSO", stemma: 'explore', gemColor: '#8D6E63', gemName: 'Pietra Calcare' },
  { level: 2, minXp: 30, nextXp: 60, title: "TURISTA CURIOSO", stemma: 'local-fire-department', gemColor: '#D4A373', gemName: 'Quarzo Citrino' },
  { level: 3, minXp: 60, nextXp: 100, title: "TURISTA CURIOSO", stemma: 'visibility', gemColor: '#9B5DE5', gemName: 'Ametista Ipogea' },
  { level: 4, minXp: 100, nextXp: 150, title: "TURISTA CURIOSO", stemma: 'navigation', gemColor: '#1D3557', gemName: 'Zaffiro Jonico' },
  { level: 5, minXp: 150, nextXp: 210, title: "CITTADINO ATTIVO", stemma: 'shield', gemColor: '#2A9D8F', gemName: 'Smeraldo Borbonico' },
  { level: 6, minXp: 210, nextXp: 280, title: "CITTADINO ATTIVO", stemma: 'military-tech', gemColor: '#E76F51', gemName: 'Rubino Dorico' },
  { level: 7, minXp: 280, nextXp: 360, title: "CITTADINO ATTIVO", stemma: 'wb-sunny', gemColor: '#457B9D', gemName: 'Acquamarina' },
  { level: 8, minXp: 360, nextXp: 450, title: "CITTADINO ATTIVO", stemma: 'auto-awesome', gemColor: '#F4A261', gemName: 'Opale del Golfo' },
  { level: 9, minXp: 450, nextXp: 550, title: "CUSTODE URBANO", stemma: 'workspace-premium', gemColor: '#D4AF37', gemName: 'Diamante Ellenico' },
  { level: 10, minXp: 550, nextXp: 700, title: "CUSTODE URBANO", stemma: 'stars', gemColor: '#E0A96D', gemName: 'Tridente Cosmico' },
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
    return { rankName: 'CITTADINO ATTIVO', nextRank: 'CUSTODE URBANO', color: '#BCA37F', requiredLvl: 9 };
  } else if (lvl <= 12) {
    return { rankName: 'CUSTODE URBANO', nextRank: 'EROE JONICO', color: '#D4AF37', requiredLvl: 13 };
  } else {
    return { rankName: 'EROE JONICO', nextRank: 'MAX', color: '#9B5DE5', requiredLvl: 99 };
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
