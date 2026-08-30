const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

exports.sendOtpEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"Manikandaprabhus" <${process.env.MAIL_USER}>`,
    to,
    subject: 'Password Reset OTP',
    html: `
      <p>Your OTP for password reset is:</p>
      <h2>${otp}</h2>
      <p>This OTP is valid for 10 minutes.</p>
    `
  });
};
