const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create-recharge-order', authMiddleware, walletController.createRechargeOrder);
router.post('/verify-recharge', authMiddleware, walletController.verifyRecharge);
router.get('/history', authMiddleware, walletController.getHistory);

module.exports = router;
