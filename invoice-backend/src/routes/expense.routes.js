const express = require('express');
const router = express.Router();
const expenseCtrl = require('../controllers/expense.controller');

router.post('/', expenseCtrl.createExpense);
router.get('/', expenseCtrl.getExpenses);
router.get('/:id', expenseCtrl.getExpenseById);
router.put('/:id', expenseCtrl.updateExpense);
router.delete('/:id', expenseCtrl.deleteExpense);

module.exports = router;
