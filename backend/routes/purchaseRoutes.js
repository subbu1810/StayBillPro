const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, purchaseController.getAllPurchases);
router.post('/', authMiddleware, purchaseController.addPurchase);

module.exports = router;
