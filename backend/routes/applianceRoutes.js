const express = require('express');
const router = express.Router();
const applianceController = require('../controllers/applianceController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, applianceController.getAllAppliances);
router.post('/', auth, applianceController.createAppliance);
router.get('/:id', auth, applianceController.getApplianceById);
router.put('/:id', auth, applianceController.updateAppliance);
router.delete('/:id', auth, applianceController.deleteAppliance);


module.exports = router;
