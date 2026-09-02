import json

with open('app.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for plugin in data['expo']['plugins']:
    if isinstance(plugin, list) and plugin[0] == 'expo-splash-screen':
        plugin[1]['backgroundColor'] = '#000000'
        if 'dark' in plugin[1]:
            plugin[1]['dark']['backgroundColor'] = '#000000'

with open('app.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
