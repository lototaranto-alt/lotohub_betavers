const fs = require('fs');
let file = fs.readFileSync('components/PoiDetailSheet.tsx', 'utf8');
file = file.replace('currentTenant.name', 'currentTenant.displayName');
fs.writeFileSync('components/PoiDetailSheet.tsx', file, 'utf8');
