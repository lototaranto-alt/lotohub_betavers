import re

with open('app/(tabs)/index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add DeviceEventEmitter to react-native imports if not present
if "DeviceEventEmitter" not in content[:1000]:
    content = content.replace("import { Alert, Dimensions", "import { Alert, Dimensions, DeviceEventEmitter")

with open('app/(tabs)/index.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
