import re

with open('components/LiveFeedBanner.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

content = re.sub(r"setMessage\(.*?esploratore.*?\);", r"setMessage(🎉 Un esploratore ha appena raggiunto !);", content)

with open('components/LiveFeedBanner.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
