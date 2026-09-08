const fs = require('fs');
let file = fs.readFileSync('app/_layout.tsx', 'utf8');
file = file.replace('catch (err) {', 'catch (err: any) {');
file = file.replace('catch (fatalErr) {', 'catch (fatalErr: any) {');
fs.writeFileSync('app/_layout.tsx', file, 'utf8');
