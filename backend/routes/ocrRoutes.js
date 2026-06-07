const express = require('express');
const router = express.Router();
const multer = require('multer');
const ocrController = require('../controllers/ocrController');
const authMiddleware = require('../middleware/authMiddleware');

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 } // Increased to 20 MB
}).single('document');

router.post('/scan-bill', authMiddleware, (req, res, next) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: false, message: 'File Upload Error: ' + err.message });
        } else if (err) {
            return res.status(500).json({ success: false, message: 'Unknown Upload Error: ' + err.message });
        }
        next();
    });
}, ocrController.scanBill);

module.exports = router;
