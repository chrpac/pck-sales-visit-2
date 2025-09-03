const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true },
  position: { type: String, trim: true },
  isDecisionMaker: { type: Boolean, default: false },
}, { _id: false });

const fileRefSchema = new mongoose.Schema({
  url: { type: String, trim: true },
  provider: { type: String, trim: true },
  key: { type: String, trim: true },
}, { _id: false });

const visitRecordSchema = new mongoose.Schema({
  // Sales info
  salesUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  salesNameManual: { type: String, trim: true },

  brand: { type: String, enum: ['PCKem', 'Watreat'], required: true },
  visitAt: { type: Date, required: true },

  // Customer info
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: false },

  // Offering details
  jobType: { type: String, enum: ['Chemical Service', 'Project', 'Maintenance', 'Trading'] },
  budgetTHB: { type: Number, min: 0 },
  purpose: { 
    type: String, 
    enum: [
      'แนะนำบริษัท/สินค้า/เก็บข้อมูล',
      'เสนอสินค้า/บริการ',
      'สำรวจ/เก็บข้อมูลเพิ่มเติม',
      'สรุปปิดการขาย/ต่อรองราคา',
      'ติดตามใบเสนอราคา/ข้อเสนอ',
      'เข้าพบเพื่อสร้างความสัมพันธ์',
      'พูดคุยปัญหา สินค้า/บริการ',
    ],
  },

  // Result section
  productPresented: { type: String, trim: true },
  details: { type: String, trim: true },
  needHelp: { type: String, trim: true },
  winReason: { type: String, trim: true },
  evaluationScore: { type: Number, min: -5, max: 5 },
  nextActionPlan: { type: String, trim: true },
  nextVisitAt: { type: Date },
  photos: { type: [fileRefSchema], default: [], validate: [arr => arr.length <= 3, 'Max 3 photos'] },

  status: { type: String, enum: ['planned', 'in-progress', 'completed', 'cancelled', 'pending'], default: 'completed' },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

visitRecordSchema.index({ visitAt: -1 });
visitRecordSchema.index({ salesUser: 1 });
visitRecordSchema.index({ customer: 1 });
visitRecordSchema.index({ brand: 1 });
visitRecordSchema.index({ status: 1 });

module.exports = mongoose.model('VisitRecord', visitRecordSchema);

