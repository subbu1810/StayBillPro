const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, purchaseController.getAllPurchases);
router.post('/', authMiddleware, purchaseController.addPurchase);

// Purchase Orders
router.get('/orders', authMiddleware, purchaseController.getAllPurchaseOrders);
router.post('/orders', authMiddleware, purchaseController.createPurchaseOrder);
router.get('/orders/:id', authMiddleware, purchaseController.getPurchaseOrder);

// Goods Received Notes (GRN)
router.get('/grn', authMiddleware, purchaseController.getAllGRNs);
router.post('/grn', authMiddleware, purchaseController.createGRN);
router.delete('/grn/:id', authMiddleware, purchaseController.deleteGRNItem);

module.exports = router;
