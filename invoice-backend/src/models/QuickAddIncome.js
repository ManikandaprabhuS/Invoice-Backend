const mongoose = require('mongoose');

const quickAddIncomeSchema = new mongoose.Schema(
  {
    serviceType: { type: String, required: true, trim: true },
    clientName: { type: String, trim: true, default: 'Walk-in Customer' },
    amount: { type: Number, required: true, min: 0.01 },
    modeOfPayment: {
      type: String,
      required: true,
      enum: ['Online', 'Cash']
    }
  },
  { timestamps: true, collection: 'QuickAddIncome' }
);

module.exports = mongoose.model('QuickAddIncome', quickAddIncomeSchema);
