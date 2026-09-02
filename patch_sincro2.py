import re

with open('utils/SincroAvventura.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("body: Passi/Spinte elaborati: ,", "body: `Passi/Spinte elaborati: ${totalLocal}`,")

with open('utils/SincroAvventura.ts', 'w', encoding='utf-8') as f:
    f.write(content)
