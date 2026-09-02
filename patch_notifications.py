import re

with open("utils/notifications.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("handleNotification: async () => ({", "handleNotification: async () => ({\n    // @ts-ignore\n    shouldShowBanner: true,\n    // @ts-ignore\n    shouldShowList: true,")

with open("utils/notifications.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed TS error in notifications.ts")
