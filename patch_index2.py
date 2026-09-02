import re

with open('app/(tabs)/index.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Remove the bad import
content = re.sub(r"import \{ triggerStepMilestoneNotification \} from '../../utils/notifications';\n", "", content)

# Import LiveFeedBanner
if "LiveFeedBanner" not in content[:1000]:
    content = content.replace("import TipsBoutiqueSheet", "import LiveFeedBanner from '../../components/LiveFeedBanner';\nimport TipsBoutiqueSheet")

# Fix the ticker syntax just in case
content = content.replace("CO'''", "CO2'")

with open('app/(tabs)/index.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
