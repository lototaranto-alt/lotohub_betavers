const fs = require('fs');
let file = fs.readFileSync('components/GamificationTransitionManager.tsx', 'utf8');

file = file.replace("import * as Clipboard from 'expo-clipboard';", "// import * as Clipboard from 'expo-clipboard'; // BYPASS");
file = file.replace("await Clipboard.setStringAsync(message);", "// await Clipboard.setStringAsync(message);");

fs.writeFileSync('components/GamificationTransitionManager.tsx', file, 'utf8');
