import re

with open('app/_layout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("// NfcManager.start().catch(e => console.warn('NFC non supportato in questo ambiente (es. Web/Simulatore)'));", "import NfcManager from 'react-native-nfc-manager';\nNfcManager.start().catch(e => console.warn('NFC non supportato in questo ambiente (es. Web/Simulatore)'));")

with open('app/_layout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
