import requests

OVERPASS_URL = 'http://overpass-api.de/api/interpreter'

overpass_query = """
[out:json][timeout:25];
area["name"="Taranto"]["admin_level"="8"]->.searchArea;
(
  node["name"~"Piazza Ebalia|Piazza Maria Immacolata|Piazza Fontana|San Francesco da Paola"](area.searchArea);
  way["name"~"Piazza Ebalia|Piazza Maria Immacolata|Piazza Fontana|San Francesco da Paola"](area.searchArea);
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
    
    cat = 'monument'
    
    layer = f'layer-{cat}'
    safe_name = name.replace("'", "''")
    sql = f"INSERT INTO public.pois (id, name, category, layer_name, tenant_id, is_active, coords) VALUES (gen_random_uuid(), '{safe_name}', '{cat}', '{layer}', 'taranto', TRUE, ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326));"
    
    if name not in [p[0] for p in pois]:
        pois.append((name, cat, sql))

with open('supabase/osm_wanderlog_pois.sql', 'w', encoding='utf-8') as f:
    for _, _, sql in pois:
        f.write(sql + '\n')

print(f"Trovati {len(pois)} POI da Wanderlog.")
