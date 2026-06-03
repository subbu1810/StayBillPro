const express = require('express');
const router = express.Router();
const spareController = require('../controllers/spareController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, spareController.getAllSpares);
router.post('/', auth, spareController.createSpare);
router.get('/low-stock', auth, spareController.getLowStockSpares);
router.put('/:id', auth, spareController.updateSpare);
router.delete('/:id', auth, spareController.deleteSpare);

module.exports = router;
