import re

with open('app/(tabs)/index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("Memoria LOTO", "Media Sbloccati")
content = re.sub(r'Sbloccati: \{Math\.floor\(\(userProfile\?\.pois_discovered \|\| 0\) \* 1\.5\)\}', 'Esplora la tua galleria', content)

with open('app/(tabs)/index.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Mock scrubbed in Memoria LOTO")
