const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Open route for subscription registration (no auth required initially)
router.post('/create-order', paymentController.createOrder);

module.exports = router;
