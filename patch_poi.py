import re

with open('components/PoiDetailSheet.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if 'B2BFeedbackModal' not in content:
    content = content.replace("import { supabase } from '../utils/supabase';", "import { supabase } from '../utils/supabase';\nimport B2BFeedbackModal from './B2BFeedbackModal';")

# Add state
if 'const [showFeedbackModal, setShowFeedbackModal] = useState(false);' not in content:
    content = content.replace("const [activeTab, setActiveTab] = useState<'media' | 'info' | 'events'>('media');", "const [activeTab, setActiveTab] = useState<'media' | 'info' | 'events'>('media');\n  const [showFeedbackModal, setShowFeedbackModal] = useState(false);")

# Add Button in 'info' tab
button_code = """
                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDFBF2', padding: 15, borderRadius: 12, marginTop: 15, borderWidth: 1, borderColor: '#D4AF37' }}
                    onPress={() => setShowFeedbackModal(true)}
                  >
                    <MaterialIcons name="mail-outline" size={24} color="#D4AF37" />
                    <View style={{ marginLeft: 15, flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1A3621' }}>La Posta del Cuore</Text>
                      <Text style={{ fontSize: 12, color: '#6A5638', marginTop: 2 }}>Lascia un feedback anonimo al custode (Visibile solo al B&B)</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color="#D4AF37" />
                  </TouchableOpacity>
"""
if 'La Posta del Cuore' not in content:
    content = content.replace("{/* Bio / Description */}", f"{button_code}\n\n                  {{/* Bio / Description */}}")

# Add Modal at the end of ScrollView
if 'B2BFeedbackModal visible=' not in content:
    content = content.replace("</ScrollView>", "  <B2BFeedbackModal visible={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} poiId={poi.id} theme={theme} />\n        </ScrollView>")

with open('components/PoiDetailSheet.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Patched PoiDetailSheet')
