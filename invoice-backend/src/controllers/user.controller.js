const User = require('../models/User');

const normalizePhone = value => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
};

exports.findUserByBusinessDetails = async (req, res) => {
  try {
    const phoneNumber = req.query.phoneNumber?.trim();
    const phoneLookupKey = normalizePhone(phoneNumber);
    const gstNumber = req.query.gstNumber?.trim().toUpperCase();
    const matches = [];
    if (phoneNumber) matches.push({ phoneNumber });
    if (phoneLookupKey) matches.push({ phoneLookupKey });
    if (gstNumber) matches.push({ gstNumber });
    if (!matches.length) {
      return res.status(400).json({ message: 'Phone number or GST number is required' });
    }

    let user = await User.findOne({ $or: matches });
    if (!user && phoneLookupKey) {
      const legacyUsers = await User.find({ phoneNumber: { $exists: true, $ne: '' } });
      user = legacyUsers.find(item => normalizePhone(item.phoneNumber) === phoneLookupKey) || null;
    }
    if (!user) return res.status(404).json({ message: 'No matching client found' });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// CREATE
exports.createUser = async (req, res) => {
  try {   
  const payload = {
    ...req.body,
    phoneLookupKey: normalizePhone(req.body.phoneNumber),
    gstNumber: req.body.gstNumber?.trim().toUpperCase()
  };
  const user = await User.create(payload);
  console.log('[CREATE USER] Created:', user); // ✅ log output
  res.json(user);
  } catch (err) {
    console.error(err);
    console.log('[CREATE USER] Error Creating User:', err); // ✅ log error
    if (err.name === 'ZodError') return res.status(400).json({ message: 'Validation failed Or Create User Failed Or server error', errors: err.issues });
    return res.status(500).json({ message: 'Server error' });
  }
};

// READ ALL
exports.getUsers = async (req, res) => {
  try{
  const users = await User.find();
  console.log('[GET USERS] Retrieved:', users); // ✅ log output
  res.json(users);
  } catch (err) {
    console.error(err);
    console.log('[GET USERS] Error Fetching Users:', err); // ✅ log error
    return res.status(500).json({ message: 'Server error' });
  }
};

// READ ONE
exports.getUserById = async (req, res) => {
  try{
  const user = await User.findById(req.params.id);
  console.log('[GET USER BY ID] Payload:', req.params.id); // ✅ log input
  if (!user) return res.status(404).json({ message: 'Not found' });
  res.json(user);
  } catch (err) {
    console.error(err);
    console.log('[GET USER BY ID] Error Fetching User :', err); // ✅ log error
    return res.status(500).json({ message: 'Server error' });
  } 
};

// READ ONE
exports.getUserById = async (req, res) => {
  try{
  const user = await User.findById(req.params.id);
  console.log('[GET USER BY ID] Payload:', req.params.id); // ✅ log input
  if (!user) return res.status(404).json({ message: 'Not found' });
  res.json(user); 
  } catch (err) {
    console.error(err);
    console.log('[GET USER BY ID] Error Fetching User :', err); // ✅ log error
    return res.status(500).json({ message: 'Server error' });
  } 
};

// UPDATE
exports.updateUser = async (req, res) => {
  console.log('[UPDATE USER] Payload:', req.params.id, req.body); // ✅ log input
  try{
  if (req.body.phoneNumber !== undefined) {
    req.body.phoneLookupKey = normalizePhone(req.body.phoneNumber);
  }
  if (req.body.gstNumber) req.body.gstNumber = req.body.gstNumber.trim().toUpperCase();
  const user = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  console.log('[UPDATE USER] Updated:', user); // ✅ log output
  res.json(user);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ message: 'Validation failed or Update Failed', errors: err.issues });
    return res.status(500).json({ message: 'Server error' });
  }       
};

// DELETE
exports.deleteUser = async (req, res) => {
  try{
  await User.findByIdAndDelete(req.params.id);
  console.log('[DELETE USER] Payload:', req.params.id); // ✅ log input
  res.json({ message: 'Deleted' });
  console.log('[DELETE USER] Deleted:', req.params.id); // ✅ log output
  } catch (err) {
    console.error(err);
    console.log('[DELETE USER] Error Deleting User :', err); // ✅ log error
    return res.status(500).json({ message: 'Server error' });
  } 
};
