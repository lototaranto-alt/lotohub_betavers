import re

with open('components/PoiDetailSheet.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Trovo il vecchio blocco accessibilità che ho inserito prima
old_access_ui = """                  {/* Accessibilità */}
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
                  )}"""

new_access_ui = """                  {/* Accessibilità a 3 Stati (Community) */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: poi.is_wheelchair_accessible === true ? 'rgba(46, 204, 113, 0.1)' : poi.is_wheelchair_accessible === false ? 'rgba(231, 76, 60, 0.1)' : 'rgba(149, 165, 166, 0.1)', padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: poi.is_wheelchair_accessible === true ? '#2ECC71' : poi.is_wheelchair_accessible === false ? '#E74C3C' : '#95A5A6' }}>
                    <MaterialIcons name={poi.is_wheelchair_accessible === true ? 'accessible' : poi.is_wheelchair_accessible === false ? 'not-accessible' : 'help-outline'} size={24} color={poi.is_wheelchair_accessible === true ? '#2ECC71' : poi.is_wheelchair_accessible === false ? '#E74C3C' : '#7F8C8D'} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: poi.is_wheelchair_accessible === true ? '#27AE60' : poi.is_wheelchair_accessible === false ? '#C0392B' : '#7F8C8D' }}>
                        {poi.is_wheelchair_accessible === true ? 'Accessibile' : poi.is_wheelchair_accessible === false ? 'Barriere Architettoniche' : 'Stato Sconosciuto'}
                      </Text>
                      <Text style={{ fontSize: 12, color: poi.is_wheelchair_accessible === true ? '#2ECC71' : poi.is_wheelchair_accessible === false ? '#E74C3C' : '#7F8C8D', marginTop: 2 }}>
                        {poi.is_wheelchair_accessible === null || poi.is_wheelchair_accessible === undefined 
                          ? 'Aiuta la community a mappare questo luogo.' 
                          : (poi.accessibility_info || 'Verificato dalla community')}
                      </Text>
                    </View>
                    {(poi.is_wheelchair_accessible === null || poi.is_wheelchair_accessible === undefined) && (
                      <TouchableOpacity style={{ backgroundColor: '#7F8C8D', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                        <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>SEGNALA</Text>
                      </TouchableOpacity>
                    )}
                  </View>"""

if old_access_ui in content:
    content = content.replace(old_access_ui, new_access_ui)
    with open('components/PoiDetailSheet.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("3-State Accessibility Patched")
else:
    print("Old UI not found")
