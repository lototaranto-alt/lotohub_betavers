import re

with open('app/_layout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove Application
content = re.sub(r"import \* as Application from 'expo-application';\n", "", content)

# Remove PostHog
content = re.sub(r"import \{ PostHogProvider \} from 'posthog-react-native';\n", "", content)
content = re.sub(r"<PostHogProvider[^>]*>", "", content)
content = re.sub(r"</PostHogProvider>", "", content)

with open('app/_layout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
