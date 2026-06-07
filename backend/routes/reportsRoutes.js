const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/sales', reportsController.getSalesReport);
router.get('/expenses', reportsController.getExpenseReport);
router.get('/profit', reportsController.getProfitReport);
router.get('/top-customers', reportsController.getTopCustomersReport);
router.get('/inventory', reportsController.getInventoryReport);
router.get('/firm-details', reportsController.getFirmDetails);

module.exports = router;
