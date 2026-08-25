import requests

OVERPASS_URL = 'http://overpass-api.de/api/interpreter'

overpass_query = """
[out:json][timeout:25];
area["name"="Taranto"]["admin_level"="8"]->.searchArea;
(
  node["name"~"Palude La Vela", i](area.searchArea);
  way["name"~"Palude La Vela", i](area.searchArea);
  relation["name"~"Palude La Vela", i](area.searchArea);

  node["name"~"Mura Greche", i](area.searchArea);
  way["name"~"Mura Greche", i](area.searchArea);
  relation["name"~"Mura Greche", i](area.searchArea);
);
out center;
"""

headers = { 'User-Agent': 'LotoHub/1.0' }
response = requests.get(OVERPASS_URL, params={'data': overpass_query}, headers=headers)
data = response.json()

pois = []
for element in data.get('elements', []):
    tags = element.get('tags', {})
    name = tags.get('name')
    if not name: continue
    
    lat = element.get('lat') or element.get('center', {}).get('lat')
    lon = element.get('lon') or element.get('center', {}).get('lon')
    if not lat or not lon: continue
    
    cat = 'park'
    if 'mura greche' in name.lower():
        cat = 'monument'
    
    layer = f'layer-{cat}'
    safe_name = name.replace("'", "''")
    sql = f"INSERT INTO public.pois (id, name, category, layer_name, tenant_id, is_active, coords) VALUES (gen_random_uuid(), '{safe_name}', '{cat}', '{layer}', 'taranto', TRUE, ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326));"
    
    # Avoid duplicates by checking name
    if name not in [p[0] for p in pois]:
        pois.append((name, cat, sql))

with open('supabase/osm_taranto_missing_pois.sql', 'w', encoding='utf-8') as f:
    for _, _, sql in pois:
        f.write(sql + '\n')

with open('C:/Users/Sem/.gemini/antigravity/brain/edf3a8e6-785a-4c0a-adf8-ccecfa355d1b/LISTA_POI_MISSING.md', 'w', encoding='utf-8') as f:
    f.write('# Lista P.O.I. Specifici (Palude, Mura Greche)\n\n')
    for name, cat, _ in pois:
        f.write(f'- **{name}** ({cat})\n')

print(f"Trovati {len(pois)} POI specifici.")
