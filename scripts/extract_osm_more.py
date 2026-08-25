import requests
import json

OVERPASS_URL = 'http://overpass-api.de/api/interpreter'

overpass_query = """
[out:json][timeout:25];
area["name"="Taranto"]["admin_level"="8"]->.searchArea;
(
  node["tourism"="museum"](area.searchArea);
  node["historic"="castle"](area.searchArea);
  node["tourism"="attraction"](area.searchArea);
  node["historic"="archaeological_site"](area.searchArea);
  way["historic"="castle"](area.searchArea);
  way["tourism"="museum"](area.searchArea);
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
    
    # Per node, lat/lon sono diretti, per way (out center) sono nel dizionario "center"
    lat = element.get('lat') or element.get('center', {}).get('lat')
    lon = element.get('lon') or element.get('center', {}).get('lon')
    if not lat or not lon: continue
    
    cat = 'museum' if 'museum' in tags.get('tourism', '') else 'castle' if tags.get('historic') == 'castle' else 'attraction'
    layer = f'layer-{cat}'
    
    safe_name = name.replace("'", "''")
    sql = f"INSERT INTO public.pois (id, name, category, layer_name, tenant_id, is_active, coords) VALUES (gen_random_uuid(), '{safe_name}', '{cat}', '{layer}', 'taranto', TRUE, ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326));"
    pois.append((name, cat, sql))

with open('supabase/osm_taranto_pois_more.sql', 'w', encoding='utf-8') as f:
    for _, _, sql in pois:
        f.write(sql + '\n')

with open('C:/Users/Sem/.gemini/antigravity/brain/edf3a8e6-785a-4c0a-adf8-ccecfa355d1b/LISTA_POI_MUSEI.md', 'w', encoding='utf-8') as f:
    f.write('# Lista P.O.I. Musei, Castelli e Attrazioni Taranto\n\n')
    for name, cat, _ in pois:
        f.write(f'- **{name}** ({cat})\n')

print(f"Trovati {len(pois)} POI (Musei, Castelli, ecc.)")
