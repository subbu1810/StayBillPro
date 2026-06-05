const express = require('express');
const router = express.Router();
const staffManagementController = require('../controllers/staffManagementController');
const authMiddleware = require('../middleware/authMiddleware');

// All staff management routes require authentication
router.use(authMiddleware);

// Attendance routes
router.get('/attendance', staffManagementController.getAttendance);
router.post('/attendance/bulk', staffManagementController.markAllPresent);

// Payroll routes
router.get('/payroll', staffManagementController.getPayroll);
router.post('/payroll/pay', staffManagementController.processPayment);

module.exports = router;
