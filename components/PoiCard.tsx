import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import { useTenant } from '../context/TenantContext';
import { useTheme as _skip } from '../context/ThemeContext';
import { calculateDistance } from '../utils/haversine';
import { LocationObject } from 'expo-location';

type PoiCardProps = {
  item: any;
  userLocation: LocationObject | null;
  userProfile: any;
  onAction: (poi: any) => void;
  onAlternative?: (poi: any) => void;
  onPress?: (poi: any) => void;
  isBooked?: boolean;
  t: any; // dictionary
  onOpenWebsite?: (poi: any) => void;
};

export default function PoiCard({ item, userLocation, userProfile, onAction, onAlternative, onPress, isBooked, t }: PoiCardProps) {
  const { theme } = useTheme();
  const { currentTenant } = useTenant();

  const img = item.image_url ? { uri: item.image_url } : (item.image ? (typeof item.image === 'string' ? { uri: item.image } : item.image) : require('../assets/images/eco_bg.png'));
  
  const crowdLevel = item.crowd_level || 20; // Default basso
  const isCrowded = crowdLevel > 75;
  const isMediumCrowd = crowdLevel > 40 && crowdLevel <= 75;
  
  let badgeText = '';
  let badgeColor = '';
  let badgeIcon = '';
  
  if (item.bonus_pts || (!isCrowded && !isMediumCrowd)) {
    badgeText = item.bonus_pts ? `BONUS +${item.bonus_pts} PTI` : 'META CONSIGLIATA';
    badgeColor = theme.accent;
    badgeIcon = 'workspace-premium';
  } else {
    badgeText = `CAPACITÀ: ${isCrowded ? 'ALTA' : 'MEDIA'}`;
    badgeColor = isCrowded ? '#D32F2F' : '#F57C00';
    badgeIcon = 'groups';
  }

  const hasWater = item.amenities?.includes('water');
  
  const isAccessibleUser = userProfile?.accessibility_mode === true;
  const isDifficult = (item.difficulty_score || (item.name?.includes('Castello') ? 80 : 20)) > 70;
  const showAccessibilityWarning = isAccessibleUser && isDifficult;

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper 
      style={[styles.poiCardHarmonious, isCrowded && { borderWidth: 1, borderColor: theme.secondary }]}
      onPress={onPress ? () => onPress(item) : undefined}
      activeOpacity={0.9}
    >
      <View style={styles.poiImageContainer}>
        {img ? <Image source={img} style={styles.poiImageHarmonious} contentFit="cover" transition={200} cachePolicy="memory-disk" /> : <View style={[styles.poiImageHarmonious, { backgroundColor: '#E2E8F0' }]} />}
        <View style={[styles.recommendedBadge, { backgroundColor: badgeColor, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }]}>
          <MaterialIcons name={badgeIcon as any} size={14} color="#FFF" />
          <Text style={[styles.recommendedText, { color: '#FFF', marginLeft: 4, fontSize: 10, fontWeight: 'bold' }]}>{badgeText}</Text>
        </View>
      </View>

      <View style={styles.poiInfoHarmonious}>
        <Text style={[styles.poiNameHarmonious, { color: theme.text, fontFamily: 'PlayfairDisplay_700Bold' }]} numberOfLines={1}>{item.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <MaterialIcons name="place" size={14} color={theme.primary} />
          <Text style={[styles.poiDistHarmonious, { fontFamily: 'Raleway_600SemiBold' }]}> {userLocation && item.latitude && item.longitude ? calculateDistance(userLocation.coords.latitude, userLocation.coords.longitude, item.latitude, item.longitude) : 'Calcolo distanza...'} </Text>
        </View>
        
        {showAccessibilityWarning && (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(217, 160, 91, 0.15)', padding: 8, borderRadius: 10, marginTop: 10 }}>
            <MaterialIcons name="warning-amber" size={16} color={theme.accent} />
            <Text style={{ fontSize: 10, color: theme.accent, marginLeft: 5, flex: 1, fontWeight: 'bold' }}>Questo sito presenta sfide architettoniche o barriere strutturali.</Text>
          </View>
        )}

        {isCrowded ? (
          <View style={{ marginTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: theme.secondary, fontWeight: 'bold', fontSize: 11 }}>{t.crowdWarning} ({(item.crowd_level || 85)}%)</Text>
            {onAlternative && (
              <TouchableOpacity
                style={[styles.btnActionHarmonious, { backgroundColor: theme.secondary }]}
                onPress={() => onAlternative(item)}
              >
                <Text style={styles.btnActionTextHarmonious}>{t.btnAlternative}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={{ marginTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {hasWater ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="water-drop" size={16} color={theme.primary} />
                <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 11, marginLeft: 4 }}>BONUS IDRICO</Text>
              </View>
            ) : <View />}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.btnActionHarmonious, { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' }]}
                onPress={async () => {
                  try {
                    const url = item.website_url || `https://www.google.com/search?q=${encodeURIComponent(item.name + (currentTenant?.id ? ' ' + currentTenant.displayName || currentTenant.cityName : ' Taranto'))}`;
                    await WebBrowser.openBrowserAsync(url);
                  } catch (e) {
                    Alert.alert('Errore', 'Impossibile aprire il browser');
                  }
                }}
              >
                <Text style={[styles.btnActionTextHarmonious, { color: '#475569' }]}>
                  Info & Sito
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnActionHarmonious, { backgroundColor: item.category === 'partner' ? '#0056D2' : theme.primary }]}
                onPress={() => onAction(item)}
              >
                <Text style={styles.btnActionTextHarmonious}>
                  {item.category === 'partner' ? 'Scopri il Custode' : 'Scopri & Sblocca'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  poiCardHarmonious: { marginHorizontal: 5, backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', elevation: 6, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 15, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.06)' },
  poiImageContainer: { width: '100%', height: 130 },
  poiImageHarmonious: { width: '100%', height: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  recommendedBadge: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  recommendedText: { color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginLeft: 4 },
  poiInfoHarmonious: { padding: 15, backgroundColor: '#FFF', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  poiNameHarmonious: { fontSize: 18, fontWeight: 'bold', fontFamily: 'serif' },
  poiDistHarmonious: { color: '#64748B', fontSize: 12, fontWeight: '500' },
  btnActionHarmonious: { borderRadius: 20, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, alignSelf: 'flex-start' },
  btnActionTextHarmonious: { color: '#FFF', fontWeight: 'bold', fontSize: 10, letterSpacing: 0.5 },
});
