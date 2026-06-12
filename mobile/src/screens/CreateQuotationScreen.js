import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productsAPI, sparesAPI, customersAPI, quotationsAPI } from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CreateQuotationScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]);
  
  // Checkout states
  const [isCartModalVisible, setIsCartModalVisible] = useState(false);
  const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState(false);
  const [discount, setDiscount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  const [savingLoading, setSavingLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, spareRes, custRes] = await Promise.all([
        productsAPI.getAll(),
        sparesAPI.getAll(),
        customersAPI.getAll().catch(() => [])
      ]);

      const extractResults = (res) => {
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.data)) return res.data;
        if (res && Array.isArray(res.customers)) return res.customers;
        return [];
      };

      const combined = [...extractResults(prodRes), ...extractResults(spareRes)];
      
      const formatted = combined.map(p => ({
        id: p.id,
        name: p.name || 'Unnamed Product',
        category: p.category_name || p.category || 'Uncategorized',
        sku: p.sku || p.part_number || '',
        price: parseFloat(p.price) || 0,
        gst: parseFloat(p.gst_rate) || 0,
      }));

      setProducts(formatted);
      setCustomers(extractResults(custRes));
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => ['All', ...new Set(products.map(p => p.category))], [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (activeCategory !== 'All' && p.category !== activeCategory) return false;
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.sku && p.sku.toLowerCase().includes(query))
      );
    });
  }, [products, activeCategory, searchQuery]);

  const filteredCustomers = useMemo(() => {
    if (!customerName) return customers;
    return customers.filter(c => c.name?.toLowerCase().includes(customerName.toLowerCase()) || c.phone?.includes(customerName));
  }, [customers, customerName]);

  const addToCart = (product) => {
    setCart(prevCart => {
      const exists = prevCart.find(i => i.id === product.id);
      if (exists) {
        return prevCart.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      } else {
        return [...prevCart, { ...product, qty: 1 }];
      }
    });
  };

  const updateQty = (id, type) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === id) {
        let qty = item.qty;
        if (type === 'inc') qty += 1;
        else qty = Math.max(1, qty - 1);
        return { ...item, qty };
      }
      return item;
    }));
  };

  const removeItem = (id) => {
    setCart(prevCart => prevCart.filter(i => i.id !== id));
  };

  const subtotal = cart.reduce((a, b) => a + (b.price * b.qty), 0);
  const gstTotal = cart.reduce((acc, item) => acc + (item.price * item.qty * (item.gst / 100)), 0);
  const discountAmount = subtotal * ((Number(discount) || 0) / 100);
  const totalAmount = subtotal + gstTotal - discountAmount;

  const handleSaveQuotation = async () => {
    if (cart.length === 0) {
      Alert.alert('Error', 'Cart is empty');
      return;
    }

    try {
      setSavingLoading(true);
      
      const payload = {
        customer_name: selectedCustomer ? selectedCustomer.name : customerName || 'Walk-in Customer',
        customer_phone: selectedCustomer ? selectedCustomer.phone : customerPhone,
        customer_email: customerEmail,
        subtotal,
        discount_amount: discountAmount,
        tax_amount: gstTotal,
        total_amount: totalAmount,
        items: cart.map(item => ({
          item_id: item.id,
          item_name: item.name,
          quantity: item.qty,
          unit_price: item.price,
          total_price: item.price * item.qty
        }))
      };

      await quotationsAPI.create(payload);
      
      Alert.alert('Success', 'Quotation created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Save Quote error:', error);
      Alert.alert('Error', error.message || 'Failed to save quotation');
    } finally {
      setSavingLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Quotation</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={() => setIsCartModalVisible(true)}>
          <View>
            <MaterialCommunityIcons name="cart-outline" size={24} color="#0f172a" />
            {cart.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cart.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.categoriesWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.productList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.productCard} onPress={() => addToCart(item)}>
              <View style={styles.productIconContainer}>
                <MaterialCommunityIcons name="package-variant" size={40} color="#8b5cf6" />
              </View>
              <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.productPrice}>₹{item.price.toFixed(2)}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Cart Summary Footer */}
      {cart.length > 0 && (
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerLabel}>Total Amount</Text>
            <Text style={styles.footerAmount}>₹{totalAmount.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={() => setIsCheckoutModalVisible(true)}>
            <Text style={styles.checkoutBtnText}>Review Quote</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Review Modal */}
      <Modal visible={isCheckoutModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.checkoutModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Finalize Quotation</Text>
              <TouchableOpacity onPress={() => setIsCheckoutModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Customer Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Customer Details</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Customer Name (Optional)"
                  value={customerName}
                  onChangeText={(val) => {
                    setCustomerName(val);
                    setSelectedCustomer(null);
                    setShowCustDropdown(true);
                  }}
                  onFocus={() => setShowCustDropdown(true)}
                />
                
                {showCustDropdown && customerName.length > 0 && !selectedCustomer && (
                  <View style={styles.dropdown}>
                    {filteredCustomers.slice(0, 3).map(c => (
                      <TouchableOpacity 
                        key={c.id} 
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedCustomer(c);
                          setCustomerName(c.name);
                          setCustomerPhone(c.phone || '');
                          setShowCustDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownName}>{c.name}</Text>
                        <Text style={styles.dropdownPhone}>{c.phone}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <TextInput
                  style={styles.input}
                  placeholder="Phone Number (Optional)"
                  keyboardType="phone-pad"
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Discount (%)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  keyboardType="numeric"
                  value={discount}
                  onChangeText={setDiscount}
                />
              </View>

              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text></View>
                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>GST Amount</Text><Text style={styles.summaryValue}>₹{gstTotal.toFixed(2)}</Text></View>
                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Discount</Text><Text style={[styles.summaryValue, {color: '#ef4444'}]}>-₹{discountAmount.toFixed(2)}</Text></View>
                <View style={[styles.summaryRow, styles.summaryTotal]}><Text style={styles.summaryTotalLabel}>Grand Total</Text><Text style={styles.summaryTotalValue}>₹{totalAmount.toFixed(2)}</Text></View>
              </View>
            </ScrollView>

            <View style={styles.checkoutFooter}>
              <TouchableOpacity style={[styles.payBtn, {backgroundColor: '#8b5cf6'}]} onPress={handleSaveQuotation} disabled={savingLoading}>
                {savingLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>Save Quotation</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Cart Modal */}
      <Modal visible={isCartModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.cartModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Items ({cart.length})</Text>
              <TouchableOpacity onPress={() => setIsCartModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={cart}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.cartItem}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.name}</Text>
                    <Text style={styles.cartItemPrice}>₹{item.price.toFixed(2)}</Text>
                  </View>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, 'dec')}><MaterialCommunityIcons name="minus" size={16} color="#64748b" /></TouchableOpacity>
                    <Text style={styles.qtyText}>{item.qty}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, 'inc')}><MaterialCommunityIcons name="plus" size={16} color="#64748b" /></TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(item.id)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  headerIcon: { padding: 8, position: 'relative' },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#ef4444', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', height: 48 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#0f172a' },
  categoriesWrapper: { marginBottom: 12 },
  categoriesContainer: { paddingHorizontal: 16 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  catChipActive: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  catText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  catTextActive: { color: '#fff' },
  productList: { padding: 12 },
  productCard: { flex: 1, backgroundColor: '#fff', margin: 4, borderRadius: 12, padding: 16, alignItems: 'center', elevation: 1, borderWidth: 1, borderColor: '#f1f5f9' },
  productIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f5f3ff', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  productName: { fontSize: 14, fontWeight: '600', color: '#1e293b', textAlign: 'center', marginBottom: 4 },
  productPrice: { fontSize: 15, fontWeight: '700', color: '#8b5cf6' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  footer: { backgroundColor: '#fff', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  footerLabel: { fontSize: 12, color: '#64748b' },
  footerAmount: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  checkoutBtn: { backgroundColor: '#8b5cf6', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  checkoutBtnText: { color: '#fff', fontWeight: '700', fontSize: 16, marginRight: 8 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  cartModal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 20, maxHeight: '80%' },
  checkoutModal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  modalBody: { padding: 20 },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  cartItemPrice: { fontSize: 14, color: '#8b5cf6', fontWeight: '700' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  qtyBtn: { padding: 8 },
  qtyText: { width: 32, textAlign: 'center', fontWeight: '600', fontSize: 15 },
  removeBtn: { padding: 12, marginLeft: 8 },
  
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#475569', marginBottom: 12 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 15, marginBottom: 12, color: '#0f172a' },
  dropdown: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginTop: -8, marginBottom: 12, elevation: 2 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownName: { fontWeight: '600', color: '#1e293b' },
  dropdownPhone: { fontSize: 12, color: '#64748b' },
  
  summaryBox: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginBottom: 40 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { color: '#64748b', fontSize: 14 },
  summaryValue: { color: '#0f172a', fontSize: 14, fontWeight: '600' },
  summaryTotal: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  summaryTotalLabel: { color: '#0f172a', fontSize: 16, fontWeight: '700' },
  summaryTotalValue: { color: '#8b5cf6', fontSize: 20, fontWeight: '800' },
  
  checkoutFooter: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  payBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
  payBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' }
});
