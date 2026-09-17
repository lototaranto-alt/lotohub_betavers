import re

with open('app/(tabs)/index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Trovo l'inizio della funzione
start_idx = content.find("const renderEventsFooter = () => {")

if start_idx != -1:
    # Trovo la fine (il prossimo `const ContentWrapper`)
    end_idx = content.find("const ContentWrapper: any = ImageBackground;", start_idx)
    
    if end_idx != -1:
        events_func = """const renderEventsFooter = () => {
    if (!publicEvents || publicEvents.length === 0) return null;
    
    const isEventsUnlocked = levelProgress.currentLevel >= 2;
    
    return (
      <View style={{ marginBottom: 40, marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', fontFamily: 'PlayfairDisplay_700Bold', color: theme.text }}>
            Eventi Pubblici 📅
          </Text>
          {!isEventsUnlocked && (
            <View style={{ backgroundColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: theme.textMuted }}>SBLOCCA AL LIV 2</Text>
            </View>
          )}
        </View>
        <View style={{ opacity: isEventsUnlocked ? 1 : 0.4 }}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={publicEvents}
            keyExtractor={ev => ev.id}
            scrollEnabled={isEventsUnlocked}
            renderItem={({ item: ev }) => (
              <View style={{ width: 280, marginRight: -5 }}>
                <TouchableOpacity 
                  onPress={() => {
                    if (isEventsUnlocked && ev.url) {
                      Linking.openURL(ev.url).catch(() => console.log("Impossibile aprire URL:", ev.url));
                    }
                  }}
                  activeOpacity={0.9}
                  style={{ 
                    backgroundColor: theme.surface, 
                    padding: 20, 
                    borderRadius: 15, 
                    marginHorizontal: 10, 
                    borderWidth: 1, 
                    borderColor: isEventsUnlocked ? '#D4AF37' : theme.border,
                    shadowColor: isEventsUnlocked ? '#D4AF37' : 'transparent',
                    shadowOpacity: isEventsUnlocked ? 0.3 : 0,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 }
                  }}>
                  {!isEventsUnlocked && (
                     <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 15 }}>
                       <MaterialIcons name="lock" size={32} color={theme.textMuted} />
                     </View>
                  )}
                  <Text style={{ fontWeight: 'bold', fontSize: 16, color: theme.text }}>{ev.title}</Text>
                  <Text style={{ fontSize: 12, color: theme.primary, marginTop: 5, fontWeight: 'bold' }}>{new Date(ev.start_time).toLocaleDateString()}</Text>
                  <Text style={{ fontSize: 13, color: theme.text, marginTop: 10, lineHeight: 20 }} numberOfLines={4}>{ev.description}</Text>
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={{ paddingLeft: 10, paddingRight: 20 }}
          />
        </View>
      </View>
    );
  };

  """
        content = content[:start_idx] + events_func + content[end_idx:]
        
        with open('app/(tabs)/index.tsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Events footer replaced successfully")
    else:
        print("End boundary not found")
else:
    print("Start boundary not found")
