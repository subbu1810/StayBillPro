import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from './apiConfig';

const apiRequest = async (url, method = 'GET', data = null, params = null) => {
  let finalUrl = url;
  
  // Basic query string builder
  if (params && Object.keys(params).length > 0) {
    const validParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      
    if (validParams.length > 0) {
      finalUrl += (finalUrl.includes('?') ? '&' : '?') + validParams.join('&');
    }
  }

  const token = await AsyncStorage.getItem('token');
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(finalUrl, options);
    
    if (!response.ok) {
      if (response.status === 401) {
        await AsyncStorage.removeItem('token');
        throw new Error('Session expired. Please log in again.');
      }
      let errorMessage = `API Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {}
      throw new Error(errorMessage);
    }

    return response.status === 204 ? null : response.json();
  } catch (error) {
    console.error(`API Fetch Error [${method} ${finalUrl}]:`, error);
    throw error;
  }
};

export const productsAPI = {
  getAll: (params) => apiRequest(API_ENDPOINTS.PRODUCTS.LIST, 'GET', null, params),
  create: (data) => apiRequest(API_ENDPOINTS.PRODUCTS.CREATE, 'POST', data),
  update: (id, data) => apiRequest(API_ENDPOINTS.PRODUCTS.UPDATE(id), 'PUT', data),
};

export const sparesAPI = {
  getAll: (params) => apiRequest(API_ENDPOINTS.SPARES.LIST, 'GET', null, params),
  create: (data) => apiRequest(API_ENDPOINTS.SPARES.CREATE, 'POST', data),
  update: (id, data) => apiRequest(API_ENDPOINTS.SPARES.UPDATE(id), 'PUT', data),
};

export const customersAPI = {
  getAll: (params) => apiRequest(API_ENDPOINTS.CUSTOMERS.LIST, 'GET', null, params),
  create: (data) => apiRequest(API_ENDPOINTS.CUSTOMERS.CREATE, 'POST', data),
};

export const billingAPI = {
  create: (data) => apiRequest(API_ENDPOINTS.BILLING.CREATE, 'POST', data),
  getAll: (params) => apiRequest(API_ENDPOINTS.BILLING.SEARCH, 'GET', null, params),
  getDetails: (id) => apiRequest(API_ENDPOINTS.BILLING.DETAILS(id), 'GET')
};
export const ocrAPI = {
  scanBill: async (formData) => {
    // Note: We use custom fetch here because apiRequest sets Content-Type to application/json by default
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(API_ENDPOINTS.OCR.SCAN, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Do NOT set Content-Type manually for FormData in React Native
      },
      body: formData
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'OCR Scan failed');
    }
    return data;
  }
};

export const categoriesAPI = {
  autoCategorize: (data) => apiRequest(API_ENDPOINTS.CATEGORIES.AUTO_CATEGORIZE, 'POST', data)
};

export const expensesAPI = {
  getAll: (params) => apiRequest(API_ENDPOINTS.EXPENSES.LIST, 'GET', null, params),
  create: (data) => apiRequest(API_ENDPOINTS.EXPENSES.CREATE, 'POST', data),
  delete: (id) => apiRequest(API_ENDPOINTS.EXPENSES.DELETE(id), 'DELETE')
};

export const quotationsAPI = {
  getAll: (params) => apiRequest(API_ENDPOINTS.QUOTATIONS.LIST, 'GET', null, params),
  create: (data) => apiRequest(API_ENDPOINTS.QUOTATIONS.CREATE, 'POST', data),
  getDetails: (id) => apiRequest(API_ENDPOINTS.QUOTATIONS.DETAILS(id), 'GET')
};

export const purchaseOrdersAPI = {
  getAll: (params) => apiRequest(API_ENDPOINTS.PURCHASE_ORDERS.LIST, 'GET', null, params),
  create: (data) => apiRequest(API_ENDPOINTS.PURCHASE_ORDERS.CREATE, 'POST', data),
  getDetails: (id) => apiRequest(API_ENDPOINTS.PURCHASE_ORDERS.DETAILS(id), 'GET')
};

export const grnAPI = {
  getAll: (params) => apiRequest(API_ENDPOINTS.GRN.LIST, 'GET', null, params),
  create: (data) => apiRequest(API_ENDPOINTS.GRN.CREATE, 'POST', data),
  pushToStock: (data) => apiRequest(API_ENDPOINTS.GRN.PUSH_TO_STOCK, 'POST', data),
  getDetails: (id) => apiRequest(API_ENDPOINTS.GRN.DETAILS(id), 'GET')
};

export const branchesAPI = {
  getAll: () => apiRequest(API_ENDPOINTS.BRANCHES.LIST, 'GET')
};
