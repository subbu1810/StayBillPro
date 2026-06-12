import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Platform,
  Modal, Alert, ScrollView, KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { productsAPI, sparesAPI, categoriesAPI } from '../api/api';

export default function InventoryScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' or 'service'
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentItemId, setCurrentItemId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    part_number: '',
    price: '',
    wholesale_price: '',
    quantity: '',
    brand: '',
    unit: 'Nos',
    purchase_price: '',
    min_wholesale_qty: '',
    low_stock_warning: '5',
    gst_rate: '',
    dimensions: '',
    size: '',
    serial_number: '',
    hsn_code: '',
  });
  const [saving, setSaving] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, [activeTab]);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const api = activeTab === 'sales' ? productsAPI : sparesAPI;
      // In web app, selectedBranchId was passed, but we don't have it natively yet so we fetch all
      const response = await api.getAll({}); 
      
      let results = [];
      if (Array.isArray(response)) {
        results = response;
      } else if (response && Array.isArray(response.data)) {
        results = response.data;
      }
      setItems(results);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Could not connect to the inventory service.');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      (item.name || '').toLowerCase().includes(query) || 
      (item.part_number || '').toLowerCase().includes(query) ||
      (item.sku || '').toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  const openAddModal = () => {
    setEditMode(false);
    setCurrentItemId(null);
    setFormData({ 
      name: '', category: '', part_number: '', price: '', wholesale_price: '', quantity: '',
      brand: '', unit: 'Nos', purchase_price: '', min_wholesale_qty: '', low_stock_warning: '5',
      gst_rate: '', dimensions: '', size: '', serial_number: '', hsn_code: ''
    });
    setShowCategoryDropdown(false);
    setIsModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditMode(true);
    setCurrentItemId(item.id);
    setFormData({
      name: item.name || '',
      category: item.category || item.category_name || '',
      part_number: item.part_number || item.sku || '',
      price: (item.price || 0).toString(),
      wholesale_price: (item.wholesale_price || 0).toString(),
      quantity: (item.quantity || item.stock || 0).toString(),
      brand: item.brand || '',
      unit: item.unit || 'Nos',
      purchase_price: (item.purchase_price || 0).toString(),
      min_wholesale_qty: (item.min_wholesale_qty || 0).toString(),
      low_stock_warning: (item.low_stock_warning || 5).toString(),
      gst_rate: (item.gst_rate || 0).toString(),
      dimensions: item.dimensions || '',
      size: item.size || '',
      serial_number: item.serial_number || '',
      hsn_code: item.hsn_code || ''
    });
    setShowCategoryDropdown(false);
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Product name is required');
      return;
    }
    
    setSaving(true);
    try {
      const api = activeTab === 'sales' ? productsAPI : sparesAPI;
      const payload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        wholesale_price: parseFloat(formData.wholesale_price) || 0,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        quantity: parseFloat(formData.quantity) || 0,
        min_wholesale_qty: parseInt(formData.min_wholesale_qty) || 0,
        low_stock_warning: parseInt(formData.low_stock_warning) || 5,
        gst_rate: parseInt(formData.gst_rate) || 0,
        category: formData.category || 'General',
        brand: formData.brand || 'Generic',
        unit: formData.unit || 'Nos',
      };

      if (editMode && currentItemId) {
        await api.update(currentItemId, payload);
      } else {
        await api.create(payload);
      }
      
      setIsModalVisible(false);
      fetchInventory();
      Alert.alert('Success', `Item successfully ${editMode ? 'updated' : 'added'}!`);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const uniqueCategories = useMemo(() => {
    const cats = new Set(items.map(item => item.category || item.category_name || 'General'));
    return Array.from(cats);
  }, [items]);

  const filteredCategories = useMemo(() => {
    if (!formData.category) return uniqueCategories;
    return uniqueCategories.filter(c => c.toLowerCase().includes(formData.category.toLowerCase()));
  }, [uniqueCategories, formData.category]);

  const handleNameBlur = async () => {
    if (formData.name && !formData.category) {
      setIsCategorizing(true);
      try {
        const response = await categoriesAPI.autoCategorize({ itemName: formData.name });
        if (response && response.category) {
          setFormData(prev => ({ ...prev, category: response.category }));
        }
      } catch (err) {
        console.error('Error auto-categorizing:', err);
      } finally {
        setIsCategorizing(false);
      }
    }
  };

  const renderItem = ({ item }) => {
    const stock = item.quantity || item.stock || 0;
    const isLowStock = stock < 5;
    const status = item.status ? item.status.replace(/_/g, ' ').toUpperCase() : 'AVAILABLE';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <View style={[styles.badge, { backgroundColor: isLowStock ? '#fef2f2' : '#f0fdf4' }]}>
            <Text style={[styles.badgeText, { color: isLowStock ? '#ef4444' : '#15803d' }]}>
              {stock} In Stock
            </Text>
          </View>
        </View>

        <Text style={styles.categoryText}>
          {item.category_name || item.category || 'General'}
        </Text>

        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={styles.detailValue}>₹{(item.price || 0).toLocaleString()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Wholesale</Text>
            <Text style={styles.detailValue}>{item.wholesale_price ? `₹${item.wholesale_price.toLocaleString()}` : '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>SKU / ID</Text>
            <Text style={styles.detailValue}>{item.part_number || item.sku || '—'}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, {
            backgroundColor: status === 'AVAILABLE' ? '#f0fdf4' : status === 'OUT OF STOCK' ? '#fef2f2' : '#f1f5f9'
          }]}>
            <Text style={[styles.statusText, {
              color: status === 'AVAILABLE' ? '#15803d' : status === 'OUT OF STOCK' ? '#ef4444' : '#475569'
            }]}>
              {status}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => openEditModal(item)}>
            <MaterialCommunityIcons name="pencil" size={18} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'sales' && styles.activeTab]}
          onPress={() => setActiveTab('sales')}
        >
          <MaterialCommunityIcons 
            name="cart-outline" 
            size={20} 
            color={activeTab === 'sales' ? '#3b82f6' : '#64748b'} 
          />
          <Text style={[styles.tabText, activeTab === 'sales' && styles.activeTabText]}>
            Sales Stock
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'service' && styles.activeTab]}
          onPress={() => setActiveTab('service')}
        >
          <MaterialCommunityIcons 
            name="tools" 
            size={20} 
            color={activeTab === 'service' ? '#3b82f6' : '#64748b'} 
          />
          <Text style={[styles.tabText, activeTab === 'service' && styles.activeTabText]}>
            Service Parts
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or SKU..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchInventory}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContent}>
              <MaterialCommunityIcons name="package-variant" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>No inventory items found.</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={openAddModal}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={30} color="#ffffff" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent={false} onRequestClose={() => setIsModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editMode ? 'Edit Item' : 'Add New Item'}</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Product Name *</Text>
                <TextInput style={styles.input} value={formData.name} onChangeText={(t) => setFormData({...formData, name: t})} onBlur={handleNameBlur} placeholder="Enter name" />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8, zIndex: 100 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.label}>Category</Text>
                    {isCategorizing && <ActivityIndicator size="small" color="#3b82f6" style={{ marginBottom: 8 }} />}
                  </View>
                  <TextInput 
                    style={styles.input} 
                    value={formData.category} 
                    onChangeText={(t) => {
                      setFormData({...formData, category: t});
                      setShowCategoryDropdown(true);
                    }} 
                    onFocus={() => setShowCategoryDropdown(true)}
                    placeholder="E.g., Hardware" 
                  />
                  {showCategoryDropdown && (
                    <View style={styles.dropdownContainer}>
                      {filteredCategories.length > 0 ? filteredCategories.map(cat => (
                        <TouchableOpacity key={cat} style={styles.dropdownItem} onPress={() => { setFormData({...formData, category: cat}); setShowCategoryDropdown(false); }}>
                          <Text style={styles.dropdownText}>{cat}</Text>
                        </TouchableOpacity>
                      )) : (
                        <TouchableOpacity style={styles.dropdownItem} onPress={() => setShowCategoryDropdown(false)}>
                          <Text style={styles.dropdownText}>Create new: "{formData.category}"</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Brand</Text>
                  <TextInput style={styles.input} value={formData.brand} onChangeText={(t) => setFormData({...formData, brand: t})} placeholder="Generic" />
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>SKU / Part Number</Text>
                  <TextInput style={styles.input} value={formData.part_number} onChangeText={(t) => setFormData({...formData, part_number: t})} placeholder="Optional" />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>HSN Code</Text>
                  <TextInput style={styles.input} value={formData.hsn_code} onChangeText={(t) => setFormData({...formData, hsn_code: t})} placeholder="HSN" />
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Retail Price (₹)</Text>
                  <TextInput style={styles.input} value={formData.price} onChangeText={(t) => setFormData({...formData, price: t})} keyboardType="numeric" placeholder="0.00" />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Wholesale (₹)</Text>
                  <TextInput style={styles.input} value={formData.wholesale_price} onChangeText={(t) => setFormData({...formData, wholesale_price: t})} keyboardType="numeric" placeholder="0.00" />
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Purchase Price (₹)</Text>
                  <TextInput style={styles.input} value={formData.purchase_price} onChangeText={(t) => setFormData({...formData, purchase_price: t})} keyboardType="numeric" placeholder="0.00" />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>GST Rate (%)</Text>
                  <TextInput style={styles.input} value={formData.gst_rate} onChangeText={(t) => setFormData({...formData, gst_rate: t})} keyboardType="numeric" placeholder="0" />
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Quantity in Stock</Text>
                  <TextInput style={styles.input} value={formData.quantity} onChangeText={(t) => setFormData({...formData, quantity: t})} keyboardType="numeric" placeholder="0" />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Unit</Text>
                  <TextInput style={styles.input} value={formData.unit} onChangeText={(t) => setFormData({...formData, unit: t})} placeholder="Nos, Kg, Ltr" />
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Low Stock Alert At</Text>
                  <TextInput style={styles.input} value={formData.low_stock_warning} onChangeText={(t) => setFormData({...formData, low_stock_warning: t})} keyboardType="numeric" placeholder="5" />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Min Wholesale Qty</Text>
                  <TextInput style={styles.input} value={formData.min_wholesale_qty} onChangeText={(t) => setFormData({...formData, min_wholesale_qty: t})} keyboardType="numeric" placeholder="0" />
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Dimensions</Text>
                  <TextInput style={styles.input} value={formData.dimensions} onChangeText={(t) => setFormData({...formData, dimensions: t})} placeholder="LxWxH" />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Size</Text>
                  <TextInput style={styles.input} value={formData.size} onChangeText={(t) => setFormData({...formData, size: t})} placeholder="M, L, XL" />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Serial Number</Text>
                <TextInput style={styles.input} value={formData.serial_number} onChangeText={(t) => setFormData({...formData, serial_number: t})} placeholder="S/N..." />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Item</Text>
                )}
              </TouchableOpacity>
            </View>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
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
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 8,
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 20,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginRight: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  categoryText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 16,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 12,
  },
  detailRow: {
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionButton: {
    padding: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 20 : 24,
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalFooter: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: Platform.OS === 'ios' ? 24 : 0,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  dropdownContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 150,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'absolute',
    top: 76,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownText: {
    fontSize: 14,
    color: '#334155',
  }
});
