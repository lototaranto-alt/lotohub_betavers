import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, FlatList, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { supabase } from '../../utils/supabase';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [pois, setPois] = useState<any[]>([]);
  const [filteredPois, setFilteredPois] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchPois();
  }, []);

  const fetchPois = async () => {
    const { data } = await supabase.rpc('get_pois');
    if (data) {
      setPois(data);
      setFilteredPois(data);
    }
  };

  useEffect(() => {
    let result = pois;
    if (searchQuery) {
      result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (activeCategory !== 'all') {
      result = result.filter(p => p.category === activeCategory);
    }
    setFilteredPois(result);
  }, [searchQuery, activeCategory, pois]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Esplora Taranto</Text>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#64748B" />
          <TextInput
            placeholder="Cerca un luogo o un evento..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        {['all', 'free', 'partner', 'secret'].map(cat => (
          <TouchableOpacity 
            key={cat} 
            style={[styles.filterBtn, activeCategory === cat && styles.filterBtnActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.filterText, activeCategory === cat && styles.filterTextActive]}>
              {cat.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredPois}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.poiCard}>
            <Image source={{uri: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=300'}} style={styles.poiThumb} />
            <View style={styles.poiInfo}>
              <Text style={styles.poiName}>{item.name}</Text>
              <Text style={styles.poiCat}>🏷️ {item.category.toUpperCase()}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 25, backgroundColor: '#FFF' },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', padding: 12, borderRadius: 15 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, marginVertical: 10 },
  filterBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
  filterBtnActive: { backgroundColor: '#4A5D23', borderColor: '#4A5D23' },
  filterText: { fontSize: 10, fontWeight: 'bold', color: '#64748B' },
  filterTextActive: { color: '#FFF' },
  poiCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 15, elevation: 1 },
  poiThumb: { width: 60, height: 60, borderRadius: 10 },
  poiInfo: { flex: 1, marginLeft: 15 },
  poiName: { fontSize: 16, fontWeight: 'bold' },
  poiCat: { fontSize: 10, color: '#64748B', marginTop: 4 }
});
