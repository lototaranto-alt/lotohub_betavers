import json

with open("app.json", "r", encoding="utf-8") as f:
    data = json.load(f)

for p in data["expo"]["plugins"]:
    if isinstance(p, list) and p[0] == "react-native-ble-plx":
        p[1]["bluetoothAlwaysPermission"] = "L.O.T.O. HUB utilizza il Bluetooth per comunicare con i beacon interni (Musei/B&B) permettendoti check-in automatici e accessibilità indoor anche senza GPS."

with open("app.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
