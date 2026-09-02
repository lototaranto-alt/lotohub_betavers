import re

with open('app/(tabs)/map.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
if "scanEncryptedTag" not in content:
    content = content.replace("import { useMobility } from '../../context/MobilityContext';", "import { useMobility } from '../../context/MobilityContext';\nimport { scanEncryptedTag } from '../../utils/nfcManager';")

# Add NFC FAB
fab_replacement = '''{/* FAB GROUP (Bottom Right) */}
        <View style={{ position: 'absolute', bottom: 25, right: 20, alignItems: 'flex-end' }}>
          
          {/* FAB NFC Scanner */}
          <TouchableOpacity 
            style={[styles.fabCircle, { backgroundColor: '#5F713D', marginBottom: 15 }]}
            onPress={async () => {
              try {
                const poiId = await scanEncryptedTag();
                const matchedPoi = pois.find(p => p.id === poiId);
                if (matchedPoi) {
                  setSelectedPoi(matchedPoi);
                } else {
                  Alert.alert('Tag Valido!', 'Ma il Punto di Interesse non e presente sulla mappa attuale.');
                }
              } catch (error: any) {
                Alert.alert('Errore NFC', error.message || 'Scansione fallita.');
              }
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="nfc" size={20} color="#FFF" />
          </TouchableOpacity>'''

content = content.replace("{/* FAB GROUP (Bottom Right) */}\n        <View style={{ position: 'absolute', bottom: 25, right: 20, alignItems: 'flex-end' }}>", fab_replacement)

with open('app/(tabs)/map.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
