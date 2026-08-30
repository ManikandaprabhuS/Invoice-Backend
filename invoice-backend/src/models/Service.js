const mongoose = require('mongoose');

module.exports = mongoose.model(
  'Service',
  new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true, unique: true }
    },
    { timestamps: true }
  )
);
