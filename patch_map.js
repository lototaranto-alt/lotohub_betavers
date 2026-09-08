const fs = require('fs');
let file = fs.readFileSync('app/(tabs)/map.tsx', 'utf8');
file = file.replace('currentTenant.longitude', 'currentTenant.centerLng');
file = file.replace('currentTenant.latitude', 'currentTenant.centerLat');
fs.writeFileSync('app/(tabs)/map.tsx', file, 'utf8');
