import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function EventsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Eventi & Flussi</Text>
        <Text style={styles.subtitle}>Directory temporanea. Nessun evento attivo oggi.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF2' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', fontFamily: 'serif', color: '#1A1C1E' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 10 },
});
