const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

const authMiddleware = require('../middleware/authMiddleware');

// Registration Route
router.post('/register', adminController.registerAdmin);

// Login Route
router.post('/login', adminController.loginAdmin);

// Change Password Route
router.post('/change-password', authMiddleware, adminController.changePassword);

// Update Branding / Business Profile Route
router.put('/profile', authMiddleware, adminController.updateAdminProfile);

module.exports = router;
