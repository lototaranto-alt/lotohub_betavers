import json

with open("app.json", "r", encoding="utf-8") as f:
    data = json.load(f)

plugins = data["expo"]["plugins"]
has_ble = False
for p in plugins:
    if isinstance(p, list) and p[0] == "@config-plugins/react-native-ble-plx": has_ble = True
    elif isinstance(p, list) and p[0] == "react-native-ble-plx": has_ble = True
    elif p == "react-native-ble-plx": has_ble = True

if not has_ble:
    data["expo"]["plugins"].append([
        "@config-plugins/react-native-ble-plx",
        {
            "isBackgroundEnabled": True,
            "modes": ["peripheral", "central"],
            "bluetoothAlwaysPermission": "L.O.T.O. HUB utilizza il Bluetooth per comunicare con i beacon interni (Musei/B&B) permettendoti check-in automatici e accessibilità indoor anche senza GPS."
        }
    ])

with open("app.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("BLE plugin added to app.json")
