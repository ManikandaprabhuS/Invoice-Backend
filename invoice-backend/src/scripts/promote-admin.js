require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const LoginModel = require('../models/login');

const emailId = process.argv[2]?.trim().toLowerCase();

if (!emailId) {
  console.error('Usage: npm run promote-admin -- admin@example.com');
  process.exit(1);
}

const run = async () => {
  try {
    await connectDB();
    const user = await LoginModel.findOneAndUpdate(
      { emailId },
      { role: 'admin' },
      { new: true }
    );

    if (!user) {
      throw new Error('No account found for that email address');
    }

    console.log(`Administrator access granted to ${user.emailId}`);
  } finally {
    await mongoose.disconnect();
  }
};

run().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
