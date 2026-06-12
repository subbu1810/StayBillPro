const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, categoryController.getCategories);
router.post('/', auth, categoryController.createCategory);
router.post('/auto-categorize', auth, categoryController.autoCategorize);
router.put('/:id', auth, categoryController.updateCategory);
router.delete('/:id', auth, categoryController.deleteCategory);

module.exports = router;
