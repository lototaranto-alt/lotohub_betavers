import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { supabase } from '../utils/supabase';
import { useCity } from '../context/CityContext';
import { useTenant } from '../context/TenantContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  userId: string;
  initialLocation?: { lat: number; lng: number };
}

const CATEGORIES = [
  { id: 'barrier', label: 'Barriera Architettonica', icon: 'stairs' },
  { id: 'degradation', label: 'Degrado Urbano', icon: 'home-repair-service' },
  { id: 'lighting', label: 'Illuminazione', icon: 'lightbulb-outline' },
  { id: 'accessibility', label: 'Accessibilità', icon: 'accessible' },
  { id: 'other', label: 'Altro', icon: 'chat-bubble-outline' },
];

export const CivicReportSheet: React.FC<Props> = ({ visible, onClose, userId, initialLocation }) => {
  const { tenant: currentTenant } = useTenant();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'idle' | 'pending' | 'confirmed'>('idle');

  const submit = async () => {
    if (!category || !description) return;
    setLoading(true);

    const lat = initialLocation?.lat || 0;
    const lng = initialLocation?.lng || 0;
    const gridCell = `${lat.toFixed(3)}_${lng.toFixed(3)}`;

    // [NOTA DI SVILUPPO - FASE 4: Whitelabel]
    // Inseriamo la segnalazione assegnandola automaticamente al tenant corrente
    // (currentTenant?.id). In questo modo, il database sa a quale Comune appartiene
    // e il Pannello Admin filtrerà i dati usando le Row Level Security (RLS) di Supabase.
    const { data, error } = await supabase
      .from('civic_reports')
      .insert({
        tenant_id: currentTenant?.id || 'taranto',
        user_id: userId,
        grid_cell: gridCell, // Adattato per coerenza col DB
        category,
        description,
        status: 'pending',
        latitude: lat,
        longitude: lng,
      })
      .select()
      .single();

    setLoading(false);
    if (!error && data) {
      setResult(data.status === 'confirmed' ? 'confirmed' : 'pending');
      setTimeout(() => {
        setResult('idle');
        setCategory('');
        setDescription('');
        onClose();
      }, 4000);
    } else {
      console.error(error);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>
            {currentTenant?.localization?.civic_module_name || 'Segnalazione Civica'}
          </Text>

          {result === 'confirmed' ? (
            <View style={styles.resultBox}>
              <MaterialIcons name="check-circle" size={48} color="#10B981" style={styles.resultIcon} />
              <Text style={styles.resultTitle}>Confermato!</Text>
              <Text style={styles.resultText}>
                Un altro cittadino ha riscontrato lo stesso problema. +25 PTI bonus!
              </Text>
            </View>
          ) : result === 'pending' ? (
            <View style={styles.resultBox}>
              <MaterialIcons name="schedule" size={48} color="#94A3B8" style={styles.resultIcon} />
              <Text style={styles.resultTitle}>Grazie per la segnalazione!</Text>
              <Text style={styles.resultText}>
                In attesa di conferma da un altro cittadino nel raggio di 50 metri...
              </Text>
            </View>
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catBtn, category === cat.id && styles.catActive]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <MaterialIcons name={cat.icon as any} size={22} style={styles.catIcon} />
                    <Text style={[styles.catText, category === cat.id && styles.catTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                style={styles.input}
                placeholder="Descrivi il problema in dettaglio..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.submitBtn, (!category || !description) && styles.submitDisabled]}
                onPress={submit}
                disabled={!category || !description || loading}
              >
                <Text style={styles.submitText}>
                  {loading ? 'Invio in corso...' : currentTenant?.localization?.civic_submit_button || 'Invia Segnalazione'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Chiudi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  container: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '90%', maxHeight: '85%' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#1B263B', textAlign: 'center' },
  categories: { flexDirection: 'row', marginBottom: 16 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f5f5f5', marginRight: 8, alignItems: 'center', minWidth: 80 },
  catActive: { backgroundColor: '#C41E3A' },
  catIcon: { fontSize: 22, marginBottom: 4 },
  catText: { fontSize: 11, color: '#666', textAlign: 'center' },
  catTextActive: { color: '#fff', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 16, minHeight: 90 },
  submitBtn: { backgroundColor: '#C41E3A', padding: 16, borderRadius: 12, alignItems: 'center' },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  closeBtn: { marginTop: 12, alignItems: 'center' },
  closeText: { color: '#999', fontSize: 14 },
  resultBox: { alignItems: 'center', paddingVertical: 32 },
  resultIcon: { fontSize: 56, marginBottom: 16 },
  resultTitle: { fontSize: 20, fontWeight: 'bold', color: '#1B263B', marginBottom: 8 },
  resultText: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
});
