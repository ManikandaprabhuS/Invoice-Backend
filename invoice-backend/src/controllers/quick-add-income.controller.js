const QuickAddIncome = require('../models/QuickAddIncome');
const mongoose = require('mongoose');

const readQuickAddIncome = body => ({
  serviceType: body.serviceType?.trim(),
  clientName: body.clientName?.trim() || 'Walk-in Customer',
  amount: Number(body.amount),
  modeOfPayment: body.modeOfPayment
});

const isValidQuickAddIncome = income =>
  Boolean(income.serviceType) &&
  Number.isFinite(income.amount) &&
  income.amount > 0 &&
  ['Online', 'Cash'].includes(income.modeOfPayment);

exports.createQuickAddIncome = async (req, res) => {
  try {
    const incomeDetails = readQuickAddIncome(req.body);

    if (!isValidQuickAddIncome(incomeDetails)) {
      return res.status(400).json({ message: 'Valid service, amount and payment mode are required' });
    }

    const income = await QuickAddIncome.create(incomeDetails);

    return res.status(201).json(income);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid quick income data' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getQuickAddIncomes = async (_req, res) => {
  try {
    const incomes = await QuickAddIncome.find().sort({ createdAt: -1 });
    return res.json(incomes);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateQuickAddIncome = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid customer invoice record' });
    }

    const incomeDetails = readQuickAddIncome(req.body);
    if (!isValidQuickAddIncome(incomeDetails)) {
      return res.status(400).json({ message: 'Valid service, amount and payment mode are required' });
    }

    const income = await QuickAddIncome.findByIdAndUpdate(
      req.params.id,
      incomeDetails,
      { new: true, runValidators: true }
    );

    if (!income) {
      return res.status(404).json({ message: 'Customer invoice record not found' });
    }

    return res.json(income);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid quick income data' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteQuickAddIncome = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid customer invoice record' });
    }

    const income = await QuickAddIncome.findByIdAndDelete(req.params.id);
    if (!income) {
      return res.status(404).json({ message: 'Customer invoice record not found' });
    }

    return res.json({ message: 'Customer invoice deleted successfully' });
  } catch (_error) {
    return res.status(500).json({ message: 'Server error' });
  }
};
