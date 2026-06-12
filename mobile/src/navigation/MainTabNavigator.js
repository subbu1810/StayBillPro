import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Import Screens
import DashboardScreen from '../screens/DashboardScreen';
import POSScreen from '../screens/POSScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ReportsScreen from '../screens/ReportsScreen';
import MenuScreen from '../screens/MenuScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'DashboardTab') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'POSTab') {
            iconName = 'cash-register';
          } else if (route.name === 'InventoryTab') {
            iconName = focused ? 'package-variant-closed' : 'package-variant';
          } else if (route.name === 'ReportsTab') {
            iconName = focused ? 'file-document' : 'file-document-outline';
          } else if (route.name === 'MenuTab') {
            iconName = focused ? 'dots-grid' : 'menu';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        }
      })}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={DashboardScreen} 
        options={{ title: 'Home' }} 
      />
      <Tab.Screen 
        name="POSTab" 
        component={POSScreen} 
        options={{ title: 'Billing' }} 
      />
      <Tab.Screen 
        name="InventoryTab" 
        component={InventoryScreen} 
        options={{ title: 'Inventory' }} 
      />
      <Tab.Screen 
        name="ReportsTab" 
        component={ReportsScreen} 
        options={{ title: 'Invoices' }} 
      />
      <Tab.Screen 
        name="MenuTab" 
        component={MenuScreen} 
        options={{ title: 'More' }} 
      />
    </Tab.Navigator>
  );
}
