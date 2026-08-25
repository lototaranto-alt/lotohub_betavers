import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, LayoutAnimation, UIManager, Platform, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import EmptyStateCard from '../../components/EmptyStateCard';
import { supabase } from '../../utils/supabase';
import { CivicReportSheet } from '../../components/CivicReportSheet';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const HorizontalShelf = ({ title, data, renderItem, theme, onHeaderPress, loading }: any) => {
  return (
    <View style={styles.shelfContainer}>
      <TouchableOpacity 
        style={[styles.shelfHeader, { borderBottomColor: theme.border }]} 
        onPress={onHeaderPress}
        disabled={!onHeaderPress}
      >
        <Text style={[styles.shelfTitle, { color: theme.text }]}>{title}</Text>
        {onHeaderPress && <MaterialIcons name="chevron-right" size={24} color={theme.textMuted} />}
      </TouchableOpacity>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.shelfScrollContent}
        snapToAlignment="center"
        decelerationRate="fast"
      >
        {loading ? (
          <View style={{ width: 150, height: 100, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : data && data.length > 0 ? (
          data.map((item: any, index: number) => renderItem(item, index))
        ) : (
          <EmptyStateCard 
            icon="event-busy" 
            title={`Nessun ${title}`} 
            subtitle="I dati dal server non sono ancora disponibili." 
            theme={theme} 
          />
        )}
      </ScrollView>
    </View>
  );
};

export default function CommunityScreen() {
  const { theme } = useTheme();
  
  const [nodoEvents, setNodoEvents] = useState<any[]>([]);
  const [activeNodes, setActiveNodes] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  
  const [impactStats, setImpactStats] = useState({
    checkins: 0,
    co2: 0,
    reports: 0
  });

  const [isReportSheetVisible, setIsReportSheetVisible] = useState(false);

  useEffect(() => {
    fetchCommunityData();
  }, []);

  const fetchCommunityData = async () => {
    try {
      // Fetch Eventi Nodo Community
      const { data: evData, error: evErr } = await supabase
        .from('events')
        .select('*, pois(name)')
        .eq('event_type', 'nodo_community')
        .order('start_time', { ascending: true });

      if (!evErr && evData) {
        setNodoEvents(evData);
      }

      // Fetch Nodi Civici (POI con layer 'nodo_civico' o 'partner')
      const { data: nodiData, error: nodiErr } = await supabase
        .from('pois')
        .select('*')
        .in('layer_name', ['nodo_civico', 'partner', 'layer-partner'])
        .eq('is_active', true)
        .limit(5);

      if (!nodiErr && nodiData) {
        setActiveNodes(nodiData);
      }

      // Fetch Dati Cooperativi (Check-in totali)
      const { count: checkinCount, error: chErr } = await supabase
        .from('user_pois')
        .select('*', { count: 'exact', head: true });
        
      // Fetch Segnalazioni Civiche Totali
      const { count: reportCount, error: repErr } = await supabase
        .from('civic_reports')
        .select('*', { count: 'exact', head: true });
        
      if (!chErr && checkinCount !== null) {
        setImpactStats({
          checkins: checkinCount,
          co2: parseFloat((checkinCount * 0.5).toFixed(1)), // 0.5kg stimati per viaggio a piedi
          reports: (!repErr && reportCount !== null) ? reportCount : 0
        });
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEvents(false);
    }
  };

  const renderEvento = (item: any, index: number) => {
    const dataStampa = new Date(item.start_time).toLocaleDateString('it-IT', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
    return (
      <TouchableOpacity key={item.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]} activeOpacity={0.8}>
        <View style={[styles.cardIconBox, { backgroundColor: theme.primary }]}>
          <MaterialIcons name="groups" size={24} color="#FFF" />
        </View>
        <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
        <Text style={[styles.cardSubtitle, { color: theme.textMuted }]} numberOfLines={1}>
          {item.pois?.name || 'Taranto'}
        </Text>
        <View style={{ marginTop: 10, padding: 4, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: theme.primary }}>{dataStampa}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderImpactStat = (title: string, value: string, icon: any, color: string, index: number) => (
    <View key={index} style={[styles.card, { flex: 1, padding: 10, marginHorizontal: 4, backgroundColor: theme.surface, borderColor: theme.border, elevation: 0 }]}>
      <View style={[styles.cardIconBox, { backgroundColor: color, width: 40, height: 40, borderRadius: 20 }]}>
        <MaterialIcons name={icon} size={20} color="#FFF" />
      </View>
      <Text style={[styles.cardTitle, { color: theme.text, fontSize: 16 }]} numberOfLines={1}>{value}</Text>
      <Text style={[styles.cardSubtitle, { color: theme.textMuted, fontSize: 9 }]}>{title}</Text>
    </View>
  );

  return (
    <ImageBackground source={require('../../assets/images/elite_bg.png')} style={{ flex: 1, backgroundColor: theme.background }} imageStyle={{ opacity: 0.15 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Community</Text>
          <Text style={styles.headerSubtitle}>Impatto Cooperativo e Nodi Civici</Text>
        </View>

        <TouchableOpacity 
          style={styles.newReportBtn}
          onPress={() => setIsReportSheetVisible(true)}
          activeOpacity={0.9}
        >
          <MaterialIcons name="add-alert" size={24} color="#FFF" style={{ marginRight: 10 }} />
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16, fontFamily: 'serif' }}>Invia Segnalazione Civica</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          
          {/* SEZIONE EVENTI: CALENDARIO + LISTA */}
          <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
            <Text style={[styles.shelfTitle, { color: theme.text, marginBottom: 15 }]}>Agenda Eventi</Text>
            
            {/* Componente Calendario Orizzontale (Mockup UI) */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              {[1, 2, 3, 4, 5].map((day, idx) => (
                <TouchableOpacity key={idx} style={{ 
                  width: 55, 
                  height: 70, 
                  backgroundColor: idx === 1 ? theme.primary : theme.surface, 
                  borderRadius: 16, 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: idx === 1 ? theme.primary : theme.border,
                  elevation: idx === 1 ? 4 : 0,
                  shadowColor: theme.primary,
                  shadowOpacity: idx === 1 ? 0.3 : 0,
                  shadowRadius: 5
                }}>
                  <Text style={{ fontSize: 10, color: idx === 1 ? '#FFF' : theme.textMuted, textTransform: 'uppercase', marginBottom: 5 }}>LUN</Text>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: idx === 1 ? '#FFF' : theme.text }}>{12 + idx}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Lista Eventi del Giorno Selezionato */}
            <HorizontalShelf 
              title="In programmazione" 
              data={nodoEvents} 
              renderItem={renderEvento} 
              theme={theme} 
              loading={loadingEvents}
            />
          </View>

          {/* Dashboard Impatto Cooperativo (Gamification Asimmetrica) - 2x2 Grid */}
          <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
            <Text style={[styles.shelfTitle, { color: theme.text, marginBottom: 5 }]}>Impatto Collettivo</Text>
            <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 15, fontStyle: 'italic' }}>
              L.O.T.O. non usa classifiche competitive. Ogni check-in unisce le forze della community.
            </Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <View style={{ width: '48%' }}>
                {renderImpactStat("Check-in Totali", impactStats.checkins.toString(), "check-circle", "#4CAF50", 1)}
              </View>
              <View style={{ width: '48%' }}>
                {renderImpactStat("CO₂ Evitata (kg)", impactStats.co2.toString(), "eco", "#8BC34A", 2)}
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ width: '48%' }}>
                {renderImpactStat("KM Esplorati", (impactStats.co2 / 0.12).toFixed(1), "directions-walk", theme.secondary, 3)}
              </View>
              <View style={{ width: '48%' }}>
                {renderImpactStat("Segnalazioni", impactStats.reports.toString(), "add-alert", "#D6734E", 4)}
              </View>
            </View>
          </View>

          {/* Test UI: Lista Nodi Civici in Container Moderno (Glassmorphism/Card) */}
          <View style={{ marginTop: 25, paddingHorizontal: 20 }}>
            
            <View style={{ 
              backgroundColor: theme.surface, 
              borderRadius: 24, 
              padding: 20, 
              borderWidth: 1, 
              borderColor: 'rgba(255,255,255,0.05)',
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 15,
            }}>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 18, fontFamily: 'serif', fontWeight: 'bold', color: theme.text }}>Nodi Civici Attivi</Text>
                <TouchableOpacity style={{ backgroundColor: theme.primary + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: theme.primary }}>VEDI MAPPA</Text>
                </TouchableOpacity>
              </View>

              <View style={{ gap: 15 }}>
                {activeNodes.length > 0 ? (
                  activeNodes.map((nodo, index) => (
                    <React.Fragment key={nodo.id}>
                      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: theme.secondary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 15 }}>
                          <MaterialIcons name="volunteer-activism" size={24} color={theme.secondary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>{nodo.name}</Text>
                          <Text style={{ fontSize: 12, color: theme.textMuted }}>
                            {nodo.layer_name === 'partner' ? 'Partner Ufficiale' : 'Presidio Civico'}
                          </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={theme.textMuted} />
                      </TouchableOpacity>
                      {index < activeNodes.length - 1 && (
                        <View style={{ height: 1, backgroundColor: theme.border, opacity: 0.5 }} />
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <Text style={{ fontSize: 14, color: theme.textMuted, fontStyle: 'italic', textAlign: 'center', marginVertical: 10 }}>
                    Nessun nodo attivo al momento.
                  </Text>
                )}
              </View>
            </View>
          </View>
          
        </ScrollView>
        
        <CivicReportSheet 
          visible={isReportSheetVisible}
          onClose={() => setIsReportSheetVisible(false)}
          userId={''}
          initialLocation={{ lat: 40.47, lng: 17.24 }}
        />

      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, marginTop: 25, marginBottom: 15 },
  headerTitle: { fontSize: 32, fontWeight: '900', fontFamily: 'serif' },
  headerSubtitle: { fontSize: 14, color: '#475569', marginTop: 5, fontFamily: 'serif', fontStyle: 'italic', textShadowColor: 'rgba(255, 255, 255, 0.9)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  
  newReportBtn: { backgroundColor: '#D4AF37', marginHorizontal: 20, marginBottom: 15, borderRadius: 16, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 3 },
  
  shelfContainer: { marginBottom: 20 },
  shelfHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: 1 },
  shelfTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'serif' },
  shelfScrollContent: { paddingHorizontal: 20, paddingTop: 15, gap: 15 },
  
  card: { width: 140, padding: 15, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  cardIconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  cardSubtitle: { fontSize: 10, textAlign: 'center' }
});
