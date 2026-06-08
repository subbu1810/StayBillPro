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
  getExpiryStock: (params) => apiRequest(API_ENDPOINTS.PRODUCTS.EXPIRY_STOCK, HTTP_METHODS.GET, null, params),
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
  getSales: (params) => apiRequest(`${API_ENDPOINTS.REPORTS.SALES}?${new URLSearchParams(params).toString()}`),
  getExpenses: (params) => apiRequest(`${API_ENDPOINTS.REPORTS.EXPENSES}?${new URLSearchParams(params).toString()}`),
  getProfit: (params) => apiRequest(`${API_ENDPOINTS.REPORTS.PROFIT}?${new URLSearchParams(params).toString()}`),
  getTopCustomers: (params) => apiRequest(`${API_ENDPOINTS.REPORTS.TOP_CUSTOMERS}?${new URLSearchParams(params).toString()}`),
  getInventory: (params) => apiRequest(`${API_ENDPOINTS.REPORTS.INVENTORY}?${new URLSearchParams(params).toString()}`),
  getFirmDetails: () => apiRequest(API_ENDPOINTS.REPORTS.FIRM_DETAILS),
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

// ========== WALLET API ==========
export const walletAPI = {
  createOrder: (data) => apiRequest(API_ENDPOINTS.WALLET.CREATE_ORDER, HTTP_METHODS.POST, data),
  verifyRecharge: (data) => apiRequest(API_ENDPOINTS.WALLET.VERIFY, HTTP_METHODS.POST, data),
  getHistory: () => apiRequest(API_ENDPOINTS.WALLET.HISTORY, HTTP_METHODS.GET),
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

// ========== SUPPLIERS API ==========
export const suppliersAPI = {
  getAll: (params) => apiRequest(`${API_ENDPOINTS.BASE_URL}/suppliers`, HTTP_METHODS.GET, null, params),
  create: (supplierData) => apiRequest(`${API_ENDPOINTS.BASE_URL}/suppliers`, HTTP_METHODS.POST, supplierData),
  update: (id, supplierData) => apiRequest(`${API_ENDPOINTS.BASE_URL}/suppliers/${id}`, HTTP_METHODS.PUT, supplierData),
  delete: (id) => apiRequest(`${API_ENDPOINTS.BASE_URL}/suppliers/${id}`, HTTP_METHODS.DELETE),
  getDues: () => apiRequest(`${API_ENDPOINTS.BASE_URL}/suppliers/dues`, HTTP_METHODS.GET),
  addPayment: (paymentData) => apiRequest(`${API_ENDPOINTS.BASE_URL}/suppliers/payments`, HTTP_METHODS.POST, paymentData),
};

// ========== SETTINGS API ==========
export const settingsAPI = {
  getAdminProfile: () => apiRequest(API_ENDPOINTS.ADMIN_AUTH.PROFILE, HTTP_METHODS.GET),
  updateAdminProfile: (profileData) => apiRequest(API_ENDPOINTS.ADMIN_AUTH.UPDATE_PROFILE, HTTP_METHODS.PUT, profileData),
  changePassword: (passwordData) => apiRequest(API_ENDPOINTS.ADMIN_AUTH.CHANGE_PASSWORD, HTTP_METHODS.POST, passwordData),
};

// ========== BARCODE SETTINGS API ==========
export const barcodeSettingsAPI = {
  get: () => apiRequest(`${API_ENDPOINTS.BASE_URL}/barcode-settings`, HTTP_METHODS.GET),
  update: (data) => apiRequest(`${API_ENDPOINTS.BASE_URL}/barcode-settings`, HTTP_METHODS.PUT, data),
};

// ========== ADMIN USERS API (PERMISSIONS) ==========
export const adminUsersAPI = {
  getBusinessUsers: () => apiRequest(API_ENDPOINTS.ADMIN_USERS.LIST, HTTP_METHODS.GET),
  createUser: (userData) => apiRequest(API_ENDPOINTS.ADMIN_USERS.CREATE, HTTP_METHODS.POST, userData),
  updateUser: (id, userData) => apiRequest(API_ENDPOINTS.ADMIN_USERS.UPDATE(id), HTTP_METHODS.PUT, userData),
  deleteUser: (id) => apiRequest(API_ENDPOINTS.ADMIN_USERS.DELETE(id), HTTP_METHODS.DELETE),
  updatePermissions: (id, permissions) => apiRequest(API_ENDPOINTS.ADMIN_USERS.UPDATE_PERMISSIONS(id), HTTP_METHODS.PUT, { permissions }),
};

// ========== ADMIN AUTH API ==========
export const adminAuthAPI = {
  register: (data) => apiRequest(API_ENDPOINTS.ADMIN_AUTH.REGISTER, HTTP_METHODS.POST, data),
  login: (data) => apiRequest(API_ENDPOINTS.ADMIN_AUTH.LOGIN, HTTP_METHODS.POST, data),
  changePassword: (data) => apiRequest(API_ENDPOINTS.ADMIN_AUTH.CHANGE_PASSWORD, HTTP_METHODS.POST, data),
  updateProfile: (data) => apiRequest(API_ENDPOINTS.ADMIN_AUTH.UPDATE_PROFILE, HTTP_METHODS.PUT, data),
  acceptEula: () => apiRequest(API_ENDPOINTS.ADMIN_AUTH.ACCEPT_EULA, HTTP_METHODS.PUT),
};

// ========== SUBSCRIPTION API ==========
export const subscriptionAPI = {
  verify: (data) => apiRequest(API_ENDPOINTS.SUBSCRIPTIONS.VERIFY, HTTP_METHODS.POST, data),
  getCurrent: () => apiRequest(`${API_ENDPOINTS.BASE_URL}/subscriptions/current`, HTTP_METHODS.GET),
  getHistory: () => apiRequest(`${API_ENDPOINTS.BASE_URL}/subscriptions/history`, HTTP_METHODS.GET),
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
  getOrders: (params) => apiRequest(`${API_ENDPOINTS.BASE_URL}/purchases/orders`, HTTP_METHODS.GET, null, params),
  getOrder: (id) => apiRequest(`${API_ENDPOINTS.BASE_URL}/purchases/orders/${id}`, HTTP_METHODS.GET),
  createOrder: (orderData) => apiRequest(`${API_ENDPOINTS.BASE_URL}/purchases/orders`, HTTP_METHODS.POST, orderData),
  getGRNs: (params) => apiRequest(`${API_ENDPOINTS.BASE_URL}/purchases/grn`, HTTP_METHODS.GET, null, params),
  createGRN: (grnData) => apiRequest(`${API_ENDPOINTS.BASE_URL}/purchases/grn`, HTTP_METHODS.POST, grnData),
  deleteGRNItem: (id) => apiRequest(`${API_ENDPOINTS.BASE_URL}/purchases/grn/${id}`, HTTP_METHODS.DELETE),
  getDamaged: () => apiRequest(`${API_ENDPOINTS.BASE_URL}/purchases/damaged`, HTTP_METHODS.GET),
  processReturn: (id) => apiRequest(`${API_ENDPOINTS.BASE_URL}/purchases/damaged/${id}/return`, HTTP_METHODS.POST),
};

// ========== BILLING API ==========
export const billingAPI = {
  getAll: (params) => apiRequest(`${API_ENDPOINTS.BASE_URL}/billing`, HTTP_METHODS.GET, null, params),
  getToday: () => apiRequest(`${API_ENDPOINTS.BASE_URL}/billing/today/list`, HTTP_METHODS.GET),
  getDailySummary: (date) => apiRequest(`${API_ENDPOINTS.BASE_URL}/billing/summary/daily`, HTTP_METHODS.GET, null, date ? { date } : {}),
  getSalesReport: (startDate, endDate) => apiRequest(`${API_ENDPOINTS.BASE_URL}/billing/reports/sales`, HTTP_METHODS.GET, null, { startDate, endDate }),
  getStatistics: () => apiRequest(`${API_ENDPOINTS.BASE_URL}/billing/statistics/overview`, HTTP_METHODS.GET),
};

// ========== HEALTH CHECK API ==========
export const healthAPI = {
  check: () => apiRequest(API_ENDPOINTS.HEALTH),
};

// ========== POS SETTINGS API ==========
export const posSettingsAPI = {
  get: (branch_id) => apiRequest(API_ENDPOINTS.POS_SETTINGS.GET(branch_id)),
  update: (data) => apiRequest(API_ENDPOINTS.POS_SETTINGS.UPDATE, HTTP_METHODS.POST, data),
};

// ========== STAFF MANAGEMENT API ==========
export const staffManagementAPI = {
  getAttendance: (date) => apiRequest(API_ENDPOINTS.STAFF_MGMT.ATTENDANCE, HTTP_METHODS.GET, null, { date }),
  markAllPresent: (date) => apiRequest(API_ENDPOINTS.STAFF_MGMT.ATTENDANCE_BULK, HTTP_METHODS.POST, { date }),
  updateAttendance: (data) => apiRequest(API_ENDPOINTS.STAFF_MGMT.ATTENDANCE_UPDATE, HTTP_METHODS.POST, data),
  getPayroll: (month) => apiRequest(API_ENDPOINTS.STAFF_MGMT.PAYROLL, HTTP_METHODS.GET, null, { month }),
  getPayrollHistory: (params) => apiRequest(API_ENDPOINTS.STAFF_MGMT.PAYROLL_HISTORY, HTTP_METHODS.GET, null, params),
  savePayrollDraft: (data) => apiRequest(API_ENDPOINTS.STAFF_MGMT.PAYROLL_SAVE_DRAFT, HTTP_METHODS.POST, data),
  processPayment: (paymentData) => apiRequest(API_ENDPOINTS.STAFF_MGMT.PAYROLL_PAY, HTTP_METHODS.POST, paymentData),
};
