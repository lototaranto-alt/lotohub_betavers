import json

with open("tsconfig.json", "r", encoding="utf-8") as f:
    data = json.load(f)

if "loto-admin-v2" not in data.get("exclude", []):
    data["exclude"].append("loto-admin-v2")

with open("tsconfig.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)
print("Excluded loto-admin-v2 from TS compilation")
