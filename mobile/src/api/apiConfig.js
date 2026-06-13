// Update this to your local machine IP address for testing on device
// E.g., 'http://192.168.1.100:5002/api'
const LOCAL_IP = 'http://10.173.45.111:5002/api';
const HOSTINGER_URL = 'https://staybillproapi.ssquareg.tech/api';

const IS_PRODUCTION = true; // set true when publishing to stores

export const API_BASE_URL = IS_PRODUCTION ? HOSTINGER_URL : LOCAL_IP;

export const API_ENDPOINTS = {
  PRODUCTS: {
    LIST: `${API_BASE_URL}/products`,
    CREATE: `${API_BASE_URL}/products`,
    UPDATE: (id) => `${API_BASE_URL}/products/${id}`,
  },
  SPARES: {
    LIST: `${API_BASE_URL}/spares`,
    CREATE: `${API_BASE_URL}/spares`,
    UPDATE: (id) => `${API_BASE_URL}/spares/${id}`,
  },
  CUSTOMERS: {
    LIST: `${API_BASE_URL}/customers`,
    CREATE: `${API_BASE_URL}/customers`,
  },
  BILLING: {
    CREATE: `${API_BASE_URL}/billing`,
    SEARCH: `${API_BASE_URL}/billing/search/advanced`,
    DETAILS: (id) => `${API_BASE_URL}/billing/details/${id}`
  },
  OCR: {
    SCAN: `${API_BASE_URL}/ocr/scan-bill`
  },
  CATEGORIES: {
    AUTO_CATEGORIZE: `${API_BASE_URL}/categories/auto-categorize`
  },
  SUPPLIERS: {
    LIST: `${API_BASE_URL}/suppliers`,
    CREATE: `${API_BASE_URL}/suppliers`,
    UPDATE: (id) => `${API_BASE_URL}/suppliers/${id}`
  },
  PURCHASE_ORDERS: {
    LIST: `${API_BASE_URL}/purchases/orders`,
    CREATE: `${API_BASE_URL}/purchases/orders`,
    DETAILS: (id) => `${API_BASE_URL}/purchases/orders/${id}`
  },
  GRN: {
    LIST: `${API_BASE_URL}/purchases/grn`,
    CREATE: `${API_BASE_URL}/purchases/grn`,
    PUSH_TO_STOCK: `${API_BASE_URL}/purchases/grn/push-to-stock`,
    DETAILS: (id) => `${API_BASE_URL}/purchases/grn/${id}`
  },
  REPORTS: {
    SALES: `${API_BASE_URL}/reports/sales`
  },
  EXPENSES: {
    LIST: `${API_BASE_URL}/expenses`,
    CREATE: `${API_BASE_URL}/expenses`,
    DELETE: (id) => `${API_BASE_URL}/expenses/${id}`
  },
  QUOTATIONS: {
    LIST: `${API_BASE_URL}/quotations`,
    CREATE: `${API_BASE_URL}/quotations`,
    DETAILS: (id) => `${API_BASE_URL}/quotations/${id}`
  },
  BRANCHES: {
    LIST: `${API_BASE_URL}/branches`
  },
  POS_SETTINGS: {
    GET: `${API_BASE_URL}/pos-settings`
  }
};

export default API_BASE_URL;
