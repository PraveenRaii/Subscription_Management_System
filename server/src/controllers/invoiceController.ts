import { Response } from 'express';
import { Invoice } from '../models/Invoice.js';
import { InvoiceItem } from '../models/InvoiceItem.js';
import { Customer } from '../models/Customer.js';
import { Coupon } from '../models/Coupon.js';
import { AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/auditLogger.js';
import { generateInvoicePdfBuffer } from '../services/invoicePdfService.js';
import { sendInvoiceEmail } from '../services/emailService.js';

export const getInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, search, page = 1, limit = 20, startDate, endDate } = req.query;
    const filter: any = {};

    if (req.user?.role === 'customer') {
      const customer = await Customer.findOne({ user: req.user._id });
      if (!customer) {
        res.json({ success: true, invoices: [], count: 0 });
        return;
      }
      filter.customer = customer._id;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (startDate && endDate) {
      filter.issueDate = { $gte: new Date(String(startDate)), $lte: new Date(String(endDate)) };
    }

    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: String(search), $options: 'i' } },
        { customerName: { $regex: String(search), $options: 'i' } },
        { customerEmail: { $regex: String(search), $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const invoices = await Invoice.find(filter)
      .populate('subscription customer')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Invoice.countDocuments(filter);

    res.json({
      success: true,
      invoices,
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

export const getInvoiceById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id).populate('subscription customer');

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    // Role check
    if (req.user?.role === 'customer') {
      const customer = await Customer.findOne({ user: req.user._id });
      if (!customer || invoice.customer._id.toString() !== customer._id.toString()) {
        res.status(403).json({ success: false, message: 'Unauthorized to view this invoice.' });
        return;
      }
    }

    const items = await InvoiceItem.find({ invoice: invoice._id });

    res.json({
      success: true,
      invoice,
      items,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Download / Stream Invoice PDF
export const downloadInvoicePdf = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    if (req.user?.role === 'customer') {
      const customer = await Customer.findOne({ user: req.user._id });
      if (!customer || invoice.customer.toString() !== customer._id.toString()) {
        res.status(403).json({ success: false, message: 'Unauthorized to download this invoice.' });
        return;
      }
    }

    const items = await InvoiceItem.find({ invoice: invoice._id });
    const pdfBuffer = await generateInvoicePdfBuffer(invoice, items);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Send Invoice to Customer Email
export const sendInvoiceByEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    const items = await InvoiceItem.find({ invoice: invoice._id });
    const pdfBuffer = await generateInvoicePdfBuffer(invoice, items);
    await sendInvoiceEmail(invoice, pdfBuffer);

    await logAudit({
      user: req.user,
      action: 'INVOICE_SENT_EMAIL',
      entity: 'Invoice',
      entityId: invoice._id.toString(),
      details: { invoiceNumber: invoice.invoiceNumber, toEmail: invoice.customerEmail },
      req,
    });

    res.json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} emailed to ${invoice.customerEmail}.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Cancel / Void Invoice
export const cancelInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    if (invoice.status === 'paid') {
      res.status(400).json({ success: false, message: 'Cannot cancel an invoice that has already been paid.' });
      return;
    }

    invoice.status = 'cancelled';
    await invoice.save();

    await logAudit({
      user: req.user,
      action: 'INVOICE_CANCELLED',
      entity: 'Invoice',
      entityId: invoice._id.toString(),
      details: { invoiceNumber: invoice.invoiceNumber },
      req,
    });

    res.json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} has been cancelled.`,
      invoice,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Apply Coupon to Unpaid Invoice
export const applyCouponToInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { couponCode } = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    if (invoice.status === 'paid') {
      res.status(400).json({ success: false, message: 'Cannot apply coupon to an already paid invoice.' });
      return;
    }

    const coupon = await Coupon.findOne({
      code: couponCode.trim().toUpperCase(),
      isActive: true,
      endDate: { $gt: new Date() },
    });

    if (!coupon) {
      res.status(400).json({ success: false, message: 'Invalid or expired promotional coupon code.' });
      return;
    }

    if (coupon.redemptionCount >= coupon.maxRedemptions) {
      res.status(400).json({ success: false, message: 'Coupon redemption limit reached.' });
      return;
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (invoice.subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount > 0 && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = coupon.discountValue;
    }

    discount = Math.min(discount, invoice.subtotal);
    const newSubtotal = invoice.subtotal - discount;
    const newTax = Math.round((newSubtotal * invoice.taxRate) / 100);
    const newTotal = newSubtotal + newTax;

    invoice.discountAmount = discount;
    invoice.discountCode = coupon.code;
    invoice.taxAmount = newTax;
    invoice.totalAmount = newTotal;
    invoice.amountRemaining = newTotal;
    await invoice.save();

    coupon.redemptionCount += 1;
    await coupon.save();

    res.json({
      success: true,
      message: `Coupon ${coupon.code} applied! Saved ${invoice.currency} ${discount}.`,
      invoice,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
