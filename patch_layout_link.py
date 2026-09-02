import re

with open('app/_layout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("https://loto-admin-v2.vercel.app/download", "https://tinyurl.com/Loto-Hub-Alpha")

with open('app/_layout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
