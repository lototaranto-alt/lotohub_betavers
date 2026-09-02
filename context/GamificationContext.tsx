import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { GamificationTransitionManager } from '../components/GamificationTransitionManager';

export type GamificationEvent = 
  | { type: 'LEVEL_UP'; level: number }
  | { type: 'WHISPER'; title: string; text: string }
  | { type: 'BADGE'; badge: { title: string; icon?: string; image?: any; color?: string; desc?: string } };

type GamificationContextType = {
  queueEvents: (events: GamificationEvent[]) => void;
};

const GamificationContext = createContext<GamificationContextType>({
  queueEvents: () => {},
});

export const useGamification = () => useContext(GamificationContext);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const transitionManagerRef = useRef<any>(null);

  const queueEvents = useCallback((events: GamificationEvent[]) => {
    if (transitionManagerRef.current) {
      transitionManagerRef.current.queueEvents(events);
    }
  }, []);

  return (
    <GamificationContext.Provider value={{ queueEvents }}>
      {children}
      <GamificationTransitionManager ref={transitionManagerRef} />
    </GamificationContext.Provider>
  );
};
