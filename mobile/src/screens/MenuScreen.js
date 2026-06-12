import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MenuScreen({ navigation }) {
  
  const menuItems = [
    {
      id: 1,
      title: 'AI Scanner',
      subtitle: 'Scan vendor bills with OCR',
      icon: 'line-scan',
      iconFamily: 'MaterialCommunityIcons',
      color: '#8b5cf6',
      onPress: () => navigation.navigate('Scanner')
    },
    {
      id: 2,
      title: 'Suppliers',
      subtitle: 'Manage your vendors',
      icon: 'truck-delivery',
      iconFamily: 'MaterialCommunityIcons',
      color: '#ef4444',
      onPress: () => navigation.navigate('Suppliers')
    },
    {
      id: 3,
      title: 'Purchase Orders',
      subtitle: 'Create and view POs',
      icon: 'file-document-outline',
      iconFamily: 'MaterialCommunityIcons',
      color: '#14b8a6',
      onPress: () => navigation.navigate('PurchaseOrders')
    },
    {
      id: 4,
      title: 'GRN Items',
      subtitle: 'Goods Receipt Notes',
      icon: 'package-down',
      iconFamily: 'MaterialCommunityIcons',
      iconFamily: 'MaterialCommunityIcons',
      color: '#ec4899',
      onPress: () => navigation.navigate('GRN')
    },
    {
      id: 5,
      title: 'Customers',
      subtitle: 'Manage client directory',
      icon: 'account-group',
      iconFamily: 'MaterialCommunityIcons',
      iconFamily: 'MaterialCommunityIcons',
      color: '#f59e0b',
      onPress: () => navigation.navigate('Customers')
    },
    {
      id: 6,
      title: 'Expenses',
      subtitle: 'Log petty cash & bills',
      icon: 'receipt-text-outline',
      iconFamily: 'MaterialCommunityIcons',
      color: '#ef4444',
      onPress: () => navigation.navigate('Expenses')
    },
    {
      id: 7,
      title: 'Quotations',
      subtitle: 'Generate and print quotes',
      icon: 'text-box-outline',
      iconFamily: 'MaterialCommunityIcons',
      color: '#8b5cf6',
      onPress: () => navigation.navigate('Quotations')
    }
  ];

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.replace('Login');
  };

  const renderIcon = (item) => {
    if (item.iconFamily === 'MaterialCommunityIcons') {
      return <MaterialCommunityIcons name={item.icon} size={28} color={item.color} />;
    } else if (item.iconFamily === 'FontAwesome5') {
      return <FontAwesome5 name={item.icon} size={24} color={item.color} />;
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More Menu</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Manage Operations</Text>
        
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.menuItem} 
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                {renderIcon(item)}
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
              <MaterialCommunityIcons name="logout" size={28} color="#ef4444" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: '#ef4444' }]}>Sign Out</Text>
              <Text style={styles.menuSubtitle}>Log out of your account</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>StayBillPro v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  }
});
