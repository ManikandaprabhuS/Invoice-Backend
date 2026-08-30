const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const LoginModel = require('../models/login');
const { generateOtp, hashOtp } = require('../utils/otp');
const { sendOtpEmail } = require('../utils/mailer');
const crypto = require('crypto');

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
    const { emailId } = req.body;

    const user = await LoginModel.findOne({ emailId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOtp();
    user.resetOtpHash = hashOtp(otp);
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000; // 10 min

    await user.save();

    await sendOtpEmail(emailId, otp);

    res.json({ message: 'OTP sent to email' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};


exports.resetPassword = async (req, res) => {
  try {
    const { emailId, otp, newPassword } = req.body;

    const user = await LoginModel.findOne({ emailId });
    if (!user) return res.status(400).json({ message: 'Invalid request' });

    if (!user.resetOtpExpires || user.resetOtpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    if (hashedOtp !== user.resetOtpHash) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtpHash = null;
    user.resetOtpExpires = null;

    await user.save();

    res.json({ message: 'Password updated successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Reset failed' });
  }
};
