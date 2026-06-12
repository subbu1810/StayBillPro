import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import POSScreen from './src/screens/POSScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import SuppliersScreen from './src/screens/SuppliersScreen';
import PurchaseOrdersScreen from './src/screens/PurchaseOrdersScreen';
import GRNScreen from './src/screens/GRNScreen';
import CreatePOScreen from './src/screens/CreatePOScreen';
import CreateGRNScreen from './src/screens/CreateGRNScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import PrinterSettingsScreen from './src/screens/PrinterSettingsScreen';
import BusinessProfileScreen from './src/screens/BusinessProfileScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import CustomersScreen from './src/screens/CustomersScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';
import QuotationsScreen from './src/screens/QuotationsScreen';
import CreateQuotationScreen from './src/screens/CreateQuotationScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        setInitialRoute('Dashboard');
      } else {
        setInitialRoute('Login');
      }
    };
    checkToken();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={MainTabNavigator} />
        <Stack.Screen 
          name="Inventory" 
          component={InventoryScreen} 
          options={{ title: 'Inventory Management' }} 
        />
        <Stack.Screen 
          name="POS" 
          component={POSScreen} 
          options={{ title: 'Point of Sale' }} 
        />
        <Stack.Screen 
          name="Reports" 
          component={ReportsScreen} 
          options={{ title: 'Billing Reports' }} 
        />
        <Stack.Screen 
          name="Scanner" 
          component={ScannerScreen} 
          options={{ title: 'AI Scanner' }} 
        />
        <Stack.Screen 
          name="Suppliers" 
          component={SuppliersScreen} 
          options={{ title: 'Suppliers' }} 
        />
        <Stack.Screen 
          name="PurchaseOrders" 
          component={PurchaseOrdersScreen} 
          options={{ title: 'Purchase Orders' }} 
        />
        <Stack.Screen 
          name="CreatePO" 
          component={CreatePOScreen} 
          options={{ title: 'Create Purchase Order' }} 
        />
        <Stack.Screen 
          name="PrinterSettings" 
          component={PrinterSettingsScreen} 
          options={{ title: 'Printer Settings' }} 
        />
        <Stack.Screen 
          name="BusinessProfile" 
          component={BusinessProfileScreen} 
          options={{ title: 'Business Profile' }} 
        />
        <Stack.Screen 
          name="ChangePassword" 
          component={ChangePasswordScreen} 
          options={{ title: 'Change Password' }} 
        />
        <Stack.Screen 
          name="Customers" 
          component={CustomersScreen} 
          options={{ title: 'Customers Directory' }} 
        />
        <Stack.Screen 
          name="Expenses" 
          component={ExpensesScreen} 
          options={{ title: 'Expense Tracking' }} 
        />
        <Stack.Screen 
          name="GRN" 
          component={GRNScreen} 
          options={{ title: 'Goods Receipt Note' }} 
        />
        <Stack.Screen 
          name="CreateGRN" 
          component={CreateGRNScreen} 
          options={{ title: 'Create Goods Receipt Note' }} 
        />
        <Stack.Screen 
          name="Quotations" 
          component={QuotationsScreen} 
          options={{ title: 'Quotations' }} 
        />
        <Stack.Screen 
          name="CreateQuotation" 
          component={CreateQuotationScreen} 
          options={{ title: 'Create Quotation' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
