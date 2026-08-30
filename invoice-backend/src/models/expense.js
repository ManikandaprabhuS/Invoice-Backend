const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    expenseDate: {
      type: Date,
      default: Date.now
    },

    // Optional (future use: link to owner/user)
    createdBy: {
      type: String,
      default: 'owner'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);