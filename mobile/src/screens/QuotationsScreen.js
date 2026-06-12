import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Platform, Modal, ScrollView, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { quotationsAPI } from '../api/api';
import { BluetoothEscposPrinter } from 'react-native-thermal-receipt-printer';

export default function QuotationsScreen({ navigation }) {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Details Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchQuotations();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const data = await quotationsAPI.getAll();
      setQuotations(data || []);
    } catch (error) {
      console.error('Fetch Quotations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotes = quotations.filter(q => 
    q.quote_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewQuote = async (id) => {
    try {
      setDetailsLoading(true);
      setIsModalVisible(true);
      const data = await quotationsAPI.getDetails(id);
      setSelectedQuote(data.quotation || data);
    } catch (error) {
      console.error('Error fetching Quote details:', error);
      Alert.alert('Error', 'Failed to load Quotation details.');
      setIsModalVisible(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handlePrintQuote = async () => {
    if (!selectedQuote) return;
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
      await BluetoothEscposPrinter.printText("STAYBILL PRO\r\n", { encoding: 'GBK', codepage: 0, widthtimes: 2, heigthtimes: 2, fonttype: 1 });
      await BluetoothEscposPrinter.printText("QUOTATION\r\n\r\n", {});
      
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      await BluetoothEscposPrinter.printText(`Quote: ${selectedQuote.quote_id}\r\n`, {});
      await BluetoothEscposPrinter.printText(`Customer: ${selectedQuote.customer_name || 'Walk-in'}\r\n`, {});
      await BluetoothEscposPrinter.printText(`Phone: ${selectedQuote.customer_phone || 'N/A'}\r\n`, {});
      await BluetoothEscposPrinter.printText(`Date: ${new Date(selectedQuote.created_at).toLocaleDateString()}\r\n`, {});
      await BluetoothEscposPrinter.printText("--------------------------------\r\n", {});
      
      const items = selectedQuote.items || [];
      for (const item of items) {
        const itemName = item.item_name || 'Unknown Item';
        await BluetoothEscposPrinter.printText(`${itemName.substring(0, 20)}\r\n`, {});
        await BluetoothEscposPrinter.printText(`  ${item.quantity} x ${item.unit_price} = ${(item.quantity * item.unit_price).toFixed(2)}\r\n`, {});
      }
      
      await BluetoothEscposPrinter.printText("--------------------------------\r\n", {});
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.RIGHT);
      
      const sub = Number(selectedQuote.subtotal || 0);
      const discount = Number(selectedQuote.discount_amount || 0);
      const total = Number(selectedQuote.total_amount || 0);
      
      if (discount > 0) {
        await BluetoothEscposPrinter.printText(`Subtotal: ${sub.toFixed(2)}\r\n`, {});
        await BluetoothEscposPrinter.printText(`Discount: -${discount.toFixed(2)}\r\n`, {});
      }
      await BluetoothEscposPrinter.printText(`TOTAL: ${total.toFixed(2)}\r\n`, { widthtimes: 1, heigthtimes: 1 });
      
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printText("\r\nValid for 7 days.\r\nThank You!\r\n\r\n\r\n", {});
      
    } catch (error) {
      console.error("Printing failed:", error);
      Alert.alert("Print Error", error.message || "Could not print the Quote.");
    }
  };

  const renderQuoteItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleViewQuote(item.id)}>
      <View style={styles.cardHeader}>
        <View style={styles.info}>
          <Text style={styles.quoteNumber} numberOfLines={1}>{item.quote_id || `QUOTE-${item.id}`}</Text>
          <Text style={styles.customerName} numberOfLines={1}>{item.customer_name || 'Walk-in'}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>VALID</Text>
        </View>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="calendar" size={16} color="#64748b" />
          <Text style={styles.detailText}>
            {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Total:</Text>
          <Text style={styles.amountValue}>₹{parseFloat(item.total_amount || 0).toFixed(2)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quotations</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={24} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Quotations..."
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
          <Text style={styles.loadingText}>Loading quotations...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredQuotes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderQuoteItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="text-box-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>No quotations found</Text>
              <Text style={styles.emptySubText}>Tap the + button to generate a new quote.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('CreateQuotation')}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Quote Details Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quotation Preview</Text>
              
              <TouchableOpacity style={styles.printBtn} onPress={handlePrintQuote}>
                <MaterialCommunityIcons name="printer" size={20} color="#fff" />
                <Text style={styles.printBtnText}>Print</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeBtn} onPress={() => { setIsModalVisible(false); setSelectedQuote(null); }}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>

            {detailsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
              </View>
            ) : selectedQuote ? (
              <ScrollView style={styles.modalBody}>
                <View style={styles.invoicePaper}>
                  <View style={styles.paperHeader}>
                    <Text style={styles.businessName}>STAYBILL PRO</Text>
                    <Text style={styles.invoiceTitle}>QUOTATION</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Quote No:</Text>
                    <Text style={styles.infoValue}>{selectedQuote.quote_id}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Date:</Text>
                    <Text style={styles.infoValue}>{new Date(selectedQuote.created_at).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Customer:</Text>
                    <Text style={styles.infoValue}>{selectedQuote.customer_name || 'Walk-in'}</Text>
                  </View>

                  <View style={styles.itemsTable}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableCol, { flex: 2 }]}>Item</Text>
                      <Text style={[styles.tableCol, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                      <Text style={[styles.tableCol, { flex: 1, textAlign: 'right' }]}>Total</Text>
                    </View>
                    {(selectedQuote.items || []).map((item, index) => (
                      <View key={index} style={styles.tableRow}>
                        <Text style={[styles.tableCol, { flex: 2 }]} numberOfLines={2}>{item.item_name}</Text>
                        <Text style={[styles.tableCol, { flex: 1, textAlign: 'center' }]}>{item.quantity}</Text>
                        <Text style={[styles.tableCol, { flex: 1, textAlign: 'right' }]}>₹{(item.quantity * item.unit_price).toFixed(2)}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.totalsSection}>
                    <View style={[styles.totalRow, styles.grandTotalRow]}>
                      <Text style={styles.totalLabel}>TOTAL</Text>
                      <Text style={styles.totalValue}>₹{Number(selectedQuote.total_amount || 0).toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.loadingContainer}>
                <Text style={styles.emptyText}>Quote details unavailable.</Text>
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', margin: 16, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', height: 54 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, height: '100%', fontSize: 16, color: '#0f172a' },
  listContainer: { padding: 16, paddingTop: 0, paddingBottom: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 16 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#334155', marginTop: 16 },
  emptySubText: { fontSize: 14, color: '#64748b', marginTop: 8, textAlign: 'center' },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  info: { flex: 1 },
  quoteNumber: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  customerName: { fontSize: 14, color: '#475569', fontWeight: '500' },
  badge: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#166534' },
  details: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: 13, color: '#64748b', marginLeft: 6, fontWeight: '500' },
  amountContainer: { flexDirection: 'row', alignItems: 'baseline' },
  amountLabel: { fontSize: 12, color: '#64748b', marginRight: 4 },
  amountValue: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)' },
  modalContainer: { flex: 1, backgroundColor: '#f1f5f9', marginTop: 40, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  closeBtnText: { color: '#475569', fontWeight: '600' },
  printBtn: { flexDirection: 'row', backgroundColor: '#8b5cf6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center', marginHorizontal: 8 },
  printBtnText: { color: '#fff', fontWeight: '600', marginLeft: 6 },
  modalBody: { padding: 16 },
  invoicePaper: { backgroundColor: '#ffffff', padding: 24, borderRadius: 8, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, marginBottom: 40 },
  paperHeader: { alignItems: 'center', marginBottom: 24, borderBottomWidth: 2, borderBottomColor: '#e2e8f0', paddingBottom: 16 },
  businessName: { fontSize: 24, fontWeight: '900', color: '#0f172a', letterSpacing: 1 },
  invoiceTitle: { fontSize: 14, color: '#64748b', marginTop: 4, letterSpacing: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontSize: 14, color: '#64748b' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  itemsTable: { marginTop: 24, marginBottom: 24 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingBottom: 8, marginBottom: 8 },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableCol: { fontSize: 13, color: '#334155' },
  totalsSection: { borderTopWidth: 2, borderTopColor: '#e2e8f0', paddingTop: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  grandTotalRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  totalLabel: { fontSize: 14, color: '#475569', fontWeight: '600' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#0f172a' }
});
