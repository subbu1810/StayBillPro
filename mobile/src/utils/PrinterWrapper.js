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
    
    // Convert all \r\n to \n to standardise
    formattedText = formattedText.replace(/\r\n/g, '\n');
    
    // Extract trailing newlines so we can put them OUTSIDE the tags
    const trailingNewlinesMatch = formattedText.match(/\n+$/);
    const trailingNewlines = trailingNewlinesMatch ? trailingNewlinesMatch[0] : '';
    
    // Remove trailing newlines from the text to be wrapped
    let cleanText = formattedText.replace(/\n+$/, '');
    
    // Apply EPToolkit tags based on options (on cleanText)
    if (options) {
      if (options.widthtimes >= 2 || options.heigthtimes >= 2) {
        cleanText = `<D>${cleanText.replace(/\n/g, '')}</D>`;
      } else if (options.fonttype === 1 || options.bold) {
        cleanText = `<B>${cleanText.replace(/\n/g, '')}</B>`;
      }
    }
    
    // Apply alignment only for Center and Right
    if (BluetoothEscposPrinter._alignTag === "<C>" && cleanText.trim().length > 0) {
      cleanText = `<C>${cleanText}</C>`;
    } else if (BluetoothEscposPrinter._alignTag === "<R>" && cleanText.trim().length > 0) {
      cleanText = `<R>${cleanText}</R>`;
    }
    
    // Re-attach trailing newlines, but REMOVE EXACTLY ONE because the native printer module implicitly adds one!
    let finalNewlines = trailingNewlines.length > 0 ? trailingNewlines.substring(1) : '';
    
    await BLEPrinter.printText(cleanText + finalNewlines);
    
    // Add a small delay to prevent BLE buffer overflow and out-of-order printing
    await new Promise(resolve => setTimeout(resolve, 150));
  }
};
