const fs = require('fs');
let file = fs.readFileSync('utils/BackgroundLocationTask.ts', 'utf8');

const target = `    if (eventType === Location.GeofencingEventType.Enter) {
      console.log('[GeofenceTask] Entrato nel POI:', region.identifier);
      
      // Spara notifica locale gratuita e offline`;

const replacement = `    if (eventType === Location.GeofencingEventType.Enter) {
      console.log('[GeofenceTask] Entrato nel POI:', region.identifier);

      // Debounce: Evita spam di notifiche (Max 1 ogni 10 minuti)
      const DEBOUNCE_MS = 10 * 60 * 1000;
      const lastNotifyStr = await AsyncStorage.getItem('@last_geofence_notify');
      const now = Date.now();
      
      if (lastNotifyStr) {
        const lastNotify = parseInt(lastNotifyStr, 10);
        if (now - lastNotify < DEBOUNCE_MS) {
           console.log('[GeofenceTask] Debounce attivo. Notifica silenziata per evitare spam.');
           return;
        }
      }
      
      await AsyncStorage.setItem('@last_geofence_notify', now.toString());
      
      // Spara notifica locale gratuita e offline`;

file = file.replace(target, replacement);

if (!file.includes("import AsyncStorage")) {
    file = "import AsyncStorage from '@react-native-async-storage/async-storage';\n" + file;
}

fs.writeFileSync('utils/BackgroundLocationTask.ts', file, 'utf8');
