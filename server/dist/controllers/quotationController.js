"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateQuotationStatus = exports.createQuotation = exports.getQuotations = void 0;
const Quotation_js_1 = require("../models/Quotation.js");
const Customer_js_1 = require("../models/Customer.js");
const auditLogger_js_1 = require("../middleware/auditLogger.js");
const getQuotations = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (req.user?.role === 'customer') {
            const customer = await Customer_js_1.Customer.findOne({ user: req.user._id });
            if (!customer) {
                res.json({ success: true, quotations: [], count: 0 });
                return;
            }
            filter.customer = customer._id;
        }
        if (status && status !== 'all') {
            filter.status = status;
        }
        if (search) {
            filter.$or = [
                { quotationNumber: { $regex: String(search), $options: 'i' } },
                { customerName: { $regex: String(search), $options: 'i' } },
                { companyName: { $regex: String(search), $options: 'i' } },
            ];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const quotations = await Quotation_js_1.Quotation.find(filter)
            .populate('customer createdBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await Quotation_js_1.Quotation.countDocuments(filter);
        res.json({
            success: true,
            quotations,
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
exports.getQuotations = getQuotations;
const createQuotation = async (req, res) => {
    try {
        const { customerName, customerEmail, companyName, items, currency = 'INR', validDays = 30, templateName, termsAndConditions, notes, } = req.body;
        if (!customerName || !customerEmail || !items || items.length === 0) {
            res.status(400).json({ success: false, message: 'Customer details and at least one item are required.' });
            return;
        }
        let subtotal = 0;
        const computedItems = items.map((it) => {
            const lineTotal = (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0) - (Number(it.discount) || 0);
            subtotal += lineTotal;
            return {
                name: it.name,
                description: it.description || '',
                quantity: Number(it.quantity) || 1,
                unitPrice: Number(it.unitPrice) || 0,
                discount: Number(it.discount) || 0,
                total: lineTotal,
            };
        });
        const taxRate = 18;
        const taxAmount = Math.round((subtotal * taxRate) / 100);
        const grandTotal = subtotal + taxAmount;
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + (Number(validDays) || 30));
        const quotationNumber = `QT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
        const quotation = await Quotation_js_1.Quotation.create({
            quotationNumber,
            customerName,
            customerEmail,
            companyName: companyName || '',
            items: computedItems,
            subtotal,
            taxRate,
            taxAmount,
            discountAmount: 0,
            grandTotal,
            currency,
            validUntil,
            status: 'draft',
            templateName: templateName || 'Standard Enterprise SaaS Quotation',
            termsAndConditions: termsAndConditions ||
                '1. Quotation valid for 30 days.\n2. Invoicing begins upon onboarding.\n3. Net-15 payment terms apply.',
            notes: notes || '',
            createdBy: req.user?._id,
        });
        await (0, auditLogger_js_1.logAudit)({
            user: req.user,
            action: 'QUOTATION_CREATED',
            entity: 'Setting',
            entityId: quotation._id.toString(),
            details: { quotationNumber, grandTotal, customerEmail },
            req,
        });
        res.status(201).json({
            success: true,
            message: 'Quotation created successfully.',
            quotation,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.createQuotation = createQuotation;
const updateQuotationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const quotation = await Quotation_js_1.Quotation.findById(id);
        if (!quotation) {
            res.status(404).json({ success: false, message: 'Quotation not found.' });
            return;
        }
        quotation.status = status;
        await quotation.save();
        await (0, auditLogger_js_1.logAudit)({
            user: req.user,
            action: 'QUOTATION_STATUS_UPDATED',
            entity: 'Setting',
            entityId: quotation._id.toString(),
            details: { quotationNumber: quotation.quotationNumber, newStatus: status },
            req,
        });
        res.json({
            success: true,
            message: `Quotation status updated to ${status}.`,
            quotation,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.updateQuotationStatus = updateQuotationStatus;
