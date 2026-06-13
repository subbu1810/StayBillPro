import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../api/apiConfig';
import axios from 'axios';
import { branchesAPI } from '../api/api';
import { BluetoothEscposPrinter } from '../utils/PrinterWrapper';

export default function CreateGRNScreen({ route, navigation }) {
  const scannedData = route.params?.scannedData || null;

  const [supplierName, setSupplierName] = useState(scannedData?.supplierName || '');
  const [grnDate, setGrnDate] = useState(new Date().toISOString().split('T')[0]);
  const [poReference, setPoReference] = useState(scannedData?.invoiceNumber || '');
  
  const initialItems = scannedData?.items?.length > 0 
    ? scannedData.items.map((item, index) => ({
        id: Date.now().toString() + index,
        product_name: item.name || '',
        quantity_received: item.quantity?.toString() || '1',
        damaged_quantity: '0'
      }))
    : [{ id: Date.now().toString(), product_name: '', quantity_received: '1', damaged_quantity: '0' }];

  const [items, setItems] = useState(initialItems);
  const [saving, setSaving] = useState(false);
  
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  React.useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const data = await branchesAPI.getAll();
      const branchList = Array.isArray(data) ? data : data?.branches || [];
      setBranches(branchList);
      if (branchList.length > 0) {
        setSelectedBranch(branchList[0]);
      }
    } catch (error) {
      console.error('Fetch branches error:', error);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items, 
      { id: Date.now().toString(), product_name: '', quantity_received: '1', damaged_quantity: '0' }
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
        return { ...item, [field]: value };
      }
      return item;
    });
    setItems(updatedItems);
  };

  const calculateTotalReceived = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.quantity_received) || 0), 0);
  };

  const handleSaveGRN = async () => {
    if (!supplierName.trim()) {
      Alert.alert('Validation Error', 'Please enter a Supplier Name.');
      return;
    }
    if (!grnDate.trim()) {
      Alert.alert('Validation Error', 'Please enter a GRN Date.');
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
      warehouse: selectedBranch ? selectedBranch.name : 'Main Warehouse',
      supplier_name: supplierName.trim(),
      grn_date: grnDate,
      po_id: poReference.trim() ? poReference.trim() : null,
      status: 'Stocked',
      items: validItems.map(item => ({
        product_name: item.product_name,
        quantity_received: parseFloat(item.quantity_received) || 1,
        damaged_quantity: parseFloat(item.damaged_quantity) || 0
      }))
    };

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(API_ENDPOINTS.GRN.CREATE, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        Alert.alert(
          'Success', 
          'Goods Receipt Note created successfully! Would you like to print it?',
          [
            { text: 'No', onPress: () => navigation.goBack() },
            { text: 'Yes, Print', onPress: () => printGRN(payload) }
          ]
        );
      } else {
        throw new Error(response.data?.message || 'Failed to create GRN');
      }
    } catch (error) {
      console.error('Create GRN Error:', error);
      Alert.alert('Error', error.response?.data?.message || error.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const printGRN = async (payload) => {
    try {
      const savedMac = await AsyncStorage.getItem('printer_mac');
      if (!savedMac) {
        Alert.alert("No Printer", "Please configure a Bluetooth printer in Profile Settings first.");
        navigation.goBack();
        return;
      }
      if (!BluetoothEscposPrinter) {
        Alert.alert("Error", "Native module missing. Use EAS Build.");
        navigation.goBack();
        return;
      }

      await BluetoothEscposPrinter.printerInit();
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printText("STAYBILL PRO\r\n", { encoding: 'GBK', codepage: 0, widthtimes: 2, heigthtimes: 2, fonttype: 1 });
      await BluetoothEscposPrinter.printText("GOODS RECEIPT NOTE\r\n\r\n", {});
      
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      await BluetoothEscposPrinter.printText(`Supplier: ${payload.supplier_name}\r\n`, {});
      await BluetoothEscposPrinter.printText(`Date: ${payload.grn_date}\r\n`, {});
      if (payload.po_id) {
        await BluetoothEscposPrinter.printText(`PO Ref: ${payload.po_id}\r\n`, {});
      }
      await BluetoothEscposPrinter.printText("--------------------------------\r\n", {});
      
      await BluetoothEscposPrinter.printText("Item                 Recvd  Dmg\r\n", {});
      await BluetoothEscposPrinter.printText("--------------------------------\r\n", {});
      
      for (const item of payload.items) {
        const itemName = item.product_name.padEnd(20, ' ').substring(0, 20);
        const recvd = String(item.quantity_received).padEnd(6, ' ');
        const dmg = String(item.damaged_quantity);
        await BluetoothEscposPrinter.printText(`${itemName} ${recvd} ${dmg}\r\n`, {});
      }
      
      await BluetoothEscposPrinter.printText("--------------------------------\r\n", {});
      await BluetoothEscposPrinter.printText("\r\nRECEIVED BY: \r\n\r\n\r\n\r\n", {});
      
      navigation.goBack();
    } catch (error) {
      console.error("Printing failed:", error);
      Alert.alert("Print Error", error.message || "Could not print the GRN.");
      navigation.goBack();
    }
  };

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
          <Text style={styles.headerTitle}>Create GRN</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* General Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Receipt Details</Text>
            
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
                <Text style={styles.label}>Date Received *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={grnDate}
                  onChangeText={setGrnDate}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>PO Reference</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Optional PO ID"
                  value={poReference}
                  onChangeText={setPoReference}
                />
              </View>
            </View>
          </View>

          {/* Items Section */}
          <View style={styles.section}>
            <View style={styles.itemsHeader}>
              <Text style={styles.sectionTitle}>Received Items</Text>
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
                    <Text style={styles.label}>Received Qty</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={item.quantity_received}
                      onChangeText={(val) => handleItemChange(item.id, 'quantity_received', val)}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 4 }]}>
                    <Text style={styles.label}>Damaged Qty</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={item.damaged_quantity}
                      onChangeText={(val) => handleItemChange(item.id, 'damaged_quantity', val)}
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
            <Text style={styles.grandTotalLabel}>Total Items Received</Text>
            <Text style={styles.grandTotalValue}>{calculateTotalReceived()}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
            onPress={handleSaveGRN}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save GRN</Text>
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
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
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ec4899', // Pink to match GRN theme
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
  grandTotalValue: { fontSize: 20, fontWeight: '800', color: '#ec4899' },
  saveBtn: {
    backgroundColor: '#10b981', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, minWidth: 120, alignItems: 'center'
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
