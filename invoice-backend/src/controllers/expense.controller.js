const Expense = require('../models/expense');

// ================= CREATE EXPENSE =================
exports.createExpense = async (req, res) => {
  try {
    console.log('[CREATE EXPENSE REQUEST]', req.body);
    const { amount, reason, expenseDate } = req.body;

    if (!amount || !reason) {
      return res.status(400).json({
        message: 'Amount and reason are required'
      });
    }

    const expense = await Expense.create({
      amount,
      reason,
      expenseDate: expenseDate || Date.now()
    });

    console.log('[EXPENSE CREATED]', expense._id);
    res.status(201).json(expense);

  } catch (err) {
    console.error('[CREATE EXPENSE ERROR]', err);
    res.status(500).json({ message: 'Failed to create expense' });
  }
};

// ================= LIST EXPENSES =================
exports.getExpenses = async (req, res) => {
  try {
    console.log('[GET EXPENSES REQUEST]');
    const expenses = await Expense.find().sort({ expenseDate: -1 });

    console.log('[EXPENSE LIST FETCHED]', expenses.length);

    res.json(expenses);

  } catch (err) {
    console.error('[GET EXPENSES ERROR]', err);
    res.status(500).json({ message: 'Failed to fetch expenses' });
  }
};

// ================= GET SINGLE EXPENSE =================
exports.getExpenseById = async (req, res) => {
  try {
    console.log('[GET EXPENSE REQUEST]', req.params.id);
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      console.log('[EXPENSE NOT FOUND]', req.params.id);
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);

  } catch (err) {
    console.error('[GET EXPENSE ERROR]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ================= UPDATE EXPENSE =================
exports.updateExpense = async (req, res) => {
  try {
    console.log('[UPDATE EXPENSE REQUEST]', req.params.id, req.body);
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!expense) {
      console.log('[EXPENSE NOT FOUND]', req.params.id);
      return res.status(404).json({ message: 'Expense not found' });
    }

    console.log('[EXPENSE UPDATED]', expense._id);

    res.json(expense);

  } catch (err) {
    console.error('[UPDATE EXPENSE ERROR]', err);
    res.status(500).json({ message: 'Failed to update expense' });
  }
};

// ================= DELETE EXPENSE =================
exports.deleteExpense = async (req, res) => {
  try {
    console.log('[DELETE EXPENSE REQUEST]', req.params.id);
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      console.log('[EXPENSE NOT FOUND]', req.params.id);
      return res.status(404).json({ message: 'Expense not found' });
    }

    console.log('[EXPENSE DELETED]', expense._id);

    res.json({ message: 'Expense deleted successfully' });

  } catch (err) {
    console.error('[DELETE EXPENSE ERROR]', err);
    res.status(500).json({ message: 'Server error' });
  }
};