import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getLevelProgress, LEVEL_THRESHOLDS } from '../utils/levelUtils';

const { height } = Dimensions.get('window');

interface GameAchievementsSheetProps {
  visible: boolean;
  onClose: () => void;
  userXp: number;
  userBadges: any[];
  onOpenBadgeCollection?: () => void;
  theme: any;
}

export default function GameAchievementsSheet({ visible, onClose, userXp, userBadges, onOpenBadgeCollection, theme }: GameAchievementsSheetProps) {
  const progress = getLevelProgress(userXp, theme);
  const unlockedBadgeCount = userBadges.length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: '#FDFBF7' }]}>
          
          {/* Maniglia */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconCircle, { backgroundColor: '#DFAB55' }]}>
                <MaterialIcons name="emoji-events" size={24} color="#FFF" />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.title}>Centro Traguardi</Text>
                <Text style={styles.subtitle}>Livello {progress.currentLevel} • {progress.levelTitle}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={22} color="#1A3621" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Rank Card Game Style */}
            <View style={styles.rankCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.gemIndicator, { backgroundColor: progress.gemColor }]}>
                    <MaterialIcons name="diamond" size={16} color="#FFF" />
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.rankBadgeTitle}>{progress.levelTitle}</Text>
                    <Text style={styles.rankBadgeSubtitle}>Gemma: {progress.gemName}</Text>
                  </View>
                </View>
                <View style={styles.levelTag}>
                  <Text style={styles.levelTagText}>LVL {progress.currentLevel}</Text>
                </View>
              </View>

              {/* Progress Bar: verso il PROSSIMO RANK (blocco da 10 livelli), non il prossimo LV */}
              <View style={styles.xpBarContainer}>
                <View style={[styles.xpBarFill, { width: `${progress.rankPercent}%`, backgroundColor: progress.gemColor }]} />
              </View>
              <View style={styles.xpTextRow}>
                <Text style={styles.xpTextSmall}>{Math.floor(progress.rankXpInBlock)} / {progress.rankXpBlockSpan} XP verso il Rank</Text>
                <Text style={styles.xpTextSmall}>Totale: {Math.floor(userXp)} XP</Text>
              </View>
              <View style={styles.nextRankRow}>
                <MaterialIcons name="arrow-circle-up" size={12} color="#D4AF37" />
                <Text style={styles.nextRankText}>
                  Prossimo Rank: {progress.rankInfo.nextRank === 'MAX' ? 'Rank Massimo' : `${progress.rankInfo.nextRank} (LV ${progress.rankInfo.requiredLvl})`}
                </Text>
              </View>
            </View>

            {/* Active Challenge Section */}
            <Text style={styles.sectionHeader}>SFIDE ATTIVE DELLA COMMUNITY</Text>
            <View style={styles.challengeCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.challengeIconBox}>
                  <MaterialIcons name="flag" size={22} color="#2D4A22" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.challengeTitle}>Sfida Mappatura Civica</Text>
                  <Text style={styles.challengeDesc}>Esplora e sblocca 3 P.O.I. nella città vecchia di Taranto.</Text>
                </View>
              </View>
              <View style={styles.challengeFooter}>
                <Text style={styles.challengeReward}>🏆 Ricompensa: +50 XP & Badge Sentinella</Text>
              </View>
            </View>

            {/* Badges Overview Section */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, marginBottom: 12 }}>
              <Text style={styles.sectionHeader}>MEDAGLIE & DISTINTIVI ({unlockedBadgeCount})</Text>
              {onOpenBadgeCollection && (
                <TouchableOpacity onPress={onOpenBadgeCollection}>
                  <Text style={styles.linkText}>Vedi Tutti →</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Level Milestones Grid */}
            <View style={styles.milestoneGrid}>
              {LEVEL_THRESHOLDS.slice(0, 5).map((lvl) => {
                const isReached = progress.currentLevel >= lvl.level;
                return (
                  <View key={lvl.level} style={[styles.milestoneCard, { borderColor: isReached ? lvl.gemColor : 'rgba(0,0,0,0.06)' }]}>
                    <View style={[styles.milestoneIconBox, { backgroundColor: isReached ? lvl.gemColor + '20' : '#F0ECE1' }]}>
                      <MaterialIcons 
                        name={lvl.stemma as any} 
                        size={20} 
                        color={isReached ? lvl.gemColor : '#A0AAB2'} 
                      />
                    </View>
                    <Text style={styles.milestoneLevel}>LVL {lvl.level}</Text>
                    <Text style={styles.milestoneTitle} numberOfLines={1}>{lvl.title}</Text>
                  </View>
                );
              })}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: height * 0.85, paddingHorizontal: 20, paddingTop: 12 },
  handle: { width: 44, height: 5, backgroundColor: '#D5CBB9', borderRadius: 3, alignSelf: 'center', marginBottom: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', fontFamily: 'serif', color: '#1A3621' },
  subtitle: { fontSize: 12, color: '#6A5638', fontWeight: '600' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  content: { paddingTop: 5 },
  rankCard: { backgroundColor: '#2D4A22', borderRadius: 20, padding: 18, marginBottom: 20, elevation: 4 },
  gemIndicator: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#FFF' },
  rankBadgeTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold', fontFamily: 'serif' },
  rankBadgeSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  levelTag: { backgroundColor: '#D4AF37', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  levelTagText: { color: '#1A3621', fontSize: 10, fontWeight: 'bold' },
  xpBarContainer: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, marginTop: 15, overflow: 'hidden' },
  xpBarFill: { height: '100%', borderRadius: 4 },
  xpTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  xpTextSmall: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '600' },
  nextRankRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', gap: 6 },
  nextRankText: { color: '#D4AF37', fontSize: 11, fontWeight: 'bold' },
  sectionHeader: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1, color: '#8C7A5E', textTransform: 'uppercase' },
  challengeCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 18, marginTop: 10, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', elevation: 2 },
  challengeIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F0E4', justifyContent: 'center', alignItems: 'center' },
  challengeTitle: { fontSize: 14, fontWeight: 'bold', color: '#1A3621', fontFamily: 'serif' },
  challengeDesc: { fontSize: 11, color: '#6A5638', marginTop: 2 },
  challengeFooter: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  challengeReward: { fontSize: 11, fontWeight: 'bold', color: '#2D4A22' },
  linkText: { fontSize: 11, fontWeight: 'bold', color: '#2D4A22' },
  milestoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  milestoneCard: { width: '31%', backgroundColor: '#FFF', padding: 12, borderRadius: 14, alignItems: 'center', borderWidth: 1.5, elevation: 1 },
  milestoneIconBox: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  milestoneLevel: { fontSize: 9, fontWeight: 'bold', color: '#8C7A5E' },
  milestoneTitle: { fontSize: 9, fontWeight: 'bold', color: '#1A3621', textAlign: 'center', marginTop: 2 }
});
