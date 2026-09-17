import json

with open("app.json", "r", encoding="utf-8") as f:
    data = json.load(f)

if "ios" in data["expo"] and "infoPlist" in data["expo"]["ios"]:
    desc = data["expo"]["ios"]["infoPlist"].get("NSMotionUsageDescription", "")
    data["expo"]["ios"]["infoPlist"]["NSMotionUsageDescription"] = desc.replace("mobilit\u01df", "mobilita").replace("mobilit\u01DF", "mobilita")

with open("app.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
