import re

with open("app/_layout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remove reanimated from current pos
content = content.replace("import 'react-native-reanimated';\n", "")
# Put it at the very top
content = "import 'react-native-reanimated';\n" + content

# Fix NfcManager
old_nfc = """import NfcManager from 'react-native-nfc-manager';
NfcManager.start().catch(e => console.warn('NFC non supportato in questo ambiente (es. Web/Simulatore)'));"""
new_nfc = """import NfcManager from 'react-native-nfc-manager';"""
content = content.replace(old_nfc, new_nfc)

# We need to inject NfcManager.start() inside useEffect
use_effect_injection = """  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);"""

new_use_effect = """  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      // Inizializza NFC in modo sicuro a runtime
      try {
        NfcManager.start().catch(e => console.log('NFC non supportato:', e));
      } catch(e) {}
    }
  }, [loaded]);"""

content = content.replace(use_effect_injection, new_use_effect)

with open("app/_layout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Patched layout")
