import json

with open("app.json", "r", encoding="utf-8") as f:
    data = json.load(f)

for p in data["expo"]["plugins"]:
    if isinstance(p, list) and p[0] == "expo-build-properties":
        if "android" in p[1]:
            # Disable ProGuard/Shrink for now to ensure a stable APK build
            p[1]["android"]["enableProguardInReleaseBuilds"] = False
            p[1]["android"]["enableShrinkResourcesInReleaseBuilds"] = False

with open("app.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Disabled ProGuard")
