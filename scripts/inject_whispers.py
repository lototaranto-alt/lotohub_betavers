import os

def inject_whispers():
    filepath = 'components/PoiDetailSheet.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'const [poiWhispers' not in content:
        states = """
  const [poiWhispers, setPoiWhispers] = useState<any[]>([]);
  const [activeTab"""
        content = content.replace("  const [activeTab", states)

    if 'setVaultMedia(finalData);' in content and 'setPoiWhispers' not in content:
        whispers_fetch = """
      setVaultMedia(finalData);
      
      // Carica i Whisper associati al POI
      const { data: whisperData, error: whisperErr } = await supabase
        .from('whispers')
        .select('*')
        .eq('poi_id', poi.id);
        
      if (!whisperErr && whisperData) {
        setPoiWhispers(whisperData);
      }
"""
        content = content.replace("setVaultMedia(finalData);", whispers_fetch)

    # Inserisci UI Whispers nella tab DIGITALE, sotto o sopra media_vault
    if '🎒 RISORSE ESCLUSIVE' in content and 'MISTERI E WHISPERS' not in content:
        whispers_ui = """
            {poiWhispers.length > 0 && (
              <View style={[styles.vaultSection, { borderBottomColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>🤫 MISTERI E WHISPERS</Text>
                {poiWhispers.map(whisper => {
                   const isUnlocked = inRoute; // Qui assumiamo che se fa checkin (o mockato con inRoute) li veda
                   // Idealmente dovremmo controllare esg_raw_logs o se l'utente l'ha sbloccato.
                   // Per l'alpha, se ha fatto check-in (e quindi ha punti/is_visited = true) lo sbloccamo.
                   // Usiamo un controllo grezzo per ora:
                   const isReallyUnlocked = (poi.is_visited || inRoute || false);
                   return (
                    <View key={whisper.id} style={[styles.mediaRow, { backgroundColor: isReallyUnlocked ? '#FEF3C7' : theme.background, borderColor: isReallyUnlocked ? '#F59E0B' : theme.border, flexDirection: 'column', alignItems: 'stretch' }]}>
                      <View style={[styles.mediaInfo, { marginBottom: 10 }]}>
                        <MaterialIcons 
                          name={isReallyUnlocked ? "lock-open" : "lock"} 
                          size={24} 
                          color={isReallyUnlocked ? '#D97706' : theme.textMuted} 
                        />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text style={[styles.mediaTitle, { color: theme.text }]}>{whisper.title}</Text>
                          <Text style={[styles.mediaTypeLabel, { color: theme.textMuted }]}>
                            {isReallyUnlocked ? 'Whisper Sbloccato' : 'Segreto bloccato (Fai Check-in per leggere)'}
                          </Text>
                        </View>
                      </View>
                      {isReallyUnlocked ? (
                         <Text style={{color: theme.text, fontSize: 13, fontStyle: 'italic', marginTop: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 8}}>
                           "{whisper.content}"
                         </Text>
                      ) : (
                         <View style={{padding: 10, backgroundColor: theme.surface, borderRadius: 8, marginTop: 10, alignItems: 'center'}}>
                            <MaterialIcons name="vpn-key" size={16} color={theme.textMuted} />
                            <Text style={{color: theme.textMuted, fontSize: 11, marginTop: 4}}>La storia si rivelerà solo quando sarai sul posto.</Text>
                         </View>
                      )}
                    </View>
                   );
                })}
              </View>
            )}
            
            {vaultMedia.length > 0 && ("""
        content = content.replace("{vaultMedia.length > 0 && (", whispers_ui)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("PoiDetailSheet.tsx updated for whispers.")

if __name__ == "__main__":
    inject_whispers()
