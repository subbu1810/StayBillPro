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
    
    // Apply EPToolkit tags based on options
    if (options) {
      if (options.widthtimes >= 2 || options.heigthtimes >= 2) {
        formattedText = `<D>${formattedText.replace(/\r\n/g, '')}</D>\r\n`;
      } else if (options.fonttype === 1 || options.bold) {
        formattedText = `<B>${formattedText.replace(/\r\n/g, '')}</B>\r\n`;
      }
    }
    
    // Apply alignment
    if (BluetoothEscposPrinter._alignTag && formattedText.trim().length > 0) {
      const endTag = BluetoothEscposPrinter._alignTag.replace('<', '</');
      // Wrap content with alignment tags
      formattedText = `${BluetoothEscposPrinter._alignTag}${formattedText.replace(/\r\n/g, '')}${endTag}\r\n`;
    }
    
    await BLEPrinter.printText(formattedText);
  }
};
