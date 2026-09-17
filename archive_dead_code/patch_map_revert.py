import re

with open('app/(tabs)/map.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove import
content = content.replace("import { scanEncryptedTag } from '../../utils/nfcManager';\n", "")

# Remove FAB NFC
regex = r"\{/\* FAB NFC Scanner \*/\}.*?\{/\* FAB 1: Accessibilità \*/\}"
content = re.sub(regex, "{/* FAB 1: Accessibilit */}", content, flags=re.DOTALL)

with open('app/(tabs)/map.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
