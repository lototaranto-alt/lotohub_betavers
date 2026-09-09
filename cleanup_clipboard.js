const fs = require('fs');
let file = fs.readFileSync('components/GamificationTransitionManager.tsx', 'utf8');
file = file.replace("import * as Clipboard from 'expo-clipboard'; // BYPASS", "import * as Clipboard from 'expo-clipboard';");
fs.writeFileSync('components/GamificationTransitionManager.tsx', file, 'utf8');
