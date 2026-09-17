import re

with open('utils/SincroAvventura.ts', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """  if (!isAccessibilityMode) {
    const { status } = await Pedometer.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[SincroAvventura] Permesso Pedometro negato.');
      return;
    }
  }

  if (isAccessibilityMode) {"""

content = content.replace("  if (isAccessibilityMode) {", replacement)

with open('utils/SincroAvventura.ts', 'w', encoding='utf-8') as f:
    f.write(content)
