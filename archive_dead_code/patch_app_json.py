import json

with open('app.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Find expo-build-properties plugin and update it
for plugin in data['expo']['plugins']:
    if isinstance(plugin, list) and plugin[0] == 'expo-build-properties':
        plugin[1]['android'] = {
            "enableProguardInReleaseBuilds": True,
            "enableShrinkResourcesInReleaseBuilds": True
        }

with open('app.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
