const Invoice = require('../models/Invoice');
const User = require('../models/User');

const normalizePhone = value => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
};

const saveClientDetails = async invoice => {
  const phoneLookupKey = normalizePhone(invoice.phoneNumber);
  const gstNumber = String(invoice.gstNumber || '').trim().toUpperCase();
  const directMatches = [];
  if (phoneLookupKey) directMatches.push({ phoneLookupKey });
  if (invoice.phoneNumber) directMatches.push({ phoneNumber: invoice.phoneNumber });
  if (gstNumber) directMatches.push({ gstNumber });

  let client = directMatches.length ? await User.findOne({ $or: directMatches }) : null;
  if (!client && phoneLookupKey) {
    const legacyClients = await User.find({ phoneNumber: { $exists: true, $ne: '' } });
    client = legacyClients.find(item => normalizePhone(item.phoneNumber) === phoneLookupKey) || null;
  }

  const clientDetails = {
    userName: invoice.userName,
    phoneNumber: invoice.phoneNumber,
    phoneLookupKey,
    emailId: invoice.emailId || '',
    address: invoice.address || ''
  };

  const clientUpdate = { $set: clientDetails };
  if (invoice.invoiceType === 'Customer') {
    // Do not erase a GST number already known for a returning business client.
    // New clients created here explicitly store GST as null.
    if (!client) clientUpdate.$setOnInsert = { gstNumber: null };
  } else {
    clientUpdate.$set.gstNumber = gstNumber;
  }

  const clientFilter = client?._id
    ? { _id: client._id }
    : phoneLookupKey
      ? { phoneLookupKey }
      : { gstNumber };

  const savedClient = await User.findOneAndUpdate(
    clientFilter,
    clientUpdate,
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  );

  if (!savedClient) {
    throw new Error('Client details could not be saved');
  }

  return savedClient;
};

const roundCurrency = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const roundFinalAmount = value => {
  const wholeAmount = Math.floor(value);
  const decimalAmount = roundCurrency(value - wholeAmount);
  return decimalAmount <= 0.5 ? wholeAmount : wholeAmount + 1;
};

const calculateInvoiceAmounts = invoice => {
  if (invoice.services && invoice.services.length > 0) {
    invoice.services = invoice.services.map(service => ({
      ...service,
      amountCharged: roundCurrency(
        Number(service.quantity || 0) * Number(service.pricePerUnit || 0)
      )
    }));
    invoice.subTotal = roundCurrency(invoice.services.reduce(
      (sum, service) => sum + Number(service.amountCharged || 0),
      0
    ));
    invoice.cgstAmount = roundCurrency(invoice.subTotal * 0.09);
    invoice.sgstAmount = roundCurrency(invoice.subTotal * 0.09);
    const totalBeforeRoundOff = roundCurrency(
      invoice.subTotal + invoice.cgstAmount + invoice.sgstAmount
    );
    invoice.totalAmount = roundFinalAmount(totalBeforeRoundOff);
    invoice.roundOff = roundCurrency(invoice.totalAmount - totalBeforeRoundOff);
  }

  const totalAmount = Number(invoice.totalAmount);
  const receivedAmount = Number(invoice.receivedAmount);
  if (Number.isFinite(totalAmount)) invoice.totalAmount = totalAmount;
  if (Number.isFinite(receivedAmount)) invoice.receivedAmount = receivedAmount;
  if (Number.isFinite(totalAmount) && Number.isFinite(receivedAmount)) {
    invoice.balanceAmount = totalAmount - receivedAmount;
  }
  return invoice;
};

const addClientDetails = async invoices => {
  const clients = await User.find({}).lean();
  const clientsByPhone = new Map(clients.map(client => [normalizePhone(client.phoneNumber), client]));
  const clientsByGst = new Map(clients.map(client => [client.gstNumber, client]));

  return invoices.map(invoice => {
    const client = clientsByPhone.get(normalizePhone(invoice.phoneNumber)) || clientsByGst.get(invoice.gstNumber);
    return {
      ...invoice,
      invoiceType: invoice.invoiceType || 'Business',
      gstNumber: invoice.invoiceType === 'Customer' ? null : invoice.gstNumber || client?.gstNumber || '',
      emailId: invoice.emailId || client?.emailId || '',
      address: invoice.address || client?.address || ''
    };
  });
};

