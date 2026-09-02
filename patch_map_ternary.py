import re

with open("app/(tabs)/map.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("{heatmapOn && (", "{heatmapOn ? (")
content = content.replace("/>\n          )}", "/>\n          ) : null}")

content = content.replace("{eventsOn && (", "{eventsOn ? (")
content = content.replace("/>\n          )}", "/>\n          ) : null}") # wait, the events one might be different

with open("app/(tabs)/map.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Replaced && with ? : null")
