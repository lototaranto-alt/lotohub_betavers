import re

files = ['components/PoiCard.tsx', 'components/PoiDetailSheet.tsx']

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix imports
    content = content.replace("../../context/ThemeContext", "../context/ThemeContext")
    content = content.replace("../../context/TenantContext", "../context/TenantContext")
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
print("Imports fixed")
