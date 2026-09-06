import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, Modal, ScrollView } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LEVEL_UP_LORE } from '../utils/LevelUpLore';
import { LEVEL_THRESHOLDS } from '../utils/levelUtils';
import SingleBadgeSheet from './SingleBadgeSheet';

const { height } = Dimensions.get('window');

interface TraguardiModalProps {
  visible: boolean;
  onClose: () => void;
  userBadges: any[];
  userProfile: any;
  theme: any;
}

export default function TraguardiModal({ visible, onClose, userBadges, userProfile, theme }: TraguardiModalProps) {
  const [activeTab, setActiveTab] = useState<'livelli' | 'badge' | 'rank'>('livelli');
  const [selectedBadge, setSelectedBadge] = useState<any>(null);

  // --- CALCOLI BASE ---
  const currentLevel = Math.max(1, Math.floor((userProfile?.total_xp || 0) / 100) + 1); // Mock calculation, normally you'd pass levelInfo
  const nextXp = currentLevel * 100;
  const currentXp = userProfile?.total_xp || 0;
  const percent = Math.min(100, (currentXp / nextXp) * 100);

  // I 5 Rank base
  const baseRanks = LEVEL_THRESHOLDS.filter(l => [1, 5, 9, 13, 17].includes(l.level)); // Adjust if needed

  // Lista fittizia di badge per la griglia
  const ALL_BADGES_CATALOG = [
    { id: 'badge_first_scan', name: 'Battesimo', icon: 'location-on', color: '#2ECC71', target: 1, unit: 'Scan' },
    { id: 'badge_civic_3', name: 'Sentinella', icon: 'security', color: '#2196F3', target: 3, unit: 'Eventi' },
    { id: 'badge_explorer_5', name: 'Esploratore', icon: 'explore', color: '#9B59B6', target: 5, unit: 'Segreti' },
    { id: 'badge_eco_5kg', name: 'Anima Green', icon: 'eco', color: '#4CAF50', target: 5, unit: 'Kg CO2' },
    { id: 'badge_marathon_3', name: 'Maratoneta', icon: 'directions-run', color: '#FF9800', target: 3, unit: 'Itinerari' },
    { id: 'badge_level_5', name: 'Cittadino', icon: 'stars', color: '#FFD700', target: 5, unit: 'Livelli' }
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>I TUOI TRAGUARDI</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* TABS */}
          <View style={[styles.tabBar, { borderColor: theme.border }]}>
            <TouchableOpacity style={[styles.tab, activeTab === 'livelli' && { borderBottomColor: theme.accent, borderBottomWidth: 2 }]} onPress={() => setActiveTab('livelli')}>
              <Text style={[styles.tabText, { color: activeTab === 'livelli' ? theme.accent : theme.textMuted }]}>LIVELLI</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'badge' && { borderBottomColor: theme.accent, borderBottomWidth: 2 }]} onPress={() => setActiveTab('badge')}>
              <Text style={[styles.tabText, { color: activeTab === 'badge' ? theme.accent : theme.textMuted }]}>BADGE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'rank' && { borderBottomColor: theme.accent, borderBottomWidth: 2 }]} onPress={() => setActiveTab('rank')}>
              <Text style={[styles.tabText, { color: activeTab === 'rank' ? theme.accent : theme.textMuted }]}>RANK</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* TAB: LIVELLI */}
            {activeTab === 'livelli' && (
              <View>
                <View style={[styles.progressCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.levelTitle, { color: theme.text }]}>Livello {currentLevel}</Text>
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${percent}%`, backgroundColor: theme.accent }]} />
                  </View>
                  <Text style={[styles.progressText, { color: theme.textMuted }]}>{Math.floor(currentXp)} / {nextXp} XP</Text>
                </View>

                <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>Micropillole Sbloccate:</Text>
                {[...Array(Math.max(1, currentLevel))].map((_, i) => {
                  const lvl = i + 1;
                  const lore = LEVEL_UP_LORE[lvl]?.it || "Continuando a esplorare sbloccherai altre consapevolezze.";
                  return (
                    <View key={lvl} style={[styles.loreBox, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                      <Text style={[styles.loreLevel, { color: theme.text }]}>Livello {lvl}</Text>
                      <Text style={[styles.loreText, { color: theme.textMuted }]}>{lore}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* TAB: BADGE */}
            {activeTab === 'badge' && (
              <View>
                <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>I tuoi obiettivi sul territorio</Text>
                <View style={styles.badgesGrid}>
                  {ALL_BADGES_CATALOG.map((b, idx) => {
                    const isUnlocked = userBadges.some(ub => (ub.badge_id || ub.id) === b.id);
                    return (
                      <TouchableOpacity 
                        key={idx} 
                        style={[styles.badgeWrapper, { borderColor: isUnlocked ? b.color : 'rgba(0,0,0,0.1)', backgroundColor: isUnlocked ? b.color + '10' : 'transparent' }]}
                        onPress={() => setSelectedBadge({ ...b, unlocked: isUnlocked })}
                      >
                        <MaterialIcons name={b.icon as any} size={32} color={isUnlocked ? b.color : 'rgba(0,0,0,0.2)'} />
                        <Text style={[styles.badgeTitle, { color: isUnlocked ? theme.text : 'rgba(0,0,0,0.3)' }]}>{b.name}</Text>
                        <Text style={[styles.badgeTarget, { color: theme.textMuted }]}>{isUnlocked ? 'SBLOCCATO' : `0 / ${b.target}`}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* TAB: RANK */}
            {activeTab === 'rank' && (
              <View>
                <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>La Gerarchia della Città (Ogni 4-5 Livelli)</Text>
                {baseRanks.map((rank, idx) => {
                  const isReached = currentLevel >= rank.level;
                  return (
                    <View key={idx} style={[styles.rankRow, { backgroundColor: isReached ? rank.gemColor + '15' : 'rgba(0,0,0,0.02)', borderColor: isReached ? rank.gemColor : 'rgba(0,0,0,0.05)' }]}>
                      <MaterialIcons name={rank.stemma as any} size={36} color={isReached ? rank.gemColor : 'rgba(0,0,0,0.2)'} />
                      <View style={{ marginLeft: 15, flex: 1 }}>
                        <Text style={[styles.rankName, { color: isReached ? theme.text : 'rgba(0,0,0,0.4)' }]}>{rank.title}</Text>
                        <Text style={[styles.rankReq, { color: theme.textMuted }]}>Si sblocca al Livello {rank.level}</Text>
                      </View>
                      {isReached && <MaterialIcons name="check-circle" size={20} color={rank.gemColor} />}
                    </View>
                  );
                })}
                <Text style={[styles.futureRanksText, { color: theme.textMuted }]}>* Rank speciali e segreti potrebbero sbloccarsi compiendo azioni specifiche sul territorio, oltre al semplice livello.</Text>
              </View>
            )}

          </ScrollView>
        </View>
      </View>

      {/* SINGLE BADGE PREVIEW */}
      <SingleBadgeSheet 
        visible={!!selectedBadge} 
        onClose={() => setSelectedBadge(null)} 
        badge={selectedBadge} 
        theme={theme} 
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: { height: height * 0.85, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 10 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#CCC', alignSelf: 'center', marginBottom: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '900', fontFamily: 'serif', letterSpacing: 1 },
  closeBtn: { padding: 5 },
  
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5 },
  
  content: { flex: 1, paddingBottom: 40 },
  sectionSubtitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 15, marginTop: 10 },
  
  progressCard: { padding: 20, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginBottom: 20 },
  levelTitle: { fontSize: 24, fontWeight: '900', fontFamily: 'serif', marginBottom: 10 },
  progressContainer: { width: '100%', height: 8, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 4, marginBottom: 8, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 12, fontWeight: 'bold' },
  
  loreBox: { padding: 15, borderRadius: 12, marginBottom: 10 },
  loreLevel: { fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
  loreText: { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 20 },
  badgeWrapper: { width: '48%', alignItems: 'center', padding: 15, borderWidth: 1.5, borderRadius: 16, marginBottom: 15 },
  badgeTitle: { fontSize: 13, fontWeight: 'bold', marginTop: 10, marginBottom: 5, textAlign: 'center' },
  badgeTarget: { fontSize: 10, fontWeight: 'bold' },
  
  rankRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  rankName: { fontSize: 16, fontWeight: '900', fontFamily: 'serif' },
  rankReq: { fontSize: 11, marginTop: 4 },
  futureRanksText: { fontSize: 11, fontStyle: 'italic', textAlign: 'center', marginTop: 15, lineHeight: 18 }
});