// CREATE
exports.createInvoice = async (req, res) => {
  try {
    console.log('[CREATE INVOICE] Payload:', req.body); // ✅ log input
    const invoice = calculateInvoiceAmounts({ ...req.body });
    invoice.invoiceType = invoice.invoiceType === 'Customer' ? 'Customer' : 'Business';

    // minimal validation
    if (!invoice.services || invoice.services.length === 0) {
      console.log('[CREATE INVOICE] Services Missing:', req.body); // ✅ log input
      return res.status(400).json({ message: 'Services required' });
    }
    if (!invoice.userName?.trim() || !invoice.phoneNumber?.trim() || !invoice.emailId?.trim()) {
      return res.status(400).json({
        message: 'Client name, phone number and email ID are required'
      });
    }
    if (invoice.invoiceType === 'Business' && !invoice.gstNumber?.trim()) {
      return res.status(400).json({ message: 'GST number is required for a Business Invoice' });
    }
    if (!['Online', 'Cash'].includes(invoice.modeOfPayment)) {
      return res.status(400).json({ message: 'Payment mode must be Online or Cash' });
    }

    invoice.userName = invoice.userName.trim();
    invoice.phoneNumber = invoice.phoneNumber.trim();
    invoice.gstNumber = invoice.invoiceType === 'Customer'
      ? null
      : invoice.gstNumber.trim().toUpperCase();
    invoice.emailId = invoice.emailId.trim();
    invoice.address = invoice.address?.trim() || '';

    const savedClient = await saveClientDetails(invoice);
    console.log('[CREATE INVOICE] Client details saved:', savedClient._id);
    const savedInvoice = await Invoice.create(invoice);
    console.log('[CREATE INVOICE] Created:', savedInvoice); // ✅ log output
    res.status(201).json(savedInvoice);

  } catch (err) {
    console.error(err);
    console.log('[CREATE INVOICE] Error Creating Invoice :', err); // ✅ log error
    res.status(500).json({ message: 'Failed to create invoice' });
  }
};

// LIST
exports.getInvoices = async (req, res) => {
  try {
    console.log('[GET INVOICES] Payload:', req.body); // ✅ log input
    const invoices = await Invoice.find().sort({ createdAt: -1 }).lean();
    const calculatedInvoices = invoices.map(calculateInvoiceAmounts);
    res.json(await addClientDetails(calculatedInvoices));
  } catch (err) {
    console.error(err);
    console.log('[GET INVOICES] Error Fetching Invoices :', err); // ✅ log error
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET SINGLE INVOICE
exports.getInvoiceById = async (req, res) => {
  try {
    console.log('[GET INVOICE BY ID] Payload:', req.params.id); // ✅ log input
    const invoice = await Invoice.findById(req.params.id).lean();
    if (!invoice) {
      console.warn('[GET INVOICE BY ID] Invoice Not Found:', req.params.id); // ✅ log error
      return res.status(404).json({ message: 'Invoice not found' });
    }
    const [invoiceWithClient] = await addClientDetails([calculateInvoiceAmounts(invoice)]);
    res.json(invoiceWithClient);
  } catch (err) {
    console.error(err);
    console.log('[GET INVOICE BY ID] Error Fetching Invoice :', err); // ✅ log error
    return res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE
exports.updateInvoice = async (req, res) => {
  try {
    console.log('[UPDATE INVOICE] Payload:', req.params.id, req.body); // ✅ log input
    const currentInvoice = await Invoice.findById(req.params.id).lean();
    if (!currentInvoice) {
      console.warn('[UPDATE INVOICE] Invoice Not Found:', req.params.id); // ✅ log error
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const recalculatedInvoice = calculateInvoiceAmounts({ ...currentInvoice, ...req.body });
    req.body.subTotal = recalculatedInvoice.subTotal;
    req.body.cgstAmount = recalculatedInvoice.cgstAmount;
    req.body.sgstAmount = recalculatedInvoice.sgstAmount;
    req.body.roundOff = recalculatedInvoice.roundOff;
    req.body.totalAmount = recalculatedInvoice.totalAmount;
    req.body.receivedAmount = recalculatedInvoice.receivedAmount;
    req.body.balanceAmount = recalculatedInvoice.balanceAmount;
    
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    const invoiceType = invoice.invoiceType || 'Business';
    if (invoice.userName && invoice.phoneNumber && invoice.emailId &&
      (invoiceType === 'Customer' || invoice.gstNumber)) {
      await saveClientDetails(invoice);
    }
    
    res.json(invoice);
  } catch (err) {
    if (err.name === 'ZodError') {
      console.warn('[UPDATE INVOICE] Validation Failed:', err.issues); // ✅ log error
      return res.status(400).json({ 
        message: 'Validation failed or Update Failed', 
        errors: err.issues 
      });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: err.message 
      });
    }
    console.error(err);
    console.log('[UPDATE INVOICE] Error Updating Invoice or server error:', err); // ✅ log error
    return res.status(500).json({ message: 'Server error' });
  } 
};

// DELETE
exports.deleteInvoice = async (req, res) => {
  try {
    console.log('[DELETE INVOICE] Payload:', req.params.id); // ✅ log input
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    
    if (!invoice) {
      console.warn('[DELETE INVOICE] Invoice Not Found:', req.params.id); // ✅ log error
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    res.json({ message: 'Invoice deleted successfully' });
    console.log('[DELETE INVOICE] Deleted:', invoice); // ✅ log output
  } catch (err) {
    console.error(err);
    console.log('[DELETE INVOICE] Error Deleting Invoice or server error:', err); // ✅ log error
    return res.status(500).json({ message: 'Server error' });
  }
};
