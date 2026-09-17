import re

with open('app/_layout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Comment out the forceful OTA alert
content = re.sub(r"if \(Application\.nativeBuildVersion === '1'\) \{[\s\S]*?\}\n", r"/* if (Application.nativeBuildVersion === '1') { \n // Disabilitato fino al rilascio del nuovo APK V2 a Settembre\n } */\n", content)

with open('app/_layout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
