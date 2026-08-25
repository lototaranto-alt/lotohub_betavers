import os
import re

base_dir = r"C:\Users\Sem\Desktop\Fase Concept\whisper"

def extract_table_rows(markdown, section_header):
    # Find the section
    start_idx = markdown.find(section_header)
    if start_idx == -1:
        return []
    
    # Find the next section or end
    end_idx = markdown.find("##", start_idx + len(section_header))
    if end_idx == -1:
        end_idx = len(markdown)
        
    section_content = markdown[start_idx:end_idx]
    
    rows = []
    for line in section_content.split('\n'):
        if line.strip().startswith('|') and not line.strip().startswith('| :---'):
            cols = [col.strip() for col in line.strip().strip('|').split('|')]
            if cols[0].startswith('**') and cols[0].endswith('**'):
                cols[0] = cols[0][2:-2]
            if cols[0] != 'Campo':
                rows.append(cols)
    return rows

sql_statements = []

# Core POIs to keep
keep_pois = ["diseducation", "plasticaqqua", "tgt", "trace", "mena me"]

poi_names = []

# Delete old media and whispers
sql_statements.append("-- Crea tabella se non esiste")
sql_statements.append("CREATE TABLE IF NOT EXISTS public.whispers (\n" +
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n" +
    "poi_id UUID NOT NULL REFERENCES pois(id) ON DELETE CASCADE,\n" +
    "tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,\n" +
    "title TEXT NOT NULL,\n" +
    "content TEXT,\n" +
    "audio_url TEXT,\n" +
    "rarity INT CHECK (rarity BETWEEN 1 AND 5),\n" +
    "unlock_condition TEXT DEFAULT 'tap',\n" +
    "created_at TIMESTAMPTZ DEFAULT now()\n" +
");")

sql_statements.append("-- Pulisci media e whispers")
sql_statements.append("DELETE FROM public.media_vault;")
sql_statements.append("DELETE FROM public.whispers;")

for root, dirs, files in os.walk(base_dir):
    if "WHISPER TIER" in root:
        continue
    
    for file in files:
        if file.endswith(".md"):
            md_path = os.path.join(root, file)
            with open(md_path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
                
            # Parse Dati Base
            base_data = extract_table_rows(content, "## 1. Dati Base del P.O.I.")
            poi_name = None
            for row in base_data:
                if row[0] == 'Nome Luogo':
                    poi_name = row[1]
                    break
                    
            if not poi_name:
                continue
                
            poi_names.append(poi_name)
            
            safe_poi_name = poi_name.split(' (')[0].replace("'", "''")
            poi_id_query = f"(SELECT id FROM public.pois WHERE name ILIKE '%{safe_poi_name}%' LIMIT 1)"
            
            # Parse Media
            media_data = extract_table_rows(content, "## 2. Racconti / Audio-Guide")
            if media_data:
                media_dict = {row[0]: row[1] for row in media_data}
                
                # Cerca file .m4a o .mp3 nella cartella
                audio_file = media_dict.get('Nome File', '')
                for f_name in files:
                    if f_name.endswith('.m4a') or f_name.endswith('.mp3'):
                        audio_file = f_name
                        break
                
                title = media_dict.get('Titolo Media', '').replace("'", "''")
                req_level = media_dict.get('Livello Richiesto', '1')
                is_premium = 'true' if media_dict.get('Solo Premium', 'NO') == 'SI' else 'false'
                safe_audio = audio_file.replace("'", "''")
                sql = f"INSERT INTO public.media_vault (poi_id, media_type, media_path, title, required_level, is_premium_only, loto_cost) " \
                      f"SELECT id, 'audio', '{safe_audio}', '{title}', {req_level}, {is_premium}, 0 " \
                      f"FROM public.pois WHERE name ILIKE '%{safe_poi_name}%' LIMIT 1;"
                sql_statements.append(sql)

            # Parse Whispers
            whisper_data = extract_table_rows(content, "## 3. I ")
            if whisper_data and len(whisper_data[0]) >= 4:
                # Righe sono: Titolo Whisper, Contenuto, Rarit
                titles = whisper_data[0][1:]
                contents = whisper_data[1][1:]
                rarities = whisper_data[2][1:]
                
                for i in range(len(titles)):
                    if titles[i].strip():
                        t = titles[i].strip()
                        c = contents[i].replace("<br>", "\n").strip()
                        r = rarities[i] if rarities[i].isdigit() else "1"
                        
                        sql = f"INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity) " \
                              f"SELECT id, 'taranto', $title${t}$title$, $content${c}$content$, {r} " \
                              f"FROM public.pois WHERE name ILIKE '%{safe_poi_name}%' LIMIT 1;"
                        sql_statements.append(sql)

# Now generate the DELETE statement
conditions = []
for p in keep_pois:
    conditions.append(f"name NOT ILIKE '%{p}%'")
for p in poi_names:
    p_safe = p.split(' (')[0].replace("'", "''")
    conditions.append(f"name NOT ILIKE '%{p_safe}%'")

sql_statements.insert(0, f"DELETE FROM public.pois WHERE " + " AND ".join(conditions) + ";")
sql_statements.insert(0, "-- ELIMINAZIONE POI MOCKATI (Mantengo partner e POI reali)")

out_path = r"C:\Users\Sem\.gemini\antigravity\brain\edf3a8e6-785a-4c0a-adf8-ccecfa355d1b\scratch\seed_contents.sql"
with open(out_path, 'w', encoding='utf-8') as f:
    f.write("\n".join(sql_statements))
    
print("SQL generated successfully.")
