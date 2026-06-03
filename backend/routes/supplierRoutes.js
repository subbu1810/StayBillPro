const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
    getAllSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier
} = require('../controllers/supplierController');

router.get('/', auth, getAllSuppliers);
router.post('/', auth, createSupplier);
router.put('/:id', auth, updateSupplier);
router.delete('/:id', auth, deleteSupplier);

module.exports = router;
