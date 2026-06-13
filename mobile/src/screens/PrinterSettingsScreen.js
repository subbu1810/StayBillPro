import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, Platform, PermissionsAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BluetoothManager, BluetoothEscposPrinter } from '../utils/PrinterWrapper';

export default function PrinterSettingsScreen({ navigation }) {
  const [pairedDevices, setPairedDevices] = useState([]);
  const [foundDs, setFoundDs] = useState([]);
  const [bleOpend, setBleOpend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [boundAddress, setBoundAddress] = useState('');

  const requestBluetoothPermissions = async () => {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);
        return (
          result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true;
  };

  useEffect(() => {
    // Check saved printer
    const checkSavedPrinter = async () => {
      const savedMac = await AsyncStorage.getItem('printer_mac');
      if (savedMac) {
        setBoundAddress(savedMac);
      }
    };
    checkSavedPrinter();

    const initBT = async () => {
      const hasPermission = await requestBluetoothPermissions();

      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Bluetooth permissions are required to connect to the printer.');
        return;
      }

      if (BluetoothManager) {
        BluetoothManager.isBluetoothEnabled().then((enabled) => {
          setBleOpend(Boolean(enabled));
          if (enabled) {
            scanDevices();
          }
        }, (err) => {
          Alert.alert('Bluetooth Error', err);
        });
      } else {
        Alert.alert('Native Module Missing', 'Bluetooth features are not available in Expo Go. Please build a custom development client using EAS.');
      }
    };

    initBT();
  }, []);

  const scanDevices = async () => {
    const hasPermission = await requestBluetoothPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Bluetooth permissions are required to scan for printers.');
      return;
    }
    if (!BluetoothManager) return;
    setLoading(true);
    try {
      const s = await BluetoothManager.enableBluetooth();
      setBleOpend(true);
      const devices = await BluetoothManager.scanDevices();
      const parsed = JSON.parse(devices);
      setPairedDevices(parsed.paired || []);
      setFoundDs(parsed.found || []);
    } catch (err) {
      Alert.alert('Scan Failed', err.message || JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  const connectDevice = async (device) => {
    setLoading(true);
    try {
      await BluetoothManager.connect(device.address);
      setBoundAddress(device.address);
      await AsyncStorage.setItem('printer_mac', device.address);
      Alert.alert('Success', `Connected to ${device.name || device.address}`);
    } catch (e) {
      Alert.alert('Connection Failed', e.message || 'Could not connect to printer.');
    } finally {
      setLoading(false);
    }
  };

  const testPrint = async () => {
    if (!boundAddress) {
      Alert.alert('Error', 'No printer connected.');
      return;
    }
    try {
      await BluetoothEscposPrinter.printerInit();
      await BluetoothEscposPrinter.printerLeftSpace(0);
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.setBlob(0);
      await BluetoothEscposPrinter.printText("STAYBILL PRO\r\n", { encoding: 'GBK', codepage: 0, widthtimes: 2, heigthtimes: 2, fonttype: 1 });
      await BluetoothEscposPrinter.printText("TEST RECEIPT\r\n\r\n", {});
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      await BluetoothEscposPrinter.printText("Printer is successfully configured.\r\n", {});
      await BluetoothEscposPrinter.printText("\r\n\r\n\r\n", {});
    } catch (e) {
      Alert.alert('Print Error', e.message || 'Could not print.');
    }
  };

  const renderDevice = ({ item }) => (
    <TouchableOpacity 
      style={[styles.deviceCard, boundAddress === item.address && styles.deviceCardActive]}
      onPress={() => connectDevice(item)}
    >
      <View style={styles.deviceInfo}>
        <MaterialCommunityIcons 
          name={boundAddress === item.address ? "printer-check" : "printer-outline"} 
          size={28} 
          color={boundAddress === item.address ? "#10b981" : "#64748b"} 
        />
        <View style={styles.deviceText}>
          <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
          <Text style={styles.deviceMac}>{item.address}</Text>
        </View>
      </View>
      {boundAddress === item.address && (
        <Text style={styles.connectedText}>Connected</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Printer Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.statusCard}>
          <MaterialCommunityIcons name={bleOpend ? "bluetooth" : "bluetooth-off"} size={32} color={bleOpend ? "#3b82f6" : "#ef4444"} />
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>Bluetooth Status</Text>
            <Text style={styles.statusSubtitle}>{bleOpend ? 'Enabled' : 'Disabled / Not Permitted'}</Text>
          </View>
          <TouchableOpacity style={styles.scanBtn} onPress={scanDevices} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.scanBtnText}>Scan</Text>}
          </TouchableOpacity>
        </View>

        {boundAddress ? (
          <TouchableOpacity style={styles.testBtn} onPress={testPrint}>
            <MaterialCommunityIcons name="printer-pos" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.testBtnText}>Print Test Receipt</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.sectionTitle}>Paired Devices</Text>
        <FlatList
          data={pairedDevices}
          keyExtractor={(item) => item.address}
          renderItem={renderDevice}
          ListEmptyComponent={<Text style={styles.emptyText}>No paired devices found.</Text>}
          style={{ flexGrow: 0 }}
        />

        <Text style={styles.sectionTitle}>Discovered Devices</Text>
        <FlatList
          data={foundDs}
          keyExtractor={(item) => item.address}
          renderItem={renderDevice}
          ListEmptyComponent={<Text style={styles.emptyText}>No new devices discovered.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  content: {
    padding: 16,
    flex: 1,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  statusTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  scanBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  scanBtnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  testBtn: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  testBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 12,
    marginTop: 8,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  deviceCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceText: {
    marginLeft: 12,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  deviceMac: {
    fontSize: 12,
    color: '#64748b',
  },
  connectedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10b981',
  },
  emptyText: {
    color: '#94a3b8',
    fontStyle: 'italic',
    marginBottom: 16,
  }
});
