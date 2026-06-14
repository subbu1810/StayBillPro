import { Platform } from 'react-native';

// Fallback wrapper for react-native-bluetooth-escpos-printer
let BluetoothManager = null;
let BluetoothEscposPrinter = null;
let BluetoothTscPrinter = null;

try {
  const escpos = require('react-native-bluetooth-escpos-printer');
  BluetoothManager = escpos.BluetoothManager;
  BluetoothEscposPrinter = escpos.BluetoothEscposPrinter;
  BluetoothTscPrinter = escpos.BluetoothTscPrinter;
} catch (error) {
  console.warn("Native bluetooth printer module not found, using fallbacks.");
}

export { BluetoothManager, BluetoothEscposPrinter, BluetoothTscPrinter };
