import re

with open('utils/SincroAvventura.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace block comments properly
content = re.sub(r"// Registrazione Headless Task per Android Notifee.*?\}\); \*/", "", content, flags=re.DOTALL)
content = re.sub(r"// Registrazione Headless Task per Android Notifee[\s\S]*?(?=\nasync function syncSteps)", "", content)

# Clean up other notifee calls
content = re.sub(r"if \(Platform\.OS === 'android'\) \{\s*// /\* await notifee\.displayNotification\(\{[\s\S]*?\}\); \*/\s*\}", "", content)
content = re.sub(r"if \(Platform\.OS === 'android'\) \{\s*// /\* const channelId = await notifee\.createChannel\(\{[\s\S]*?\}\); \*/\s*// /\* await notifee\.displayNotification\(\{[\s\S]*?\}\); \*/\s*\}", "", content)

with open('utils/SincroAvventura.ts', 'w', encoding='utf-8') as f:
    f.write(content)
