import re

with open("app/(tabs)/map.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("onNavigate={() => {}}", "")
content = content.replace("routePois={routePois}", "")
content = content.replace("theme={theme}", "")

with open("app/(tabs)/map.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Removed invalid props")
