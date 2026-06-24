import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function UpgradeScreen() {
  const router = useRouter();
  const { theme, setElite, isElite } = useTheme();

  // Colori allineati alla nuova palette Boutique Premium
  const bgColor = '#121417'; 
  const textColor = '#F2ECE4';
  const accentColor = '#C5A059'; // Oro Brunito Champagne

  const handleUpgrade = () => {
    // Mock dell'acquisto In-App
    setElite(true);
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <MaterialIcons name="close" size={28} color={textColor} />
        </TouchableOpacity>

        <View style={styles.header}>
          <MaterialIcons name="workspace-premium" size={80} color={accentColor} />
          <Text style={[styles.title, { color: textColor }]}>Diventa Elite</Text>
          <Text style={[styles.subtitle, { color: '#A0AAB5' }]}>
            Sblocca il vero potenziale del territorio e unisciti agli esploratori Premium.
          </Text>
        </View>

        <View style={styles.featuresList}>
          <FeatureItem 
            icon="nightlight-round" 
            title="Status Dark/Neon Mode" 
            desc="Un'interfaccia esclusiva e immersiva, riservata solo agli utenti Elite."
            accent={accentColor}
          />
          <FeatureItem 
            icon="headphones" 
            title="Audio-Documentari Premium" 
            desc="Scansiona gli adesivi NFC per ascoltare storie segrete di altissima qualità."
            accent={accentColor}
          />
          <FeatureItem 
            icon="vpn-key" 
            title="Accesso a Luoghi Segreti" 
            desc="Sblocca Punti di Interesse nascosti ai turisti normali."
            accent={accentColor}
          />
          <FeatureItem 
            icon="notifications-active" 
            title="Notifiche Boost Partner" 
            desc="Ricevi inviti esclusivi in tempo reale dai locali più ambiti."
            accent={accentColor}
          />
        </View>

        {!isElite ? (
          <TouchableOpacity style={[styles.upgradeBtn, { backgroundColor: accentColor }]} onPress={handleUpgrade}>
            <Text style={styles.upgradeBtnText}>Sblocca Ora - 4.99€/Mese</Text>
          </TouchableOpacity>
        ) : (
          <View>
            <View style={[styles.upgradedBadge, { borderColor: accentColor }]}>
              <MaterialIcons name="check-circle" size={24} color={accentColor} />
              <Text style={[styles.upgradedText, { color: accentColor }]}>Sei già un utente Premium</Text>
            </View>
            <TouchableOpacity 
              style={{ marginTop: 15, alignItems: 'center' }}
              onPress={() => { setElite(false); router.back(); }}
            >
              <Text style={{ color: '#A0AAB5', textDecorationLine: 'underline', fontSize: 12 }}>[Dev] Torna a Freemium per Test</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.legal}>
          Abbonamento con rinnovo automatico. Puoi disdire in qualsiasi momento dalle impostazioni del tuo store.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const FeatureItem = ({ icon, title, desc, accent }: { icon: any, title: string, desc: string, accent: string }) => (
  <View style={styles.featureItem}>
    <View style={styles.iconContainer}>
      <MaterialIcons name={icon} size={28} color={accent} />
    </View>
    <View style={styles.featureTextContainer}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDesc}>{desc}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 60,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    fontFamily: 'serif',
    marginTop: 15,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  featuresList: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 25,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 50,
    alignItems: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featureDesc: {
    color: '#A0AAB5',
    fontSize: 13,
    lineHeight: 18,
  },
  upgradeBtn: {
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  upgradeBtnText: {
    color: '#1A1C1E',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  upgradedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 30,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  upgradedText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  legal: {
    color: '#64748B',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 20,
  }
});
