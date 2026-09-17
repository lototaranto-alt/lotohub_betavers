import re

with open("components/PoiDetailSheet.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("const { theme, isElite } = useTheme();", "const { theme, isElite } = useTheme();\n  const { currentTenant } = useTenant();")

with open("components/PoiDetailSheet.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Injected currentTenant")
