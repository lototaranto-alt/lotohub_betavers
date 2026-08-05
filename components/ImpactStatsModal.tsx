import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, FlatList, StyleSheet, Dimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

interface ImpactStatsModalProps {
  visible: boolean;
  onClose: () => void;
  userProfile: any;
  userTransactions: any[];
  userTokens: number;
  theme: any;
}

export default function ImpactStatsModal({ visible, onClose, userProfile, userTransactions, userTokens, theme }: ImpactStatsModalProps) {
  const [activeTab, setActiveTab] = useState<'co2' | 'pts'>('co2');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        
        <View style={[styles.modalContent, { backgroundColor: theme.background, borderColor: theme.accent }]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Impatto & Punti</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'co2' && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]} 
              onPress={() => setActiveTab('co2')}
            >
              <MaterialIcons name="eco" size={20} color={activeTab === 'co2' ? theme.primary : theme.textMuted} />
              <Text style={[styles.tabText, { color: activeTab === 'co2' ? theme.primary : theme.textMuted }]}>CO₂</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'pts' && { borderBottomColor: theme.accent, borderBottomWidth: 3 }]} 
              onPress={() => setActiveTab('pts')}
            >
              <MaterialIcons name="toll" size={20} color={activeTab === 'pts' ? theme.accent : theme.textMuted} />
              <Text style={[styles.tabText, { color: activeTab === 'pts' ? theme.accent : theme.textMuted }]}>LOTO PTI</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ padding: 20 }}>
            {activeTab === 'co2' ? (
              <View style={{ alignItems: 'center' }}>
                <MaterialIcons name="eco" size={60} color={theme.primary} style={{ marginBottom: 15 }} />
                <Text style={[styles.mainStat, { color: theme.primary }]}>{userProfile?.total_co2?.toFixed(2) ?? '0.00'} kg</Text>
                <Text style={styles.statLabel}>Totale CO₂ Risparmiata</Text>
                
                <View style={{ width: '100%', marginTop: 30 }}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>CRONOLOGIA IMPATTO</Text>
                  {userTransactions.filter(tx => tx.co2_saved > 0).length === 0 ? (
                    <Text style={[styles.emptyText, { color: theme.textMuted }]}>Nessuna attività eco-sostenibile registrata.</Text>
                  ) : (
                    userTransactions.filter(tx => tx.co2_saved > 0).map(item => (
                      <View key={item.id} style={[styles.transactionItem, { borderBottomColor: theme.border }]}>
                        <View>
                          <Text style={[styles.txTitle, { color: theme.text }]}>{item.action_type || 'Attività Eco'}</Text>
                          <Text style={[styles.txDate, { color: theme.textMuted }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
                        </View>
                        <Text style={[styles.txVal, { color: theme.primary }]}>+{item.co2_saved.toFixed(1)} kg</Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <MaterialIcons name="toll" size={60} color={theme.accent} style={{ marginBottom: 15 }} />
                <Text style={[styles.mainStat, { color: theme.accent }]}>{userTokens}</Text>
                <Text style={styles.statLabel}>Totale LOTO PTI</Text>
                
                <View style={{ width: '100%', marginTop: 30 }}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>CRONOLOGIA GUADAGNI</Text>
                  {userTransactions.filter(tx => tx.tokens_earned > 0).length === 0 ? (
                    <Text style={[styles.emptyText, { color: theme.textMuted }]}>Nessun LOTO PTI accumulato finora.</Text>
                  ) : (
                    userTransactions.filter(tx => tx.tokens_earned > 0).map(item => (
                      <View key={item.id} style={[styles.transactionItem, { borderBottomColor: theme.border }]}>
                        <View>
                          <Text style={[styles.txTitle, { color: theme.text }]}>{item.action_type || 'Bonus LOTO'}</Text>
                          <Text style={[styles.txDate, { color: theme.textMuted }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
                        </View>
                        <Text style={[styles.txVal, { color: theme.accent }]}>+{item.tokens_earned} PTI</Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            )}
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26, 28, 30, 0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', height: '70%', borderRadius: 30, borderWidth: 1, overflow: 'hidden', elevation: 15, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 20, fontWeight: '900', fontFamily: 'serif' },
  closeBtn: { padding: 5 },
  tabsContainer: { flexDirection: 'row', width: '100%', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  tab: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, gap: 8 },
  tabText: { fontSize: 14, fontWeight: 'bold' },
  mainStat: { fontSize: 42, fontWeight: 'bold' },
  statLabel: { fontSize: 16, opacity: 0.8, marginTop: 5 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 15, letterSpacing: 0.5 },
  emptyText: { fontSize: 13, textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, paddingVertical: 12 },
  txTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  txDate: { fontSize: 11 },
  txVal: { fontSize: 16, fontWeight: 'bold' }
});
