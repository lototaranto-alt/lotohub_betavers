import json

with open('app.json', 'r') as f:
    data = json.load(f)

new_plugins = []
seen_build_props = False

for p in data['expo']['plugins']:
    if isinstance(p, list) and p[0] == 'expo-build-properties':
        if not seen_build_props:
            new_plugins.append(['expo-build-properties', {'ios': {'deploymentTarget': '16.4'}}])
            seen_build_props = True
    else:
        new_plugins.append(p)

data['expo']['plugins'] = new_plugins

with open('app.json', 'w') as f:
    json.dump(data, f, indent=2)

print("app.json pulito con successo!")
