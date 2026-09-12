require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const optionalFields = ['phoneNumber', 'phoneLookupKey', 'gstNumber', 'emailId', 'address'];
const applyChanges = process.argv.includes('--apply');

const emptyValueFilter = field => ({
  $or: [
    { [field]: { $exists: false } },
    { [field]: { $type: 'string', $regex: /^\s*$/ } }
  ]
});

const run = async () => {
  try {
    await connectDB();

    for (const field of optionalFields) {
      const filter = emptyValueFilter(field);
      const matchingRecords = await User.countDocuments(filter);

      if (!applyChanges) {
        console.log(`[DRY RUN] ${field}: ${matchingRecords} record(s) require normalization`);
        continue;
      }

      const result = await User.updateMany(filter, { $set: { [field]: null } });
      console.log(`[UPDATED] ${field}: ${result.modifiedCount} record(s)`);
    }

    if (!applyChanges) {
      console.log('No data was changed. Run with --apply to update the matching records.');
    }
  } finally {
    await mongoose.disconnect();
  }
};

run().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
