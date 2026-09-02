import re

with open('app/(tabs)/index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Import the new Modal
if "SensorsOnboardingModal" not in content:
    content = content.replace("import TipsBoutiqueSheet", "import SensorsOnboardingModal from '../../components/SensorsOnboardingModal';\nimport TipsBoutiqueSheet")

# Add state for it
if "const [isSensorsModalVisible" not in content:
    content = content.replace("const [isTipsVisible, setIsTipsVisible] = useState(false);", "const [isTipsVisible, setIsTipsVisible] = useState(false);\n  const [isSensorsModalVisible, setIsSensorsModalVisible] = useState(false);")

# Change the 14400 timeout to show the Sensors Modal if not seen
old_timeout = """      // Verrà richiesto esplicitamente solo quando l'utente entra nella Mappa (o preme check-in).
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

new_timeout = """      // Trigger intelligente per Modalità Permessi contestuale
      setTimeout(async () => {
        try {
          const onboarded = await AsyncStorage.getItem('loto_sensors_onboarded');
          if (!onboarded) {
             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=> {});
             setIsSensorsModalVisible(true);
          } else {
             // Passive location tracking if already granted
             let { status } = await Location.getForegroundPermissionsAsync();
             if (status === 'granted') {
               Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 10 }, (loc) => {
                 setUserLocation(loc);
               });
             }
          }
        } catch(e) {}
      }, 14400);"""

content = content.replace(old_timeout, new_timeout)

# Add the Component rendering
if "<SensorsOnboardingModal" not in content:
    content = content.replace("<TipsBoutiqueSheet", "<SensorsOnboardingModal visible={isSensorsModalVisible} onClose={() => setIsSensorsModalVisible(false)} theme={theme} />\n      <TipsBoutiqueSheet")

# Make the Tip button also open the Sensors Modal if not onboarded
# The button is: <TouchableOpacity onPress={() => setIsTipsVisible(true)}
old_tip_btn = "<TouchableOpacity onPress={() => setIsTipsVisible(true)} style={{ backgroundColor: '#FDFBF7', padding: 6, borderRadius: 20, elevation: 4, borderWidth: 1, borderColor: '#D4AF37' }}>"
new_tip_btn = """<TouchableOpacity onPress={async () => {
                  const ob = await AsyncStorage.getItem('loto_sensors_onboarded');
                  if (!ob) setIsSensorsModalVisible(true);
                  else setIsTipsVisible(true);
                }} style={{ backgroundColor: '#FDFBF7', padding: 6, borderRadius: 20, elevation: 4, borderWidth: 1, borderColor: '#D4AF37' }}>"""
content = content.replace(old_tip_btn, new_tip_btn)

with open('app/(tabs)/index.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Sensors Modal integrated in index.tsx")
