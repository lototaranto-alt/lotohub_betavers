import fs from "fs";

const path = "components/PoiDetailSheet.tsx";
let content = fs.readFileSync(path, "utf-8");

if (!content.includes("useGamification")) {
    content = content.replace(
        "import { useTheme } from '../context/ThemeContext';",
        "import { useTheme } from '../context/ThemeContext';\nimport { useGamification } from '../context/GamificationContext';\nimport { buildLevelUpEvents, calculateLevel } from '../utils/levelUtils';"
    );
}

// Add the hook inside the component
if (!content.includes("const { queueEvents } = useGamification();")) {
    content = content.replace(
        "const { currentTenant } = useTenant();",
        "const { currentTenant } = useTenant();\n  const { queueEvents } = useGamification();"
    );
}

// In handleRiscattaVisitaGPS and scan_poi, we need the old XP. 
// Right now they fetch new_total_xp from data, but we don't know old XP right away unless we fetch it or store it.
// Wait, the profile query might run before. Let's just do a dirty fast fetch of old XP before calling RPC.
const newRpcCall = `
      const { data: { user } } = await supabase.auth.getUser();
      let oldXp = 0;
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('total_xp').eq('id', user.id).single();
        oldXp = prof?.total_xp || 0;
      }
      
      const { data, error } = await supabase.rpc('scan_poi', { p_poi_id: poi.id });
      if (error) throw error;
      
      const newXp = data.new_total_xp;
      const oldLevel = calculateLevel(oldXp);
      const newLevel = calculateLevel(newXp);
      
      const events = buildLevelUpEvents(oldLevel, newLevel, 'it');
      if (events.length > 0) {
        queueEvents(events);
      } else {
        Alert.alert('Ottimo!', \`Hai ottenuto i punti di questo POI. I tuoi XP sono ora \${newXp}.\`);
      }
`;

// Replace in handleRiscattaVisitaGPS
content = content.replace(
    /const \{ data, error \} = await supabase\.rpc\('scan_poi', \{ p_poi_id: poi\.id \}\);\s*if \(error\) throw error;\s*Alert\.alert\('Ottimo!', `Hai ottenuto i punti di questo POI\. I tuoi XP sono ora \$\{data\.new_total_xp\}\.`\);/g,
    newRpcCall
);

fs.writeFileSync(path, content, "utf-8");
console.log("Patched PoiDetailSheet");
