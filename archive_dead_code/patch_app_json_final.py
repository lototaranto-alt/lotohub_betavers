import json

with open("app.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Add Camera Permission
if "android.permission.CAMERA" not in data["expo"]["android"]["permissions"]:
    data["expo"]["android"]["permissions"].append("android.permission.CAMERA")
    
# Add Camera and Picker Plugins
plugins = data["expo"]["plugins"]
has_camera = False
has_picker = False
for p in plugins:
    if isinstance(p, list) and p[0] == "expo-camera": has_camera = True
    elif p == "expo-camera": has_camera = True
    elif isinstance(p, list) and p[0] == "expo-image-picker": has_picker = True
    elif p == "expo-image-picker": has_picker = True

if not has_camera:
    data["expo"]["plugins"].append([
        "expo-camera",
        {
            "cameraPermission": "L.O.T.O. HUB ha bisogno della fotocamera per scansionare il tuo L.O.T.O. Pass (QR Code) e recuperare il tuo account anonimo."
        }
    ])

if not has_picker:
    data["expo"]["plugins"].append([
        "expo-image-picker",
        {
            "photosPermission": "L.O.T.O. HUB ha bisogno di accedere alla tua galleria per permetterti di caricare il L.O.T.O. Pass (QR Code) che avevi salvato in precedenza."
        }
    ])

with open("app.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Plugins and permissions updated in app.json")
