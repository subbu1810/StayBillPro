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
    getCustomerPayments
} = require('../controllers/customerController');

router.get('/', auth, getAllCustomers);
router.post('/', auth, createCustomer);
router.put('/:id', auth, updateCustomer);
router.delete('/:id', auth, deleteCustomer);
router.get('/payments', auth, getCustomerPayments);
router.get('/:id/ledger', auth, getCustomerLedger);
router.post('/:id/ledger/email', auth, sendCustomerLedgerEmail);

module.exports = router;

