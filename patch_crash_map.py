import re

with open("app/(tabs)/map.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_mapbox = """// Inizializza Mapbox con la chiave pubblica
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_KEY || 'pk.eyJ1IjoibG90b2h1YiIsImEiOiJjbW5yOGY4bXYwMTliMnNzNG84c2YwbXFqIn0.wUjhbriAWqmuGh0tn-zHtw');"""
new_mapbox = """// Inizializza Mapbox con la chiave pubblica
try {
  Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_KEY || 'pk.eyJ1IjoibG90b2h1YiIsImEiOiJjbW5yOGY4bXYwMTliMnNzNG84c2YwbXFqIn0.wUjhbriAWqmuGh0tn-zHtw');
} catch(e) {}"""
content = content.replace(old_mapbox, new_mapbox)

with open("app/(tabs)/map.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Patched map")
