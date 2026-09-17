import re
with open('app/(tabs)/index.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

content = content.replace("triggerStepMilestoneNotification(km);", "// triggerStepMilestoneNotification(km);")

with open('app/(tabs)/index.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
