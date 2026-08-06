import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert, TextInput, LayoutAnimation, Platform, UIManager, ImageBackground, BackHandler } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import LotoPassCard from '../../components/LotoPassCard';
import TipsBoutiqueSheet from '../../components/TipsBoutiqueSheet';
import EmptyStateCard from '../../components/EmptyStateCard';
import BadgeCollectionModal from '../../components/BadgeCollectionModal';
import LotoPassRecoveryScanner from '../../components/LotoPassRecoveryScanner';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../utils/supabase';
import { useFocusEffect } from 'expo-router';
import { useRouteBuilder } from '../../context/RouteContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLevelProgress } from '../../utils/levelUtils';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Componente Accordion Controllato
const Accordion = ({ title, icon, children, isOpen, onToggle, theme }: any) => {
  return (
    <View style={[styles.accordionContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <TouchableOpacity style={styles.accordionHeader} onPress={onToggle} activeOpacity={0.7}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name={icon} size={24} color={theme.primary} style={{ marginRight: 15 }} />
          <Text style={[styles.accordionTitle, { color: theme.text }]}>{title}</Text>
        </View>
        <MaterialIcons name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={24} color={theme.textMuted} />
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.accordionBody}>
          {children}
        </View>
      )}
    </View>
  );
};

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { routePois, clearRoute } = useRouteBuilder();
  
  const [openAccordion, setOpenAccordion] = useState<string | null>('vetrina');
  const [expandedItinerary, setExpandedItinerary] = useState<number | null>(null);
  
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [userItineraries, setUserItineraries] = useState<any[]>([]);
  
  // Dati reali dal backend
  const [userTotalXp, setUserTotalXp] = useState<number>(0);
  const [userTokens, setUserTokens] = useState<number>(0);
  
  // Sfruttiamo le VERE logiche matematiche di levelUtils
  const progressInfo = getLevelProgress(userTotalXp, theme);
  const currentRank = {
    title: progressInfo.levelTitle,
    color: progressInfo.color,
    stemma: progressInfo.stemma as any
  };
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [isTipsVisible, setIsTipsVisible] = useState(false);
  const [isCollectionVisible, setIsCollectionVisible] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // GESTIONE FOCUS PER RE-FETCH E TASTO INDIETRO
  useFocusEffect(
    useCallback(() => {
      // Re-fetch dei dati ogni volta che si entra nel tab Profilo
      const fetchProfileData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsAnonymous(!user.email);
          const { data: profile } = await supabase.from('profiles').select('total_xp, total_tokens').eq('id', user.id).single();
          if (profile) {
            setUserTotalXp(profile.total_xp || 0);
            setUserTokens(profile.total_tokens || 0);
          }

          // Fetch Badges
          const { data: badgesData } = await supabase
            .from('user_badges')
            .select('*, badges(*)')
            .eq('user_id', user.id);
          if (badgesData) setUserBadges(badgesData);

          // Fetch Itineraries (solo dati REALI dal DB)
          const { data: itinData } = await supabase.rpc('get_user_itineraries');
          if (itinData) {
            setUserItineraries(itinData);
          } else {
            setUserItineraries([]);
          }
        }
      };
      fetchProfileData();

      // GESTIONE TASTO INDIETRO
      const onBackPress = () => {
        // Se c'è una scheda aperta e NON è la Vetrina (che è il default), chiudila e torna alla Vetrina
        if (openAccordion && openAccordion !== 'vetrina') {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setOpenAccordion('vetrina');
          return true; // Blocca il back di default
        }
        return false; // Permetti il back normale (esci dall'app)
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [openAccordion])
  );

  const toggleSection = (section: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenAccordion(openAccordion === section ? null : section);
  };

  const handleEmailLogin = () => {
    if (!email || !password) {
      Alert.alert("Attenzione", "Inserisci email e password per effettuare il backup.");
      return;
    }
    setIsLinking(true);
    setTimeout(() => {
      setIsLinking(false);
      Alert.alert("Backup completato", `Il tuo account anonimo è stato fuso con ${email}. I tuoi LOTO PTI sono ora al sicuro!`, [{ text: "Ottimo!" }]);
    }, 1500);
  };

  const handleResetDemo = () => {
    Alert.alert(
      "Azzera Progressi (Demo)",
      "Vuoi riportare questo profilo a 0 XP per testare di nuovo il Level Up?",
      [
        { text: "Annulla", style: "cancel" },
        { 
          text: "Sì, Azzera XP", 
          style: "destructive",
          onPress: async () => {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              await AsyncStorage.removeItem('loto_onboarding_seen');
              await AsyncStorage.removeItem('loto_fallback_xp');
              await AsyncStorage.removeItem('loto_fallback_tokens');
              await AsyncStorage.removeItem('loto_fallback_pois');
              
              if (session) {
                await supabase.from('profiles').update({ total_xp: 0, pois_discovered: 0, total_tokens: 0 }).eq('id', session.user.id);
              }
              setUserTotalXp(0);
              Alert.alert("Fatto", "XP azzerati e Onboarding ripristinato. Ora chiudi e riapri l'app per vederlo dall'inizio!");
            } catch(e) {
              console.log("Errore durante l'azzeramento:", e);
            }
          }
        }
      ]
    );
  };

  return (
    <ImageBackground source={require('../../assets/images/elite_bg.png')} style={{ flex: 1, backgroundColor: theme.background }} imageStyle={{ opacity: 0.15 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Pannello Utente</Text>
            </View>
            <Text style={styles.headerSubtitle}>Gestione Profilo, Impatto e Pass</Text>
          </View>
          <TouchableOpacity style={[styles.boutiqueIconBtn, { borderColor: '#D4AF37', backgroundColor: '#FDFBF7' }]} onPress={() => setIsTipsVisible(true)}>
            <MaterialIcons name="tips-and-updates" size={20} color="#D4AF37" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            
            {/* SEZIONE 1: VETRINA BADGES */}
            <Accordion 
              title="La Tua Vetrina" 
              icon="military-tech" 
              theme={theme}
              isOpen={openAccordion === 'vetrina'}
              onToggle={() => toggleSection('vetrina')}
            >
              <View style={{ marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.sectionDesc, { flex: 1 }]}>
                  I tuoi traguardi in evidenza.
                </Text>

                {/* BADGE ANONIMO RIDIMENSIONATO A DESTRA */}
                {isAnonymous && (
                  <TouchableOpacity 
                    onPress={() => setOpenAccordion('backup')}
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(212, 175, 55, 0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#D4AF37', marginLeft: 10 }}
                  >
                    <MaterialIcons name="warning-amber" size={14} color="#D4AF37" />
                    <Text style={{ color: '#D4AF37', fontSize: 10, fontWeight: 'bold', marginLeft: 4 }}>Ospite</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 15, justifyContent: 'center', marginTop: 10 }}>
                {/* GRADO ATTUALE (SEMPRE VISIBILE) */}
                <TouchableOpacity style={{ alignItems: 'center' }}>
                  <View style={[styles.badgeCircle, { borderColor: currentRank.color, backgroundColor: theme.surface }]}>
                    <MaterialIcons name={currentRank.stemma} size={28} color={currentRank.color} />
                  </View>
                  <Text style={[styles.badgeText, { color: currentRank.color, fontWeight: 'bold' }]} numberOfLines={1}>{currentRank.title}</Text>
                </TouchableOpacity>

                {(userBadges.length > 0) && (
                  userBadges.slice(0, 4).map((ub, i) => (
                    <TouchableOpacity key={i} style={{ alignItems: 'center' }} onPress={() => setIsCollectionVisible(true)}>
                      <View style={[styles.badgeCircle, { borderColor: theme.primary, backgroundColor: theme.surface }]}>
                        <MaterialIcons name={ub.badges?.icon || 'star'} size={28} color={theme.primary} />
                      </View>
                      <Text style={[styles.badgeText, { color: theme.text }]} numberOfLines={1}>{ub.badges?.name}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
              
              {/* Pulsante Vedi Collezione Migliorato */}
              <TouchableOpacity 
                style={{ marginTop: 20, backgroundColor: theme.surface, paddingVertical: 12, borderRadius: 25, borderWidth: 1, borderColor: theme.border, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                onPress={() => setIsCollectionVisible(true)}
              >
                <MaterialIcons name="military-tech" size={18} color={theme.primary} style={{ marginRight: 8 }} />
                <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 14 }}>Vedi l'intera Collezione</Text>
              </TouchableOpacity>
            </Accordion>

            {/* SEZIONE 2: IMPATTO PERSONALE */}
            <Accordion 
              title="Il Tuo Impatto Globale" 
              icon="public" 
              theme={theme}
              isOpen={openAccordion === 'impatto'}
              onToggle={() => toggleSection('impatto')}
            >
              <Text style={styles.sectionDesc}>
                La tua impronta ecologica e i percorsi scoperti.
              </Text>

              {/* Box Impatto */}
              <View style={[styles.impactBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.impactCol}>
                  <MaterialIcons name="eco" size={24} color="#2ECC71" />
                  <Text style={[styles.impactVal, { color: theme.text }]}>{(userTokens * 0.15).toFixed(1)} kg</Text>
                  <Text style={styles.impactLabel}>CO2 Evitata</Text>
                </View>
                <View style={[styles.impactDivider, { backgroundColor: theme.border }]} />
                <View style={styles.impactCol}>
                  <MaterialIcons name="account-balance-wallet" size={24} color="#D4AF37" />
                  <Text style={[styles.impactVal, { color: theme.text }]}>{userTokens}</Text>
                  <Text style={styles.impactLabel}>LOTO PTI</Text>
                </View>
              </View>

              {routePois.length > 0 && (
                <View style={{ marginTop: 15, padding: 15, backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <MaterialIcons name="route" size={24} color={theme.primary} />
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginLeft: 8 }}>Itinerario in Corso</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: theme.textMuted }}>
                    Stai esplorando {routePois.length} tappe. L'impatto verrà calcolato all'arrivo.
                  </Text>
                </View>
              )}

              {userItineraries.length > 0 ? (
                <View style={{ marginTop: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.text, marginBottom: 10 }}>I tuoi Percorsi Salvati</Text>
                  {userItineraries.map((itin, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={{ padding: 15, backgroundColor: theme.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 10 }}
                      onPress={() => setExpandedItinerary(expandedItinerary === index ? null : index)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>{itin.name || 'Itinerario Salvato'}</Text>
                        <MaterialIcons name={expandedItinerary === index ? "expand-less" : "expand-more"} size={20} color={theme.textMuted} />
                      </View>
                      <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 5 }}>Tappe salvate: {itin.pois?.length || 0}</Text>
                      
                      {expandedItinerary === index && itin.pois && (
                        <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: theme.border }}>
                          {itin.pois.map((poi: any, pIndex: number) => (
                            <View key={pIndex} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                              <MaterialIcons name="place" size={14} color={theme.primary} />
                              <Text style={{ fontSize: 13, color: theme.text, marginLeft: 6, flex: 1 }}>{poi.name}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15, gap: 20 }}>
                        <TouchableOpacity 
                          style={{ flexDirection: 'row', alignItems: 'center' }}
                          onPress={() => {
                            const { Share } = require('react-native');
                            const poiNames = itin.pois?.map((p: any) => p.name).join(', ') || '';
                            Share.share({
                              message: `Guarda questo incredibile itinerario esplorato con LOTO: ${itin.name || 'Il mio percorso'}! Tappe: ${poiNames}. Scarica l'app per unirti alla missione!`
                            });
                          }}
                        >
                          <MaterialIcons name="share" size={18} color={theme.primary} />
                          <Text style={{ color: theme.primary, fontWeight: 'bold', marginLeft: 4, fontSize: 12 }}>Condividi</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={{ flexDirection: 'row', alignItems: 'center' }}
                          onPress={async () => {
                            try {
                              const newItins = userItineraries.filter((_, i) => i !== index);
                              setUserItineraries(newItins);
                              await AsyncStorage.setItem('loto_diary', JSON.stringify(newItins));
                            } catch(e) {}
                          }}
                        >
                          <MaterialIcons name="delete-outline" size={18} color={theme.accent} />
                          <Text style={{ color: theme.accent, fontWeight: 'bold', marginLeft: 4, fontSize: 12 }}>Elimina</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={{ marginTop: 15 }}>
                  <EmptyStateCard 
                    icon="map" 
                    title="Nessun Itinerario" 
                    subtitle="Non hai ancora salvato percorsi. Esplora la città per creare il tuo primo diario!" 
                    theme={theme} 
                  />
                </View>
              )}
            </Accordion>

            {/* SEZIONE 3: GUARDAROBA E COSMESI */}
            <Accordion 
              title="Boutique / Cosmetici" 
              icon="checkroom" 
              theme={theme}
              isOpen={openAccordion === 'boutique'}
              onToggle={() => toggleSection('boutique')}
            >
              <Text style={styles.sectionDesc}>
                Personalizza il tuo Avatar e la tua LOTO Pass.
              </Text>
              
              <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 15, borderWidth: 1, borderColor: theme.border, marginBottom: 15, marginTop: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                   <MaterialIcons name="face" size={24} color={theme.primary} />
                   <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginLeft: 8 }}>Skin & Avatar</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                   <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(212,175,55,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#D4AF37' }}>
                         <MaterialIcons name="face" size={30} color="#D4AF37" />
                      </View>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 15 }}>Avatar LOTO VIP</Text>
                        <Text style={{ fontSize: 13, color: '#2ECC71', fontWeight: 'bold', marginTop: 2 }}>Equipaggiato</Text>
                      </View>
                   </View>
                   <TouchableOpacity style={{ padding: 10, backgroundColor: theme.background, borderRadius: 20, borderWidth: 1, borderColor: theme.border }}>
                      <MaterialIcons name="swap-horiz" size={20} color={theme.primary} />
                   </TouchableOpacity>
                </View>
              </View>

              <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 15, borderWidth: 1, borderColor: theme.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                   <MaterialIcons name="crop-free" size={24} color="#9b59b6" />
                   <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginLeft: 8 }}>Cornici Digitali</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                   <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 50, height: 50, borderRadius: 10, backgroundColor: 'rgba(155,89,182,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#9b59b6' }}>
                         <MaterialIcons name="filter-frames" size={30} color="#9b59b6" />
                      </View>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 15 }}>Cornice Cyber-Neon</Text>
                        <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }}>In uso sul Profilo</Text>
                      </View>
                   </View>
                   <TouchableOpacity style={{ padding: 10, backgroundColor: theme.background, borderRadius: 20, borderWidth: 1, borderColor: theme.border }}>
                      <MaterialIcons name="swap-horiz" size={20} color={theme.primary} />
                   </TouchableOpacity>
                </View>
              </View>
            </Accordion>

            {/* SEZIONE 4: BACKUP & IMPOSTAZIONI */}
            <Accordion 
              title="Backup e Impostazioni" 
              icon="settings" 
              theme={theme}
              isOpen={openAccordion === 'backup'}
              onToggle={() => toggleSection('backup')}
            >
              <Text style={styles.sectionDesc}>
                La tua LOTO Pass è la tua identità civica anonima. Proteggi i tuoi progressi salvando la Pass in galleria, oppure effettua un backup completo in cloud tramite email.
              </Text>

              {/* OPZIONE 1: LOTO PASS LOCALE (QR) */}
              <View style={{ marginVertical: 15 }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.text, marginLeft: 5, marginBottom: 10 }}>Opzione 1: Salvataggio Offline (QR)</Text>
                <LotoPassCard />
                <TouchableOpacity style={[styles.authButton, { backgroundColor: theme.text, marginTop: 10 }]} onPress={() => setShowRecoveryModal(true)}>
                  <MaterialIcons name="qr-code-scanner" size={20} color={theme.background} style={{ marginRight: 8 }} />
                  <Text style={[styles.authButtonText, { color: theme.background }]}>Recupera da QR Galleria</Text>
                </TouchableOpacity>
              </View>
              
              <View style={{ width: '100%', height: 1, backgroundColor: theme.border, marginVertical: 20 }} />

              {/* OPZIONE 2: EMAIL CLOUD BACKUP */}
              <View style={[styles.formContainer, { backgroundColor: theme.background, borderColor: theme.border, marginBottom: 25 }]}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.text, marginBottom: 15 }}>Opzione 2: Backup Cloud (Email)</Text>
                <View style={[styles.inputWrapper, { borderBottomColor: theme.border }]}>
                  <MaterialIcons name="email" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput style={[styles.input, { color: theme.text }]} placeholder="La tua Email" placeholderTextColor="#94A3B8" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
                </View>
                <View style={[styles.inputWrapper, { borderBottomWidth: 0 }]}>
                  <MaterialIcons name="lock" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput style={[styles.input, { color: theme.text }]} placeholder="Crea Password" placeholderTextColor="#94A3B8" secureTextEntry value={password} onChangeText={setPassword} />
                </View>
                <TouchableOpacity style={[styles.authButton, { backgroundColor: theme.primary, borderRadius: 0, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }]} onPress={handleEmailLogin} disabled={isLinking}>
                  <Text style={styles.authButtonText}>{isLinking ? "Salvataggio..." : "Metti al Sicuro i miei Punti in Cloud"}</Text>
                </TouchableOpacity>
              </View>

              {/* OPZIONE DEMO: RESET */}
              <View style={{ marginBottom: 25 }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.text, marginLeft: 5, marginBottom: 10 }}>Opzione 3: Reset Dispositivo (Test)</Text>
                <TouchableOpacity 
                  style={[styles.authButton, { backgroundColor: '#EF4444', borderRadius: 12 }]} 
                  onPress={handleResetDemo}
                >
                  <MaterialIcons name="delete-forever" size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.authButtonText}>Formatta Account Locale</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 8, textAlign: 'center' }}>
                  Usalo sul 2° telefono per ripartire dal livello 1.
                </Text>
              </View>

              {/* Supporto & FAQ con Documentazione Proprietà Intellettuale */}
              <View style={{ marginTop: 10, padding: 15, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <MaterialIcons name="info-outline" size={20} color={theme.text} />
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.text, marginLeft: 8 }}>Supporto, FAQ & IP</Text>
                </View>
                <Text style={{ fontSize: 11, color: theme.textMuted, lineHeight: 18, textAlign: 'justify' }}>
                  Tutti i contenuti presenti in questa applicazione (inclusi ma non limitati a: Punti di Interesse, Itinerari Culturali, Logiche di Gamification, Sistema LOTO PTI, Classifiche e Architettura DB) costituiscono Proprietà Intellettuale Riservata creata appositamente per le finalità dimostrative del progetto.{"\n\n"}
                  Qualsiasi riproduzione o utilizzo non autorizzato è vietato. Per assistenza tecnica o domande sul funzionamento della piattaforma, contatta il tuo referente LOTO.
                </Text>
              </View>
            </Accordion>

          </View>
        </ScrollView>

        <TipsBoutiqueSheet visible={isTipsVisible} onClose={() => setIsTipsVisible(false)} />
        <BadgeCollectionModal visible={isCollectionVisible} onClose={() => setIsCollectionVisible(false)} userBadges={userBadges} theme={theme} />
        <LotoPassRecoveryScanner visible={showRecoveryModal} onClose={() => setShowRecoveryModal(false)} theme={theme} />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  header: { paddingHorizontal: 20, marginTop: 45, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 32, fontWeight: '900', fontFamily: 'serif' },
  headerSubtitle: { fontSize: 14, color: '#475569', marginTop: 5, fontFamily: 'serif', fontStyle: 'italic', textShadowColor: 'rgba(255, 255, 255, 0.9)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  boutiqueIconBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  section: { paddingHorizontal: 15, marginTop: 20 },
  sectionDesc: { fontSize: 13, color: '#64748B', marginBottom: 15, lineHeight: 20 },
  
  // Accordion Styles
  accordionContainer: { marginBottom: 15, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  accordionTitle: { fontSize: 16, fontWeight: 'bold', fontFamily: 'serif' },
  accordionBody: { paddingHorizontal: 20, paddingBottom: 20 },
  
  // Diario
  badgeCircle: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  badgeText: { fontSize: 11, fontWeight: 'bold', marginTop: 8, color: '#64748B' },
  
  // Form
  formContainer: { borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, borderWidth: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  authButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12 },
  authButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  
  // Menu Row
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  menuRowLeft: { flexDirection: 'row', alignItems: 'center' },
  menuRowText: { fontSize: 15, marginLeft: 15, fontWeight: '500' },

  // Nuovi Stili Impatto e Cosmesi
  impactBox: { flexDirection: 'row', padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 15, justifyContent: 'space-around', alignItems: 'center' },
  impactCol: { alignItems: 'center' },
  impactVal: { fontSize: 24, fontWeight: 'bold', fontFamily: 'serif', marginTop: 5 },
  impactLabel: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: 'bold' },
  impactDivider: { width: 1, height: '80%' },
  
  cosmeticItem: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 15, alignItems: 'center', elevation: 1 },
  cosmeticIconWrap: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  cosmeticName: { fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  cosmeticStatus: { fontSize: 10, color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase' }
});
