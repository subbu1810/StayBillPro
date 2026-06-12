import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { customersAPI } from '../api/api';

export default function CustomersScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add Modal State
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', gst_number: '', address: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await customersAPI.getAll({ search: searchQuery });
      setCustomers(data.customers || data || []);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, fetchCustomers]);

  const handleCall = (phoneNumber) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleSaveCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      Alert.alert('Error', 'Name and Phone are required');
      return;
    }
    
    try {
      setIsSaving(true);
      await customersAPI.create(newCustomer);
      Alert.alert('Success', 'Customer added successfully');
      setIsAddModalVisible(false);
      setNewCustomer({ name: '', phone: '', email: '', gst_number: '', address: '' });
      fetchCustomers();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to add customer');
    } finally {
      setIsSaving(false);
    }
  };

  const renderCustomer = ({ item }) => (
    <View style={styles.customerCard}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{item.name ? item.name.charAt(0).toUpperCase() : 'C'}</Text>
      </View>
      
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.name}</Text>
        <Text style={styles.customerPhone}>
          <MaterialCommunityIcons name="phone-outline" size={12} /> {item.phone || item.mobile || 'N/A'}
        </Text>
        {(item.gst_number || item.email) && (
          <Text style={styles.customerDetails} numberOfLines={1}>
            {item.gst_number ? `GST: ${item.gst_number}  ` : ''}
            {item.email || ''}
          </Text>
        )}
      </View>

      <TouchableOpacity 
        style={styles.callButton} 
        onPress={() => handleCall(item.phone || item.mobile)}
        disabled={!item.phone && !item.mobile}
      >
        <MaterialCommunityIcons 
          name="phone" 
          size={24} 
          color={(item.phone || item.mobile) ? '#10b981' : '#cbd5e1'} 
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customers Directory</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCustomer}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="account-search-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>No customers found</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setIsAddModalVisible(true)}>
        <MaterialCommunityIcons name="plus" size={30} color="#ffffff" />
      </TouchableOpacity>

      {/* Add Customer Modal */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Customer</Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Customer Name *</Text>
              <TextInput style={styles.input} value={newCustomer.name} onChangeText={(t) => setNewCustomer({...newCustomer, name: t})} placeholder="e.g. Rahul Sharma" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput style={styles.input} value={newCustomer.phone} onChangeText={(t) => setNewCustomer({...newCustomer, phone: t})} placeholder="10 digit mobile number" keyboardType="phone-pad" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email (Optional)</Text>
              <TextInput style={styles.input} value={newCustomer.email} onChangeText={(t) => setNewCustomer({...newCustomer, email: t})} placeholder="customer@email.com" keyboardType="email-address" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>GST Number (Optional)</Text>
              <TextInput style={styles.input} value={newCustomer.gst_number} onChangeText={(t) => setNewCustomer({...newCustomer, gst_number: t})} placeholder="29ABCDE1234F1Z5" autoCapitalize="characters" />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveCustomer} disabled={isSaving}>
              {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Customer</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', margin: 16, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: Platform.OS === 'ios' ? 12 : 8, fontSize: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 80 },
  customerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  avatarContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#4f46e5' },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  customerPhone: { fontSize: 14, color: '#64748b', marginBottom: 2 },
  customerDetails: { fontSize: 12, color: '#94a3b8' },
  callButton: { padding: 12, backgroundColor: '#f0fdf4', borderRadius: 12 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#94a3b8', fontSize: 16, marginTop: 12 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 10, fontSize: 16 },
  saveBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
