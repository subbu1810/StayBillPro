const express = require('express');
const router = express.Router();
const stockTransferController = require('../controllers/stockTransferController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes are protected
router.use(authMiddleware);

router.get('/', stockTransferController.getAllTransfers);
router.post('/', stockTransferController.createTransfer);
router.put('/:id/status', stockTransferController.updateTransferStatus);

module.exports = router;
