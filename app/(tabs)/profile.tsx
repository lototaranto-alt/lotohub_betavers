import { View, StyleSheet, ScrollView, Text } from 'react-native';
import LotoPassCard from '../../components/LotoPassCard';
import { useTenant } from '../../context/TenantContext';

export default function ProfileScreen() {
  const { currentTenant } = useTenant();

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentTenant.colors.CREMA }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: currentTenant.colors.EBANO }]}>Il tuo Backup</Text>
        <Text style={styles.headerSubtitle}>L'unico modo per non perdere i tuoi LOTO PTI</Text>
      </View>
      <LotoPassCard />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    marginTop: 40,
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'serif'
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 5
  }
});
