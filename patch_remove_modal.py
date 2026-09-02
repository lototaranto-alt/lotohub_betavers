import re

with open("app/(tabs)/index.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("import SensorsOnboardingModal from '../../components/SensorsOnboardingModal';\n", "")
content = content.replace("const [isSensorsModalVisible, setIsSensorsModalVisible] = useState(false);", "")
content = re.sub(r'<SensorsOnboardingModal visible=\{isSensorsModalVisible\}.*?\n      ', '', content)

old_timeout = """      // Trigger intelligente per Modalità Permessi contestuale
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

new_timeout = """      // Location tracking passivo: se l'utente ha GIÀ dato il permesso in mappa, lo usiamo anche in Home.
      // Nessun popup forzato.
      setTimeout(async () => {
        try {
           let { status } = await Location.getForegroundPermissionsAsync();
           if (status === 'granted') {
             Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 10 }, (loc) => {
               setUserLocation(loc);
             });
           }
        } catch(e) {}
      }, 14400);"""

content = content.replace(old_timeout, new_timeout)

with open("app/(tabs)/index.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Removed intrusive modal from Home")
