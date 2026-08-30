const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  serviceType: { type: String, required: true },
  quantity: { type: Number, required: true },
  pricePerUnit: { type: Number, required: true },
  amountCharged: { type: Number, required: true },
  notes: { type: String }
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceType: {
      type: String,
      enum: ['Business', 'Customer'],
      default: 'Business',
      required: true
    },
    userName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    gstNumber: {
      type: String,
      default: null,
      uppercase: true,
      trim: true,
      required() {
        return this.invoiceType === 'Business';
      }
    },
    emailId: { type: String, required: true, trim: true },
    address: { type: String, trim: true },

    services: { type: [serviceSchema], required: true },

    subTotal: { type: Number, required: true },
    cgstAmount: { type: Number, required: true },
    sgstAmount: { type: Number, required: true },
    roundOff: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    receivedAmount: { type: Number, required: true },
    modeOfPayment: {
      type: String,
      required: true,
      enum: ['Online', 'Cash']
    },
    balanceAmount: { type: Number, required: true },

    ownerDetails: {
      companyName: String,
      ownerName: String,
      phoneNumber: String,
      emailId: String,
      gstNumber: String,
      address: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
