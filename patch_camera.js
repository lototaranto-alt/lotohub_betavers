const fs = require('fs');
let file = fs.readFileSync('components/ProfileModal.tsx', 'utf8');

// 1. Aggiungiamo gli import necessari
const importLine = `import { CameraView, useCameraPermissions } from 'expo-camera';\nimport { Alert } from 'react-native';`;
if (!file.includes('CameraView')) {
    file = file.replace("import QRCode from 'react-native-qrcode-svg';", "import QRCode from 'react-native-qrcode-svg';\n" + importLine);
}

// 2. Aggiungiamo lo state isScanning e permission
const stateHookTarget = `const [activeTab, setActiveTab] = useState<'identity' | 'squad'>('identity');`;
const stateHookNew = `const [activeTab, setActiveTab] = useState<'identity' | 'squad'>('identity');\n  const [isScanning, setIsScanning] = useState(false);\n  const [permission, requestPermission] = useCameraPermissions();`;
if (!file.includes('isScanning')) {
    file = file.replace(stateHookTarget, stateHookNew);
}

// 3. Aggiungiamo la funzione handleScan
const fnTarget = `const computedLevel = levelInfo?.level || 1;`;
const fnNew = `
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setIsScanning(false);
    if (data.startsWith('loto-squad:')) {
      const leaderId = data.replace('loto-squad:', '');
      try {
        const { error } = await supabase.rpc('join_squad', { p_leader_id: leaderId });
        if (error) throw error;
        Alert.alert("Sincronia Riuscita", "Sei entrato in modalità Co-Experience!");
      } catch (e: any) {
        Alert.alert("Errore Sincronia", e.message || "Impossibile unire la squadra.");
      }
    } else {
      Alert.alert("Errore", "QR Code non valido per L.O.T.O. Squad.");
    }
  };

  const computedLevel = levelInfo?.level || 1;
`;
if (!file.includes('handleBarCodeScanned')) {
    file = file.replace(fnTarget, fnNew);
}

// 4. Sostituiamo il bottone scanBtn per aprire la fotocamera o renderizzare la fotocamera
const btnTarget = `<TouchableOpacity style={[styles.scanBtn, { backgroundColor: theme.primary }]}>
                  <MaterialIcons name="qr-code-scanner" size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.scanBtnText}>Scansiona un amico</Text>
                </TouchableOpacity>`;

const btnNew = `
                {!isScanning ? (
                  <TouchableOpacity 
                    style={[styles.scanBtn, { backgroundColor: theme.primary }]}
                    onPress={async () => {
                      if (!permission?.granted) await requestPermission();
                      setIsScanning(true);
                    }}
                  >
                    <MaterialIcons name="qr-code-scanner" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.scanBtnText}>Scansiona un amico</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ width: 250, height: 250, borderRadius: 20, overflow: 'hidden', marginTop: 20 }}>
                    <CameraView
                      style={{ flex: 1 }}
                      facing="back"
                      barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                      onBarcodeScanned={handleBarCodeScanned}
                    />
                    <TouchableOpacity style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 20 }} onPress={() => setIsScanning(false)}>
                      <MaterialIcons name="close" size={20} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                )}
`;
file = file.replace(btnTarget, btnNew);

fs.writeFileSync('components/ProfileModal.tsx', file, 'utf8');
