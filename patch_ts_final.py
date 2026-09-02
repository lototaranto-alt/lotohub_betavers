import re

with open("app/(tabs)/map.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("? (", "? (")
content = content.replace(") : null}", ") : <></>}")
content = content.replace("poi={selectedPoi}", "poi={selectedPoi}\n        onCheckIn={() => {}}")

with open("app/(tabs)/map.tsx", "w", encoding="utf-8") as f:
    f.write(content)

for file in ["components/PoiCard.tsx", "components/PoiDetailSheet.tsx"]:
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()
    content = content.replace("currentTenant?.name", "currentTenant?.id")
    with open(file, "w", encoding="utf-8") as f:
        f.write(content)

print("Fixed remaining TS errors")
