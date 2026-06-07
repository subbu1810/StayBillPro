const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unitController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', unitController.getUnits);
router.post('/', unitController.addUnit);

module.exports = router;
