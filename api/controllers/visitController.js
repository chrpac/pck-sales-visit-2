const VisitRecord = require('../models/VisitRecord');
const Customer = require('../models/Customer');
const logger = require('../config/logger');
const ExcelJS = require('exceljs');

// Create visit (with optional inline new customer)
const createVisit = async (req, res, next) => {
  try {
    const body = req.body;

    let customerId = body.customer;
    // If newCustomer provided, create it first
    if (!customerId && body.newCustomer && body.newCustomer.name) {
      const newCustomer = await Customer.create({
        ...body.newCustomer,
        createdBy: req.user._id,
        updatedBy: req.user._id,
      });
      customerId = newCustomer._id;
    }
    // If customerUpdate provided and customer specified, update customer doc
    if (customerId && body.customerUpdate) {
      await Customer.findByIdAndUpdate(customerId, { ...body.customerUpdate, updatedBy: req.user._id }, { new: true, runValidators: true });
    }

    // Prepare visit payload
    const visitPayload = {
      salesUser: body.salesUser || undefined,
      salesNameManual: body.salesNameManual || undefined,
      brand: body.brand,
      visitAt: body.visitAt,

      customer: customerId || undefined,

      jobType: body.jobType,
      budgetTHB: body.budgetTHB,
      purpose: body.purpose,

      productPresented: body.productPresented,
      details: body.details,
      needHelp: body.needHelp,
      winReason: body.winReason,
      evaluationScore: body.evaluationScore,
      nextActionPlan: body.nextActionPlan,
      nextVisitAt: body.nextVisitAt,
      photos: body.photos || [],

      status: body.status || 'completed',
      createdBy: req.user._id,
      updatedBy: req.user._id,
    };

    // No snapshotting; data remains in Customer collection

    // If key fields missing, mark as pending
    const missingKeyFields = !visitPayload.productPresented || !visitPayload.details || !(visitPayload.photos && visitPayload.photos.length > 0);
    if (missingKeyFields) {
      visitPayload.status = 'pending';
    }

    const visit = await VisitRecord.create(visitPayload);
    res.status(201).json({ status: 'success', data: visit });
  } catch (error) {
    logger.error('Create visit error:', error);
    next(error);
  }
};

module.exports = {
  createVisit,
};

