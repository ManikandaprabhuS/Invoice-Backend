const Service = require('../models/Service');

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

    const service = await Service.create({ name });
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

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { name },
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
