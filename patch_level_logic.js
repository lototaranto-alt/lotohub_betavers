import fs from "fs";

const levelUtilsPath = "utils/levelUtils.ts";
let content = fs.readFileSync(levelUtilsPath, "utf-8");

const importStmt = "import { getLoreForLevel } from './LevelUpLore';\n";
if (!content.includes(importStmt)) {
    content = importStmt + content;
}

const newFunc = `
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
        title: \`Pillola del Livello \${lvl}\`,
        text: loreText
      });
    }
  }

  return events;
};
`;

if (!content.includes("buildLevelUpEvents")) {
    content += newFunc;
    fs.writeFileSync(levelUtilsPath, content, "utf-8");
    console.log("Patched levelUtils.ts");
} else {
    console.log("Already patched");
}
