const mongoose = require('mongoose');

module.exports = mongoose.model(
  'User',
  new mongoose.Schema(
    {
      userName: { type: String, required: true },
      phoneNumber: { type: String, trim: true, default: null },
      phoneLookupKey: { type: String, index: true, default: null },
      gstNumber: { type: String, uppercase: true, trim: true, default: null },
      emailId: { type: String, trim: true, default: null },
      address: { type: String, trim: true, default: null }
    },
    { timestamps: true }
  )
);
