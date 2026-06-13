import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { billingAPI, posSettingsAPI } from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BluetoothEscposPrinter } from '../utils/PrinterWrapper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function ReportsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' or 'wholesale'
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [posSettings, setPosSettings] = useState(null);

  const fetchInvoices = useCallback(async (pageNum = 1, isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setLoading(true);

      const params = {
        page: pageNum,
        limit: 20,
        invoiceType: activeTab,
        ...(searchTerm ? { searchTerm } : {})
      };

      const data = await billingAPI.getAll(params);
      
      if (pageNum === 1) {
        setInvoices(data.invoices || []);
      } else {
        setInvoices(prev => [...prev, ...(data.invoices || [])]);
      }
      
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching reports:', error);
      Alert.alert('Error', 'Failed to load invoices.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices(1);
    }, 500); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchInvoices]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const storedBranch = await AsyncStorage.getItem('selectedBranch');
        const branchObj = storedBranch ? JSON.parse(storedBranch) : null;
        const branchId = branchObj ? branchObj.id : 1;
        const settings = await posSettingsAPI.getSettings(branchId);
        setPosSettings(settings);
      } catch (e) {
        console.error('Error fetching pos settings:', e);
      }
    };
    fetchSettings();
  }, []);

  const handleRefresh = () => {
    fetchInvoices(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && page < totalPages) {
      fetchInvoices(page + 1);
    }
  };

  const fetchInvoiceDetails = async (id) => {
    try {
      setDetailsLoading(true);
      setIsModalVisible(true);
      const data = await billingAPI.getDetails(id);
      if (data && data.invoice) {
        setSelectedInvoice({
          ...data.invoice,
          items: data.items || []
        });
      }
    } catch (error) {
      console.error('Error fetching details:', error);
      Alert.alert('Error', 'Failed to load invoice details.');
      setIsModalVisible(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleReprint = async () => {
    if (!selectedInvoice) return;
    try {
      const savedMac = await AsyncStorage.getItem('printer_mac');
      if (!savedMac) {
        Alert.alert("No Printer", "Please configure a Bluetooth printer in Profile Settings first.");
        return;
      }

      if (!BluetoothEscposPrinter) {
        Alert.alert("Error", "Native module missing. Use EAS Build.");
        return;
      }

      await BluetoothEscposPrinter.printerInit();
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printText(`${posSettings?.shop_name || 'STAYBILL PRO'}\r\n`, { encoding: 'GBK', codepage: 0, widthtimes: 2, heigthtimes: 2, fonttype: 1 });
      await BluetoothEscposPrinter.printText("REPRINT - TAX INVOICE\r\n\r\n", {});
      
      const isWholesale = selectedInvoice.invoice_type === 'wholesale' || activeTab === 'wholesale';
      const printSize = isWholesale ? (posSettings?.wholesale_print_size || 'A4') : (posSettings?.print_size || '80mm');
      const is80mm = printSize === '80mm';
      const lineLen = is80mm ? 48 : 32;
      const maxNameLen = is80mm ? 30 : 20;
      const separator = "-".repeat(lineLen) + "\r\n";

      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      await BluetoothEscposPrinter.printText(`INV: INV-${String(selectedInvoice.id).padStart(4, '0')}\r\n`, {});
      await BluetoothEscposPrinter.printText(`Customer: ${selectedInvoice.customer_name || 'Walk-in'}\r\n`, {});
      await BluetoothEscposPrinter.printText(`Phone: ${selectedInvoice.customer_phone || 'N/A'}\r\n`, {});
      await BluetoothEscposPrinter.printText(`Date: ${new Date(selectedInvoice.created_at).toLocaleString()}\r\n`, {});
      await BluetoothEscposPrinter.printText(separator, {});
      
      // Items
      if (selectedInvoice.items && selectedInvoice.items.length > 0) {
        for (const item of selectedInvoice.items) {
          const itemName = item.item_name || 'Unknown Item';
          await BluetoothEscposPrinter.printText(`${itemName.substring(0, maxNameLen)}\r\n`, {});
          await BluetoothEscposPrinter.printText(`  ${item.quantity} x ${item.unit_price} = ${(item.quantity * item.unit_price).toFixed(2)}\r\n`, {});
        }
      }
      
      await BluetoothEscposPrinter.printText(separator, {});
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.RIGHT);
      
      // Calculate subtotals if not directly available
      const total = Number(selectedInvoice.total_amount || 0);
      const gst = Number(selectedInvoice.gst_amount || 0);
      const discount = Number(selectedInvoice.discount_amount || 0);
      const sub = total - gst + discount;

      await BluetoothEscposPrinter.printText(`Subtotal: ${sub.toFixed(2)}\r\n`, {});
      await BluetoothEscposPrinter.printText(`GST: ${gst.toFixed(2)}\r\n`, {});
      if (discount > 0) {
        await BluetoothEscposPrinter.printText(`Discount: -${discount.toFixed(2)}\r\n`, {});
      }
      await BluetoothEscposPrinter.printText(`TOTAL: ${total.toFixed(2)}\r\n`, { widthtimes: 1, heigthtimes: 1 });
      await BluetoothEscposPrinter.printText(`Mode: ${(selectedInvoice.payment_method || '').toUpperCase()}\r\n`, {});
      
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printText("\r\nThank You For Your Business!\r\n\r\n\r\n", {});
      
    } catch (error) {
      console.error("Printing failed:", error);
      Alert.alert("Print Error", error.message || "Could not print the receipt.");
    }
  };

  const handleDownloadReceipt = async () => {
    if (!selectedInvoice) return;
    try {
      const isWholesale = selectedInvoice.invoice_type === 'wholesale' || activeTab === 'wholesale';
      const printSize = isWholesale ? (posSettings?.wholesale_print_size || 'A4') : (posSettings?.print_size || '80mm');
      let paperWidth = '302px';
      if (printSize === 'A4') paperWidth = '794px';
      else if (printSize === '50mm') paperWidth = '188px';
      else if (printSize === '55mm') paperWidth = '208px';

      const total = Number(selectedInvoice.total_amount || 0);
      const gst = Number(selectedInvoice.gst_amount || 0);
      const discount = Number(selectedInvoice.discount_amount || 0);
      const sub = total - gst + discount;

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Courier New', Courier, monospace; width: ${paperWidth}; padding: 10px; margin: 0; color: #000; font-size: 12px; }
              .center { text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { text-align: left; padding: 4px 0; font-size: 11px; border-bottom: 1px dashed #ccc; }
              .right { text-align: right; }
              .bold { font-weight: bold; }
              @page { margin: 0; size: auto; }
            </style>
          </head>
          <body>
            <h2 class="center" style="margin:0;">${posSettings?.shop_name || 'STAYBILL PRO'}</h2>
            <div class="center" style="margin-bottom:10px; font-size:10px;">
              ${posSettings?.shop_address || 'Address Not Set'}<br>
              Phone: ${posSettings?.phone || 'N/A'}<br>
              GSTIN: ${posSettings?.gstin || 'N/A'}
            </div>
            <div class="center bold">REPRINT - TAX INVOICE</div>
            <hr style="border-top:1px dashed #000;">
            <div>Customer: ${selectedInvoice.customer_name || 'Walk-in'}</div>
            <div>Phone: ${selectedInvoice.customer_phone || 'N/A'}</div>
            <div>Invoice No: INV-${String(selectedInvoice.id).padStart(4, '0')}</div>
            <div>Date: ${new Date(selectedInvoice.created_at).toLocaleString()}</div>
            <table>
              <tr><th>Item</th><th>Qty</th><th class="right">Total</th></tr>
              ${(selectedInvoice.items || []).map(i => `
                <tr>
                  <td>${i.item_name}</td>
                  <td>${i.quantity}</td>
                  <td class="right">${(i.quantity * i.unit_price).toFixed(2)}</td>
                </tr>
              `).join('')}
            </table>
            <div style="margin-top:10px;">
              <div style="display:flex; justify-content:space-between;"><span>Subtotal:</span><span>${sub.toFixed(2)}</span></div>
              <div style="display:flex; justify-content:space-between;"><span>GST:</span><span>${gst.toFixed(2)}</span></div>
              ${discount > 0 ? `<div style="display:flex; justify-content:space-between;"><span>Discount:</span><span>-${discount.toFixed(2)}</span></div>` : ''}
              <div style="display:flex; justify-content:space-between;" class="bold"><span>Total:</span><span>${total.toFixed(2)}</span></div>
              <div style="display:flex; justify-content:space-between;"><span>Mode:</span><span>${(selectedInvoice.payment_method || '').toUpperCase()}</span></div>
            </div>
            <div class="center" style="margin-top:15px; font-weight:bold;">Thank You!</div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not generate PDF');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#64748b';
    }
  };

  const renderInvoiceCard = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => fetchInvoiceDetails(item.id)}>
      <View style={styles.cardHeader}>
        <Text style={styles.invoiceId}>INV-{String(item.id).padStart(4, '0')}</Text>
        <Text style={[styles.statusBadge, { color: getStatusColor(item.status), backgroundColor: getStatusColor(item.status) + '1A' }]}>
          {item.status?.toUpperCase() || 'UNKNOWN'}
        </Text>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.customer_name || 'Walk-in Customer'}</Text>
          <Text style={styles.customerPhone}>{item.customer_phone || 'No phone'}</Text>
        </View>
        <View style={styles.amountInfo}>
          <Text style={styles.amount}>₹{Number(item.total_amount || 0).toLocaleString()}</Text>
          <Text style={styles.paymentMethod}>{item.payment_method?.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>{new Date(item.created_at).toLocaleString()}</Text>
        <Text style={styles.itemsCount}>{item.item_count || 0} items</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pos' && styles.activeTab]} 
          onPress={() => setActiveTab('pos')}
        >
          <Text style={[styles.tabText, activeTab === 'pos' && styles.activeTabText]}>POS Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'wholesale' && styles.activeTab]} 
          onPress={() => setActiveTab('wholesale')}
        >
          <Text style={[styles.tabText, activeTab === 'wholesale' && styles.activeTabText]}>Wholesale</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput 
          style={styles.searchInput}
          placeholder="Search Invoice # or Customer..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* List */}
      {loading && page === 1 ? (
        <ActivityIndicator size="large" color="#0ea5e9" style={styles.loader} />
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          renderItem={renderInvoiceCard}
          contentContainerStyle={styles.listContainer}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No invoices found</Text>
            </View>
          }
          ListFooterComponent={
            loading && page > 1 ? <ActivityIndicator color="#0ea5e9" style={{ margin: 10 }} /> : null
          }
        />
      )}

      {/* Invoice Details Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Invoice Preview</Text>
            
            <TouchableOpacity style={styles.reprintBtn} onPress={handleReprint}>
              <MaterialCommunityIcons name="printer" size={20} color="#fff" />
              <Text style={styles.reprintBtnText}>Reprint</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.reprintBtn, {backgroundColor: '#0ea5e9'}]} onPress={handleDownloadReceipt}>
              <MaterialCommunityIcons name="download" size={20} color="#fff" />
              <Text style={styles.reprintBtnText}>PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => { setIsModalVisible(false); setSelectedInvoice(null); }}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
          
          {detailsLoading ? (
            <ActivityIndicator size="large" color="#0ea5e9" style={styles.loader} />
          ) : selectedInvoice ? (
            <ScrollView style={styles.modalBody}>
              <View style={styles.invoicePaper}>
                {/* Header */}
                <View style={styles.paperHeader}>
                  <Text style={styles.companyName}>{selectedInvoice.business_name || 'STAYBILL PRO'}</Text>
                  <Text style={styles.companyMeta}>GSTIN: {selectedInvoice.branch_gst || 'N/A'}</Text>
                  <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
                </View>

                {/* Meta */}
                <View style={styles.paperMetaRow}>
                  <View>
                    <Text style={styles.metaLabel}>Billed To:</Text>
                    <Text style={styles.metaValue}>{selectedInvoice.customer_name}</Text>
                    <Text style={styles.metaSubValue}>{selectedInvoice.customer_phone}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.metaLabel}>Invoice No:</Text>
                    <Text style={styles.metaValue}>INV-{String(selectedInvoice.id).padStart(4, '0')}</Text>
                    <Text style={styles.metaSubValue}>{new Date(selectedInvoice.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>

                {/* Items */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, { flex: 3 }]}>Item</Text>
                  <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                  <Text style={[styles.th, { flex: 2, textAlign: 'right' }]}>Rate</Text>
                  <Text style={[styles.th, { flex: 2, textAlign: 'right' }]}>Amount</Text>
                </View>
                
                {selectedInvoice.items && selectedInvoice.items.map((item, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.td, { flex: 3 }]} numberOfLines={2}>{item.item_name}</Text>
                    <Text style={[styles.td, { flex: 1, textAlign: 'center' }]}>{item.quantity}</Text>
                    <Text style={[styles.td, { flex: 2, textAlign: 'right' }]}>₹{item.unit_price}</Text>
                    <Text style={[styles.td, { flex: 2, textAlign: 'right' }]}>₹{item.total_price}</Text>
                  </View>
                ))}

                <View style={styles.divider} />

                {/* Totals */}
                <View style={styles.totalsBox}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal:</Text>
                    <Text style={styles.totalValue}>₹{Number(selectedInvoice.total_amount - selectedInvoice.gst_amount + selectedInvoice.discount_amount).toLocaleString()}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>GST:</Text>
                    <Text style={styles.totalValue}>₹{Number(selectedInvoice.gst_amount).toLocaleString()}</Text>
                  </View>
                  {Number(selectedInvoice.discount_amount) > 0 && (
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Discount:</Text>
                      <Text style={styles.totalValue}>-₹{Number(selectedInvoice.discount_amount).toLocaleString()}</Text>
                    </View>
                  )}
                  <View style={[styles.totalRow, styles.grandTotalRow]}>
                    <Text style={styles.grandTotalLabel}>Grand Total:</Text>
                    <Text style={styles.grandTotalValue}>₹{Number(selectedInvoice.total_amount).toLocaleString()}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Payment Mode:</Text>
                    <Text style={styles.totalValue}>{selectedInvoice.payment_method.toUpperCase()}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Status:</Text>
                    <Text style={[styles.totalValue, { color: getStatusColor(selectedInvoice.status) }]}>{selectedInvoice.status.toUpperCase()}</Text>
                  </View>
                </View>
                
                <View style={styles.footerSignature}>
                  <Text style={styles.signatureText}>Authorized Signatory</Text>
                </View>

              </View>
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#ffffff', padding: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#eff6ff' },
  tabText: { fontSize: 16, fontWeight: '600', color: '#64748b' },
  activeTabText: { color: '#0ea5e9' },
  searchContainer: { padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  searchInput: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 8, fontSize: 16 },
  listContainer: { padding: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  invoiceId: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 4 },
  customerPhone: { fontSize: 14, color: '#64748b' },
  amountInfo: { alignItems: 'flex-end' },
  amount: { fontSize: 18, fontWeight: 'bold', color: '#0ea5e9', marginBottom: 4 },
  paymentMethod: { fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  dateText: { fontSize: 12, color: '#94a3b8' },
  itemsCount: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#64748b', fontSize: 16 },
  
  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: '#f1f5f9' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  closeBtnText: { color: '#475569', fontWeight: '600' },
  reprintBtn: { flexDirection: 'row', backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center', marginHorizontal: 8 },
  reprintBtnText: { color: '#fff', fontWeight: '600', marginLeft: 6 },
  modalBody: { padding: 16 },
  invoicePaper: { backgroundColor: '#ffffff', padding: 24, borderRadius: 8, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, marginBottom: 40 },
  paperHeader: { alignItems: 'center', marginBottom: 24, borderBottomWidth: 2, borderBottomColor: '#e2e8f0', paddingBottom: 16 },
  companyName: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  companyMeta: { fontSize: 12, color: '#64748b', marginBottom: 8 },
  invoiceTitle: { fontSize: 18, fontWeight: 'bold', color: '#0ea5e9', marginTop: 8 },
  paperMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  metaLabel: { fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  metaValue: { fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 2 },
  metaSubValue: { fontSize: 14, color: '#64748b' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f8fafc', paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#cbd5e1', marginBottom: 8 },
  th: { fontSize: 12, fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  td: { fontSize: 14, color: '#334155' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 16 },
  totalsBox: { alignSelf: 'flex-end', width: '100%', minWidth: 200, maxWidth: 300, backgroundColor: '#f8fafc', padding: 16, borderRadius: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontSize: 14, color: '#64748b' },
  totalValue: { fontSize: 14, fontWeight: '600', color: '#334155' },
  grandTotalRow: { borderTopWidth: 1, borderTopColor: '#cbd5e1', paddingTop: 8, marginTop: 4, marginBottom: 12 },
  grandTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  grandTotalValue: { fontSize: 18, fontWeight: 'bold', color: '#0ea5e9' },
  footerSignature: { marginTop: 40, alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, width: 150, alignSelf: 'flex-end' },
  signatureText: { fontSize: 12, color: '#94a3b8', textAlign: 'center', width: '100%' }
});
