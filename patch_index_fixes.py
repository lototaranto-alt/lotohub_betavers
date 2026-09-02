import re

with open('app/(tabs)/index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Animation (No front flips)
old_anim_logic = """{ rotate: pushRotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] }) }"""
new_anim_logic = """{ translateX: pushRotateAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }) }"""
content = content.replace(old_anim_logic, new_anim_logic)

# Rename "Memoria LOTO" to "Media Sbloccati"
content = content.replace("MEMORIA LOTO", "MEDIA SBLOCCATI")

with open('app/(tabs)/index.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Animation and Title fixed in index.tsx")
