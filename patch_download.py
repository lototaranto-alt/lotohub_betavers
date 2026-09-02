import re

with open('loto-admin-v2/src/app/download/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the dispersive link with a direct download link
old_link = 'href="https://lototaranto-alt.github.io/loto-app-alpha/"'
new_link = 'href="https://lototaranto-alt.github.io/loto-app-alpha/loto-app.apk" download'
content = content.replace(old_link, new_link)

with open('loto-admin-v2/src/app/download/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
