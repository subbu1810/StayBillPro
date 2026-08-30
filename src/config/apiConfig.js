/**
 * Centralized API Configuration
 * 
 * Change the API_BASE_URL to switch between different environments
 * All API endpoints are defined here for easy management
 */

import API_BASE_URL from './serverConfig';

// ========== API ENDPOINTS ==========
export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  // Users
  USERS: {
    LIST: `${API_BASE_URL}/staff`,
    CREATE: `${API_BASE_URL}/staff`,
    GET: (id) => `${API_BASE_URL}/staff/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/staff/${id}`,
    DELETE: (id) => `${API_BASE_URL}/staff/${id}`,
  },

  // Staff Management (Attendance & Payroll)
  STAFF_MGMT: {
    ATTENDANCE: `${API_BASE_URL}/staff-mgmt/attendance`,
    ATTENDANCE_BULK: `${API_BASE_URL}/staff-mgmt/attendance/bulk`,
    ATTENDANCE_UPDATE: `${API_BASE_URL}/staff-mgmt/attendance/update`,
    PAYROLL: `${API_BASE_URL}/staff-mgmt/payroll`,
    PAYROLL_HISTORY: `${API_BASE_URL}/staff-mgmt/payroll/history`,
    PAYROLL_SAVE_DRAFT: `${API_BASE_URL}/staff-mgmt/payroll/save-draft`,
    PAYROLL_PAY: `${API_BASE_URL}/staff-mgmt/payroll/pay`,
  },

  // Appliances
  APPLIANCES: {
    LIST: `${API_BASE_URL}/appliances`,
    CREATE: `${API_BASE_URL}/appliances`,
    GET: (id) => `${API_BASE_URL}/appliances/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/appliances/${id}`,
    DELETE: (id) => `${API_BASE_URL}/appliances/${id}`,
    SERVICE_REQUESTS: (id) => `${API_BASE_URL}/appliances/${id}/service-requests`,
  },

  // Service Requests
  SERVICE_REQUESTS: {
    LIST: `${API_BASE_URL}/service-requests`,
    CREATE: `${API_BASE_URL}/service-requests`,
    GET: (id) => `${API_BASE_URL}/service-requests/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/service-requests/${id}`,
    DELETE: (id) => `${API_BASE_URL}/service-requests/${id}`,
  },

  // Technicians
  TECHNICIANS: {
    LIST: `${API_BASE_URL}/technicians`,
    CREATE: `${API_BASE_URL}/technicians`,
    GET: (id) => `${API_BASE_URL}/technicians/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/technicians/${id}`,
    DELETE: (id) => `${API_BASE_URL}/technicians/${id}`,
    ACTIVE: `${API_BASE_URL}/technicians/active`,
    BY_SPECIALIZATION: (spec) => `${API_BASE_URL}/technicians/specialization/${spec}`,
  },

  // Products
  PRODUCTS: {
    LIST: `${API_BASE_URL}/products`,
    CREATE: `${API_BASE_URL}/products`,
    GET: (id) => `${API_BASE_URL}/products/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/products/${id}`,
    DELETE: (id) => `${API_BASE_URL}/products/${id}`,
    LOW_STOCK: `${API_BASE_URL}/products/low-stock`,
    EXPIRY_STOCK: `${API_BASE_URL}/products/expiry-stock`,
  },

  // Spares
  SPARES: {
    LIST: `${API_BASE_URL}/spares`,
    CREATE: `${API_BASE_URL}/spares`,
    GET: (id) => `${API_BASE_URL}/spares/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/spares/${id}`,
    DELETE: (id) => `${API_BASE_URL}/spares/${id}`,
    LOW_STOCK: `${API_BASE_URL}/spares/low-stock`,
    BY_COMPATIBILITY: (type) => `${API_BASE_URL}/spares/compatible/${type}`,
  },

  // Reports
  REPORTS: {
    SALES: `${API_BASE_URL}/reports/sales`,
    EXPENSES: `${API_BASE_URL}/reports/expenses`,
    PROFIT: `${API_BASE_URL}/reports/profit`,
    TOP_CUSTOMERS: `${API_BASE_URL}/reports/top-customers`,
    INVENTORY: `${API_BASE_URL}/reports/inventory`,
    FIRM_DETAILS: `${API_BASE_URL}/reports/firm-details`,
  },

  // Default Charges
  DEFAULT_CHARGES: {
    LIST: `${API_BASE_URL}/default-charges`,
    CREATE: `${API_BASE_URL}/default-charges`,
    GET: (id) => `${API_BASE_URL}/default-charges/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/default-charges/${id}`,
    DELETE: (id) => `${API_BASE_URL}/default-charges/${id}`,
    BY_SERVICE_AND_APPLIANCE: (serviceType, applianceType) => 
      `${API_BASE_URL}/default-charges/${serviceType}/${applianceType}`,
  },

  // Jobs
  JOBS: {
    LIST: `${API_BASE_URL}/jobs`,
    CREATE: `${API_BASE_URL}/jobs`,
    GET: (id) => `${API_BASE_URL}/jobs/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/jobs/${id}`,
    DELETE: (id) => `${API_BASE_URL}/jobs/${id}`,
    BY_TECHNICIAN: (techId) => `${API_BASE_URL}/jobs/technician/${techId}`,
    BY_STATUS: (status) => `${API_BASE_URL}/jobs/status/${status}`,
    BY_PRIORITY: (priority) => `${API_BASE_URL}/jobs/priority/${priority}`,
    SCHEDULED: `${API_BASE_URL}/jobs/scheduled`,
  },

  // Customers
  CUSTOMERS: {
    LIST: `${API_BASE_URL}/customers`,
    CREATE: `${API_BASE_URL}/customers`,
    GET: (id) => `${API_BASE_URL}/customers/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/customers/${id}`,
    DELETE: (id) => `${API_BASE_URL}/customers/${id}`,
  },

  // Service Job Payments
  SERVICE_PAYMENTS: {
    GET_ALL: `${API_BASE_URL}/service-payments`,
    GET_LEDGER: `${API_BASE_URL}/service-payments/ledger`,
    LEDGER_ENTRIES: `${API_BASE_URL}/service-payments/ledger-entries`,
    LEDGER_SUMMARY: `${API_BASE_URL}/service-payments/ledger-summary`,
    BY_JOB: (jobId) => `${API_BASE_URL}/service-payments/job/${jobId}`,
    CREATE: (jobId) => `${API_BASE_URL}/service-payments/job/${jobId}`,
    UPDATE: (id) => `${API_BASE_URL}/service-payments/${id}`,
    DELETE: (id) => `${API_BASE_URL}/service-payments/${id}`,
  },

  // Payment
  PAYMENT: {
    CREATE_ORDER: `${API_BASE_URL}/payment/create-order`,
    VERIFY: `${API_BASE_URL}/payment/verify`,
  },

  // Wallet
  WALLET: {
    CREATE_ORDER: `${API_BASE_URL}/wallet/create-recharge-order`,
    VERIFY: `${API_BASE_URL}/wallet/verify-recharge`,
    HISTORY: `${API_BASE_URL}/wallet/history`,
  },

  // Admin Auth
  ADMIN_AUTH: {
    REGISTER: `${API_BASE_URL}/admin/register`,
    LOGIN: `${API_BASE_URL}/admin/login`,
    CHANGE_PASSWORD: `${API_BASE_URL}/admin/change-password`,
    UPDATE_PROFILE: `${API_BASE_URL}/admin/profile`,
    ACCEPT_EULA: `${API_BASE_URL}/admin/accept-eula`,
  },

  // Admin Users (Permissions)
  ADMIN_USERS: {
    LIST: `${API_BASE_URL}/admin/users`,
    CREATE: `${API_BASE_URL}/staff`,
    UPDATE: (id) => `${API_BASE_URL}/admin/users/${id}`,
    DELETE: (id) => `${API_BASE_URL}/staff/${id}`,
    UPDATE_PERMISSIONS: (id) => `${API_BASE_URL}/admin/users/${id}/permissions`,
  },


  // Subscriptions
  SUBSCRIPTIONS: {
    VERIFY: `${API_BASE_URL}/subscriptions/verify`,
  },

  // Categories
  CATEGORIES: {
    LIST: (type) => `${API_BASE_URL}/categories${type ? `?type=${type}` : ''}`,
    CREATE: `${API_BASE_URL}/categories`,
    UPDATE: (id) => `${API_BASE_URL}/categories/${id}`,
    DELETE: (id) => `${API_BASE_URL}/categories/${id}`,
  },

  // Health Check
  HEALTH: `${API_BASE_URL}/health`,

  // Branches
  BRANCHES: {
    LIST: `${API_BASE_URL}/branches`,
    CREATE: `${API_BASE_URL}/branches`,
    UPDATE: (id) => `${API_BASE_URL}/branches/${id}`,
    DELETE: (id) => `${API_BASE_URL}/branches/${id}`,
  },

  // POS Settings
  POS_SETTINGS: {
    GET: (branch_id) => `${API_BASE_URL}/pos-settings?branch_id=${branch_id}`,
    UPDATE: `${API_BASE_URL}/pos-settings`,
  },

  // Staff
  STAFF: {
    LIST: `${API_BASE_URL}/staff`,
    CREATE: `${API_BASE_URL}/staff`,
    DELETE: (id) => `${API_BASE_URL}/staff/${id}`,
  },

  // Stock Logs
  STOCK_LOGS: {
    LIST: (type) => `${API_BASE_URL}/stock-movement${type ? `?type=${type}` : ''}`,
    CREATE: `${API_BASE_URL}/stock-movement`,
  },

  // Accounting
  ACCOUNTING: {
    LEDGER: `${API_BASE_URL}/accounting/ledger`,
    SUMMARY: `${API_BASE_URL}/accounting/summary`,
    PROFIT_LOSS: `${API_BASE_URL}/accounting/profit-loss`,
    GST_SUMMARY: `${API_BASE_URL}/accounting/gst-summary`,
    GSTR1: `${API_BASE_URL}/accounting/gstr1`,
  },

  // Backup
  BACKUP: {
    STATUS: `${API_BASE_URL}/backup/status`,
    LOGS: `${API_BASE_URL}/backup/logs`,
    DOWNLOAD: `${API_BASE_URL}/backup/download`,
  },
};

// ========== HTTP METHODS ==========
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};

// ========== HTTP HEADERS ==========
export const HTTP_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// ========== API CONFIGURATION ==========
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// ========== ENVIRONMENT CONFIGURATION ==========
export const ENVIRONMENT = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  STAGING: 'staging',
};

export const CURRENT_ENV = process.env.NODE_ENV || ENVIRONMENT.DEVELOPMENT;

// ========== EXPORT CONFIGURATION ==========
const apiConfig = {
  API_ENDPOINTS,
  HTTP_METHODS,
  HTTP_HEADERS,
  API_CONFIG,
  ENVIRONMENT,
  CURRENT_ENV,
};

export default apiConfig;
