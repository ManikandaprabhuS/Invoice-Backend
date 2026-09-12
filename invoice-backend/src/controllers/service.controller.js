const Service = require('../models/Service');

const parseAmount = value => {
  if (value === undefined || value === null || value === '') return 0;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0
    ? Math.round((amount + Number.EPSILON) * 100) / 100
    : null;
};

const sendError = (res, error) => {
  if (error.code === 11000) {
    return res.status(409).json({ message: 'Service already exists' });
  }

  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid service data' });
  }

  return res.status(500).json({ message: 'Server error' });
};

exports.createService = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: 'Service name is required' });
    const amount = parseAmount(req.body.amount);
    if (amount === null) return res.status(400).json({ message: 'Service amount must be a valid non-negative number' });

    const service = await Service.create({ name, amount });
    return res.status(201).json(service);
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getServices = async (_req, res) => {
  try {
    const services = await Service.find().sort({ name: 1 });
    return res.json(services);
  } catch (error) {
    return sendError(res, error);
  }
};

exports.updateService = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: 'Service name is required' });
    const update = { name };
    if (Object.prototype.hasOwnProperty.call(req.body, 'amount')) {
      const amount = parseAmount(req.body.amount);
      if (amount === null) return res.status(400).json({ message: 'Service amount must be a valid non-negative number' });
      update.amount = amount;
    }

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!service) return res.status(404).json({ message: 'Service not found' });
    return res.json(service);
  } catch (error) {
    return sendError(res, error);
  }
};

exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    return res.json({ message: 'Service deleted' });
  } catch (error) {
    return sendError(res, error);
  }
};
