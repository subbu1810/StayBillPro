const express = require('express');
const router = express.Router();
const serviceRequestController = require('../controllers/serviceRequestController');

router.post('/', serviceRequestController.createServiceRequest);
router.get('/:id', serviceRequestController.getServiceRequest);
router.put('/:id', serviceRequestController.updateServiceRequest);
router.delete('/:id', serviceRequestController.deleteServiceRequest);

module.exports = router;
