const fs = require('fs');
let file = fs.readFileSync('components/PoiCard.tsx', 'utf8');
file = file.replace('currentTenant.brand_name', 'currentTenant.displayName');
file = file.replace('currentTenant.city_name', 'currentTenant.cityName');
fs.writeFileSync('components/PoiCard.tsx', file, 'utf8');
