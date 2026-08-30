require('dotenv').config();

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const LoginModel = require('../models/login');

const { INITIAL_ADMIN_USERNAME, INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD } = process.env;

const run = async () => {
  try {
    if (!INITIAL_ADMIN_USERNAME || !INITIAL_ADMIN_EMAIL || !INITIAL_ADMIN_PASSWORD) {
      throw new Error('Initial administrator username, email, and password are required');
    }

    if (INITIAL_ADMIN_PASSWORD.length < 8) {
      throw new Error('Initial administrator password must be at least 8 characters long');
    }

    await connectDB();
    const userName = INITIAL_ADMIN_USERNAME.trim();
    const account = await LoginModel.findOne({ userName });

    if (account) {
      account.emailId = INITIAL_ADMIN_EMAIL.trim().toLowerCase();
      account.password = await bcrypt.hash(INITIAL_ADMIN_PASSWORD, 10);
      account.role = 'admin';
      await account.save();
    } else if (await LoginModel.exists({})) {
      throw new Error('An account already exists; use promote-admin instead');
    } else {
      await LoginModel.create({
        userName,
        emailId: INITIAL_ADMIN_EMAIL.trim().toLowerCase(),
        password: await bcrypt.hash(INITIAL_ADMIN_PASSWORD, 10),
        role: 'admin'
      });
    }

    console.log('Initial administrator account created');
  } finally {
    await mongoose.disconnect();
  }
};

run().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