// List visits with role-based visibility
module.exports.listVisits = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    // Sales can only see their own
    if (!['admin', 'manager'].includes(req.user.role)) {
      filter.createdBy = req.user._id;
    }

    // Date range filter (inclusive)
    const { startDate, endDate, customerName, status, customerId } = req.query;
    if (startDate || endDate) {
      filter.visitAt = {};
      if (startDate) {
        const s = new Date(startDate);
        if (!isNaN(s.getTime())) filter.visitAt.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        if (!isNaN(e.getTime())) {
          e.setHours(23, 59, 59, 999);
          filter.visitAt.$lte = e;
        }
      }
      if (Object.keys(filter.visitAt).length === 0) delete filter.visitAt;
    }

    if (status) {
      filter.status = status;
    }

    if (customerId) {
      filter.customer = customerId;
    }

    // Build base query
    let q = VisitRecord.find(filter)
      .sort({ visitAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customer', 'name province')
      .populate('salesUser', 'displayName firstName lastName email');

    // Customer name filter (requires lookup of IDs first)
    if (customerName) {
      const nameRegex = new RegExp(customerName, 'i');
      const ids = await Customer.find({ name: nameRegex }).distinct('_id');
      q = VisitRecord.find({ ...filter, customer: { $in: ids } })
        .sort({ visitAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('customer', 'name province')
        .populate('salesUser', 'displayName firstName lastName email');
    }

    const [items, total] = await Promise.all([
      q,
      (async () => {
        if (customerName) {
          const nameRegex = new RegExp(customerName, 'i');
          const ids = await Customer.find({ name: nameRegex }).distinct('_id');
          return VisitRecord.countDocuments({ ...filter, customer: { $in: ids } });
        }
        return VisitRecord.countDocuments(filter);
      })(),
    ]);

    res.status(200).json({
      status: 'success',
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      data: items,
    });
  } catch (error) {
    logger.error('List visits error:', error);
    next(error);
  }
};

// Authorization helper
const canAccessVisit = (user, visit) => {
  if (!visit) return false;
  if (['admin', 'manager'].includes(user.role)) return true;
  return String(visit.createdBy) === String(user._id);
};

// Get visit by id
module.exports.getVisitById = async (req, res, next) => {
  try {
    const visit = await VisitRecord.findById(req.params.id)
      .populate('customer', 'name province contacts businessCard')
      .populate('salesUser', 'displayName firstName lastName email role');
    if (!visit) return res.status(404).json({ status: 'fail', message: 'Visit not found' });
    if (!canAccessVisit(req.user, visit)) {
      return res.status(403).json({ status: 'fail', message: 'Forbidden' });
    }
    res.status(200).json({ status: 'success', data: visit });
  } catch (error) {
    logger.error('Get visit error:', error);
    next(error);
  }
};

// Update visit (owner only)
module.exports.updateVisit = async (req, res, next) => {
  try {
    const visit = await VisitRecord.findById(req.params.id);
    if (!visit) return res.status(404).json({ status: 'fail', message: 'Visit not found' });
    if (!canAccessVisit(req.user, visit)) {
      return res.status(403).json({ status: 'fail', message: 'Forbidden' });
    }

    const payload = { ...req.body, updatedBy: req.user._id };

    // Create or update customer inline
    let customerId = payload.customer || visit.customer;
    if (!customerId && payload.newCustomer && payload.newCustomer.name) {
      const nc = await Customer.create({ ...payload.newCustomer, createdBy: req.user._id, updatedBy: req.user._id });
      customerId = nc._id;
    }
    if (customerId && payload.customerUpdate) {
      await Customer.findByIdAndUpdate(customerId, { ...payload.customerUpdate, updatedBy: req.user._id }, { new: true, runValidators: true });
    }
    payload.customer = customerId;
    delete payload.newCustomer;
    delete payload.customerUpdate;

    // Auto-manage status based on key fields
    const missingKeyFields = !payload.productPresented || !payload.details || !(payload.photos && payload.photos.length > 0);
    if (missingKeyFields) {
      payload.status = 'pending';
    } else {
      // If fields are complete and client didn't explicitly set a status,
      // or current status is pending, mark as completed automatically
      if (!('status' in payload) || visit.status === 'pending') {
        payload.status = 'completed';
      }
    }

    const updated = await VisitRecord.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    logger.error('Update visit error:', error);
    next(error);
  }
};

// Delete visit (owner only)
module.exports.deleteVisit = async (req, res, next) => {
  try {
    const visit = await VisitRecord.findById(req.params.id);
    if (!visit) return res.status(404).json({ status: 'fail', message: 'Visit not found' });
    if (!canAccessVisit(req.user, visit)) {
      return res.status(403).json({ status: 'fail', message: 'Forbidden' });
    }

    await VisitRecord.findByIdAndDelete(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    logger.error('Delete visit error:', error);
    next(error);
  }
};

// Export visits to Excel with filters
module.exports.exportVisits = async (req, res, next) => {
  try {
    // Reuse filter logic from listVisits
    const filter = {};
    if (!['admin', 'manager'].includes(req.user.role)) {
      filter.createdBy = req.user._id;
    }
    const { startDate, endDate, customerName, status, customerId } = req.query;
    if (startDate || endDate) {
      filter.visitAt = {};
      if (startDate) {
        const s = new Date(startDate);
        if (!isNaN(s.getTime())) filter.visitAt.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        if (!isNaN(e.getTime())) {
          e.setHours(23, 59, 59, 999);
          filter.visitAt.$lte = e;
        }
      }
      if (Object.keys(filter.visitAt).length === 0) delete filter.visitAt;
    }
    if (status) filter.status = status;
    if (customerId) filter.customer = customerId;

    let mongoFilter = { ...filter };
    if (customerName) {
      const nameRegex = new RegExp(customerName, 'i');
      const ids = await Customer.find({ name: nameRegex }).distinct('_id');
      mongoFilter = { ...filter, customer: { $in: ids } };
    }

    const visits = await VisitRecord.find(mongoFilter)
      .sort({ visitAt: -1 })
      .populate('customer', 'name province')
      .populate('salesUser', 'displayName firstName lastName email');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Visits');
    sheet.columns = [
      { header: 'วันที่เข้าพบ', key: 'visitAt', width: 20 },
      { header: 'ลูกค้า', key: 'customerName', width: 30 },
      { header: 'จังหวัด', key: 'province', width: 16 },
      { header: 'ลักษณะงาน', key: 'jobType', width: 22 },
      { header: 'พนักงานขาย', key: 'salesName', width: 24 },
      { header: 'สถานะ', key: 'status', width: 14 },
      { header: 'วัตถุประสงค์', key: 'purpose', width: 28 },
      { header: 'รายละเอียด', key: 'details', width: 50 },
    ];

    visits.forEach(v => {
      const salesName = v.salesUser
        ? (v.salesUser.displayName || `${v.salesUser.firstName || ''} ${v.salesUser.lastName || ''}`)
        : (v.salesNameManual || '-');
      sheet.addRow({
        visitAt: new Date(v.visitAt).toLocaleString('th-TH'),
        customerName: v.customer?.name || '-',
        province: v.customer?.province || '-',
        jobType: v.jobType || '-',
        salesName,
        status: v.status,
        purpose: v.purpose || '-',
        details: v.details || '-',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="visits.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.error('Export visits error:', error);
    next(error);
  }
};
