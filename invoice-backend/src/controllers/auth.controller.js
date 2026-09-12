const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const LoginModel = require('../models/login');
const { generateOtp, generateResetToken, hashOtp, hashResetToken } = require('../utils/otp');
const { sendOtpEmail } = require('../utils/mailer');
const crypto = require('crypto');
const mongoose = require('mongoose');

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const RESET_TOKEN_EXPIRY_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const normalizeEmail = value => String(value || '').trim().toLowerCase();
const isValidEmail = emailId => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailId);
const safelyMatches = (actualHash, expectedHash) => {
  if (!actualHash || !expectedHash) return false;
  const actual = Buffer.from(actualHash, 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};

const clearOtp = user => {
  user.resetOtpHash = undefined;
  user.resetOtpExpires = undefined;
  user.resetOtpAttempts = 0;
};

const clearResetToken = user => {
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
};

exports.register = async (req, res) => {
  try{
  const { userName, emailId,password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  await LoginModel.create({ userName: userName, emailId: emailId, password: hash });
  res.json({ message: 'Registered' });
  console.log('Registered');
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ message: 'Validation failed', errors: err.issues });
    if (err.code === 11000) return res.status(400).json({ message: 'Username or email already exists' });
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const userName = req.body.userName?.trim();
    const { password } = req.body;

    if (!userName || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const login = await LoginModel.findOne({ userName });
    if (!login) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, login.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
 
    const token = jwt.sign(
    { id: login._id, role: login.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

    res.json({
    token,
    user: {
      id: login._id,
      userName: login.userName,
      role: login.role
    }
  });

  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ message: 'Validation failed', errors: err.issues });
    return res.status(500).json({ message: 'Server error' });
  }
}

exports.createUser = async (req, res) => {
  try {
    const userName = req.body.userName?.trim();
    const emailId = req.body.emailId?.trim().toLowerCase();
    const branchName = req.body.branchName?.trim();
    const { password } = req.body;

    if (!userName || !emailId || !branchName || !password) {
      return res.status(400).json({ message: 'Username, email, branch, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const user = await LoginModel.create({
      userName,
      emailId,
      branchName,
      password: await bcrypt.hash(password, 10),
      role: 'user'
    });

    return res.status(201).json({
      _id: user._id,
      id: user._id,
      userName: user.userName,
      emailId: user.emailId,
      branchName: user.branchName,
      role: user.role
    });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Username or email already exists' });
    return res.status(500).json({ message: 'Unable to create user' });
  }
};
exports.getUsers = async (_req, res) => {
  try {
    const users = await LoginModel.find()
      .select('userName emailId branchName role createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return res.json(users);
  } catch (_err) {
    return res.status(500).json({ message: 'Unable to load users' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user account' });
    }

    const user = await LoginModel.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User account not found' });

    if (user.role !== 'user') {
      return res.status(400).json({ message: 'Administrator accounts cannot be deleted' });
    }

    await user.deleteOne();
    return res.json({ message: 'User account deleted' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid user account' });
    return res.status(500).json({ message: 'Unable to delete user' });
  }
};
exports.forgotPassword = async (req, res) => {
  try {
    const emailId = normalizeEmail(req.body.emailId);
    if (!isValidEmail(emailId)) return res.status(400).json({ message: 'A valid email address is required' });

    const user = await LoginModel.findOne({ emailId });
    if (!user) {
      return res.json({ message: 'If this email is registered, an OTP has been sent' });
    }

    const otp = generateOtp();
    user.resetOtpHash = hashOtp(emailId, otp);
    user.resetOtpExpires = new Date(Date.now() + OTP_EXPIRY_MS);
    user.resetOtpAttempts = 0;
    clearResetToken(user);

    await user.save();
    try {
      await sendOtpEmail(emailId, otp);
    } catch (error) {
      clearOtp(user);
      await user.save();
      throw error;
    }

    return res.json({ message: 'If this email is registered, an OTP has been sent' });

  } catch (err) {
    if (err.code === 'MAIL_AUTH_FAILED') {
      console.error('[FORGOT PASSWORD] Gmail rejected MAIL_USER/MAIL_PASS. Generate a new Google App Password for the configured MAIL_USER account.');
      return res.status(503).json({
        message: 'OTP email service is not authenticated. Please update the server email credentials and try again.'
      });
    }
    console.error('[FORGOT PASSWORD] OTP delivery failed:', err.message);
    return res.status(500).json({ message: 'Failed to send OTP' });
  }
};

exports.verifyResetOtp = async (req, res) => {
  try {
    const emailId = normalizeEmail(req.body.emailId);
    const otp = String(req.body.otp || '').trim();
    if (!isValidEmail(emailId) || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'A valid email and 6-digit OTP are required' });
    }

    const user = await LoginModel.findOne({ emailId });
    if (!user || !user.resetOtpHash || !user.resetOtpExpires) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    if (user.resetOtpExpires.getTime() < Date.now()) {
      clearOtp(user);
      await user.save();
      return res.status(400).json({ message: 'OTP expired. Request a new OTP' });
    }

    const otpMatches = safelyMatches(hashOtp(emailId, otp), user.resetOtpHash);
    if (!otpMatches) {
      user.resetOtpAttempts = Number(user.resetOtpAttempts || 0) + 1;
      if (user.resetOtpAttempts >= MAX_OTP_ATTEMPTS) clearOtp(user);
      await user.save();
      return res.status(400).json({
        message: user.resetOtpHash ? 'Invalid OTP' : 'Too many attempts. Request a new OTP'
      });
    }

    const resetToken = generateResetToken();
    user.resetTokenHash = hashResetToken(resetToken);
    user.resetTokenExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
    clearOtp(user);
    await user.save();

    return res.json({ message: 'OTP verified', resetToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'OTP verification failed' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const emailId = normalizeEmail(req.body.emailId);
    const resetToken = String(req.body.resetToken || '').trim();
    const newPassword = String(req.body.newPassword || '');
    const confirmPassword = String(req.body.confirmPassword || '');

    if (!isValidEmail(emailId) || !resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password reset fields are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const user = await LoginModel.findOne({ emailId });
    if (!user || !user.resetTokenHash || !user.resetTokenExpires ||
      user.resetTokenExpires.getTime() < Date.now() ||
      !safelyMatches(hashResetToken(resetToken), user.resetTokenHash)) {
      return res.status(400).json({ message: 'Password reset session is invalid or expired' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    clearOtp(user);
    clearResetToken(user);

    await user.save();

    return res.json({ message: 'Password updated successfully' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Reset failed' });
  }
};
