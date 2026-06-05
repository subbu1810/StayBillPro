const express = require('express');
const router = express.Router();
const barcodeSettingsController = require('../controllers/barcodeSettingsController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, barcodeSettingsController.getSettings);
router.put('/', authMiddleware, barcodeSettingsController.updateSettings);

module.exports = router;
