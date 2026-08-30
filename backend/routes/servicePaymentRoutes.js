const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/servicePaymentController');
const auth = require('../middleware/authMiddleware');

router.use(auth);

// GET all payments across all jobs
router.get('/', ctrl.getAll);

// GET payment ledger
router.get('/ledger', ctrl.getLedger);

// GET service ledger entries (cashbook)
router.get('/ledger-entries', ctrl.getServiceLedger);

// GET service ledger summary
router.get('/ledger-summary', ctrl.getServiceLedgerSummary);

// GET all payments for a job
router.get('/job/:jobId', ctrl.getByJob);

// POST create payment for a job
router.post('/job/:jobId', ctrl.create);

// PUT update a payment
router.put('/:id', ctrl.update);

// DELETE a payment
router.delete('/:id', ctrl.remove);

module.exports = router;
