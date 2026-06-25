import { View, StyleSheet, ScrollView, Text } from 'react-native';
import LotoPassCard from '../../components/LotoPassCard';
import { useTheme } from '../../context/ThemeContext';

export default function ProfileScreen() {
  const { theme } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Il tuo Backup</Text>
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
