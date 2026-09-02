import json

with open("app.json", "r", encoding="utf-8") as f:
    data = json.load(f)

if "reactCompiler" in data["expo"].get("experiments", {}):
    del data["expo"]["experiments"]["reactCompiler"]

with open("app.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Removed reactCompiler")
