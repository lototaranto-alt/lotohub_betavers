import re

with open(r'C:\Users\Sem\.gemini\antigravity\brain\edf3a8e6-785a-4c0a-adf8-ccecfa355d1b\.system_generated\steps\433\content.md', 'r', encoding='utf-8') as f:
    content = f.read()

# Trova tutti i tag <h3> o h2 con i titoli
# In Wanderlog di solito sono <h2>1. Nome Posto</h2>
matches = re.findall(r'<h2[^>]*>(\d+\.\s+[^<]+)</h2>', content)
for m in matches:
    print(m)

# Se non trova h2, proviamo a estrarre i JSON in pagina
if not matches:
    places = re.findall(r'"name":"([^"]+)"', content)
    unique_places = set()
    for p in places:
        if len(p) > 3 and not p.startswith('http') and '{' not in p and 'Wanderlog' not in p:
            unique_places.add(p)
    print("Possibili luoghi:")
    for p in unique_places:
        print(p)
