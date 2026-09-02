import json

files = [
    r"C:\Users\Sem\Desktop\Fase Concept\whisper\WHISPER TIER PER LV1-30 UP\tier1_approdo_localized-v3.json",
    r"C:\Users\Sem\Desktop\Fase Concept\whisper\WHISPER TIER PER LV1-30 UP\tier2_radici_acqua_localized-v3.json",
    r"C:\Users\Sem\Desktop\Fase Concept\whisper\WHISPER TIER PER LV1-30 UP\tier3_sottosuolo_localized-v3.json"
]

all_lore = {}

for file in files:
    with open(file, "r", encoding="utf-8") as f:
        data = json.load(f)
        for key, val in data.items():
            # key format: whisper_t1_l1
            parts = key.split('_')
            level_str = parts[-1].replace('l', '')
            try:
                level = int(level_str)
                all_lore[level] = val
            except:
                pass

ts_content = """// Generato automaticamente dai file JSON di Lore
export type LocalizedLore = {
  it: string;
  en: string;
};

export const LEVEL_UP_LORE: Record<number, LocalizedLore> = {\n"""

for i in range(1, 31):
    if i in all_lore:
        it = all_lore[i].get('it', '').replace('"', '\\"').replace('\n', ' ')
        en = all_lore[i].get('en', '').replace('"', '\\"').replace('\n', ' ')
        ts_content += f'  {i}: {{\n    it: "{it}",\n    en: "{en}"\n  }},\n'

ts_content += "};\n\n"
ts_content += """export const getLoreForLevel = (level: number, language: 'it' | 'en' = 'it'): string | null => {
  const lore = LEVEL_UP_LORE[level];
  return lore ? lore[language] : null;
};
"""

with open("utils/LevelUpLore.ts", "w", encoding="utf-8") as f:
    f.write(ts_content)

print("LevelUpLore.ts created successfully.")
