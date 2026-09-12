const nodemailer = require('nodemailer');

const mailUser = String(process.env.MAIL_USER || '').trim();
const mailPassword = String(process.env.MAIL_PASS || '').replace(/\s/g, '');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: mailUser,
    pass: mailPassword
  }
});

const isAuthenticationError = error =>
  error?.code === 'EAUTH' || Number(error?.responseCode) === 535;

exports.sendOtpEmail = async (to, otp) => {
  if (!mailUser || !mailPassword) {
    throw new Error('Email service is not configured');
  }

  try {
    await transporter.sendMail({
      from: `"NomadStudio" <${mailUser}>`,
      to,
      subject: 'Password Reset OTP',
      html: `
        <p>Your OTP for password reset is:</p>
        <h2>${otp}</h2>
        <p>This OTP is valid for 10 minutes.</p>
      `
    });
  } catch (error) {
    if (isAuthenticationError(error)) {
      const authenticationError = new Error('Email service authentication failed');
      authenticationError.code = 'MAIL_AUTH_FAILED';
      throw authenticationError;
    }
    throw error;
  }
};
