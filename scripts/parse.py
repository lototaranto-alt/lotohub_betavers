import re
with open('supabase/osm_taranto_pois.sql', 'r', encoding='utf-8') as f:
    text = f.read()
matches = re.findall(r"INSERT INTO public\.pois .*? VALUES \([^,]+, '([^']+)', '([^']+)'", text)
with open('C:/Users/Sem/.gemini/antigravity/brain/edf3a8e6-785a-4c0a-adf8-ccecfa355d1b/LISTA_POI_TARANTO.md', 'w', encoding='utf-8') as f:
    f.write('# Lista Semplificata P.O.I. Taranto\n\n')
    for name, cat in matches:
        name = name.replace("''", "'")
        f.write(f'- **{name}** ({cat})\n')
