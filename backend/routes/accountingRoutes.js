const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accountingController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/ledger', authMiddleware, accountingController.getLedger);
router.post('/ledger', authMiddleware, accountingController.addEntry);
router.get('/summary', authMiddleware, accountingController.getSummary);
router.get('/profit-loss', authMiddleware, accountingController.getProfitLoss);
router.get('/gst-summary', authMiddleware, accountingController.getGSTSummary);
router.get('/gstr1', authMiddleware, accountingController.getGSTR1Data);

module.exports = router;
