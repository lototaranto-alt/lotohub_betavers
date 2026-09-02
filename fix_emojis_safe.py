import re

with open("app/(tabs)/index.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace any sequence of "?" or weird chars after the title words with the safe unicode
content = re.sub(r"title: 'Mete Consigliate [^']+'", "title: 'Mete Consigliate \u2728'", content)
content = re.sub(r"title: 'Culturali [^']+'", "title: 'Culturali \U0001F3DB\uFE0F'", content)
content = re.sub(r"title: 'Boutique & Partner [^']+'", "title: 'Boutique & Partner \U0001F6CD\uFE0F'", content)
content = re.sub(r"title: 'Mete Segrete [^']+'", "title: 'Mete Segrete \U0001F92B'", content)

with open("app/(tabs)/index.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Unicode Emojis injected safely")
