import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../api/apiConfig';
import axios from 'axios';

export default function GRNScreen({ navigation }) {
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [pushing, setPushing] = useState(false);

  useEffect(() => {
    fetchGRNs();
  }, []);

  const fetchGRNs = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.GRN.LIST, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // The web app uses response.data.grns if it's an object, or just the array.
      // Assuming response.data.grns or response.data based on common patterns:
      const data = response.data?.grns || response.data || [];
      // Filter out items already pushed to stock
      const pendingData = data.filter(item => !item.pushed_to_stock);
      setGrns(pendingData);
      setSelectedItems([]);
    } catch (error) {
      console.error('Fetch GRNs error:', error);
      Alert.alert('Error', 'Failed to fetch GRN items.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (item) => {
    if (selectedItems.includes(item.grn_item_id)) {
      setSelectedItems(selectedItems.filter(id => id !== item.grn_item_id));
    } else {
      setSelectedItems([...selectedItems, item.grn_item_id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === grns.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(grns.map(item => item.grn_item_id));
    }
  };

  const handlePushToStock = async () => {
    if (selectedItems.length === 0) return;

    try {
      setPushing(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(API_ENDPOINTS.GRN.PUSH_TO_STOCK, {
        itemIds: selectedItems
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        Alert.alert('Success', 'Items successfully pushed to stock!');
        // Remove pushed items from the list visually
        setGrns(prev => prev.filter(item => !selectedItems.includes(item.grn_item_id)));
        setSelectedItems([]);
      } else {
        throw new Error(response.data?.message || 'Failed to push to stock');
      }
    } catch (error) {
      console.error('Push to stock error:', error);
      Alert.alert('Error', error.message || 'Something went wrong.');
    } finally {
      setPushing(false);
    }
  };

  const filteredGrns = grns.filter(item => 
    item.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.grn_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderGRNItem = ({ item }) => {
    const isSelected = selectedItems.includes(item.grn_item_id);
    return (
      <TouchableOpacity 
        style={[styles.grnCard, isSelected && styles.grnCardSelected]}
        onPress={() => handleToggleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons 
            name={isSelected ? "checkbox-marked" : "checkbox-blank-outline"} 
            size={24} 
            color={isSelected ? "#3b82f6" : "#cbd5e1"} 
          />
          <View style={styles.grnInfo}>
            <Text style={styles.itemName} numberOfLines={1}>{item.item_name || 'Unknown Item'}</Text>
            <Text style={styles.supplierName} numberOfLines={1}>{item.supplier_name}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.grn_number}</Text>
          </View>
        </View>
        
        <View style={styles.grnDetails}>
          <View style={styles.detailBlock}>
            <Text style={styles.detailLabel}>Order Qty</Text>
            <Text style={styles.detailValue}>{item.order_qty || 0}</Text>
          </View>
          <View style={styles.detailBlock}>
            <Text style={styles.detailLabel}>Recvd</Text>
            <Text style={[styles.detailValue, { color: '#10b981' }]}>{item.recvd_qty || 0}</Text>
          </View>
          <View style={styles.detailBlock}>
            <Text style={styles.detailLabel}>Damaged</Text>
            <Text style={[styles.detailValue, { color: item.damaged_qty > 0 ? '#ef4444' : '#64748b' }]}>
              {item.damaged_qty || 0}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pending GRNs</Text>
        <TouchableOpacity onPress={handleSelectAll} style={styles.selectAllBtn}>
          <MaterialCommunityIcons 
            name={selectedItems.length === grns.length && grns.length > 0 ? "checkbox-multiple-marked" : "checkbox-multiple-blank-outline"} 
            size={24} 
            color="#3b82f6" 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={24} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items, suppliers, GRN..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={20} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading pending items...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGrns}
          keyExtractor={(item) => item.grn_item_id.toString()}
          renderItem={renderGRNItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="check-all" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>All Caught Up!</Text>
              <Text style={styles.emptySubText}>Tap the + button to manually create a new GRN.</Text>
            </View>
          }
        />
      )}

      {selectedItems.length > 0 && (
        <View style={styles.bottomBar}>
          <Text style={styles.selectedText}>{selectedItems.length} items selected</Text>
          <TouchableOpacity 
            style={[styles.pushBtn, pushing && styles.pushBtnDisabled]} 
            onPress={handlePushToStock}
            disabled={pushing}
          >
            {pushing ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="package-down" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.pushBtnText}>Push to Stock</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.fab, selectedItems.length > 0 && { bottom: 100 }]} 
        onPress={() => navigation.navigate('CreateGRN')}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#ffffff" />
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f1f5f9' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#ffffff',
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  backButton: { padding: 8, marginLeft: -8 },
  selectAllBtn: { padding: 8, marginRight: -8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff',
    margin: 16, paddingHorizontal: 16, borderRadius: 16,
    borderWidth: 1, borderColor: '#e2e8f0', height: 54,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, height: '100%', fontSize: 16, color: '#0f172a' },
  listContainer: { padding: 16, paddingTop: 0, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 16, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '800', color: '#334155', marginTop: 16 },
  emptySubText: { fontSize: 14, color: '#64748b', marginTop: 8, textAlign: 'center', fontWeight: '500' },
  
  grnCard: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  grnCardSelected: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  grnInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  supplierName: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  statusBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  
  grnDetails: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: '#f8fafc', padding: 12, borderRadius: 12,
  },
  detailBlock: { alignItems: 'center', flex: 1 },
  detailLabel: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: 4 },
  detailValue: { fontSize: 15, fontWeight: '800', color: '#0f172a' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#ffffff', padding: 16, paddingBottom: 32,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 10,
  },
  selectedText: { fontSize: 14, fontWeight: '700', color: '#334155' },
  pushBtn: {
    backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
  },
  pushBtnDisabled: { backgroundColor: '#94a3b8' },
  pushBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ec4899', // Matching the GRN tile pink color
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  }
});
