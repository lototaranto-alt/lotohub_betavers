const fs = require('fs');
let file = fs.readFileSync('C:\\Users\\Sem\\.gemini\\antigravity\\brain\\edf3a8e6-785a-4c0a-adf8-ccecfa355d1b\\SUPABASE_DEPLOYMENT.md', 'utf8');
file = file.replace("INTERVAL '24 hours'", "INTERVAL '2 hours'");
fs.writeFileSync('C:\\Users\\Sem\\.gemini\\antigravity\\brain\\edf3a8e6-785a-4c0a-adf8-ccecfa355d1b\\SUPABASE_DEPLOYMENT.md', file, 'utf8');

let file2 = fs.readFileSync('components/ProfileModal.tsx', 'utf8');
file2 = file2.replace("dura 24 ore", "dura 2 ore");
fs.writeFileSync('components/ProfileModal.tsx', file2, 'utf8');
