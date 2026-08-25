import requests
query='''
[out:json];
area["name"="Taranto"]->.searchArea;
(node["historic"="monument"](area.searchArea);node["amenity"="fountain"](area.searchArea);node["leisure"="park"](area.searchArea);way["leisure"="park"](area.searchArea););
out center;'''
url='http://overpass-api.de/api/interpreter'
r=requests.get(url, params={'data': query}, headers={'User-Agent': 'LotoHub/1.0'})
data=r.json()
with open('supabase/osm_taranto_pois.sql', 'w', encoding='utf-8') as f:
  for el in data.get('elements', []):
    name=el.get('tags', {}).get('name')
    if not name: continue
    name=name.replace("'", "''")
    lat=el.get('lat') or el.get('center', {}).get('lat')
    lon=el.get('lon') or el.get('center', {}).get('lon')
    cat='monument' if 'historic' in el.get('tags', {}) else 'park' if 'leisure' in el.get('tags', {}) else 'fountain'
    f.write(f"INSERT INTO public.pois (id, name, category, layer_name, tenant_id, is_active, coords) VALUES (gen_random_uuid(), '{name}', '{cat}', 'layer-{cat}', 'taranto', TRUE, ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326));\n")
