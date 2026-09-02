import re

with open('app/_layout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'Sincronizzazione Identit.', 'Sincronizzazione Identità', content)

with open('app/_layout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Layout fixed")
