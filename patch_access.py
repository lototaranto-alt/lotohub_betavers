import re

with open('components/PoiDetailSheet.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

access_ui = """                  {/* Accessibilità */}
                  {poi.hasOwnProperty('is_wheelchair_accessible') && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: poi.is_wheelchair_accessible ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)', padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: poi.is_wheelchair_accessible ? '#2ECC71' : '#E74C3C' }}>
                      <MaterialIcons name={poi.is_wheelchair_accessible ? 'accessible' : 'not-accessible'} size={24} color={poi.is_wheelchair_accessible ? '#2ECC71' : '#E74C3C'} />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: poi.is_wheelchair_accessible ? '#27AE60' : '#C0392B' }}>
                          {poi.is_wheelchair_accessible ? 'Pienamente Accessibile' : 'Barriere Architettoniche'}
                        </Text>
                        {poi.accessibility_info && (
                          <Text style={{ fontSize: 12, color: poi.is_wheelchair_accessible ? '#2ECC71' : '#E74C3C', marginTop: 2 }}>
                            {poi.accessibility_info}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
"""

content = content.replace(
    "{/* Bio / Description */}",
    access_ui + "\n                  {/* Bio / Description */}"
)

with open('components/PoiDetailSheet.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Accessibility UI added")
