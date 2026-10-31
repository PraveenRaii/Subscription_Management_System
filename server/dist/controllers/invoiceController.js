"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyCouponToInvoice = exports.cancelInvoice = exports.sendInvoiceByEmail = exports.downloadInvoicePdf = exports.getInvoiceById = exports.getInvoices = void 0;
const Invoice_js_1 = require("../models/Invoice.js");
const InvoiceItem_js_1 = require("../models/InvoiceItem.js");
const Customer_js_1 = require("../models/Customer.js");
const Coupon_js_1 = require("../models/Coupon.js");
const auditLogger_js_1 = require("../middleware/auditLogger.js");
const invoicePdfService_js_1 = require("../services/invoicePdfService.js");
const emailService_js_1 = require("../services/emailService.js");
const getInvoices = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 20, startDate, endDate } = req.query;
        const filter = {};
        if (req.user?.role === 'customer') {
            const customer = await Customer_js_1.Customer.findOne({ user: req.user._id });
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
        const invoices = await Invoice_js_1.Invoice.find(filter)
            .populate('subscription customer')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await Invoice_js_1.Invoice.countDocuments(filter);
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
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getInvoices = getInvoices;
const getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice_js_1.Invoice.findById(id).populate('subscription customer');
        if (!invoice) {
            res.status(404).json({ success: false, message: 'Invoice not found.' });
            return;
        }
        // Role check
        if (req.user?.role === 'customer') {
            const customer = await Customer_js_1.Customer.findOne({ user: req.user._id });
            if (!customer || invoice.customer._id.toString() !== customer._id.toString()) {
                res.status(403).json({ success: false, message: 'Unauthorized to view this invoice.' });
                return;
            }
        }
        const items = await InvoiceItem_js_1.InvoiceItem.find({ invoice: invoice._id });
        res.json({
            success: true,
            invoice,
            items,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getInvoiceById = getInvoiceById;
// Download / Stream Invoice PDF
const downloadInvoicePdf = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice_js_1.Invoice.findById(id);
        if (!invoice) {
            res.status(404).json({ success: false, message: 'Invoice not found.' });
            return;
        }
        if (req.user?.role === 'customer') {
            const customer = await Customer_js_1.Customer.findOne({ user: req.user._id });
            if (!customer || invoice.customer.toString() !== customer._id.toString()) {
                res.status(403).json({ success: false, message: 'Unauthorized to download this invoice.' });
                return;
            }
        }
        const items = await InvoiceItem_js_1.InvoiceItem.find({ invoice: invoice._id });
        const pdfBuffer = await (0, invoicePdfService_js_1.generateInvoicePdfBuffer)(invoice, items);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber}.pdf"`);
        res.send(pdfBuffer);
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.downloadInvoicePdf = downloadInvoicePdf;
// Send Invoice to Customer Email
const sendInvoiceByEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice_js_1.Invoice.findById(id);
        if (!invoice) {
            res.status(404).json({ success: false, message: 'Invoice not found.' });
            return;
        }
        const items = await InvoiceItem_js_1.InvoiceItem.find({ invoice: invoice._id });
        const pdfBuffer = await (0, invoicePdfService_js_1.generateInvoicePdfBuffer)(invoice, items);
        await (0, emailService_js_1.sendInvoiceEmail)(invoice, pdfBuffer);
        await (0, auditLogger_js_1.logAudit)({
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
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.sendInvoiceByEmail = sendInvoiceByEmail;
// Cancel / Void Invoice
const cancelInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice_js_1.Invoice.findById(id);
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
        await (0, auditLogger_js_1.logAudit)({
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
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.cancelInvoice = cancelInvoice;
// Apply Coupon to Unpaid Invoice
const applyCouponToInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const { couponCode } = req.body;
        const invoice = await Invoice_js_1.Invoice.findById(id);
        if (!invoice) {
            res.status(404).json({ success: false, message: 'Invoice not found.' });
            return;
        }
        if (invoice.status === 'paid') {
            res.status(400).json({ success: false, message: 'Cannot apply coupon to an already paid invoice.' });
            return;
        }
        const coupon = await Coupon_js_1.Coupon.findOne({
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
        }
        else {
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
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.applyCouponToInvoice = applyCouponToInvoice;
