import { API_ENDPOINTS, HTTP_METHODS, HTTP_HEADERS } from '../config/apiConfig';

/**
 * Generic API Request Handler
 * Handles all HTTP requests with error handling
 */
const apiRequest = async (url, method = HTTP_METHODS.GET, data = null, params = null) => {
  let finalUrl = url;
  if (params && Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryString;
  }

  const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
  const options = {
    method,
    headers: {
      ...HTTP_HEADERS,
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  };

  if (data && (method === HTTP_METHODS.POST || method === HTTP_METHODS.PUT || method === HTTP_METHODS.PATCH)) {
    options.body = JSON.stringify(data);
  }

  console.log(`API Request: ${method} ${finalUrl}`, data || '');

  const response = await fetch(finalUrl, options);

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && (errorData.message || errorData.error)) {
        errorMessage = errorData.message || errorData.error;
      }
    } catch (e) {
      // If not JSON, use default status text
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

// ========== USERS API ==========
export const usersAPI = {
  getAll: () => apiRequest(API_ENDPOINTS.USERS.LIST),
  create: (userData) => apiRequest(API_ENDPOINTS.USERS.CREATE, HTTP_METHODS.POST, userData),
  get: (id) => apiRequest(API_ENDPOINTS.USERS.GET(id)),
  update: (id, userData) => apiRequest(API_ENDPOINTS.USERS.UPDATE(id), HTTP_METHODS.PUT, userData),
  delete: (id) => apiRequest(API_ENDPOINTS.USERS.DELETE(id), HTTP_METHODS.DELETE),
};

// ========== APPLIANCES API ==========
export const appliancesAPI = {
  getAll: (params) => apiRequest(API_ENDPOINTS.APPLIANCES.LIST, HTTP_METHODS.GET, null, params),
  create: (applianceData) => apiRequest(API_ENDPOINTS.APPLIANCES.CREATE, HTTP_METHODS.POST, applianceData),
  get: (id) => apiRequest(API_ENDPOINTS.APPLIANCES.GET(id)),
  update: (id, applianceData) => apiRequest(API_ENDPOINTS.APPLIANCES.UPDATE(id), HTTP_METHODS.PUT, applianceData),
  delete: (id) => apiRequest(API_ENDPOINTS.APPLIANCES.DELETE(id), HTTP_METHODS.DELETE),
  getServiceRequests: (id) => apiRequest(API_ENDPOINTS.APPLIANCES.SERVICE_REQUESTS(id)),
};

// ========== SERVICE REQUESTS API ==========
export const serviceRequestsAPI = {
  getAll: (params) => apiRequest(API_ENDPOINTS.SERVICE_REQUESTS.LIST, HTTP_METHODS.GET, null, params),
  create: (requestData) => apiRequest(API_ENDPOINTS.SERVICE_REQUESTS.CREATE, HTTP_METHODS.POST, requestData),
  get: (id) => apiRequest(API_ENDPOINTS.SERVICE_REQUESTS.GET(id)),
  update: (id, requestData) => apiRequest(API_ENDPOINTS.SERVICE_REQUESTS.UPDATE(id), HTTP_METHODS.PUT, requestData),
  delete: (id) => apiRequest(API_ENDPOINTS.SERVICE_REQUESTS.DELETE(id), HTTP_METHODS.DELETE),
};

// ========== TECHNICIANS API ==========
export const techniciansAPI = {
  getAll: (params) => apiRequest(API_ENDPOINTS.TECHNICIANS.LIST, HTTP_METHODS.GET, null, params),
  create: (technicianData) => apiRequest(API_ENDPOINTS.TECHNICIANS.CREATE, HTTP_METHODS.POST, technicianData),
  get: (id) => apiRequest(API_ENDPOINTS.TECHNICIANS.GET(id)),
  update: (id, technicianData) => apiRequest(API_ENDPOINTS.TECHNICIANS.UPDATE(id), HTTP_METHODS.PUT, technicianData),
  delete: (id) => apiRequest(API_ENDPOINTS.TECHNICIANS.DELETE(id), HTTP_METHODS.DELETE),
  getActive: () => apiRequest(API_ENDPOINTS.TECHNICIANS.ACTIVE),
  getBySpecialization: (spec) => apiRequest(API_ENDPOINTS.TECHNICIANS.BY_SPECIALIZATION(spec)),
};

// ========== PRODUCTS API ==========
export const productsAPI = {
  getAll: (params) => apiRequest(API_ENDPOINTS.PRODUCTS.LIST, HTTP_METHODS.GET, null, params),
  create: (productData) => apiRequest(API_ENDPOINTS.PRODUCTS.CREATE, HTTP_METHODS.POST, productData),
  get: (id) => apiRequest(API_ENDPOINTS.PRODUCTS.GET(id)),
  update: (id, productData) => apiRequest(API_ENDPOINTS.PRODUCTS.UPDATE(id), HTTP_METHODS.PUT, productData),
  delete: (id) => apiRequest(API_ENDPOINTS.PRODUCTS.DELETE(id), HTTP_METHODS.DELETE),
  getLowStock: (params) => apiRequest(API_ENDPOINTS.PRODUCTS.LOW_STOCK, HTTP_METHODS.GET, null, params),
};

// ========== SPARES API ==========
export const sparesAPI = {
  getAll: (params) => apiRequest(API_ENDPOINTS.SPARES.LIST, HTTP_METHODS.GET, null, params),
  create: (spareData) => apiRequest(API_ENDPOINTS.SPARES.CREATE, HTTP_METHODS.POST, spareData),
  get: (id) => apiRequest(API_ENDPOINTS.SPARES.GET(id)),
  update: (id, spareData) => apiRequest(API_ENDPOINTS.SPARES.UPDATE(id), HTTP_METHODS.PUT, spareData),
  delete: (id) => apiRequest(API_ENDPOINTS.SPARES.DELETE(id), HTTP_METHODS.DELETE),
  getLowStock: (params) => apiRequest(API_ENDPOINTS.SPARES.LOW_STOCK, HTTP_METHODS.GET, null, params),
  getByCompatibility: (type) => apiRequest(API_ENDPOINTS.SPARES.BY_COMPATIBILITY(type)),
};

// ========== CATEGORIES API ==========
export const categoriesAPI = {
  getAll: (type) => apiRequest(API_ENDPOINTS.CATEGORIES.LIST(type)),
  create: (categoryData) => apiRequest(API_ENDPOINTS.CATEGORIES.CREATE, HTTP_METHODS.POST, categoryData),
  update: (id, categoryData) => apiRequest(API_ENDPOINTS.CATEGORIES.UPDATE(id), HTTP_METHODS.PUT, categoryData),
  delete: (id) => apiRequest(API_ENDPOINTS.CATEGORIES.DELETE(id), HTTP_METHODS.DELETE),
};

// ========== REPORTS API ==========
export const reportsAPI = {
  getInventory: () => apiRequest(API_ENDPOINTS.REPORTS.INVENTORY),
};

// ========== DEFAULT CHARGES API ==========
export const defaultChargesAPI = {
  getAll: () => apiRequest(API_ENDPOINTS.DEFAULT_CHARGES.LIST),
  create: (chargeData) => apiRequest(API_ENDPOINTS.DEFAULT_CHARGES.CREATE, HTTP_METHODS.POST, chargeData),
  get: (id) => apiRequest(API_ENDPOINTS.DEFAULT_CHARGES.GET(id)),
  update: (id, chargeData) => apiRequest(API_ENDPOINTS.DEFAULT_CHARGES.UPDATE(id), HTTP_METHODS.PUT, chargeData),
  delete: (id) => apiRequest(API_ENDPOINTS.DEFAULT_CHARGES.DELETE(id), HTTP_METHODS.DELETE),
  getByServiceAndAppliance: (serviceType, applianceType) =>
    apiRequest(API_ENDPOINTS.DEFAULT_CHARGES.BY_SERVICE_AND_APPLIANCE(serviceType, applianceType)),
};

// ========== JOBS API ==========
export const jobsAPI = {
  getAll: (params) => apiRequest(API_ENDPOINTS.JOBS.LIST, HTTP_METHODS.GET, null, params),
  create: (jobData) => apiRequest(API_ENDPOINTS.JOBS.CREATE, HTTP_METHODS.POST, jobData),
  get: (id) => apiRequest(API_ENDPOINTS.JOBS.GET(id)),
  update: (id, jobData) => apiRequest(API_ENDPOINTS.JOBS.UPDATE(id), HTTP_METHODS.PUT, jobData),
  delete: (id) => apiRequest(API_ENDPOINTS.JOBS.DELETE(id), HTTP_METHODS.DELETE),
  getByTechnician: (techId) => apiRequest(API_ENDPOINTS.JOBS.BY_TECHNICIAN(techId)),
  getByStatus: (status) => apiRequest(API_ENDPOINTS.JOBS.BY_STATUS(status)),
  getByPriority: (priority) => apiRequest(API_ENDPOINTS.JOBS.BY_PRIORITY(priority)),
  getScheduled: () => apiRequest(API_ENDPOINTS.JOBS.SCHEDULED),
};

// ========== CUSTOMERS API ==========
export const customersAPI = {
  getAll: (params) => apiRequest(API_ENDPOINTS.CUSTOMERS.LIST, HTTP_METHODS.GET, null, params),
  create: (customerData) => apiRequest(API_ENDPOINTS.CUSTOMERS.CREATE, HTTP_METHODS.POST, customerData),
  get: (id) => apiRequest(API_ENDPOINTS.CUSTOMERS.GET(id)),
  update: (id, customerData) => apiRequest(API_ENDPOINTS.CUSTOMERS.UPDATE(id), HTTP_METHODS.PUT, customerData),
  delete: (id) => apiRequest(API_ENDPOINTS.CUSTOMERS.DELETE(id), HTTP_METHODS.DELETE),
};

// ========== ADMIN AUTH API ==========
export const adminAuthAPI = {
  register: (adminData) => apiRequest(API_ENDPOINTS.ADMIN_AUTH.REGISTER, HTTP_METHODS.POST, adminData),
  login: (credentials) => apiRequest(API_ENDPOINTS.ADMIN_AUTH.LOGIN, HTTP_METHODS.POST, credentials),
  changePassword: (passwordData) => apiRequest(API_ENDPOINTS.ADMIN_AUTH.CHANGE_PASSWORD, HTTP_METHODS.POST, passwordData),
};

// ========== SUBSCRIPTION API ==========
export const subscriptionAPI = {
  verify: (data) => apiRequest(API_ENDPOINTS.SUBSCRIPTIONS.VERIFY, HTTP_METHODS.POST, data),
};

// ========== PAYMENT API ==========
export const paymentAPI = {
  createOrder: (amount, currency = 'INR') => apiRequest(API_ENDPOINTS.PAYMENT.CREATE_ORDER, HTTP_METHODS.POST, { amount, currency }),
  verifyPayment: (paymentData) => apiRequest(API_ENDPOINTS.PAYMENT.VERIFY, HTTP_METHODS.POST, paymentData),
};

// ========== BRANCHES API ==========
export const branchesAPI = {
  getAll: () => apiRequest(API_ENDPOINTS.BRANCHES.LIST),
  create: (branchData) => apiRequest(API_ENDPOINTS.BRANCHES.CREATE, HTTP_METHODS.POST, branchData),
  update: (id, branchData) => apiRequest(API_ENDPOINTS.BRANCHES.UPDATE(id), HTTP_METHODS.PUT, branchData),
  delete: (id) => apiRequest(API_ENDPOINTS.BRANCHES.DELETE(id), HTTP_METHODS.DELETE),
};

// ========== STAFF API ==========
export const staffAPI = {
  getAll: () => apiRequest(API_ENDPOINTS.STAFF.LIST),
  create: (staffData) => apiRequest(API_ENDPOINTS.STAFF.CREATE, HTTP_METHODS.POST, staffData),
  delete: (id) => apiRequest(API_ENDPOINTS.STAFF.DELETE(id), HTTP_METHODS.DELETE),
};

// ========== STOCK LOGS API ==========
export const stockLogAPI = {
  getAll: (type) => apiRequest(API_ENDPOINTS.STOCK_LOGS.LIST(type)),
  create: (logData) => apiRequest(API_ENDPOINTS.STOCK_LOGS.CREATE, HTTP_METHODS.POST, logData),
};

// ========== ACCOUNTING API ==========
export const accountingAPI = {
  getLedger: (params) => apiRequest(API_ENDPOINTS.ACCOUNTING.LEDGER, HTTP_METHODS.GET, null, params),
  addEntry: (entryData) => apiRequest(API_ENDPOINTS.ACCOUNTING.LEDGER, HTTP_METHODS.POST, entryData),
  getSummary: (params) => apiRequest(API_ENDPOINTS.ACCOUNTING.SUMMARY, HTTP_METHODS.GET, null, params),
  getProfitLoss: (params) => apiRequest(API_ENDPOINTS.ACCOUNTING.PROFIT_LOSS, HTTP_METHODS.GET, null, params),
  getGSTSummary: (params) => apiRequest(API_ENDPOINTS.ACCOUNTING.GST_SUMMARY, HTTP_METHODS.GET, null, params),
  getGSTR1: (params) => apiRequest(API_ENDPOINTS.ACCOUNTING.GSTR1, HTTP_METHODS.GET, null, params),
};

// ========== EXPENSES API ==========
export const expenseAPI = {
  getAll: (params) => apiRequest(`${API_ENDPOINTS.BASE_URL}/expenses`, HTTP_METHODS.GET, null, params),
  create: (expenseData) => apiRequest(`${API_ENDPOINTS.BASE_URL}/expenses`, HTTP_METHODS.POST, expenseData),
  delete: (id) => apiRequest(`${API_ENDPOINTS.BASE_URL}/expenses/${id}`, HTTP_METHODS.DELETE),
};

// ========== PURCHASES API ==========
export const purchaseAPI = {
  getAll: (params) => apiRequest(`${API_ENDPOINTS.BASE_URL}/purchases`, HTTP_METHODS.GET, null, params),
  create: (purchaseData) => apiRequest(`${API_ENDPOINTS.BASE_URL}/purchases`, HTTP_METHODS.POST, purchaseData),
};

// ========== HEALTH CHECK API ==========
export const healthAPI = {
  check: () => apiRequest(API_ENDPOINTS.HEALTH),
};
