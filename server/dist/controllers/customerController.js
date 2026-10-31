"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCustomer = exports.getCustomerById = exports.getCustomers = void 0;
const Customer_js_1 = require("../models/Customer.js");
const User_js_1 = require("../models/User.js");
const Subscription_js_1 = require("../models/Subscription.js");
const Invoice_js_1 = require("../models/Invoice.js");
const Payment_js_1 = require("../models/Payment.js");
const auditLogger_js_1 = require("../middleware/auditLogger.js");
const getCustomers = async (req, res) => {
    try {
        const { status, churnRiskLevel, search, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (status && status !== 'all')
            filter.status = status;
        if (churnRiskLevel && churnRiskLevel !== 'all')
            filter.churnRiskLevel = churnRiskLevel;
        if (search) {
            const users = await User_js_1.User.find({
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
        const customers = await Customer_js_1.Customer.find(filter)
            .populate('user', 'name email phoneNumber avatar lastLogin status')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await Customer_js_1.Customer.countDocuments(filter);
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
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getCustomers = getCustomers;
const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await Customer_js_1.Customer.findById(id).populate('user', 'name email phoneNumber avatar lastLogin createdAt');
        if (!customer) {
            res.status(404).json({ success: false, message: 'Customer record not found.' });
            return;
        }
        const subscriptions = await Subscription_js_1.Subscription.find({ customer: customer._id }).populate('plan');
        const invoices = await Invoice_js_1.Invoice.find({ customer: customer._id }).sort({ createdAt: -1 });
        const payments = await Payment_js_1.Payment.find({ customer: customer._id }).sort({ createdAt: -1 });
        res.json({
            success: true,
            customer,
            subscriptions,
            invoices,
            payments,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getCustomerById = getCustomerById;
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { companyName, taxId, billingAddress, currency, notes, status } = req.body;
        const customer = await Customer_js_1.Customer.findById(id);
        if (!customer) {
            res.status(404).json({ success: false, message: 'Customer not found.' });
            return;
        }
        if (companyName)
            customer.companyName = companyName;
        if (taxId !== undefined)
            customer.taxId = taxId;
        if (billingAddress)
            customer.billingAddress = { ...customer.billingAddress, ...billingAddress };
        if (currency)
            customer.currency = currency;
        if (notes !== undefined)
            customer.notes = notes;
        if (status)
            customer.status = status;
        await customer.save();
        await (0, auditLogger_js_1.logAudit)({
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
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.updateCustomer = updateCustomer;
