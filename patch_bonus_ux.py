import re

with open('app/(tabs)/index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Revert the tip button logic
old_btn = """<TouchableOpacity onPress={async () => {
                  const ob = await AsyncStorage.getItem('loto_sensors_onboarded');
                  if (!ob) setIsSensorsModalVisible(true);
                  else setIsTipsVisible(true);
                }} style={{ backgroundColor: '#FDFBF7', padding: 6, borderRadius: 20, elevation: 4, borderWidth: 1, borderColor: '#D4AF37' }}>"""
new_btn = """<TouchableOpacity onPress={() => setIsTipsVisible(true)} style={{ backgroundColor: '#FDFBF7', padding: 6, borderRadius: 20, elevation: 4, borderWidth: 1, borderColor: '#D4AF37' }}>"""

content = content.replace(old_btn, new_btn)

with open('app/(tabs)/index.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Bonus UX removed")
