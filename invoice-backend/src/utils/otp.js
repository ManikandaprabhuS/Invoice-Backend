const crypto = require('crypto');

exports.generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

exports.hashOtp = (emailId, otp) => {
  return crypto.createHash('sha256').update(`${emailId}:${otp}`).digest('hex');
};

exports.generateResetToken = () => crypto.randomBytes(32).toString('hex');

exports.hashResetToken = token => crypto.createHash('sha256').update(token).digest('hex');
