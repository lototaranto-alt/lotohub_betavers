import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';

// --- Obiettivi giornalieri (Zeigarnik: loop quotidiano a 3 petali) ---
const WALK_TARGET_M = 2000; // 🟢 2 km a piedi
const WALK_ALT_CO2 = 1;     // ... oppure 1 kg CO₂ evitata
const CHECKIN_TARGET = 1;   // 🟡 1 check-in

interface DailyChallenge {
  title: string;
  icon: string;
  type: 'walk' | 'co2' | 'checkins';
  value: number;
}

// Sfide quotidiane CURATE (no UGC) e misurabili dai contatori della Home.
const DAILY_CHALLENGES: DailyChallenge[] = [
  { title: '1 NUOVO INDIZIO', icon: 'nfc', type: 'checkins', value: 1 },
  { title: '1 KM DI LEGGEREZZA', icon: 'self-improvement', type: 'walk', value: 1000 },
  { title: '0,5 KG CO₂ EVITATA', icon: 'eco', type: 'co2', value: 0.5 },
  { title: '2 KM DI LINFA', icon: 'directions-walk', type: 'walk', value: 2000 },
  { title: '1 CHECK-IN SILENZIOSO', icon: 'water-drop', type: 'checkins', value: 1 },
];

function getTodayIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return dayOfYear % DAILY_CHALLENGES.length;
}

interface FioreDeiTrePetaliProps {
  distanceToday: number; // metri
  co2Kg: number;
  checkinsToday: number;
  onPress?: () => void;
}

function Petalo({
  icon,
  label,
  percent,
  accent,
  done,
}: {
  icon: any;
  label: string;
  percent: number;
  accent: string;
  done: boolean;
}) {
  const { theme } = useTheme();
  const pct = Math.max(0, Math.min(1, percent));

  return (
    <View style={styles.petalWrapper}>
      <View
        style={[
          styles.petal,
          {
            borderColor: accent,
            borderWidth: done ? 3 : 2,
            opacity: 0.35 + pct * 0.65,
            backgroundColor: done ? `${accent}22` : theme.surface,
          },
        ]}
      >
        <MaterialIcons name={icon} size={22} color={done ? accent : theme.textMuted} />
        {done && (
          <View style={[styles.checkBadge, { backgroundColor: accent }]}>
            <MaterialIcons name="check" size={11} color="#FFF" />
          </View>
        )}
      </View>
      <Text
        style={[styles.petalLabel, { color: done ? accent : theme.textMuted }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export default function FioreDeiTrePetali({ distanceToday, co2Kg, checkinsToday, onPress }: FioreDeiTrePetaliProps) {
  const { theme } = useTheme();
  const challenge = DAILY_CHALLENGES[getTodayIndex()];

  // 🟢 Petalo Camminata: 2 km a piedi OPPURE 1 kg CO₂
  const walkPercent = Math.max(
    distanceToday / WALK_TARGET_M,
    co2Kg / WALK_ALT_CO2,
  );

  // 🟡 Petalo Check-in: almeno 1 check-in oggi
  const checkinPercent = checkinsToday / CHECKIN_TARGET;

  // 🔵 Petalo Sfida: obiettivo curato a rotazione
  const challengeValue =
    challenge.type === 'walk' ? distanceToday :
    challenge.type === 'co2' ? co2Kg :
    checkinsToday;
  const challengePercent = challengeValue / challenge.value;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>Fiore di Oggi</Text>
        <View style={[styles.todayChip, { backgroundColor: theme.primary + '22' }]}>
          <Text style={[styles.todayChipText, { color: theme.primary }]}>RITUALE QUOTIDIANO</Text>
        </View>
      </View>

      <View style={styles.petalsRow}>
        <Petalo
          icon="directions-walk"
          label="2 KM"
          percent={walkPercent}
          accent="#4CAF50"
          done={walkPercent >= 1}
        />
        <Petalo
          icon="nfc"
          label="1 CHECK-IN"
          percent={checkinPercent}
          accent="#D4AF37"
          done={checkinPercent >= 1}
        />
        <View style={{ width: 8 }} />
        <Petalo
          icon={challenge.icon}
          label={challenge.title}
          percent={challengePercent}
          accent="#2A9D8F"
          done={challengePercent >= 1}
        />
      </View>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>
          {challengePercent >= 1
            ? 'Sfida di oggi compiuta. Il Loto fiorisce passo dopo passo.'
            : `Sfida di oggi: raggiungi "${challenge.title.toLowerCase()}" prima di domani.`}
        </Text>
        <MaterialIcons name="chevron-right" size={22} color={theme.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  todayChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayChipText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  petalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  petalWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  petal: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBadge: {
    position: 'absolute',
    right: -3,
    top: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petalLabel: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  footerText: {
    flex: 1,
    fontSize: 11,
    fontStyle: 'italic',
    marginRight: 10,
  },
});