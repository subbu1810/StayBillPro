const express = require('express');
const router = express.Router();
const posSettingsController = require('../controllers/posSettingsController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', posSettingsController.getSettings);
router.post('/', posSettingsController.updateSettings);

module.exports = router;
