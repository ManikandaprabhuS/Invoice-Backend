const mongoose = require('mongoose');

module.exports = mongoose.model(
  'login',
  new mongoose.Schema({
    userName: { type: String, required: true, unique: true, trim: true },
    emailId: { type: String, required: true, unique: true, trim: true, lowercase: true },
    branchName: { type: String, trim: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user', required: true },

    password: { type: String, required: true },

    // 🔐 Forgot password fields
    resetOtpHash: String,
    resetOtpExpires: Date
  }, { timestamps: true })
);
