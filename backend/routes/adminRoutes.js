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

// Get business users (staff + superadmin)
router.get('/users', authMiddleware, adminController.getBusinessUsers);

// Update user permissions
router.put('/users/:id/permissions', authMiddleware, adminController.updatePermissions);

// Update full user details (branch, status, permissions, password)
router.put('/users/:id', authMiddleware, adminController.updateBusinessUser);

// Accept EULA Route
router.put('/accept-eula', authMiddleware, adminController.acceptEula);

module.exports = router;
