import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function UpgradeScreen() {
  const router = useRouter();
  const { theme, setElite, isElite } = useTheme();

  // STILE NEO-FUTURISTA (Proposta 3 Screen Match)
  const bgColor = '#0A0F14'; 
  const textColor = '#E0F2FE';
  const neonCyan = '#00F0FF';
  const neonGreen = '#10B981'; // Smeraldo Neon
  const neonPurple = '#FF00FF';

  const handleUpgrade = () => {
    setElite(true);
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      
      {/* HEADER COMPATTO */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <MaterialIcons name="close" size={28} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textColor }]}>
          L.O.T.O. <Text style={{ color: neonCyan, textShadowColor: neonCyan, textShadowRadius: 10 }}>ELITE</Text>
        </Text>
        <Text style={styles.subtitle}>Cyber-upgrade: Sblocca il potenziale del territorio.</Text>
      </View>

      {/* TOP CARD (Stile "ECO-NAVIGATORE" della proposta 3) */}
      <View style={styles.topCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name="sailing" size={24} color={neonCyan} style={{ marginRight: 10 }} />
          <Text style={{ color: neonCyan, fontWeight: 'bold', fontSize: 16, letterSpacing: 2 }}>STATUS ELITE</Text>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 15 }}>
          <View style={[styles.badge, { backgroundColor: neonCyan + '20' }]}>
            <Text style={{ color: neonCyan, fontSize: 10, fontWeight: 'bold' }}>NEON MODE</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: neonGreen + '20', marginLeft: 10 }]}>
            <Text style={{ color: neonGreen, fontSize: 10, fontWeight: 'bold' }}>HQ AUDIO</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>I TUOI PRIVILEGI PREMIUM</Text>

      {/* 3 RECTANGULAR CARDS (Cyan, Green, Purple) */}
      <View style={styles.cardsRow}>
        <FeatureCard icon="nightlight-round" color={neonCyan} title="NEON" desc="Tema Dark" />
        <FeatureCard icon="headphones" color={neonGreen} title="AUDIO" desc="Storie HQ" />
        <FeatureCard icon="vpn-key" color={neonPurple} title="SECRET" desc="Aree VIP" />
      </View>

      {/* BOTTOM ACTION (ancorata in basso, senza scroll) */}
      <View style={styles.bottomSection}>
        {!isElite ? (
          <TouchableOpacity onPress={handleUpgrade} activeOpacity={0.8} style={styles.upgradeWrapper}>
            <LinearGradient
              colors={['#00F0FF', '#FF00FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeBtnGlow}
            >
              <View style={styles.upgradeBtnInner}>
                <Text style={[styles.upgradeBtnText, { color: neonCyan }]}>SBLOCCA ORA - 4.99€</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={{ alignItems: 'center', width: '100%' }}>
            <View style={[styles.upgradedBadge, { borderColor: neonCyan }]}>
              <MaterialIcons name="check-circle" size={24} color={neonCyan} />
              <Text style={[styles.upgradedText, { color: neonCyan }]}>SEI PREMIUM</Text>
            </View>
            <TouchableOpacity onPress={() => { setElite(false); router.back(); }} style={{ marginTop: 20 }}>
              <Text style={{ color: '#8BA6B9', textDecorationLine: 'underline', fontSize: 12 }}>[Dev] Torna a Freemium</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const FeatureCard = ({ icon, color, title, desc }: { icon: any, color: string, title: string, desc: string }) => (
  <View style={[styles.featureCard, { borderColor: color }]}>
    <MaterialIcons name={icon} size={28} color={color} style={{ marginBottom: 10, textShadowColor: color, textShadowRadius: 8 }} />
    <Text style={[styles.cardTitle, { color: '#FFF' }]}>{title}</Text>
    <Text style={[styles.cardDesc, { color: '#8BA6B9' }]}>{desc}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
  closeBtn: { alignSelf: 'flex-end', padding: 5 },
  title: { fontSize: 32, fontWeight: '900', fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: 2 },
  subtitle: { color: '#8BA6B9', fontSize: 13, marginTop: 5 },
  topCard: {
    marginHorizontal: 24,
    marginTop: 20,
    backgroundColor: '#111827',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  sectionTitle: {
    color: '#E0F2FE',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
    letterSpacing: 1,
    opacity: 0.8
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  featureCard: {
    width: (width - 48 - 20) / 3, // 3 colonne con gap di 10
    borderWidth: 1,
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 5,
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  cardTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  cardDesc: { fontSize: 10, textAlign: 'center' },
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  upgradeWrapper: { width: '100%' },
  upgradeBtnGlow: {
    padding: 2,
    borderRadius: 30,
  },
  upgradeBtnInner: {
    backgroundColor: '#0A0F14',
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
  },
  upgradeBtnText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: '#00F0FF',
    textShadowRadius: 8,
  },
  upgradedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 30,
    borderWidth: 2,
    width: '100%',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  upgradedText: {
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 10,
    letterSpacing: 1,
  }
});
