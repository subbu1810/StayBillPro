const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/download', authMiddleware, backupController.downloadBackup);

module.exports = router;
