import glob
import os

files = ['supabase/osm_taranto_pois.sql', 'supabase/osm_taranto_pois_more.sql', 'supabase/osm_wanderlog_pois.sql']
all_queries = []

custom_queries = [
    "INSERT INTO public.pois (id, name, category, layer_name, tenant_id, is_active, coords) VALUES (gen_random_uuid(), 'Ecomuseo Palude la Vela', 'park', 'layer-park', 'taranto', TRUE, ST_SetSRID(ST_MakePoint(17.3216, 40.4752), 4326));",
    "INSERT INTO public.pois (id, name, category, layer_name, tenant_id, is_active, coords) VALUES (gen_random_uuid(), 'Parco delle Mura Greche', 'park', 'layer-park', 'taranto', TRUE, ST_SetSRID(ST_MakePoint(17.2647, 40.4631), 4326));",
    "INSERT INTO public.pois (id, name, category, layer_name, tenant_id, is_active, coords) VALUES (gen_random_uuid(), 'Piazza Ebalia', 'monument', 'layer-monument', 'taranto', TRUE, ST_SetSRID(ST_MakePoint(17.2427, 40.4697), 4326));",
    "INSERT INTO public.pois (id, name, category, layer_name, tenant_id, is_active, coords) VALUES (gen_random_uuid(), 'Piazza Maria Immacolata', 'monument', 'layer-monument', 'taranto', TRUE, ST_SetSRID(ST_MakePoint(17.2431, 40.4712), 4326));",
    "INSERT INTO public.pois (id, name, category, layer_name, tenant_id, is_active, coords) VALUES (gen_random_uuid(), 'Piazza Fontana', 'monument', 'layer-monument', 'taranto', TRUE, ST_SetSRID(ST_MakePoint(17.2277, 40.4789), 4326));",
    "INSERT INTO public.pois (id, name, category, layer_name, tenant_id, is_active, coords) VALUES (gen_random_uuid(), 'Chiesetta Neogotica S. Francesco da Paola', 'monument', 'layer-monument', 'taranto', TRUE, ST_SetSRID(ST_MakePoint(17.2382, 40.4705), 4326));"
]

for file in files:
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip() and not line.startswith('--'):
                    all_queries.append(line.strip())

for q in custom_queries:
    if q not in all_queries:
        all_queries.append(q)

cultural = []
always_on = []
other = []

for q in all_queries:
    # Set proper layers
    if "'museum'" in q or "'attraction'" in q or "'castle'" in q:
        q = q.replace("'layer-museum'", "'layer-cultural'").replace("'layer-attraction'", "'layer-cultural'").replace("'layer-castle'", "'layer-cultural'")
        cultural.append(q)
    elif "'park'" in q or "'fountain'" in q:
        always_on.append(q)
    else:
        other.append(q)

with open('supabase/seed_alpha_pois.sql', 'w', encoding='utf-8') as f:
    f.write('-- SEED P.O.I. DEFINITIVI (VERSIONE ALPHA)\n\n')
    f.write('-- 1. POLI CULTURALI E ATTRAZIONI (Soggetti a Orari / Check-in GPS)\n')
    f.write('-- Icone suggerite mappa/UI: 🏛️ (Museo), 🏰 (Castello), 🏺 (Archeologia)\n')
    f.write('-- Layer assegnato: layer-cultural\n')
    for q in cultural: f.write(q + '\n')
    
    f.write('\n-- 2. PARCHI E FONTANE (Sempre Accesi / Open 24h)\n')
    f.write('-- Icone suggerite mappa/UI: 🌳 (Parco), 💧 (Fontana/Refill)\n')
    for q in always_on: f.write(q + '\n')
    
    f.write('\n-- 3. MONUMENTI E PIAZZE (Check-in Rapido)\n')
    f.write('-- Icone suggerite mappa/UI: 🗿 (Monumento), 📍 (Piazza/Luogo Storico)\n')
    for q in other: f.write(q + '\n')

print(f"File generato con {len(all_queries)} POI totali.")
