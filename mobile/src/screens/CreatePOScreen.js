import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../api/apiConfig';
import { branchesAPI } from '../api/api';
import axios from 'axios';

export default function CreatePOScreen({ navigation }) {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [supplierName, setSupplierName] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState('');
  
  const [items, setItems] = useState([
    { id: Date.now().toString(), product_name: '', quantity: '1', unit_price: '0', total_price: '0' }
  ]);
  
  const [saving, setSaving] = useState(false);
  
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      // Fetch suppliers to auto-complete or check
      const suppRes = await axios.get(API_ENDPOINTS.SUPPLIERS.LIST, { headers: { Authorization: `Bearer ${token}` }});
      setSuppliers(suppRes.data?.suppliers || suppRes.data || []);
      
      // Fetch products for dropdowns if needed, or user can just type them
      const prodRes = await axios.get(API_ENDPOINTS.PRODUCTS.LIST, { headers: { Authorization: `Bearer ${token}` }});
      setProducts(prodRes.data?.data || prodRes.data || []);
      
      // Fetch branches
      const branchRes = await branchesAPI.getAll();
      const branchList = Array.isArray(branchRes) ? branchRes : branchRes?.branches || [];
      setBranches(branchList);
      if (branchList.length > 0) {
        setSelectedBranch(branchList[0]);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items, 
      { id: Date.now().toString(), product_name: '', quantity: '1', unit_price: '0', total_price: '0' }
    ]);
  };

  const handleRemoveItem = (id) => {
    if (items.length === 1) {
      Alert.alert('Notice', 'You must have at least one item.');
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Recalculate total if quantity or price changes
        if (field === 'quantity' || field === 'unit_price') {
          const qty = parseFloat(updatedItem.quantity) || 0;
          const price = parseFloat(updatedItem.unit_price) || 0;
          updatedItem.total_price = (qty * price).toFixed(2);
        }
        return updatedItem;
      }
      return item;
    });
    setItems(updatedItems);
  };

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0).toFixed(2);
  };

  const handleSavePO = async () => {
    if (!supplierName.trim()) {
      Alert.alert('Validation Error', 'Please enter a Supplier Name.');
      return;
    }
    if (!orderDate.trim()) {
      Alert.alert('Validation Error', 'Please enter an Order Date.');
      return;
    }

    // Validate items
    const validItems = items.filter(i => i.product_name.trim().length > 0);
    if (validItems.length === 0) {
      Alert.alert('Validation Error', 'Please complete at least one item row (Name is required).');
      return;
    }

    const payload = {
      branch_id: selectedBranch ? selectedBranch.id : 1,
      supplier_name: supplierName.trim(),
      order_date: orderDate,
      expected_date: expectedDate || null,
      items: validItems.map(item => ({
        product_name: item.product_name,
        quantity: parseFloat(item.quantity) || 1,
        unit_price: parseFloat(item.unit_price) || 0,
        total_price: parseFloat(item.total_price) || 0
      }))
    };

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(API_ENDPOINTS.PURCHASE_ORDERS.CREATE, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        Alert.alert('Success', 'Purchase Order created successfully!');
        navigation.goBack();
      } else {
        throw new Error(response.data?.message || 'Failed to create PO');
      }
    } catch (error) {
      console.error('Create PO Error:', error);
      Alert.alert('Error', error.response?.data?.message || error.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create PO</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* General Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>General Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Branch *</Text>
              <TouchableOpacity 
                style={styles.dropdownToggle}
                onPress={() => setShowBranchDropdown(!showBranchDropdown)}
              >
                <Text style={styles.dropdownToggleText}>
                  {selectedBranch ? selectedBranch.name : 'Select Branch'}
                </Text>
                <MaterialCommunityIcons name={showBranchDropdown ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />
              </TouchableOpacity>
              
              {showBranchDropdown && (
                <View style={styles.dropdownMenu}>
                  {branches.length === 0 ? (
                    <Text style={styles.dropdownEmptyText}>No branches available</Text>
                  ) : (
                    branches.map(b => (
                      <TouchableOpacity 
                        key={b.id} 
                        style={styles.dropdownMenuItem}
                        onPress={() => {
                          setSelectedBranch(b);
                          setShowBranchDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownMenuItemText}>{b.name}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Supplier Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Supplier Name"
                value={supplierName}
                onChangeText={setSupplierName}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Order Date *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={orderDate}
                  onChangeText={setOrderDate}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Expected Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={expectedDate}
                  onChangeText={setExpectedDate}
                />
              </View>
            </View>
          </View>

          {/* Items Section */}
          <View style={styles.section}>
            <View style={styles.itemsHeader}>
              <Text style={styles.sectionTitle}>Line Items</Text>
              <TouchableOpacity style={styles.addBtn} onPress={handleAddItem}>
                <MaterialCommunityIcons name="plus" size={16} color="#ffffff" />
                <Text style={styles.addBtnText}>Add Row</Text>
              </TouchableOpacity>
            </View>

            {items.map((item, index) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemCardHeader}>
                  <Text style={styles.itemCardTitle}>Item {index + 1}</Text>
                  <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Product Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter item name"
                    value={item.product_name}
                    onChangeText={(val) => handleItemChange(item.id, 'product_name', val)}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 4 }]}>
                    <Text style={styles.label}>Qty</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={item.quantity}
                      onChangeText={(val) => handleItemChange(item.id, 'quantity', val)}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginHorizontal: 4 }]}>
                    <Text style={styles.label}>Unit Price (₹)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={item.unit_price}
                      onChangeText={(val) => handleItemChange(item.id, 'unit_price', val)}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 4 }]}>
                    <Text style={styles.label}>Total (₹)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: '#f8fafc', color: '#64748b' }]}
                      editable={false}
                      value={item.total_price}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>

        </ScrollView>

        {/* Footer Area */}
        <View style={styles.footer}>
          <View style={styles.grandTotalContainer}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>₹{calculateGrandTotal()}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
            onPress={handleSavePO}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save PO</Text>
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f1f5f9' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 16 },
  
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#ffffff',
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  
  content: { flex: 1, padding: 16 },
  
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1',
    borderRadius: 8, paddingHorizontal: 12, height: 44, fontSize: 15, color: '#0f172a'
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  
  itemsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20
  },
  addBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '600', marginLeft: 4 },
  
  itemCard: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#e2e8f0'
  },
  itemCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  itemCardTitle: { fontSize: 14, fontWeight: '700', color: '#64748b' },

  footer: {
    backgroundColor: '#ffffff', padding: 16, paddingBottom: 24,
    borderTopWidth: 1, borderTopColor: '#e2e8f0',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  grandTotalLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', textTransform: 'uppercase' },
  grandTotalValue: { fontSize: 20, fontWeight: '800', color: '#0ea5e9' },
  saveBtn: {
    backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, minWidth: 120, alignItems: 'center'
  },
  saveBtnDisabled: { backgroundColor: '#94a3b8' },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  
  dropdownToggle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1',
    borderRadius: 8, paddingHorizontal: 12, height: 44,
  },
  dropdownToggleText: { fontSize: 15, color: '#0f172a' },
  dropdownMenu: {
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1',
    borderRadius: 8, marginTop: 4, elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  dropdownMenuItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownMenuItemText: { fontSize: 15, color: '#334155' },
  dropdownEmptyText: { padding: 12, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }
});
