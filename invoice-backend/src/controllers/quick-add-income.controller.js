const QuickAddIncome = require('../models/QuickAddIncome');

exports.createQuickAddIncome = async (req, res) => {
  try {
    const serviceType = req.body.serviceType?.trim();
    const clientName = req.body.clientName?.trim() || 'Walk-in Customer';
    const amount = Number(req.body.amount);
    const modeOfPayment = req.body.modeOfPayment;

    if (!serviceType || !amount || amount <= 0 || !['Online', 'Cash'].includes(modeOfPayment)) {
      return res.status(400).json({ message: 'Valid service, amount and payment mode are required' });
    }

    const income = await QuickAddIncome.create({
      serviceType,
      clientName,
      amount,
      modeOfPayment
    });

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
