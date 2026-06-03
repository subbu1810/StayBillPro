const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, expenseController.getAllExpenses);
router.post('/', authMiddleware, expenseController.addExpense);
router.delete('/:id', authMiddleware, expenseController.deleteExpense);

module.exports = router;
