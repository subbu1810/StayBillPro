const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
    createInvoice,
    getInvoice,
    getAllInvoices,
    getDailySummary,
    getSalesReport,
    cancelInvoice,
    getStatistics,
    searchInvoices,
    getInvoiceDetails,
    getTodayInvoices,
    getInvoiceByNumber,
    getInvoiceReceipt
} = require('../controllers/billingController');

// Create invoice (POS billing)
router.post('/', auth, createInvoice);

// Cancel invoice
router.post('/:invoiceId/cancel', auth, cancelInvoice);

// Real-time invoices
router.get('/today/list', auth, getTodayInvoices);

// Search invoices with filters (Real-time data)
router.get('/search/advanced', auth, searchInvoices);

// Get invoice receipt for printing
router.get('/receipt/:invoiceId', auth, getInvoiceReceipt);

// Get invoice details
router.get('/details/:invoiceId', auth, getInvoiceDetails);

// Get all invoices
router.get('/', auth, getAllInvoices);

// Get invoice by ID
router.get('/:invoiceId', auth, getInvoice);

// Get invoice by number
router.get('/number/:invoiceNumber', auth, getInvoiceByNumber);

// Get daily summary
router.get('/summary/daily', auth, getDailySummary);

// Get sales report
router.get('/reports/sales', auth, getSalesReport);

// Get statistics
router.get('/statistics/overview', auth, getStatistics);

module.exports = router;
