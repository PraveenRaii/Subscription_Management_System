"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordUsage = exports.addTeamMember = exports.cancelSubscription = exports.changePlan = exports.renewSubscription = exports.resumeSubscription = exports.pauseSubscription = exports.createSubscription = exports.getSubscriptionById = exports.getSubscriptions = void 0;
const Subscription_js_1 = require("../models/Subscription.js");
const Plan_js_1 = require("../models/Plan.js");
const Customer_js_1 = require("../models/Customer.js");
const Invoice_js_1 = require("../models/Invoice.js");
const InvoiceItem_js_1 = require("../models/InvoiceItem.js");
const UsageRecord_js_1 = require("../models/UsageRecord.js");
const auditLogger_js_1 = require("../middleware/auditLogger.js");
const invoicePdfService_js_1 = require("../services/invoicePdfService.js");
const emailService_js_1 = require("../services/emailService.js");
const getSubscriptions = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;
        const filter = {};
        // Customer can only view their own
        if (req.user?.role === 'customer') {
            const customer = await Customer_js_1.Customer.findOne({ user: req.user._id });
            if (!customer) {
                res.json({ success: true, subscriptions: [], count: 0 });
                return;
            }
            filter.customer = customer._id;
        }
        if (status && status !== 'all') {
            filter.status = status;
        }
        if (search) {
            filter.$or = [
                { subscriptionId: { $regex: String(search), $options: 'i' } },
            ];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const subscriptions = await Subscription_js_1.Subscription.find(filter)
            .populate('customer plan')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await Subscription_js_1.Subscription.countDocuments(filter);
        res.json({
            success: true,
            subscriptions,
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
exports.getSubscriptions = getSubscriptions;
const getSubscriptionById = async (req, res) => {
    try {
        const { id } = req.params;
        const subscription = await Subscription_js_1.Subscription.findById(id).populate({
            path: 'customer',
            populate: { path: 'user', select: 'name email phoneNumber' },
        }).populate('plan');
        if (!subscription) {
            res.status(404).json({ success: false, message: 'Subscription not found.' });
            return;
        }
        // Authorization check
        if (req.user?.role === 'customer') {
            const customer = await Customer_js_1.Customer.findOne({ user: req.user._id });
            if (!customer || subscription.customer._id.toString() !== customer._id.toString()) {
                res.status(403).json({ success: false, message: 'Unauthorized to view this subscription.' });
                return;
            }
        }
        // Invoices and Usage history
        const invoices = await Invoice_js_1.Invoice.find({ subscription: subscription._id }).sort({ createdAt: -1 });
        const usageRecords = await UsageRecord_js_1.UsageRecord.find({ subscription: subscription._id }).sort({ recordedAt: -1 }).limit(10);
        res.json({
            success: true,
            subscription,
            invoices,
            usageRecords,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getSubscriptionById = getSubscriptionById;
// Create / Activate New Subscription
const createSubscription = async (req, res) => {
    try {
        const { planId, customerId, billingFrequency, quantity = 1, seatCount = 1, autoRenew = true } = req.body;
        const plan = await Plan_js_1.Plan.findById(planId);
        if (!plan) {
            res.status(404).json({ success: false, message: 'Selected plan not found.' });
            return;
        }
        let customerDoc;
        if (req.user?.role === 'customer') {
            customerDoc = await Customer_js_1.Customer.findOne({ user: req.user._id });
        }
        else {
            customerDoc = await Customer_js_1.Customer.findById(customerId);
        }
        if (!customerDoc) {
            res.status(404).json({ success: false, message: 'Customer account not found.' });
            return;
        }
        // Pricing calculation
        const currency = customerDoc.currency || 'INR';
        let basePrice = currency === 'USD' ? plan.priceUSD : currency === 'EUR' ? plan.priceEUR : plan.priceINR;
        if (plan.isTeamPlan && seatCount > plan.minSeats) {
            basePrice += (seatCount - plan.minSeats) * plan.seatPrice;
        }
        const subtotal = basePrice * Number(quantity);
        const taxRate = 18; // 18% standard GST
        const taxAmount = Math.round((subtotal * taxRate) / 100);
        const totalAmount = subtotal + taxAmount;
        // Period calculation
        const startDate = new Date();
        const periodEnd = new Date(startDate);
        const frequency = billingFrequency || plan.billingFrequency || 'monthly';
        switch (frequency) {
            case 'daily':
                periodEnd.setDate(periodEnd.getDate() + 1);
                break;
            case 'weekly':
                periodEnd.setDate(periodEnd.getDate() + 7);
                break;
            case 'yearly':
                periodEnd.setFullYear(periodEnd.getFullYear() + 1);
                break;
            case 'monthly':
            default:
                periodEnd.setMonth(periodEnd.getMonth() + 1);
                break;
        }
        const subscriptionId = `SUB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const subscription = await Subscription_js_1.Subscription.create({
            subscriptionId,
            customer: customerDoc._id,
            plan: plan._id,
            status: 'active',
            billingFrequency: frequency,
            currency,
            quantity: Number(quantity),
            seatCount: Number(seatCount),
            unitPrice: basePrice,
            taxRate,
            taxAmount,
            totalAmount,
            startDate,
            currentPeriodStart: startDate,
            currentPeriodEnd: periodEnd,
            renewalDate: periodEnd,
            autoRenew: autoRenew !== undefined ? autoRenew : true,
        });
        // Auto-generate First Invoice
        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + 5);
        const invoice = await Invoice_js_1.Invoice.create({
            invoiceNumber,
            subscription: subscription._id,
            customer: customerDoc._id,
            customerName: customerDoc.companyName || req.user?.name || 'Customer',
            customerEmail: req.user?.email || 'customer@subflow.io',
            billingAddress: customerDoc.billingAddress,
            billingPeriodStart: startDate,
            billingPeriodEnd: periodEnd,
            issueDate: startDate,
            dueDate,
            status: 'unpaid',
            currency,
            subtotal,
            taxRate,
            taxAmount,
            discountAmount: 0,
            totalAmount,
            amountPaid: 0,
            amountRemaining: totalAmount,
            idempotencyKey: `INV-INIT-${subscriptionId}`,
            notes: `Subscription activation for ${plan.name} (${frequency})`,
        });
        await InvoiceItem_js_1.InvoiceItem.create({
            invoice: invoice._id,
            description: `${plan.name} - ${frequency.toUpperCase()} Subscription (${seatCount} seats)`,
            quantity,
            unitPrice: basePrice,
            amount: totalAmount,
            taxRate,
            taxAmount,
            type: 'subscription',
        });
        // Generate PDF and dispatch notification
        try {
            const pdfBuffer = await (0, invoicePdfService_js_1.generateInvoicePdfBuffer)(invoice);
            await (0, emailService_js_1.sendInvoiceEmail)(invoice, pdfBuffer);
        }
        catch (err) {
            console.warn('Invoice email notice:', err.message);
        }
        await (0, auditLogger_js_1.logAudit)({
            user: req.user,
            action: 'SUBSCRIPTION_CREATED',
            entity: 'Subscription',
            entityId: subscription._id.toString(),
            details: { subscriptionId, plan: plan.name, totalAmount, currency },
            req,
        });
        res.status(201).json({
            success: true,
            message: 'Subscription created and activated successfully.',
            subscription,
            invoice,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.createSubscription = createSubscription;
// Pause Subscription
const pauseSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const subscription = await Subscription_js_1.Subscription.findById(id);
        if (!subscription) {
            res.status(404).json({ success: false, message: 'Subscription not found.' });
            return;
        }
        if (subscription.status !== 'active') {
            res.status(400).json({ success: false, message: `Cannot pause a subscription that is currently ${subscription.status}.` });
            return;
        }
        subscription.status = 'paused';
        subscription.pausedAt = new Date();
        await subscription.save();
        await (0, auditLogger_js_1.logAudit)({
            user: req.user,
            action: 'SUBSCRIPTION_PAUSED',
            entity: 'Subscription',
            entityId: subscription._id.toString(),
            details: { subscriptionId: subscription.subscriptionId },
            req,
        });
        res.json({
            success: true,
            message: 'Subscription has been paused.',
            subscription,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.pauseSubscription = pauseSubscription;
// Resume Subscription
const resumeSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const subscription = await Subscription_js_1.Subscription.findById(id);
        if (!subscription) {
            res.status(404).json({ success: false, message: 'Subscription not found.' });
            return;
        }
        if (subscription.status !== 'paused') {
            res.status(400).json({ success: false, message: `Subscription is not paused (current status: ${subscription.status}).` });
            return;
        }
        subscription.status = 'active';
        subscription.pausedAt = undefined;
        await subscription.save();
        await (0, auditLogger_js_1.logAudit)({
            user: req.user,
            action: 'SUBSCRIPTION_RESUMED',
            entity: 'Subscription',
            entityId: subscription._id.toString(),
            details: { subscriptionId: subscription.subscriptionId },
            req,
        });
        res.json({
            success: true,
            message: 'Subscription has been resumed and is active.',
            subscription,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.resumeSubscription = resumeSubscription;
// Renew Subscription Manually
const renewSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const subscription = await Subscription_js_1.Subscription.findById(id).populate('plan customer');
        if (!subscription) {
            res.status(404).json({ success: false, message: 'Subscription not found.' });
            return;
        }
        const now = new Date();
        const periodStart = subscription.currentPeriodEnd > now ? subscription.currentPeriodEnd : now;
        const periodEnd = new Date(periodStart);
        switch (subscription.billingFrequency) {
            case 'daily':
                periodEnd.setDate(periodEnd.getDate() + 1);
                break;
            case 'weekly':
                periodEnd.setDate(periodEnd.getDate() + 7);
                break;
            case 'yearly':
                periodEnd.setFullYear(periodEnd.getFullYear() + 1);
                break;
            case 'monthly':
            default:
                periodEnd.setMonth(periodEnd.getMonth() + 1);
                break;
        }
        subscription.currentPeriodStart = periodStart;
        subscription.currentPeriodEnd = periodEnd;
        subscription.renewalDate = periodEnd;
        subscription.status = 'active';
        await subscription.save();
        const customer = subscription.customer;
        const plan = subscription.plan;
        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
        const newInvoice = await Invoice_js_1.Invoice.create({
            invoiceNumber,
            subscription: subscription._id,
            customer: customer._id,
            customerName: customer.companyName || 'Customer',
            customerEmail: customer.user?.email || 'billing@subflow.io',
            billingAddress: customer.billingAddress,
            billingPeriodStart: periodStart,
            billingPeriodEnd: periodEnd,
            issueDate: now,
            dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
            status: 'unpaid',
            currency: subscription.currency,
            subtotal: subscription.unitPrice * subscription.quantity,
            taxRate: subscription.taxRate,
            taxAmount: subscription.taxAmount,
            totalAmount: subscription.totalAmount,
            amountPaid: 0,
            amountRemaining: subscription.totalAmount,
            notes: `Renewal invoice for ${plan?.name}`,
        });
        await InvoiceItem_js_1.InvoiceItem.create({
            invoice: newInvoice._id,
            description: `Subscription Renewal - ${plan?.name}`,
            quantity: subscription.quantity,
            unitPrice: subscription.unitPrice,
            amount: subscription.totalAmount,
            taxRate: subscription.taxRate,
            taxAmount: subscription.taxAmount,
        });
        await (0, auditLogger_js_1.logAudit)({
            user: req.user,
            action: 'SUBSCRIPTION_RENEWED',
            entity: 'Subscription',
            entityId: subscription._id.toString(),
            details: { newRenewalDate: periodEnd },
            req,
        });
        res.json({
            success: true,
            message: 'Subscription renewed successfully.',
            subscription,
            invoice: newInvoice,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.renewSubscription = renewSubscription;
// Upgrade / Downgrade Plan
const changePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { targetPlanId } = req.body;
        const subscription = await Subscription_js_1.Subscription.findById(id).populate('plan');
        if (!subscription) {
            res.status(404).json({ success: false, message: 'Subscription not found.' });
            return;
        }
        const targetPlan = await Plan_js_1.Plan.findById(targetPlanId);
        if (!targetPlan) {
            res.status(404).json({ success: false, message: 'Target plan not found.' });
            return;
        }
        const oldPlan = subscription.plan;
        const oldPrice = oldPlan.priceINR;
        const newPrice = targetPlan.priceINR;
        const changeType = newPrice >= oldPrice ? 'UPGRADE' : 'DOWNGRADE';
        subscription.plan = targetPlan._id;
        subscription.unitPrice = subscription.currency === 'USD' ? targetPlan.priceUSD : subscription.currency === 'EUR' ? targetPlan.priceEUR : targetPlan.priceINR;
        subscription.taxAmount = Math.round((subscription.unitPrice * subscription.quantity * subscription.taxRate) / 100);
        subscription.totalAmount = subscription.unitPrice * subscription.quantity + subscription.taxAmount;
        await subscription.save();
        await (0, auditLogger_js_1.logAudit)({
            user: req.user,
            action: `SUBSCRIPTION_${changeType}`,
            entity: 'Subscription',
            entityId: subscription._id.toString(),
            details: { fromPlan: oldPlan.name, toPlan: targetPlan.name, newTotal: subscription.totalAmount },
            req,
        });
        res.json({
            success: true,
            message: `Subscription successfully transitioned to ${targetPlan.name} (${changeType.toLowerCase()}).`,
            subscription,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.changePlan = changePlan;
// Cancel Subscription
const cancelSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const subscription = await Subscription_js_1.Subscription.findById(id);
        if (!subscription) {
            res.status(404).json({ success: false, message: 'Subscription not found.' });
            return;
        }
        subscription.status = 'cancelled';
        subscription.cancelledAt = new Date();
        subscription.cancelReason = reason || 'Customer requested cancellation';
        subscription.autoRenew = false;
        await subscription.save();
        await (0, auditLogger_js_1.logAudit)({
            user: req.user,
            action: 'SUBSCRIPTION_CANCELLED',
            entity: 'Subscription',
            entityId: subscription._id.toString(),
            details: { reason: subscription.cancelReason },
            severity: 'warning',
            req,
        });
        res.json({
            success: true,
            message: 'Subscription has been cancelled.',
            subscription,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.cancelSubscription = cancelSubscription;
// Add Team Member to Subscription
const addTeamMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role = 'member' } = req.body;
        if (!name || !email) {
            res.status(400).json({ success: false, message: 'Name and email are required.' });
            return;
        }
        const subscription = await Subscription_js_1.Subscription.findById(id);
        if (!subscription) {
            res.status(404).json({ success: false, message: 'Subscription not found.' });
            return;
        }
        subscription.teamMembers.push({
            name,
            email,
            role,
            addedAt: new Date(),
        });
        await subscription.save();
        res.json({
            success: true,
            message: `Team member ${name} invited successfully.`,
            teamMembers: subscription.teamMembers,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.addTeamMember = addTeamMember;
// Record Usage Record (Usage-based billing)
const recordUsage = async (req, res) => {
    try {
        const { id } = req.params;
        const { metric, quantity, unit, unitRate } = req.body;
        const subscription = await Subscription_js_1.Subscription.findById(id);
        if (!subscription) {
            res.status(404).json({ success: false, message: 'Subscription not found.' });
            return;
        }
        const usageRecord = await UsageRecord_js_1.UsageRecord.create({
            subscription: subscription._id,
            customer: subscription.customer,
            metric: metric || 'api_calls',
            quantity: Number(quantity) || 1,
            unit: unit || 'calls',
            unitRate: Number(unitRate) || 0,
            billingPeriodStart: subscription.currentPeriodStart,
            billingPeriodEnd: subscription.currentPeriodEnd,
            recordedAt: new Date(),
        });
        res.status(201).json({
            success: true,
            message: 'Usage recorded.',
            usageRecord,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.recordUsage = recordUsage;
