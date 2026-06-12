import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productsAPI, sparesAPI, customersAPI, billingAPI, branchesAPI } from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BluetoothEscposPrinter } from 'react-native-thermal-receipt-printer';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function POSScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]);
  
  // Checkout states
  const [isCartModalVisible, setIsCartModalVisible] = useState(false);
  const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState(false);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [discount, setDiscount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, spareRes, custRes, branchRes] = await Promise.all([
        productsAPI.getAll(),
        sparesAPI.getAll(),
        customersAPI.getAll().catch(() => []),
        branchesAPI.getAll().catch(() => [])
      ]);

      const extractResults = (res) => {
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.data)) return res.data;
        if (res && Array.isArray(res.customers)) return res.customers;
        if (res && Array.isArray(res.branches)) return res.branches;
        return [];
      };

      const prodResults = extractResults(prodRes);
      const spareResults = extractResults(spareRes);
      const custResults = extractResults(custRes);
      const branchResults = extractResults(branchRes);
      
      setBranches(branchResults);
      if (branchResults.length > 0) {
        setSelectedBranch(branchResults[0]);
      }

      const combined = [...prodResults, ...spareResults];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const unexpiredProducts = combined.filter(p => {
        if (!p.expiry_date) return true;
        const expDate = new Date(p.expiry_date);
        return expDate >= today;
      });

      const formatted = unexpiredProducts.map(p => ({
        id: p.id,
        name: p.name || 'Unnamed Product',
        category: p.category_name || p.category || 'Uncategorized',
        sku: p.sku || p.part_number || '',
        price: parseFloat(p.price) || 0,
        stock: Math.max(0, parseInt(p.quantity || p.stock) || 0),
        gst: parseFloat(p.gst_rate) || 0,
      }));

      setProducts(formatted);
      setCustomers(custResults);
    } catch (error) {
      console.error('Error fetching POS data:', error);
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
        if (exists.qty >= product.stock) {
          Alert.alert('Stock Limit', `Only ${product.stock} units available.`);
          return prevCart;
        }
        return prevCart.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      } else {
        if (product.stock <= 0) {
          Alert.alert('Out of Stock', 'This product is out of stock.');
          return prevCart;
        }
        return [...prevCart, { ...product, qty: 1 }];
      }
    });
  };

  const updateQty = (id, type) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === id) {
        let qty = item.qty;
        if (type === 'inc') {
          if (qty >= item.stock) {
            Alert.alert('Stock Limit', `Only ${item.stock} units available.`);
            return item;
          }
          qty += 1;
        } else {
          qty = Math.max(1, qty - 1);
        }
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
  const total = subtotal + gstTotal - discountAmount;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert('Error', 'Cart is empty');
      return;
    }
    
    if (paymentMode === 'credit' && !selectedCustomer && (!customerName.trim() || !customerPhone.trim())) {
      Alert.alert('Error', 'Customer Name and Phone are required for Credit payments');
      return;
    }

    try {
      setCheckoutLoading(true);
      
      const payload = {
        branch_id: selectedBranch ? selectedBranch.id : 1,
        customerId: selectedCustomer ? selectedCustomer.id : null,
        customerName: selectedCustomer ? selectedCustomer.name : (customerName.trim() || 'Walk-in Customer'),
        customerPhone: selectedCustomer ? (selectedCustomer.phone || selectedCustomer.mobile || '') : customerPhone.trim(),
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          qty: item.qty,
          price: item.price
        })),
        totalAmount: parseFloat(total.toFixed(2)),
        gstAmount: parseFloat(gstTotal.toFixed(2)),
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        paymentMethod: paymentMode,
        notes: '',
        invoiceType: 'pos'
      };

      const response = await billingAPI.create(payload);
      
      // Auto Print Receipt Logic
      try {
        const savedMac = await AsyncStorage.getItem('printer_mac');
        if (savedMac && BluetoothEscposPrinter) {
          await BluetoothEscposPrinter.printerInit();
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
          await BluetoothEscposPrinter.printText("STAYBILL PRO\r\n", { encoding: 'GBK', codepage: 0, widthtimes: 2, heigthtimes: 2, fonttype: 1 });
          await BluetoothEscposPrinter.printText("TAX INVOICE\r\n\r\n", {});
          
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
          await BluetoothEscposPrinter.printText(`Customer: ${payload.customerName}\r\n`, {});
          await BluetoothEscposPrinter.printText(`Phone: ${payload.customerPhone || 'N/A'}\r\n`, {});
          await BluetoothEscposPrinter.printText(`Date: ${new Date().toLocaleString()}\r\n`, {});
          await BluetoothEscposPrinter.printText("--------------------------------\r\n", {});
          
          // Items
          for (const item of payload.items) {
            await BluetoothEscposPrinter.printText(`${item.name.substring(0, 20)}\r\n`, {});
            await BluetoothEscposPrinter.printText(`  ${item.qty} x ${item.price} = ${(item.qty * item.price).toFixed(2)}\r\n`, {});
          }
          
          await BluetoothEscposPrinter.printText("--------------------------------\r\n", {});
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.RIGHT);
          await BluetoothEscposPrinter.printText(`Subtotal: ${subtotal.toFixed(2)}\r\n`, {});
          await BluetoothEscposPrinter.printText(`GST: ${gstTotal.toFixed(2)}\r\n`, {});
          if (discountAmount > 0) {
            await BluetoothEscposPrinter.printText(`Discount: -${discountAmount.toFixed(2)}\r\n`, {});
          }
          await BluetoothEscposPrinter.printText(`TOTAL: ${total.toFixed(2)}\r\n`, { widthtimes: 1, heigthtimes: 1 });
          await BluetoothEscposPrinter.printText(`Mode: ${paymentMode.toUpperCase()}\r\n`, {});
          
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
          await BluetoothEscposPrinter.printText("\r\nThank You For Your Business!\r\n\r\n\r\n", {});
        }
      } catch (printError) {
        console.error("Printing failed:", printError);
        Alert.alert("Printing Error", "Invoice created, but printing failed. Make sure your Bluetooth printer is connected.");
      }

      Alert.alert('Success', 'Invoice created successfully!', [
        { text: 'OK', onPress: () => {
            setIsCheckoutModalVisible(false);
            setIsCartModalVisible(false);
            setCart([]);
            setPaymentMode('cash');
            setDiscount('');
            setCustomerName('');
            setCustomerPhone('');
            setSelectedCustomer(null);
            fetchData(); // Refresh stock
        }}
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Checkout Failed', error.message || 'Something went wrong.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity style={styles.productCard} onPress={() => addToCart(item)}>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productSku}>{item.sku}</Text>
        <Text style={styles.productPrice}>₹{item.price.toFixed(2)}</Text>
      </View>
      <View style={styles.productStock}>
        <Text style={[styles.stockText, item.stock < 5 && styles.lowStockText]}>
          {item.stock} in stock
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>{item.name}</Text>
        <Text style={styles.cartItemPrice}>₹{item.price.toFixed(2)} x {item.qty}</Text>
      </View>
      <View style={styles.cartItemActions}>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, 'dec')}>
          <Text style={styles.qtyBtnText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.qty}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, 'inc')}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(item.id)}>
          <Text style={styles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header & Search */}
      <View style={styles.header}>
        <TextInput 
          style={styles.searchInput}
          placeholder="Search products by name or SKU..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories Horizontal Scroll */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.categoryTab, activeCategory === cat && styles.activeCategoryTab]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryText, activeCategory === cat && styles.activeCategoryText]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product List */}
      {loading ? (
        <ActivityIndicator size="large" color="#0ea5e9" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProduct}
          numColumns={2}
          contentContainerStyle={styles.productList}
          columnWrapperStyle={styles.row}
        />
      )}

      {/* Persistent Cart Bottom Bar */}
      {cart.length > 0 && (
        <TouchableOpacity style={styles.cartBottomBar} onPress={() => setIsCartModalVisible(true)}>
          <View style={styles.cartBarContent}>
            <Text style={styles.cartBarText}>{cart.reduce((s, i) => s + i.qty, 0)} Items</Text>
            <Text style={styles.cartBarTotal}>Total: ₹{total.toFixed(2)}</Text>
          </View>
          <Text style={styles.cartBarAction}>View Cart</Text>
        </TouchableOpacity>
      )}

      {/* Cart Full Screen Modal */}
      <Modal visible={isCartModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Your Cart</Text>
            <TouchableOpacity onPress={() => setIsCartModalVisible(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Text style={styles.emptyCartText}>Cart is empty</Text>
            </View>
          ) : (
            <>
              <FlatList
                data={cart}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderCartItem}
                style={styles.cartList}
              />
              
              <View style={styles.cartSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>GST Total</Text>
                  <Text style={styles.summaryValue}>₹{gstTotal.toFixed(2)}</Text>
                </View>
                {discountAmount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Discount ({discount}%)</Text>
                    <Text style={styles.summaryValue}>-₹{discountAmount.toFixed(2)}</Text>
                  </View>
                )}
                <View style={[styles.summaryRow, styles.grandTotalRow]}>
                  <Text style={styles.grandTotalLabel}>Grand Total</Text>
                  <Text style={styles.grandTotalValue}>₹{total.toFixed(2)}</Text>
                </View>

                <TouchableOpacity 
                  style={styles.checkoutBtn}
                  onPress={() => setIsCheckoutModalVisible(true)}
                >
                  <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </SafeAreaView>
      </Modal>

      {/* Checkout Modal */}
      <Modal visible={isCheckoutModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.checkoutOverlay}>
          <View style={styles.checkoutBox}>
            <View style={styles.checkoutHeader}>
              <Text style={styles.checkoutTitle}>Checkout</Text>
              <TouchableOpacity onPress={() => setIsCheckoutModalVisible(false)}>
                <Text style={styles.closeBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.sectionTitle}>Branch Details</Text>
              <View style={styles.inputGroup}>
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
                  <View style={styles.dropdown}>
                    {branches.length === 0 ? (
                      <Text style={styles.dropdownEmptyText}>No branches available</Text>
                    ) : (
                      branches.map(b => (
                        <TouchableOpacity 
                          key={b.id} 
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedBranch(b);
                            setShowBranchDropdown(false);
                          }}
                        >
                          <Text>{b.name}</Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}
              </View>

              <Text style={styles.sectionTitle}>Customer Details</Text>
              
              <View style={styles.inputGroup}>
                <TextInput 
                  style={styles.input} 
                  placeholder="Customer Name (Optional)" 
                  value={customerName}
                  onChangeText={(t) => {
                    setCustomerName(t);
                    setSelectedCustomer(null);
                    setShowCustDropdown(true);
                  }}
                  onFocus={() => setShowCustDropdown(true)}
                />
                {showCustDropdown && filteredCustomers.length > 0 && (
                  <View style={styles.dropdown}>
                    {filteredCustomers.slice(0, 5).map(c => (
                      <TouchableOpacity 
                        key={c.id} 
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedCustomer(c);
                          setCustomerName(c.name);
                          setCustomerPhone(c.phone || c.mobile || '');
                          setShowCustDropdown(false);
                        }}
                      >
                        <Text>{c.name} {c.phone ? `(${c.phone})` : ''}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <TextInput 
                  style={styles.input} 
                  placeholder="Phone Number (Optional)" 
                  keyboardType="phone-pad"
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                />
              </View>

              <Text style={styles.sectionTitle}>Discount</Text>
              <View style={styles.inputGroup}>
                <TextInput 
                  style={styles.input} 
                  placeholder="Discount % (Optional)" 
                  keyboardType="numeric"
                  value={discount}
                  onChangeText={setDiscount}
                />
              </View>

              <Text style={styles.sectionTitle}>Payment Method</Text>
              <View style={styles.paymentMethods}>
                {['cash', 'upi', 'card', 'credit'].map(method => (
                  <TouchableOpacity 
                    key={method}
                    style={[styles.paymentBtn, paymentMode === method && styles.activePaymentBtn]}
                    onPress={() => setPaymentMode(method)}
                  >
                    <Text style={[styles.paymentBtnText, paymentMode === method && styles.activePaymentBtnText]}>
                      {method.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.checkoutSummary}>
                <Text style={styles.checkoutTotalText}>Total to Pay: ₹{total.toFixed(2)}</Text>
              </View>

              <TouchableOpacity 
                style={[styles.completeBtn, checkoutLoading && styles.disabledBtn]}
                onPress={handleCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.completeBtnText}>Complete Payment</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  categoriesContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  activeCategoryTab: {
    backgroundColor: '#0ea5e9',
  },
  categoryText: {
    color: '#64748b',
    fontWeight: '500',
  },
  activeCategoryText: {
    color: '#ffffff',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productList: {
    padding: 8,
    paddingBottom: 80, // Space for bottom bar
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    margin: 8,
    flex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    justifyContent: 'space-between',
  },
  productInfo: {
    marginBottom: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  productSku: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  productStock: {
    marginTop: 'auto',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  stockText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  lowStockText: {
    color: '#ef4444',
  },
  cartBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartBarContent: {
    flexDirection: 'column',
  },
  cartBarText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  cartBarTotal: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cartBarAction: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  closeBtnText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCartText: {
    color: '#64748b',
    fontSize: 16,
  },
  cartList: {
    padding: 16,
  },
  cartItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#64748b',
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    backgroundColor: '#f1f5f9',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  qtyText: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  removeBtn: {
    marginLeft: 16,
    padding: 8,
  },
  removeBtnText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartSummary: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  grandTotalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  checkoutBtn: {
    backgroundColor: '#0ea5e9',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  checkoutBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkoutOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  checkoutBox: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  checkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkoutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    marginTop: 16,
  },
  inputGroup: {
    marginBottom: 12,
    zIndex: 10,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    zIndex: 100,
    elevation: 5,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paymentBtn: {
    flex: 1,
    minWidth: '45%',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    marginBottom: 10,
  },
  activePaymentBtn: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0ea5e9',
  },
  paymentBtnText: {
    color: '#64748b',
    fontWeight: '600',
  },
  activePaymentBtnText: {
    color: '#0ea5e9',
  },
  checkoutSummary: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  checkoutTotalText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  completeBtn: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  dropdownToggle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1',
    borderRadius: 8, paddingHorizontal: 12, height: 44,
  },
  dropdownToggleText: { fontSize: 15, color: '#0f172a' },
  dropdownEmptyText: { padding: 12, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' },
  completeBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
