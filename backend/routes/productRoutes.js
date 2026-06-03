const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, productController.getAllProducts);
router.post('/', auth, productController.createProduct);
router.get('/low-stock', auth, productController.getLowStockProducts);
router.put('/:id', auth, productController.updateProduct);
router.delete('/:id', auth, productController.deleteProduct);

module.exports = router;
