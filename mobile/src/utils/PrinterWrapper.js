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
  },
  printerLeftSpace: async () => {},
  printerAlign: async (align) => {
    if (align === 0) BluetoothEscposPrinter._alignTag = "<L>";
    if (align === 1) BluetoothEscposPrinter._alignTag = "<C>";
    if (align === 2) BluetoothEscposPrinter._alignTag = "<R>";
  },
  setBlob: async () => {},
  printText: async (text, options) => {
    let formattedText = text;
    
    // Clean up carriage returns to prevent double spacing
    formattedText = formattedText.replace(/\r\n/g, '\n');
    
    // Apply EPToolkit tags based on options
    if (options) {
      if (options.widthtimes >= 2 || options.heigthtimes >= 2) {
        formattedText = `<D>${formattedText.replace(/\n/g, '')}</D>\n`;
      } else if (options.fonttype === 1 || options.bold) {
        formattedText = `<B>${formattedText.replace(/\n/g, '')}</B>\n`;
      }
    }
    
    // Apply alignment only for Center and Right (Left is default and <L> causes extra spacing)
    if (BluetoothEscposPrinter._alignTag === "<C>" && formattedText.trim().length > 0) {
      formattedText = `<C>${formattedText.replace(/\n/g, '')}</C>\n`;
    } else if (BluetoothEscposPrinter._alignTag === "<R>" && formattedText.trim().length > 0) {
      formattedText = `<R>${formattedText.replace(/\n/g, '')}</R>\n`;
    }
    
    await BLEPrinter.printText(formattedText);
    
    // Add a small delay to prevent BLE buffer overflow and out-of-order printing
    await new Promise(resolve => setTimeout(resolve, 150));
  }
};
