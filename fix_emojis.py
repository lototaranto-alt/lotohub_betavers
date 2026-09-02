import re

with open('app/(tabs)/index.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Fix dictionaries and titles
replacements = {
    "Mete Consigliate ": "Mete Consigliate ✨",
    "Mete Consigliate ": "Mete Consigliate ✨",
    "Culturali ": "Culturali 🏛️",
    "Culturali ": "Culturali 🏛️",
    "Boutique & Partner ": "Boutique & Partner 🛍️",
    "Boutique & Partner ": "Boutique & Partner 🛍️",
    "Mete Segrete ": "Mete Segrete 🤫",
    "Mete Segrete ": "Mete Segrete 🤫",
    "Y? COMMUNITY TARANTO OGGI: 1.240 Litri risparmiati ? 45kg Plastica ? 12kg CO'": "🌍 COMMUNITY TARANTO OGGI: 1.240 Litri risparmiati • 45kg Plastica • 12kg CO2",
    "Y? TARANTO COMMUNITY TODAY: 1.240 Liters saved ? 45kg Plastic ? 12kg CO'": "🌍 TARANTO COMMUNITY TODAY: 1.240 Liters saved • 45kg Plastic • 12kg CO2",
    "Kg CO' Evitata": "Kg CO2 Evitata",
    "o CONSIGLIATO: BONUS +10 PTI": "✨ CONSIGLIATO: BONUS +10 PTI",
    "o RECOMMENDED: +10 PTS BONUS": "✨ RECOMMENDED: +10 PTS BONUS",
    "DEV TOOLS Y>? (Modalit Super User)": "DEV TOOLS 🛠️ (Modalità Super User)",
    "CUSTODE DELLA CITT?": "CUSTODE DELLA CITTÀ",
    "Ys STAZIONE REFILL: BONUS IDRICO": "💧 STAZIONE REFILL: BONUS IDRICO",
    "Y\" META MOLTO AFFOLLATA": "🔥 META MOLTO AFFOLLATA",
    "mappare la citt.": "mappare la città.",
    "mobilit dolce": "mobilità dolce",
    "la citt.": "la città."
}

# The weird characters printed in powershell are a result of reading utf-8 as windows-1252 or similar.
# Let's do regex replacements for the core concepts instead of exact string matches which might fail.
content = re.sub(r"Mete Consigliate [^\']+", "Mete Consigliate ✨", content)
content = re.sub(r"Culturali [^\']+", "Culturali 🏛️", content)
content = re.sub(r"Boutique & Partner [^\']+", "Boutique & Partner 🛍️", content)
content = re.sub(r"Mete Segrete [^\']+", "Mete Segrete 🤫", content)
content = re.sub(r"COMMUNITY TARANTO OGGI: 1.240 Litri risparmiati[^\']+", "COMMUNITY TARANTO OGGI: 1.240 Litri risparmiati • 45kg Plastica • 12kg CO2", content)
content = re.sub(r"TARANTO COMMUNITY TODAY: 1.240 Liters saved[^\']+", "TARANTO COMMUNITY TODAY: 1.240 Liters saved • 45kg Plastic • 12kg CO2", content)
content = re.sub(r"Kg CO[^\']*Evitata", "Kg CO2 Evitata", content)
content = re.sub(r"CONSIGLIATO: BONUS \+10 PTI", "✨ CONSIGLIATO: BONUS +10 PTI", content)
content = re.sub(r"RECOMMENDED: \+10 PTS BONUS", "✨ RECOMMENDED: +10 PTS BONUS", content)
content = re.sub(r"DEV TOOLS [^\(]+\(Modalit. Super User\)", "DEV TOOLS 🛠️ (Modalità Super User)", content)
content = re.sub(r"CUSTODE DELLA CITT.", "CUSTODE DELLA CITTÀ", content)
content = re.sub(r"STAZIONE REFILL: BONUS IDRICO", "💧 STAZIONE REFILL: BONUS IDRICO", content)
content = re.sub(r"META MOLTO AFFOLLATA", "🔥 META MOLTO AFFOLLATA", content)
content = re.sub(r"mappare la citt.\.", "mappare la città.", content)
content = re.sub(r"mobilit. dolce", "mobilità dolce", content)

with open('app/(tabs)/index.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Emojis Fixed in index.tsx")
