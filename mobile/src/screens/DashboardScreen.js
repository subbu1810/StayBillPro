import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform, Alert, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { API_ENDPOINTS } from '../api/apiConfig';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const [profileVisible, setProfileVisible] = useState(false);
  const [adminName, setAdminName] = useState('Admin');
  const [sales, setSales] = useState(0);
  const [orders, setOrders] = useState(0);
  const [dateFilter, setDateFilter] = useState('Today');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const fetchDashboardData = useCallback(async (filter = dateFilter) => {
    try {
      const name = await AsyncStorage.getItem('admin_name');
      if (name) setAdminName(name);

      const token = await AsyncStorage.getItem('token');
      const today = new Date();
      let fromDate = new Date();
      let toDate = new Date();

      if (filter === 'Yesterday') {
        fromDate.setDate(today.getDate() - 1);
        toDate.setDate(today.getDate() - 1);
      } else if (filter === 'Last 7 Days') {
        fromDate.setDate(today.getDate() - 7);
      } else if (filter === 'This Month') {
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
      } // Today is default

      const formatDate = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      
      const response = await axios.get(`${API_ENDPOINTS.REPORTS.SALES}?startDate=${formatDate(fromDate)}&endDate=${formatDate(toDate)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.summary) {
        setSales(Number(response.data.summary.grossSales || 0));
        setOrders(Number(response.data.summary.totalInvoices || 0));
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData(dateFilter);
    }, [fetchDashboardData, dateFilter])
  );

  const applyFilter = (filterName) => {
    setDateFilter(filterName);
    setIsFilterModalVisible(false);
    fetchDashboardData(filterName);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.replace('Login');
  };

  const confirmLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive", 
          onPress: () => {
            setProfileVisible(false);
            handleLogout();
          } 
        }
      ]
    );
  };

  // Mock Data for Charts (Replace with API data later)
  const lineChartData = {
    labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43, 50],
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // Green
        strokeWidth: 3
      }
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: '#1e293b',
    backgroundGradientTo: '#1e293b',
    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
    strokeWidth: 2, 
    barPercentage: 0.5,
    useShadowColorFromDataset: false, 
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#059669'
    },
    propsForBackgroundLines: {
      strokeDasharray: '', // solid background lines
      stroke: 'rgba(255,255,255,0.05)',
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header Section (Wallet Style) */}
      <View style={styles.headerSection}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.greeting}>Hi, {adminName} 👋</Text>
              <Text style={styles.dateText}>{new Date().toDateString()}</Text>
            </View>
            <TouchableOpacity onPress={() => setProfileVisible(true)} style={styles.avatarButton}>
              <MaterialCommunityIcons name="account-circle" size={40} color="#f8fafc" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.balanceLabel}>Total Sales</Text>
            <TouchableOpacity style={styles.filterBtn} onPress={() => setIsFilterModalVisible(true)}>
              <MaterialCommunityIcons name="calendar-range" size={16} color="#cbd5e1" />
              <Text style={styles.filterBtnText}>{dateFilter}</Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color="#cbd5e1" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.balanceContainer}>
            <View style={styles.balanceRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Text style={styles.balanceAmount}>{sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.ordersPill}>
              <MaterialCommunityIcons name="receipt" size={14} color="#10b981" />
              <Text style={styles.ordersText}>{orders} Orders {dateFilter === 'Today' ? 'Today' : ''}</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Main Content Area (Bottom Sheet Style) */}
      <View style={styles.bottomSheet}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Quick Actions Horizontal */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalActions}>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Scanner')}>
              <View style={[styles.actionIconBox, { backgroundColor: '#e0e7ff' }]}>
                <MaterialCommunityIcons name="line-scan" size={24} color="#4f46e5" />
              </View>
              <Text style={styles.actionText}>Scan Bill</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('CreatePO')}>
              <View style={[styles.actionIconBox, { backgroundColor: '#dcfce7' }]}>
                <MaterialCommunityIcons name="file-document-plus" size={24} color="#16a34a" />
              </View>
              <Text style={styles.actionText}>New PO</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('CreateGRN')}>
              <View style={[styles.actionIconBox, { backgroundColor: '#fce7f3' }]}>
                <MaterialCommunityIcons name="package-down" size={24} color="#db2777" />
              </View>
              <Text style={styles.actionText}>New GRN</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Suppliers')}>
              <View style={[styles.actionIconBox, { backgroundColor: '#fef3c7' }]}>
                <MaterialCommunityIcons name="truck-delivery" size={24} color="#d97706" />
              </View>
              <Text style={styles.actionText}>Vendors</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Revenue Chart */}
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Weekly Revenue</Text>
            <MaterialCommunityIcons name="dots-horizontal" size={24} color="#94a3b8" />
          </View>
          
          <View style={styles.chartWrapper}>
            <LineChart
              data={lineChartData}
              width={width - 48} 
              height={200}
              yAxisLabel="₹"
              chartConfig={chartConfig}
              bezier
              style={styles.chartStyle}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLines={false}
            />
          </View>

          {/* Mini Stats Grid */}
          <View style={styles.miniStatsGrid}>
            <View style={styles.miniStatCard}>
              <MaterialCommunityIcons name="trending-up" size={24} color="#10b981" />
              <Text style={styles.miniStatValue}>+12.5%</Text>
              <Text style={styles.miniStatLabel}>vs last week</Text>
            </View>
            <View style={styles.miniStatCard}>
              <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#f59e0b" />
              <Text style={styles.miniStatValue}>4</Text>
              <Text style={styles.miniStatLabel}>Low Stock Items</Text>
            </View>
          </View>

        </ScrollView>
      </View>

      {/* Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={profileVisible}
        onRequestClose={() => setProfileVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setProfileVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>My Profile</Text>
              <TouchableOpacity onPress={() => setProfileVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileInfo}>
              <MaterialCommunityIcons name="account-circle" size={80} color="#cbd5e1" />
              <Text style={styles.profileName}>{adminName}</Text>
              <Text style={styles.profileEmail}>admin@staybillpro.com</Text>
            </View>

            <TouchableOpacity style={styles.profileOption} onPress={() => { setProfileVisible(false); navigation.navigate('BusinessProfile'); }}>
              <MaterialCommunityIcons name="domain" size={24} color="#64748b" />
              <Text style={styles.profileOptionText}>Business Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.profileOption} onPress={() => { setProfileVisible(false); navigation.navigate('ChangePassword'); }}>
              <MaterialCommunityIcons name="shield-lock-outline" size={24} color="#64748b" />
              <Text style={styles.profileOptionText}>Change Password</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.profileOption} onPress={() => { setProfileVisible(false); navigation.navigate('PrinterSettings'); }}>
              <MaterialCommunityIcons name="printer-pos" size={24} color="#64748b" />
              <Text style={styles.profileOptionText}>Printer & Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButtonModal} onPress={confirmLogout} activeOpacity={0.8}>
              <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Filter Modal */}
      <Modal visible={isFilterModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setIsFilterModalVisible(false)}>
          <View style={styles.filterModalContent}>
            <Text style={styles.filterModalTitle}>Select Date Range</Text>
            {['Today', 'Yesterday', 'Last 7 Days', 'This Month'].map(f => (
              <TouchableOpacity key={f} style={styles.filterOption} onPress={() => applyFilter(f)}>
                <Text style={[styles.filterOptionText, dateFilter === f && { color: '#38bdf8', fontWeight: 'bold' }]}>{f}</Text>
                {dateFilter === f && <MaterialCommunityIcons name="check" size={20} color="#38bdf8" />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Deep Slate Dark Background
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
    paddingBottom: 40,
    backgroundColor: '#0f172a',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
  },
  dateText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  avatarButton: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 2,
  },
  balanceContainer: {
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#94a3b8',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currencySymbol: {
    color: '#38bdf8', // Light Blue
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
    marginRight: 4,
  },
  balanceAmount: {
    color: '#f8fafc',
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterBtnText: {
    color: '#cbd5e1',
    fontSize: 12,
    marginHorizontal: 6,
  },
  ordersPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)', // Light Green Tint
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 16,
  },
  ordersText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  horizontalActions: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  actionCard: {
    alignItems: 'center',
    marginRight: 24,
  },
  actionIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartWrapper: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    paddingVertical: 20,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  chartStyle: {
    borderRadius: 16,
  },
  miniStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  miniStatCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginHorizontal: 4,
  },
  miniStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 12,
    marginBottom: 4,
  },
  miniStatLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 12,
  },
  profileEmail: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterModalContent: {
    backgroundColor: '#ffffff',
    marginHorizontal: 40,
    borderRadius: 16,
    padding: 20,
    alignSelf: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  filterModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterOptionText: {
    fontSize: 15,
    color: '#475569',
  },
  profileOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginLeft: 16,
  },
  logoutButtonModal: {
    flexDirection: 'row',
    marginTop: 32,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  }
});
