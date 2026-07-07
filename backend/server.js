const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for local development to avoid blocking
}));
app.use(morgan('dev'));

// Log all requests for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Routes
app.get('/api/verify-server', (req, res) => res.json({ message: "SERVER VERSION 2.0" }));

const adminRoutes = require('./routes/adminRoutes');
const branchRoutes = require('./routes/branchRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const spareRoutes = require('./routes/spareRoutes');
const staffRoutes = require('./routes/staffRoutes');
const stockLogRoutes = require('./routes/stockLogRoutes');
const stockTransferRoutes = require('./routes/stockTransferRoutes');
const accountingRoutes = require('./routes/accountingRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const customerRoutes = require('./routes/customerRoutes');
const billingRoutes = require('./routes/billingRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const posSettingsRoutes = require('./routes/posSettingsRoutes');
const returnRoutes = require('./routes/returnRoutes');
const staffManagementRoutes = require('./routes/staffManagementRoutes');
const barcodeSettingsRoutes = require('./routes/barcodeSettingsRoutes');
const unitRoutes = require('./routes/unitRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const ocrRoutes = require('./routes/ocrRoutes');
const walletRoutes = require('./routes/walletRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const backupRoutes = require('./routes/backupRoutes');
const technicianRoutes = require('./routes/technicianRoutes');
const applianceRoutes = require('./routes/applianceRoutes');

app.use('/api/admin', adminRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/spares', spareRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/stock-movement', stockLogRoutes);
app.use('/api/stock-transfers', stockTransferRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/pos-settings', posSettingsRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/staff-mgmt', staffManagementRoutes);
app.use('/api/barcode-settings', barcodeSettingsRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/appliances', applianceRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: "Electronics Service App API is running..." });
});

// 404 Handler
app.use((req, res) => {
    console.log(`404 error for: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
        message: `Route ${req.originalUrl} Not Found`,
        debug: "Check your terminal logs for the request path"
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({ 
        message: 'Internal Server Error', 
        error: process.env.NODE_ENV === 'development' ? err.message : {} 
    });
});

// Port Configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
