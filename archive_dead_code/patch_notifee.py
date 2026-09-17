import re

with open('utils/SincroAvventura.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Comment out notifee imports and usage
content = re.sub(r"(import notifee.*?@notifee/react-native';)", r"// \1", content)
content = re.sub(r"(notifee\.registerForegroundService\()", r"// \1", content)
content = re.sub(r"(await notifee\.displayNotification\()", r"// \1", content)
content = re.sub(r"(const channelId = await notifee\.createChannel\()", r"// \1", content)
content = re.sub(r"(await notifee\.stopForegroundService\(\);)", r"// \1", content)

# Remove the body of registerForegroundService to avoid syntax errors if multiline
content = content.replace("notifee.registerForegroundService((notification) => {", "/* notifee.registerForegroundService((notification) => {")
content = content.replace("});\n});", "});\n}); */")

# Remove the body of displayNotification
content = re.sub(r"(await notifee\.displayNotification\(\{.*?\}\);)", r"/* \1 */", content, flags=re.DOTALL)
content = re.sub(r"(const channelId = await notifee\.createChannel\(\{.*?\}\);)", r"/* \1 */", content, flags=re.DOTALL)

with open('utils/SincroAvventura.ts', 'w', encoding='utf-8') as f:
    f.write(content)
