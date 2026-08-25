import re

def update_map():
    with open('app/(tabs)/map.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We will carefully inject Mapbox logic
    # First, import Mapbox and MapConfig
    
    import_block = """
import { MAP_CONFIG } from '../../constants/MapConfig';
let MapboxGL: any = null;
try {
  MapboxGL = require('@rnmapbox/maps').default;
  MapboxGL.setAccessToken(MAP_CONFIG.ACCESS_TOKEN);
} catch (e) {
  console.warn("Mapbox not available (probably running in Expo Go without native modules)");
}
"""
    
    # Replace the top imports
    content = content.replace("import { useFocusEffect } from 'expo-router';", "import { useFocusEffect } from 'expo-router';\n" + import_block)
    
    # Now, find the <ScrollView> map mockup and replace it with <MapboxGL.MapView>
    # We can use regex to replace everything between <View style={styles.mapContainer}> and {/* FAB GROUP (Bottom Right) */}
    
    mapbox_implementation = """
        {MapboxGL ? (
          <MapboxGL.MapView 
            style={StyleSheet.absoluteFillObject}
            styleURL={MAP_CONFIG.STYLE_URL || MapboxGL.StyleURL.Street}
            logoEnabled={false}
            attributionEnabled={false}
          >
            <MapboxGL.Camera 
              zoomLevel={13} 
              centerCoordinate={[17.243, 40.473]} 
              animationMode="flyTo"
              animationDuration={2000}
            />
            
            {/* RENDER PINS V2 (Layer Alpha) */}
            {filteredPois.map(poi => {
              const inRoute = isPoiInRoute(poi.id);
              const isSelected = selectedPoi?.id === poi.id;
              
              // Scegli icona basata sulla categoria o layer_name
              let iconName = 'place';
              let bgColor = theme.primary;
              
              if (poi.layer_name === 'layer-cultural') {
                iconName = 'account-balance';
                bgColor = '#E63946'; // Rosso Culturale
              } else if (poi.layer_name === 'layer-park') {
                iconName = 'park';
                bgColor = '#2A9D8F'; // Verde Parco
              } else if (poi.layer_name === 'layer-monument') {
                iconName = 'account-balance';
                bgColor = '#F4A261'; // Arancio Monumento
              }
              
              return (
                <MapboxGL.PointAnnotation 
                  key={poi.id} 
                  id={poi.id} 
                  coordinate={[poi.lng, poi.lat]}
                  onSelected={() => setSelectedPoi(poi)}
                >
                  <View style={{ alignItems: 'center' }}>
                    <View style={[styles.pinDot, { 
                      backgroundColor: inRoute ? theme.accent : isSelected ? bgColor : '#FFF',
                      borderColor: inRoute ? '#FFF' : bgColor,
                      width: 24, height: 24, borderRadius: 12,
                      transform: [{ scale: isSelected ? 1.3 : inRoute ? 1.2 : 1 }]
                    }]}>
                      {inRoute ? (
                        <MaterialIcons name="check" size={14} color="#FFF" />
                      ) : (
                        <MaterialIcons name={iconName as any} size={14} color={isSelected ? '#FFF' : bgColor} />
                      )}
                    </View>
                  </View>
                </MapboxGL.PointAnnotation>
              );
            })}

            {/* RENDER EVENTS COMMUNITY */}
            {eventsOn && activeEvents.map(ev => {
              const lat = ev.lat || ev.geojson_boundary?.coordinates?.[1] || 40.4735;
              const lng = ev.lng || ev.geojson_boundary?.coordinates?.[0] || 17.2340;
              const inRoute = isEventInRoute(ev.id);
              return (
                <MapboxGL.PointAnnotation 
                  key={ev.id} 
                  id={ev.id} 
                  coordinate={[lng, lat]}
                  onSelected={() => setSelectedEvent(ev)}
                >
                  <View style={{ alignItems: 'center' }}>
                    <View style={[styles.pinDot, { 
                      backgroundColor: inRoute ? theme.accent : '#10B981',
                      borderColor: '#FFF',
                      width: 28, height: 28, borderRadius: 14,
                      transform: [{ scale: inRoute ? 1.2 : 1 }]
                    }]}>
                      <MaterialIcons name="star" size={16} color="#FFF" />
                    </View>
                  </View>
                </MapboxGL.PointAnnotation>
              );
            })}
          </MapboxGL.MapView>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
             <ActivityIndicator size="large" color={theme.primary} />
             <Text style={{ marginTop: 10, color: theme.text }}>Inizializzazione Motore Mappa...</Text>
          </View>
        )}
"""

    pattern = re.compile(r'<ScrollView ref=\{scrollVerticalRef\}.*?</ScrollView>\s*</ScrollView>', re.DOTALL)
    
    if pattern.search(content):
        content = pattern.sub(mapbox_implementation, content)
        with open('app/(tabs)/map.tsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Success: Mapbox UI inyected.")
    else:
        print("Error: Could not find the ScrollView block to replace.")

if __name__ == "__main__":
    update_map()
