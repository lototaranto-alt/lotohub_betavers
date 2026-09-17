import re

with open("app/(tabs)/index.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# We comment out the entire block starting with "setTimeout(async () => {" that requests Location.getForegroundPermissionsAsync
# Let's use a regex replacement to safely comment it out or remove the request
old_block = """      setTimeout(async () => {
        try {
          let { status } = await Location.getForegroundPermissionsAsync();
          if (status !== 'granted') {
            const res = await Location.requestForegroundPermissionsAsync();
            status = res.status;
          }
          if (status === 'granted') {
            Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 10 }, (loc) => {
            setUserLocation(loc);
            
            // HAPTICS QUANDO CI SI AVVICINA A UN P.O.I. (< 50 METRI)
            if (fetchedPois && fetchedPois.length > 0) {
              fetchedPois.forEach((p) => {
                const dist = calculateDistance(loc.coords.latitude, loc.coords.longitude, p.lat, p.lng);
                if (dist < 0.05) {
                   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=> {});
                }
              });
            }
          });
          }
        } catch (e) {
          console.log("Errore Permessi Posizione (Background):", e);
        }
      }, 13300);"""

new_block = """      // [MODIFICA UX] Il GPS non viene più richiesto in automatico dopo 13.3s per evitare frizione.
      // Verrà richiesto esplicitamente solo quando l'utente entra nella Mappa (o preme check-in).
      setTimeout(async () => {
        try {
          // Controlliamo solo se l'ha GIÀ garantito, altrimenti non lo forziamo con un popup
          let { status } = await Location.getForegroundPermissionsAsync();
          if (status === 'granted') {
            Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 10 }, (loc) => {
            setUserLocation(loc);
            if (fetchedPois && fetchedPois.length > 0) {
              fetchedPois.forEach((p) => {
                const dist = calculateDistance(loc.coords.latitude, loc.coords.longitude, p.lat, p.lng);
                if (dist < 0.05) {
                   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=> {});
                }
              });
            }
          });
          }
        } catch (e) {
          console.log("Errore Permessi Posizione (Background):", e);
        }
      }, 14400); // Adeguato al nuovo timing del carosello (4 x 3.6s)"""

content = content.replace(old_block, new_block)

with open("app/(tabs)/index.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("GPS timeout friction removed")
