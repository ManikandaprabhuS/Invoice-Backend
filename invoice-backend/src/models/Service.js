const mongoose = require('mongoose');

module.exports = mongoose.model(
  'Service',
  new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true, unique: true },
      amount: { type: Number, min: 0, default: 0 }
    },
    { timestamps: true }
  )
);
