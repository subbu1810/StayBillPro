const express = require('express');
const router = express.Router();
const stockLogController = require('../controllers/stockLogController');
const auth = require('../middleware/authMiddleware');

// Debug route
router.get('/health', (req, res) => res.json({ status: 'ok', message: 'Stock log router is mounted' }));

// Main routes
router.get('/', auth, stockLogController.getAllLogs);
router.post('/', auth, stockLogController.createLog);

module.exports = router;
