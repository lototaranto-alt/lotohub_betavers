import re

file_path = 'node_modules/@rnmapbox/maps/android/build.gradle'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

def replacer(match):
    original = match.group(0)
    path = original.replace("java.srcDirs += ", "").strip()
    return f"{original}\n                kotlin.srcDir {path}"

new_content = re.sub(r"java\.srcDirs \+= '.*'", replacer, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Patch applicata con successo!")
