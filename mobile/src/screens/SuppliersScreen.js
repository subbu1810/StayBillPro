import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Platform, Modal, Alert, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../api/apiConfig';
import axios from 'axios';

export default function SuppliersScreen({ navigation }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    supplier_name: '',
    mobile: '',
    email: '',
    city: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.SUPPLIERS.LIST, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuppliers(response.data || []);
    } catch (error) {
      console.error('Fetch suppliers error:', error);
      Alert.alert('Error', 'Failed to fetch suppliers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSupplier = async () => {
    if (!formData.supplier_name.trim() || !formData.mobile.trim()) {
      Alert.alert('Validation Error', 'Supplier Name and Mobile Number are required.');
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('token');
      
      if (editingId) {
        await axios.put(API_ENDPOINTS.SUPPLIERS.UPDATE(editingId), formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Success', 'Supplier updated successfully.');
      } else {
        await axios.post(API_ENDPOINTS.SUPPLIERS.CREATE, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Success', 'Supplier added successfully.');
      }

      setIsModalVisible(false);
      setFormData({ supplier_name: '', mobile: '', email: '', city: '' });
      setEditingId(null);
      fetchSuppliers();
    } catch (error) {
      console.error('Save supplier error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save supplier.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (supplier) => {
    setFormData({
      supplier_name: supplier.supplier_name || '',
      mobile: supplier.mobile || '',
      email: supplier.email || '',
      city: supplier.city || '',
    });
    setEditingId(supplier.id);
    setIsModalVisible(true);
  };

  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.mobile?.includes(searchQuery)
  );

  const renderSupplierItem = ({ item }) => (
    <View style={styles.supplierCard}>
      <View style={styles.supplierHeader}>
        <View style={styles.supplierIcon}>
          <Text style={styles.supplierInitials}>
            {item.supplier_name ? item.supplier_name.substring(0, 2).toUpperCase() : 'SP'}
          </Text>
        </View>
        <View style={styles.supplierInfo}>
          <Text style={styles.supplierName} numberOfLines={1} ellipsizeMode="tail">{item.supplier_name}</Text>
          <Text style={styles.supplierCode} numberOfLines={1} ellipsizeMode="tail">{item.supplier_code || 'No Code'}</Text>
        </View>
        <TouchableOpacity style={styles.editIconButton} onPress={() => handleEditClick(item)}>
          <MaterialCommunityIcons name="pencil-outline" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.supplierDetails}>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="phone" size={16} color="#64748b" />
          <Text style={styles.detailText}>{item.mobile || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="email" size={16} color="#64748b" />
          <Text style={styles.detailText} numberOfLines={1}>{item.email || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="map-marker" size={16} color="#64748b" />
          <Text style={styles.detailText} numberOfLines={1} ellipsizeMode="tail">{item.city || 'N/A'}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suppliers</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={24} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search suppliers by name or phone..."
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
          <Text style={styles.loadingText}>Loading suppliers...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSuppliers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSupplierItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="truck-delivery-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>No suppliers found</Text>
              <Text style={styles.emptySubText}>Tap the + button to add a new supplier.</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={() => {
          setEditingId(null);
          setFormData({ supplier_name: '', mobile: '', email: '', city: '' });
          setIsModalVisible(true);
        }}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Add Supplier Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingId ? 'Edit Supplier' : 'Add New Supplier'}</Text>
                <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
                  <MaterialCommunityIcons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Supplier Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="E.g., ABC Electronics"
                    value={formData.supplier_name}
                    onChangeText={(text) => setFormData({...formData, supplier_name: text})}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mobile Number *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="E.g., 9876543210"
                    keyboardType="phone-pad"
                    value={formData.mobile}
                    onChangeText={(text) => setFormData({...formData, mobile: text})}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="E.g., contact@abcelectronics.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(text) => setFormData({...formData, email: text})}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="E.g., Mumbai"
                    value={formData.city}
                    onChangeText={(text) => setFormData({...formData, city: text})}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
                  onPress={handleSaveSupplier}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveButtonText}>{editingId ? 'Update Supplier' : 'Save Supplier'}</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 54,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#0f172a',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  supplierCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  supplierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  supplierIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  supplierInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3b82f6',
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  supplierCode: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  supplierDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
  },
  editIconButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 13,
    color: '#475569',
    marginLeft: 6,
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalContent: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeButton: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  }
});
