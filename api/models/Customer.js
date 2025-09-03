const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true },
  phone: { type: String, trim: true },
  position: { type: String, trim: true },
  isDecisionMaker: { type: Boolean, default: false },
}, { _id: false });

const fileRefSchema = new mongoose.Schema({
  url: { type: String, trim: true },
  provider: { type: String, trim: true },
  key: { type: String, trim: true },
}, { _id: false });

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  province: { type: String, trim: true },
  contacts: { type: [contactSchema], default: [] },
  businessCard: fileRefSchema,
  currentProviderBrand: { type: String, trim: true },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

customerSchema.index({ name: 1 }, { unique: true });
customerSchema.index({ province: 1 });

module.exports = mongoose.model('Customer', customerSchema);

