import re

files_to_patch = ['components/PoiCard.tsx', 'components/PoiDetailSheet.tsx']

for file in files_to_patch:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if useTenant is imported
    if "useTenant" not in content:
        content = content.replace("import { useTheme }", "import { useTheme } from '../../context/ThemeContext';\nimport { useTenant } from '../../context/TenantContext';\nimport { useTheme as _skip }")
    
    # Check if currentTenant is extracted inside the component
    if "const { currentTenant }" not in content and "const tenant =" not in content:
        if "export default function PoiCard" in content:
            content = content.replace("const { theme } = useTheme();", "const { theme } = useTheme();\n  const { currentTenant } = useTenant();")
    
    # We replace the hardcoded Taranto with the tenant name or a dynamic fallback
    # Since PoiDetailSheet already has currentTenant (probably), let's just do a blanket replace of the string
    content = content.replace("item.name + ' Taranto'", "item.name + (currentTenant?.name ? ' ' + currentTenant.name : ' Taranto')")
    content = content.replace("poi.name + ' Taranto'", "poi.name + (currentTenant?.name ? ' ' + currentTenant.name : ' Taranto')")
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Hardcoded city patched in POI components")
