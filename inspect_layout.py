import re
with open('app/_layout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
match = re.search(r'if \(!isAuthReady \|\| !fontsLoaded\) \{(.*?)\} return \(', content, re.DOTALL)
if match:
    print(match.group(1))
