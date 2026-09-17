const fs = require('fs');
let file = fs.readFileSync('utils/levelUtils.ts', 'utf8');

const newThresholds = [];
let currentXp = 0;

for (let i = 1; i <= 50; i++) {
    let title = "TURISTA CURIOSO";
    let stemma = "explore";
    
    if (i >= 41) { title = "LEGGENDA L.O.T.O."; stemma = "public"; }
    else if (i >= 31) { title = "EROE JONICO"; stemma = "anchor"; }
    else if (i >= 21) { title = "CUSTODE URBANO"; stemma = "security"; }
    else if (i >= 11) { title = "CITTADINO ATTIVO"; stemma = "shield"; }

    let nextXp = currentXp + (i * 30) + (i > 10 ? 100 : 0) + (i > 20 ? 200 : 0);
    
    newThresholds.push(`  { level: ${i}, minXp: ${currentXp}, nextXp: ${nextXp}, title: "${title}", stemma: '${stemma}', gemColor: '#D4AF37', gemName: 'Gemma ${i}' }`);
    currentXp = nextXp;
}

const replacement = `export const LEVEL_THRESHOLDS: LevelThreshold[] = [\n${newThresholds.join(',\n')}\n];`;

file = file.replace(/export const LEVEL_THRESHOLDS: LevelThreshold\[\] = \[[\s\S]*?\];/m, replacement);
fs.writeFileSync('utils/levelUtils.ts', file);
