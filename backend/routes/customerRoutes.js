const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
    getAllCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerLedger,
    sendCustomerLedgerEmail,
    getCustomerPayments,
    updateCustomerDues,
    recordCustomerPayment
} = require('../controllers/customerController');

router.get('/', auth, getAllCustomers);
router.post('/', auth, createCustomer);
router.put('/:id', auth, updateCustomer);
router.put('/:id/dues', auth, updateCustomerDues);
router.post('/:id/payments', auth, recordCustomerPayment);
router.delete('/:id', auth, deleteCustomer);
router.get('/payments', auth, getCustomerPayments);
router.get('/:id/ledger', auth, getCustomerLedger);
router.post('/:id/ledger/email', auth, sendCustomerLedgerEmail);

module.exports = router;

