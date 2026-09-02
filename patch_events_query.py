import re

with open('app/(tabs)/index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Fetch Query
old_query = "const { data: evData } = await supabase.from('events').select('*').eq('event_type', 'web_public');"
new_query = """const todayISO = new Date().toISOString();
      const { data: evData } = await supabase
        .from('events')
        .select('*')
        .eq('event_type', 'web_public')
        .gte('start_time', todayISO)
        .order('start_time', { ascending: true })
        .limit(10);"""
content = content.replace(old_query, new_query)

# Fix 2: FlatList Card Interactivity
# We need to wrap the event card in a TouchableOpacity
old_card = """<View style={{ 
                    backgroundColor: theme.surface, """
new_card = """<TouchableOpacity 
                  onPress={() => {
                    if (isEventsUnlocked && ev.url) {
                      Linking.openURL(ev.url).catch(() => console.log("Impossibile aprire URL:", ev.url));
                    }
                  }}
                  activeOpacity={0.9}
                  style={{ 
                    backgroundColor: theme.surface, """
content = content.replace(old_card, new_card)

# Close the TouchableOpacity
old_close = """</View>
                </View>
              )}
            />"""
new_close = """</TouchableOpacity>
                </View>
              )}
            />"""
content = content.replace(old_close, new_close)

with open('app/(tabs)/index.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Event querying and interactivity patched")
