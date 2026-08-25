import re
import os

def update_poi_sheet():
    filepath = 'components/PoiDetailSheet.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add Location import
    if 'expo-location' not in content:
        content = content.replace("import * as WebBrowser from 'expo-web-browser';", 
                                  "import * as WebBrowser from 'expo-web-browser';\nimport * as Location from 'expo-location';\nimport { calculateDistanceRaw } from '../utils/haversine';")
                                  
    # Add states
    if 'const [gpsDistance' not in content:
        states = """
  const [gpsDistance, setGpsDistance] = useState<number | null>(null);
  const [checkinStartTime, setCheckinStartTime] = useState<number | null>(null);
  const [timerLeft, setTimerLeft] = useState<number>(0);
  const [isGpsValidating, setIsGpsValidating] = useState(false);
"""
        content = content.replace("const [activeTab", states + "  const [activeTab")

    # Add useEffect for location and timer
    if 'Location.requestForegroundPermissionsAsync' not in content:
        use_effects = """
  // Tracker Location per abilitare pulsante GPS
  useEffect(() => {
    let sub: any;
    if (visible && poi) {
      (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        
        // Controlla se c'è un timer in corso in AsyncStorage
        const savedTime = await AsyncStorage.getItem(`@checkin_start_${poi.id}`);
        if (savedTime) {
           setCheckinStartTime(parseInt(savedTime));
        }

        sub = await Location.watchPositionAsync({ distanceInterval: 10 }, (loc) => {
           if (poi.lat && poi.lng) {
              const dist = calculateDistanceRaw(loc.coords.latitude, loc.coords.longitude, poi.lat, poi.lng);
              setGpsDistance(dist * 1000); // in metri
           }
        });
      })();
    }
    return () => { if (sub) sub.remove(); };
  }, [visible, poi]);

  // Timer Tick
  useEffect(() => {
    let interval: any;
    if (checkinStartTime) {
      interval = setInterval(() => {
        const elapsed = Date.now() - checkinStartTime;
        const remaining = (10 * 60 * 1000) - elapsed;
        if (remaining <= 0) {
          setTimerLeft(0);
          clearInterval(interval);
        } else {
          setTimerLeft(Math.floor(remaining / 1000));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [checkinStartTime]);

  const handleStartVisitaGPS = async () => {
     const now = Date.now();
     await AsyncStorage.setItem(`@checkin_start_${poi.id}`, now.toString());
     setCheckinStartTime(now);
     setTimerLeft(10 * 60);
  };

  const handleRiscattaVisitaGPS = async () => {
     setIsGpsValidating(true);
     try {
       const loc = await Location.getCurrentPositionAsync({});
       const { data, error } = await supabase.rpc('scan_poi_gps', { 
         p_poi_id: poi.id,
         p_lat: loc.coords.latitude,
         p_lng: loc.coords.longitude
       });
       
       if (error) throw error;
       Alert.alert('Ottimo!', `Hai ottenuto i punti di questo POI. I tuoi XP sono ora ${data.new_total_xp}.`);
       await AsyncStorage.removeItem(`@checkin_start_${poi.id}`);
       setCheckinStartTime(null);
       onCheckIn(poi);
     } catch (e: any) {
       Alert.alert('Errore GPS', e.message);
     } finally {
       setIsGpsValidating(false);
     }
  };
"""
        content = content.replace("useEffect(() => {\n    if (visible && poi) {", use_effects + "\n  useEffect(() => {\n    if (visible && poi) {")

    # Replace NFC button logic
    old_btn = """              {/* NFC SCAN BUTTON MOVED TO TOP */}
              <TouchableOpacity 
                style={[styles.mainBtn, { backgroundColor: theme.text, elevation: 4, shadowColor: theme.text, marginTop: 15 }]}
                onPress={() => setIsScannerVisible(true)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="nfc" size={20} color={theme.background} style={{ marginRight: 8 }} />
                  <Text style={[styles.mainBtnText, { color: theme.background }]}>Acquisisci POI (NFC/QR)</Text>
                </View>
              </TouchableOpacity>
              <Text style={{ textAlign: 'center', fontSize: 11, color: theme.textMuted, marginTop: 6 }}>
                Avvicina lo smartphone al sensore oppure inquadra il QR
              </Text>"""

    new_btn = """
              {/* PULSANTE ACQUISIZIONE (NFC per Partner, GPS-Soft per Culturali) */}
              {poi.category === 'partner' ? (
                <>
                  <TouchableOpacity 
                    style={[styles.mainBtn, { backgroundColor: theme.text, elevation: 4, shadowColor: theme.text, marginTop: 15 }]}
                    onPress={() => setIsScannerVisible(true)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialIcons name="nfc" size={20} color={theme.background} style={{ marginRight: 8 }} />
                      <Text style={[styles.mainBtnText, { color: theme.background }]}>Acquisisci POI (NFC/QR)</Text>
                    </View>
                  </TouchableOpacity>
                  <Text style={{ textAlign: 'center', fontSize: 11, color: theme.textMuted, marginTop: 6 }}>
                    Avvicina lo smartphone al sensore Partner
                  </Text>
                </>
              ) : (
                <>
                  {checkinStartTime ? (
                    timerLeft > 0 ? (
                      <View style={[styles.mainBtn, { backgroundColor: '#F59E0B', marginTop: 15 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <MaterialIcons name="timer" size={20} color="#FFF" style={{ marginRight: 8 }} />
                          <Text style={[styles.mainBtnText, { color: '#FFF' }]}>
                            Visita in corso... {Math.floor(timerLeft / 60)}:{(timerLeft % 60).toString().padStart(2, '0')}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={[styles.mainBtn, { backgroundColor: '#10B981', elevation: 4, marginTop: 15 }]}
                        onPress={handleRiscattaVisitaGPS}
                        disabled={isGpsValidating}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {isGpsValidating ? <ActivityIndicator color="#FFF" /> : <MaterialIcons name="check-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />}
                          <Text style={[styles.mainBtnText, { color: '#FFF', marginLeft: isGpsValidating ? 8 : 0 }]}>Riscatta Visita</Text>
                        </View>
                      </TouchableOpacity>
                    )
                  ) : (
                    <TouchableOpacity 
                      style={[styles.mainBtn, { 
                        backgroundColor: (gpsDistance !== null && gpsDistance < 80) ? theme.primary : '#E2E8F0', 
                        elevation: 4, 
                        marginTop: 15 
                      }]}
                      onPress={handleStartVisitaGPS}
                      disabled={gpsDistance === null || gpsDistance >= 80}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialIcons name="gps-fixed" size={20} color={(gpsDistance !== null && gpsDistance < 80) ? '#FFF' : '#94A3B8'} style={{ marginRight: 8 }} />
                        <Text style={[styles.mainBtnText, { color: (gpsDistance !== null && gpsDistance < 80) ? '#FFF' : '#94A3B8' }]}>
                          Inizia Visita (GPS)
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  <Text style={{ textAlign: 'center', fontSize: 11, color: theme.textMuted, marginTop: 6 }}>
                    {gpsDistance === null 
                      ? "Calcolo posizione in corso..." 
                      : gpsDistance < 80 
                        ? "Sei nel raggio del monumento! Puoi iniziare la visita."
                        : `Avvicinati a meno di 80m. (Distanza: ${Math.round(gpsDistance)}m)`}
                  </Text>
                </>
              )}
"""
    content = content.replace(old_btn, new_btn)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("PoiDetailSheet.tsx updated successfully.")

if __name__ == "__main__":
    update_poi_sheet()
