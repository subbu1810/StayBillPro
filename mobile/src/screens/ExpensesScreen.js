import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { expensesAPI } from '../api/api';

const CATEGORIES = [
  { id: 'supplies', label: 'Supplies', icon: 'cart-outline', color: '#3b82f6' },
  { id: 'maintenance', label: 'Maintenance', icon: 'wrench-outline', color: '#f59e0b' },
  { id: 'utilities', label: 'Utilities', icon: 'lightning-bolt-outline', color: '#10b981' },
  { id: 'travel', label: 'Travel', icon: 'car-outline', color: '#8b5cf6' },
  { id: 'tea_snacks', label: 'Tea/Snacks', icon: 'coffee-outline', color: '#ec4899' },
  { id: 'other', label: 'Other', icon: 'dots-horizontal', color: '#64748b' }
];

export default function ExpensesScreen({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalExpenses, setTotalExpenses] = useState(0);
  
  // Modal State
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: 'other',
    notes: ''
  });

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await expensesAPI.getAll();
      setExpenses(data.expenses || data || []);
      
      // Calculate total
      const total = (data.expenses || data || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
      setTotalExpenses(total);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleSaveExpense = async () => {
    if (!newExpense.amount || isNaN(newExpense.amount)) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        description: newExpense.notes,
        date: new Date().toISOString().split('T')[0], // Today's date YYYY-MM-DD
        payment_method: 'Cash' // Default for petty cash
      };
      
      await expensesAPI.create(payload);
      Alert.alert('Success', 'Expense logged successfully');
      
      setIsAddModalVisible(false);
      setNewExpense({ amount: '', category: 'other', notes: '' });
      fetchExpenses();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to add expense');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert("Delete Expense", "Are you sure you want to delete this expense?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          try {
            await expensesAPI.delete(id);
            fetchExpenses();
          } catch (error) {
            Alert.alert("Error", "Could not delete expense");
          }
        } 
      }
    ]);
  };

  const getCategoryDetails = (catId) => {
    return CATEGORIES.find(c => c.id === catId || c.label.toLowerCase() === catId?.toLowerCase()) || CATEGORIES[5];
  };

  const renderExpense = ({ item }) => {
    const cat = getCategoryDetails(item.category);
    
    return (
      <View style={styles.expenseCard}>
        <View style={[styles.iconContainer, { backgroundColor: cat.color + '1A' }]}>
          <MaterialCommunityIcons name={cat.icon} size={24} color={cat.color} />
        </View>
        
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseCategory}>{item.category}</Text>
          <Text style={styles.expenseNotes} numberOfLines={1}>
            {item.description || item.notes || 'No description'}
          </Text>
          <Text style={styles.expenseDate}>{new Date(item.date || item.created_at).toLocaleDateString()}</Text>
        </View>

        <View style={styles.expenseAmountContainer}>
          <Text style={styles.expenseAmount}>₹{Number(item.amount).toFixed(2)}</Text>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expense Tracking</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Expenses</Text>
        <Text style={styles.summaryAmount}>₹{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderExpense}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="receipt-text-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>No expenses recorded yet.</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setIsAddModalVisible(true)}>
        <MaterialCommunityIcons name="plus" size={30} color="#ffffff" />
      </TouchableOpacity>

      {/* Add Expense Modal */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Expense</Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount (₹) *</Text>
              <TextInput 
                style={[styles.input, { fontSize: 24, fontWeight: 'bold' }]} 
                value={newExpense.amount} 
                onChangeText={(t) => setNewExpense({...newExpense, amount: t})} 
                placeholder="0.00" 
                keyboardType="numeric" 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity 
                    key={cat.id} 
                    style={[styles.categoryChip, newExpense.category === cat.label && styles.categoryChipActive, { borderColor: newExpense.category === cat.label ? cat.color : '#e2e8f0' }]}
                    onPress={() => setNewExpense({...newExpense, category: cat.label})}
                  >
                    <MaterialCommunityIcons name={cat.icon} size={16} color={newExpense.category === cat.label ? cat.color : '#64748b'} />
                    <Text style={[styles.categoryChipText, { color: newExpense.category === cat.label ? cat.color : '#64748b' }]}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput 
                style={styles.input} 
                value={newExpense.notes} 
                onChangeText={(t) => setNewExpense({...newExpense, notes: t})} 
                placeholder="What was this for?" 
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveExpense} disabled={isSaving}>
              {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Expense</Text>}
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
  
  summaryCard: { margin: 16, padding: 24, backgroundColor: '#1e293b', borderRadius: 16, alignItems: 'center', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  summaryLabel: { color: '#94a3b8', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  summaryAmount: { color: '#f8fafc', fontSize: 36, fontWeight: '800' },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 80 },
  
  expenseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  iconContainer: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  expenseInfo: { flex: 1 },
  expenseCategory: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  expenseNotes: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  expenseDate: { fontSize: 12, color: '#94a3b8' },
  
  expenseAmountContainer: { alignItems: 'flex-end' },
  expenseAmount: { fontSize: 18, fontWeight: '800', color: '#ef4444', marginBottom: 8 },
  deleteBtn: { padding: 4 },
  
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94a3b8', fontSize: 16, marginTop: 12 },
  
  fab: { position: 'absolute', bottom: 24, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 10, fontSize: 16, color: '#0f172a' },
  
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, backgroundColor: '#f8fafc' },
  categoryChipActive: { backgroundColor: '#ffffff', borderWidth: 2 },
  categoryChipText: { fontSize: 13, fontWeight: '600', marginLeft: 6 },
  
  saveBtn: { backgroundColor: '#ef4444', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
