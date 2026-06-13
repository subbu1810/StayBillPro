import { BLEPrinter } from 'react-native-thermal-receipt-printer';

export const BluetoothManager = {
  isBluetoothEnabled: async () => true,
  enableBluetooth: async () => { 
    await BLEPrinter.init(); 
    return true; 
  },
  scanDevices: async () => {
    try {
      await BLEPrinter.init();
      const devices = await BLEPrinter.getDeviceList();
      const mapped = devices.map(d => ({ 
        name: d.device_name || 'Unknown', 
        address: d.inner_mac_address 
      }));
      return JSON.stringify({ paired: mapped, found: [] });
    } catch (e) {
      return JSON.stringify({ paired: [], found: [] });
    }
  },
  connect: async (address) => {
    return BLEPrinter.connectPrinter(address);
  }
};

export const BluetoothEscposPrinter = {
  ALIGN: { LEFT: 0, CENTER: 1, RIGHT: 2 },
  _alignTag: "",
  printerInit: async () => { 
    BluetoothEscposPrinter._alignTag = ""; 
    // Initialize printer (ESC @) and set default line spacing (ESC 2)
    await BLEPrinter.printText('\x1B\x40\x1B\x32');
  },
  printerLeftSpace: async () => {},
  printerAlign: async (align) => {
    if (align === 0) BluetoothEscposPrinter._alignTag = "<L>";
    if (align === 1) BluetoothEscposPrinter._alignTag = "<C>";
    if (align === 2) BluetoothEscposPrinter._alignTag = "<R>";
  },
  setBlob: async () => {},
  printText: async (text, options) => {
    let formattedText = text.replace(/\r\n/g, '\n');
    
    // Bypassing EPToolkit tags which trigger buggy line spacing in the native module.
    // We convert everything to raw ESC/POS commands to bypass EPToolkit's \n parser.
    
    // Default: Align Left (ESC a 0), Normal Font (ESC ! 0)
    let prefix = '\x1B\x61\x00\x1B\x21\x00';
    
    if (BluetoothEscposPrinter._alignTag === "<C>") {
      prefix = '\x1B\x61\x01'; // Align Center
    } else if (BluetoothEscposPrinter._alignTag === "<R>") {
      prefix = '\x1B\x61\x02'; // Align Right
    }
    
    if (options) {
      if (options.widthtimes >= 2 || options.heigthtimes >= 2) {
        // Double width & height: ESC ! 48 (0x30)
        prefix += '\x1B\x21\x30';
      } else if (options.fonttype === 1 || options.bold) {
        // Bold: ESC E 1 (0x1B 0x45 0x01)
        prefix += '\x1B\x45\x01';
      }
    }
    
    // Replace \n with Print and Feed 1 Line (ESC d 1), then reset formatting
    // This completely bypasses EPToolkit's buggy \n parser which injects massive line gaps!
    let reset = '\x1B\x61\x00\x1B\x21\x00\x1B\x45\x00';
    let safeText = formattedText.replace(/\n/g, `\x1B\x64\x01${reset}`);
    
    await BLEPrinter.printText(prefix + safeText);
    
    // Add a small delay to prevent BLE buffer overflow and out-of-order printing
    await new Promise(resolve => setTimeout(resolve, 150));
  }
};
