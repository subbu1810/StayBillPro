const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
    createReturn,
    getAllReturns,
    getReturnDetails
} = require('../controllers/returnController');

// Process a sales return
router.post('/', auth, createReturn);

// Get list of all returns
router.get('/', auth, getAllReturns);

// Get details of a single return
router.get('/:returnId', auth, getReturnDetails);

module.exports = router;
