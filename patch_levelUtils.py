
import { getLoreForLevel } from './LevelUpLore';

// (To be added at the bottom of utils/levelUtils.ts)
export const buildLevelUpEvents = (oldLevel: number, newLevel: number, lang: 'it' | 'en' = 'it') => {
  if (newLevel <= oldLevel) return [];

  const events = [];
  
  // Per ogni livello saltato/raggiunto
  for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
    events.push({
      type: 'LEVEL_UP',
      level: lvl
    });

    const loreText = getLoreForLevel(lvl, lang);
    if (loreText) {
      // Inserisce il whisper subito dopo il livello per creare la narrazione
      events.push({
        type: 'WHISPER',
        title: `Pillola del Livello ${lvl}`,
        text: loreText
      });
    }
  }

  return events;
};
