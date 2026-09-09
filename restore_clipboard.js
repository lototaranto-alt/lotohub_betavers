const fs = require('fs');
let file = fs.readFileSync('components/GamificationTransitionManager.tsx', 'utf8');

// Togliamo i commenti dalla clipboard
file = file.replace(/\/\/ import \* as Clipboard/g, 'import * as Clipboard');
file = file.replace(/\/\/ await Clipboard.setStringAsync/g, 'await Clipboard.setStringAsync');
file = file.replace(/\/\/ alert\('Testo copiato nella clipboard!'\);/g, "alert('Testo copiato nella clipboard!');");

fs.writeFileSync('components/GamificationTransitionManager.tsx', file, 'utf8');
