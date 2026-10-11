import React, { createContext, useContext, useRef, useState, useCallback, useMemo } from 'react';
import { GamificationTransitionManager, GamificationEvent } from '../components/GamificationTransitionManager';
import { getLevelProgress, LevelProgress } from '../utils/levelUtils';

export type { GamificationEvent };

export interface GamificationSyncOptions {
  badges?: any[];
  distanceToday?: number;
}

type GamificationContextType = {
  xp: number;
  level: number;
  levelTitle: string;
  levelProgress: LevelProgress;
  badges: any[];
  badgesCount: number;
  poisDiscovered: number;
  tokens: number;
  co2: number;
  distanceToday: number;
  hasData: boolean;
  syncProfile: (profile: any, options?: GamificationSyncOptions) => void;
  setBadges: (badges: any[]) => void;
  setDistanceToday: (distanceMeters: number) => void;
  queueEvents: (events: GamificationEvent[]) => void;
};

const GamificationContext = createContext<GamificationContextType>({
  xp: 0,
  level: 1,
  levelTitle: 'TURISTA OCCASIONALE',
  levelProgress: getLevelProgress(0),
  badges: [],
  badgesCount: 0,
  poisDiscovered: 0,
  tokens: 0,
  co2: 0,
  distanceToday: 0,
  hasData: false,
  syncProfile: () => {},
  setBadges: () => {},
  setDistanceToday: () => {},
  queueEvents: () => {},
});

export const useGamification = () => useContext(GamificationContext);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const transitionManagerRef = useRef<any>(null);

  const [metrics, setMetrics] = useState({
    xp: 0,
    tokens: 0,
    poisDiscovered: 0,
    co2: 0,
    badges: [] as any[],
    distanceToday: 0,
  });
  const [profileReady, setProfileReady] = useState(false);

  const queueEvents = useCallback((events: GamificationEvent[]) => {
    if (transitionManagerRef.current) {
      transitionManagerRef.current.queueEvents(events);
    }
  }, []);

  const syncProfile = useCallback((profile: any, options: GamificationSyncOptions = {}) => {
    setMetrics(prev => ({
      xp: profile?.total_xp || 0,
      tokens: profile?.total_tokens || 0,
      poisDiscovered: profile?.pois_discovered || 0,
      co2: profile?.total_co2 || 0,
      distanceToday: options.distanceToday !== undefined ? options.distanceToday : prev.distanceToday,
      badges: options.badges || prev.badges || [],
    }));
    setProfileReady(true);
  }, []);

  const setBadges = useCallback((badges: any[]) => {
    setMetrics(prev => ({ ...prev, badges: badges || [] }));
  }, []);

  const setDistanceToday = useCallback((distanceMeters: number) => {
    setMetrics(prev => ({ ...prev, distanceToday: distanceMeters }));
  }, []);

  const levelProgress = useMemo(() => getLevelProgress(metrics.xp), [metrics.xp]);

  const value = useMemo(() => ({
    xp: metrics.xp,
    level: levelProgress.currentLevel,
    levelTitle: levelProgress.levelTitle,
    levelProgress,
    badges: metrics.badges,
    badgesCount: metrics.badges.length,
    poisDiscovered: metrics.poisDiscovered,
    tokens: metrics.tokens,
    co2: metrics.co2,
    distanceToday: metrics.distanceToday,
    hasData: profileReady,
    syncProfile,
    setBadges,
    setDistanceToday,
    queueEvents,
  }), [metrics, levelProgress, profileReady, syncProfile, setBadges, setDistanceToday, queueEvents]);

  return (
    <GamificationContext.Provider value={value}>
      {children}
      <GamificationTransitionManager ref={transitionManagerRef} />
    </GamificationContext.Provider>
  );
};