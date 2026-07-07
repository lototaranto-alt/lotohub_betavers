import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView, Modal } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../utils/supabase';

export default function CivicDashboard() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'form' | 'leaderboard'>('form');
  
  // Form State
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [unlockedBadgeData, setUnlockedBadgeData] = useState<{name: string, icon: any, color: string, isConfirmed: boolean, isBadge: boolean, message?: string} | null>(null);

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const categories = [
    { id: 'barrier', label: 'Barriera Architett.', icon: 'accessible' },
    { id: 'degradation', label: 'Degrado Urbano', icon: 'delete-outline' },
    { id: 'lighting', label: 'Illuminazione', icon: 'lightbulb-outline' },
    { id: 'other', label: 'Altro', icon: 'more-horiz' }
  ];

  // Carica Leaderboard quando si apre il tab
  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const { data, error } = await supabase
        .from('global_impact_leaderboard')
        .select('*')
        .order('impact_score', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const handleGetLocation = async () => {
    setGpsLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Errore', 'Permesso GPS negato.');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch (e) {
      Alert.alert('Errore', 'Impossibile recuperare la posizione GPS.');
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!category) return Alert.alert('Errore', 'Seleziona una categoria');
    if (!location) return Alert.alert('Errore', 'Acquisisci la posizione GPS prima di inviare');
    
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Devi essere autenticato.');

      // 1. Calcola la cella della griglia di ~100m (3 decimali)
      const gridCell = `${location.latitude.toFixed(3)}_${location.longitude.toFixed(3)}`;

      // 2. Inserisci la segnalazione
      const { data, error } = await supabase
        .from('civic_reports')
        .insert({
          user_id: user.id,
          grid_cell_50m: gridCell,
          category,
          description,
          latitude: location.latitude,
          longitude: location.longitude
        })
        .select()
        .single();

      if (error) throw error;

      // Haptic feedback per il successo
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Controlliamo quante segnalazioni ha l'utente per la Traccia Impegno
      const { count: reportCount } = await supabase
        .from('civic_reports')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      let badgeUnlocked = '';
      let badgeIcon = 'visibility';
      let badgeColor = '#4CAF50';

      if (reportCount === 1) { badgeUnlocked = 'Osservatore Civico'; badgeIcon = 'visibility'; badgeColor = '#4CAF50'; }
      else if (reportCount === 5) { badgeUnlocked = 'Esploratore Urbano'; badgeIcon = 'explore'; badgeColor = '#2196F3'; }
      else if (reportCount === 10) { badgeUnlocked = 'Cittadino Attivo'; badgeIcon = 'security'; badgeColor = '#FF9800'; }

      // 3. Feedback basato sullo stato restituito dal Trigger SQL
      if (data?.status === 'confirmed') {
        if (badgeUnlocked) {
          setUnlockedBadgeData({ name: badgeUnlocked, icon: badgeIcon, color: badgeColor, isConfirmed: true, isBadge: true });
        } else {
          setUnlockedBadgeData({ name: 'Confermata!', icon: 'check-circle', color: theme.primary, isConfirmed: true, isBadge: false, message: 'Un altro cittadino aveva segnalato questo problema. Hai appena confermato il caso e attivato i moderatori! (+25 PTI in arrivo)' });
        }
      } else {
        if (badgeUnlocked) {
          setUnlockedBadgeData({ name: badgeUnlocked, icon: badgeIcon, color: badgeColor, isConfirmed: false, isBadge: true });
        } else {
          setUnlockedBadgeData({ name: 'Segnalazione Inviata', icon: 'check-circle-outline', color: theme.primary, isConfirmed: false, isBadge: false, message: 'Grazie per il tuo contributo prezioso! Se altri cittadini segnaleranno questo stesso problema, i nostri partner interverranno tempestivamente.' });
        }
      }
      setShowBadgeModal(true);
      
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Errore Invio', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      
      {/* TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'form' && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]}
          onPress={() => setActiveTab('form')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'form' ? theme.primary : '#94A3B8' }]}>Nuova Segnalazione</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'leaderboard' && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'leaderboard' ? theme.primary : '#94A3B8' }]}>Classifica (7gg)</Text>
        </TouchableOpacity>
      </View>

      {/* CONTENUTO */}
      <ScrollView style={styles.content}>
        
        {activeTab === 'form' ? (
          <View>
            <Text style={[styles.label, { color: theme.text }]}>1. Cosa vuoi segnalare?</Text>
            <View style={styles.categoryGrid}>
              {categories.map(cat => (
                <TouchableOpacity 
                  key={cat.id}
                  style={[styles.catBtn, { borderColor: category === cat.id ? theme.primary : theme.border, backgroundColor: category === cat.id ? theme.primary + '20' : 'transparent' }]}
                  onPress={() => setCategory(cat.id)}
                >
                  <MaterialIcons name={cat.icon as any} size={24} color={category === cat.id ? theme.primary : theme.text} />
                  <Text style={[styles.catText, { color: category === cat.id ? theme.primary : theme.text }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: theme.text, marginTop: 20 }]}>2. Posizione GPS (Obbligatoria)</Text>
            <TouchableOpacity 
              style={[styles.gpsBtn, { backgroundColor: location ? '#10B981' : theme.text }]}
              onPress={handleGetLocation}
              disabled={!!location}
            >
              <MaterialIcons name={location ? "check-circle" : "gps-fixed"} size={20} color="#FFF" />
              <Text style={styles.btnText}>
                {gpsLoading ? 'Acquisizione...' : location ? 'Coordinate Acquisite' : 'Ottieni Posizione Attuale'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.label, { color: theme.text, marginTop: 20 }]}>3. Dettagli (Opzionale)</Text>
            <TextInput 
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              placeholder="Descrivi brevemente il problema..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: isSubmitting ? theme.border : theme.primary }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Invia Segnalazione Privata</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.disclaimer}>La tua segnalazione sarà visibile solo agli enti di competenza.</Text>
          </View>
        ) : (
          <View>
            <View style={styles.leaderboardHeader}>
              <Text style={styles.leaderboardTitle}>Impact Score</Text>
              <Text style={styles.leaderboardSubtitle}>Classifica viva (ultimi 7 giorni)</Text>
            </View>

            {loadingLeaderboard ? (
              <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
            ) : leaderboard.length === 0 ? (
              <Text style={{ textAlign: 'center', marginTop: 20, color: theme.text }}>Ancora nessun dato per la classifica.</Text>
            ) : (
              leaderboard.map((user, idx) => (
                <View key={user.user_id || idx} style={[styles.leaderboardRow, { borderBottomColor: theme.border }]}>
                  <View style={styles.rankCol}>
                    <Text style={[styles.rankText, { color: idx === 0 ? '#F59E0B' : idx === 1 ? '#94A3B8' : idx === 2 ? '#B45309' : theme.text }]}>#{user.rank || idx + 1}</Text>
                  </View>
                  <Text style={[styles.nameText, { color: theme.text }]}>{user.nickname || 'Anonimo'}</Text>
                  <Text style={[styles.scoreText, { color: theme.primary }]}>{user.impact_score ? Math.floor(user.impact_score) : 0} PTI</Text>
                </View>
              ))
            )}
            <Text style={[styles.disclaimer, { marginTop: 20 }]}>*Il punteggio è la somma di camminate, scansioni e segnalazioni civiche verificate.</Text>
          </View>
        )}
      </ScrollView>

      {/* BOUTIQUE BADGE MODAL */}
      <Modal visible={showBadgeModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }}>
          {unlockedBadgeData && (
            <View style={{ backgroundColor: theme.surface, width: '85%', borderRadius: 24, padding: 30, alignItems: 'center', shadowColor: unlockedBadgeData.color, shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }}>
              
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#94A3B8', letterSpacing: 2, marginBottom: 20, textTransform: 'uppercase' }}>
                {unlockedBadgeData.isBadge ? 'NUOVO TRAGUARDO' : 'OPERAZIONE COMPLETATA'}
              </Text>

              <View style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: unlockedBadgeData.color, justifyContent: 'center', alignItems: 'center', backgroundColor: unlockedBadgeData.color + '1A', marginBottom: 20 }}>
                <MaterialIcons name={unlockedBadgeData.icon as any} size={50} color={unlockedBadgeData.color} />
              </View>

              <Text style={{ fontSize: 24, fontWeight: '900', color: theme.text, textAlign: 'center', marginBottom: 10, fontFamily: 'serif' }}>
                {unlockedBadgeData.name}
              </Text>

              <Text style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 22, marginBottom: 30 }}>
                {unlockedBadgeData.isBadge 
                  ? (unlockedBadgeData.isConfirmed 
                      ? 'Hai confermato un problema esistente e sbloccato questo badge esclusivo. Il tuo impatto è reale.' 
                      : 'Il tuo impegno civico è stato premiato. Continua a esplorare e proteggere la tua città.')
                  : unlockedBadgeData.message
                }
              </Text>

              <TouchableOpacity 
                style={{ backgroundColor: unlockedBadgeData.color, paddingVertical: 14, width: '100%', borderRadius: 12, alignItems: 'center' }}
                onPress={() => {
                  setShowBadgeModal(false);
                  setCategory('');
                  setDescription('');
                  setLocation(null);
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>CONTINUA</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
    marginTop: 10
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center'
  },
  tabText: {
    fontWeight: 'bold',
    fontSize: 14
  },
  content: {
    padding: 16
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 14
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  catBtn: {
    width: '47%',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  catText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 6,
    textAlign: 'center'
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 8
  },
  btnText: {
    color: '#FFF',
    fontWeight: 'bold'
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    textAlignVertical: 'top',
    height: 80
  },
  submitBtn: {
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16
  },
  disclaimer: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10
  },
  leaderboardHeader: {
    alignItems: 'center',
    marginBottom: 20
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B'
  },
  leaderboardSubtitle: {
    fontSize: 12,
    color: '#64748B'
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  rankCol: {
    width: 40
  },
  rankText: {
    fontWeight: 'bold',
    fontSize: 16
  },
  nameText: {
    flex: 1,
    fontWeight: '600',
    fontSize: 15
  },
  scoreText: {
    fontWeight: '900',
    fontSize: 16
  }
});
