import re

with open('app/(tabs)/profile.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove Option 2 (Email)
regex_email = r"\{/\* OPZIONE 2: EMAIL CLOUD BACKUP \*/\}.*?\{/\* OPZIONE DEMO: RESET \*/\}"
content = re.sub(regex_email, "{/* OPZIONE DEMO: RESET */}", content, flags=re.DOTALL)

# Remove Option 3 (Reset)
regex_reset = r"\{/\* OPZIONE DEMO: RESET \*/\}.*?\{/\* Supporto & FAQ"
content = re.sub(regex_reset, "{/* Supporto & FAQ", content, flags=re.DOTALL)

with open('app/(tabs)/profile.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
