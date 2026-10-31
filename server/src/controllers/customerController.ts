import { Request, Response } from 'express';
import { Customer } from '../models/Customer.js';
import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/auditLogger.js';

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, churnRiskLevel, search, page = 1, limit = 20 } = req.query;
    const filter: any = {};

    if (status && status !== 'all') filter.status = status;
    if (churnRiskLevel && churnRiskLevel !== 'all') filter.churnRiskLevel = churnRiskLevel;

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: String(search), $options: 'i' } },
          { email: { $regex: String(search), $options: 'i' } },
        ],
      }).select('_id');

      const userIds = users.map((u) => u._id);

      filter.$or = [
        { customerId: { $regex: String(search), $options: 'i' } },
        { companyName: { $regex: String(search), $options: 'i' } },
        { user: { $in: userIds } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const customers = await Customer.find(filter)
      .populate('user', 'name email phoneNumber avatar lastLogin status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Customer.countDocuments(filter);

    res.json({
      success: true,
      customers,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id).populate('user', 'name email phoneNumber avatar lastLogin createdAt');

    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer record not found.' });
      return;
    }

    const subscriptions = await Subscription.find({ customer: customer._id }).populate('plan');
    const invoices = await Invoice.find({ customer: customer._id }).sort({ createdAt: -1 });
    const payments = await Payment.find({ customer: customer._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      customer,
      subscriptions,
      invoices,
      payments,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { companyName, taxId, billingAddress, currency, notes, status } = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found.' });
      return;
    }

    if (companyName) customer.companyName = companyName;
    if (taxId !== undefined) customer.taxId = taxId;
    if (billingAddress) customer.billingAddress = { ...customer.billingAddress, ...billingAddress };
    if (currency) customer.currency = currency;
    if (notes !== undefined) customer.notes = notes;
    if (status) customer.status = status;

    await customer.save();

    await logAudit({
      user: req.user,
      action: 'CUSTOMER_UPDATED',
      entity: 'User',
      entityId: customer._id.toString(),
      details: { customerId: customer.customerId, companyName: customer.companyName },
      req,
    });

    res.json({
      success: true,
      message: 'Customer details updated successfully.',
      customer,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
