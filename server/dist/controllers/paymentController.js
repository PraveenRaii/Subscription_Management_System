"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryFailedPayment = exports.getPayments = exports.processRefund = exports.verifyPayment = exports.createOrder = void 0;
const Payment_js_1 = require("../models/Payment.js");
const Invoice_js_1 = require("../models/Invoice.js");
const Subscription_js_1 = require("../models/Subscription.js");
const Customer_js_1 = require("../models/Customer.js");
const Transaction_js_1 = require("../models/Transaction.js");
const auditLogger_js_1 = require("../middleware/auditLogger.js");
const razorpayService_js_1 = require("../services/razorpayService.js");
// 1. Create Razorpay Payment Order
const createOrder = async (req, res) => {
    try {
        const { invoiceId, paymentMethod = 'razorpay' } = req.body;
        const invoice = await Invoice_js_1.Invoice.findById(invoiceId);
        if (!invoice) {
            res.status(404).json({ success: false, message: 'Invoice not found.' });
            return;
        }
        if (req.user?.role === 'customer') {
            const customer = await Customer_js_1.Customer.findOne({ user: req.user._id }).select('_id');
            if (!customer || !invoice.customer.equals(customer._id)) {
                res.status(404).json({ success: false, message: 'Invoice not found.' });
                return;
            }
        }
        else if (!['super_admin', 'staff'].includes(req.user?.role || '')) {
            res.status(403).json({ success: false, message: 'Not authorized to create payments.' });
            return;
        }
        if (invoice.status === 'paid') {
            res.status(400).json({ success: false, message: 'Invoice has already been settled and paid.' });
            return;
        }
        const order = await (0, razorpayService_js_1.createRazorpayOrder)({
            amount: invoice.totalAmount,
            currency: invoice.currency,
            receipt: invoice.invoiceNumber,
            notes: {
                invoiceId: invoice._id.toString(),
                customerEmail: invoice.customerEmail,
                customerName: invoice.customerName,
            },
        });
        await Payment_js_1.Payment.create({
            paymentId: `ORDER-${order.id}`,
            invoice: invoice._id,
            subscription: invoice.subscription,
            customer: invoice.customer,
            amount: invoice.totalAmount,
            currency: invoice.currency,
            paymentMethod,
            status: 'pending',
            gatewayOrderId: order.id,
            metadata: { simulated: order.isSimulated },
        });
        res.json({
            success: true,
            order,
            keyId: process.env.RAZORPAY_KEY_ID || '',
            invoice: {
                id: invoice._id,
                invoiceNumber: invoice.invoiceNumber,
                amount: invoice.totalAmount,
                currency: invoice.currency,
                customerName: invoice.customerName,
                customerEmail: invoice.customerEmail,
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.createOrder = createOrder;
// 2. Verify Razorpay Payment (Server-side verification)
const verifyPayment = async (req, res) => {
    try {
        const { invoiceId, razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentMethod = 'razorpay', } = req.body;
        const invoice = await Invoice_js_1.Invoice.findById(invoiceId);
        if (!invoice) {
            res.status(404).json({ success: false, message: 'Invoice not found.' });
            return;
        }
        if (req.user?.role === 'customer') {
            const customer = await Customer_js_1.Customer.findOne({ user: req.user._id }).select('_id');
            if (!customer || !invoice.customer.equals(customer._id)) {
                res.status(404).json({ success: false, message: 'Invoice not found.' });
                return;
            }
        }
        else if (!['super_admin', 'staff'].includes(req.user?.role || '')) {
            res.status(403).json({ success: false, message: 'Not authorized to verify payments.' });
            return;
        }
        const payment = await Payment_js_1.Payment.findOne({
            invoice: invoice._id,
            gatewayOrderId: razorpay_order_id,
            status: 'pending',
        });
        if (!payment || payment.metadata?.simulated !== Boolean(String(razorpay_order_id).startsWith('order_sim_'))) {
            res.status(400).json({ success: false, message: 'Payment order is invalid or already used.' });
            return;
        }
        if (invoice.status === 'paid') {
            res.status(409).json({ success: false, message: 'Invoice has already been paid.' });
            return;
        }
        const isValid = (0, razorpayService_js_1.verifyPaymentSignature)(razorpay_order_id, razorpay_payment_id, razorpay_signature);
        if (!isValid) {
            // Record failed payment attempt
            await Payment_js_1.Payment.create({
                paymentId: `PAY-FAIL-${Date.now().toString().slice(-6)}`,
                invoice: invoice._id,
                subscription: invoice.subscription,
                customer: invoice.customer,
                amount: invoice.totalAmount,
                currency: invoice.currency,
                paymentMethod: 'razorpay',
                status: 'failed',
                gatewayOrderId: razorpay_order_id,
                failureReason: 'Invalid payment signature or authorization verification failed.',
                retryCount: 1,
                nextRetryAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next retry in 24h
            });
            await (0, auditLogger_js_1.logAudit)({
                user: req.user,
                action: 'PAYMENT_VERIFICATION_FAILED',
                entity: 'Payment',
                details: { invoiceId, orderId: razorpay_order_id },
                severity: 'critical',
                req,
            });
            res.status(400).json({ success: false, message: 'Payment verification failed: Signature mismatch.' });
            return;
        }
        // Success - mark invoice as paid
        const now = new Date();
        invoice.status = 'paid';
        invoice.paidAt = now;
        invoice.amountPaid = invoice.totalAmount;
        invoice.amountRemaining = 0;
        invoice.paymentMethod = paymentMethod;
        await invoice.save();
        // If linked to subscription, ensure active
        if (invoice.subscription) {
            await Subscription_js_1.Subscription.findByIdAndUpdate(invoice.subscription, {
                status: 'active',
                gracePeriodEndsAt: undefined,
            });
        }
        // Settle the persisted order record to prevent replaying an order.
        payment.paymentId = `PAY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
        payment.status = 'success';
        payment.paymentMethod = paymentMethod;
        payment.gatewayTransactionId = razorpay_payment_id;
        payment.gatewaySignature = razorpay_signature;
        await payment.save();
        // Create Ledger Transaction
        await Transaction_js_1.Transaction.create({
            transactionId: `TXN-${Date.now().toString().slice(-6)}`,
            type: 'credit',
            amount: invoice.totalAmount,
            currency: invoice.currency,
            customer: invoice.customer,
            payment: payment._id,
            invoice: invoice._id,
            status: 'completed',
            description: `Payment for Invoice ${invoice.invoiceNumber} via ${paymentMethod.toUpperCase()}`,
        });
        // Update Customer Lifetime Value & Total Spent
        const customer = await Customer_js_1.Customer.findById(invoice.customer);
        if (customer) {
            customer.totalSpent += invoice.totalAmount;
            customer.lifetimeValue += invoice.totalAmount;
            customer.churnRiskScore = Math.max(5, customer.churnRiskScore - 15);
            customer.churnRiskLevel = customer.churnRiskScore > 60 ? 'High' : customer.churnRiskScore > 30 ? 'Medium' : 'Low';
            await customer.save();
        }
        await (0, auditLogger_js_1.logAudit)({
            user: req.user,
            action: 'PAYMENT_SUCCESS',
            entity: 'Payment',
            entityId: payment._id.toString(),
            details: {
                paymentId: payment.paymentId,
                invoiceNumber: invoice.invoiceNumber,
                amount: invoice.totalAmount,
                currency: invoice.currency,
                razorpayPaymentId: razorpay_payment_id,
            },
            req,
        });
        res.json({
            success: true,
            message: 'Payment verified and settled successfully.',
            payment,
            invoice,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.verifyPayment = verifyPayment;
// 3. Process Refund
const processRefund = async (req, res) => {
    try {
        const { paymentId, amount, reason } = req.body;
        const payment = await Payment_js_1.Payment.findById(paymentId);
        if (!payment) {
            res.status(404).json({ success: false, message: 'Payment record not found.' });
            return;
        }
        if (!['success', 'partially_refunded'].includes(payment.status)) {
            res.status(400).json({ success: false, message: 'This payment has already been completely refunded.' });
            return;
        }
        const refundAmount = amount === undefined ? payment.amount - payment.refundedAmount : Number(amount);
        const refundableAmount = payment.amount - payment.refundedAmount;
        if (!Number.isFinite(refundAmount) || refundAmount <= 0 || refundAmount > refundableAmount) {
            res.status(400).json({ success: false, message: 'Refund amount must be greater than zero and no more than the remaining refundable balance.' });
            return;
        }
        const refundResult = await (0, razorpayService_js_1.initiateRefund)(payment.gatewayTransactionId || `pay_sim_${payment._id}`, refundAmount, {
            reason: reason || 'Customer refund request',
        });
        payment.refundedAmount += refundAmount;
        payment.status = payment.refundedAmount >= payment.amount ? 'refunded' : 'partially_refunded';
        payment.refundReason = reason || 'Customer requested refund';
        await payment.save();
        // Create refund ledger transaction
        await Transaction_js_1.Transaction.create({
            transactionId: `TXN-RFND-${Date.now().toString().slice(-6)}`,
            type: 'refund',
            amount: refundAmount,
            currency: payment.currency,
            customer: payment.customer,
            payment: payment._id,
            invoice: payment.invoice,
            status: 'completed',
            description: `Refund for Payment ${payment.paymentId}: ${reason || 'Processed'}`,
        });
        await (0, auditLogger_js_1.logAudit)({
            user: req.user,
            action: 'PAYMENT_REFUNDED',
            entity: 'Payment',
            entityId: payment._id.toString(),
            details: { refundAmount, refundId: refundResult.refundId, reason },
            severity: 'warning',
            req,
        });
        res.json({
            success: true,
            message: `Refund of ${payment.currency} ${refundAmount} processed successfully.`,
            payment,
            refundResult,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.processRefund = processRefund;
// 4. List Payments & Transactions
const getPayments = async (req, res) => {
    try {
        const { status, page = 1, limit = 20, search } = req.query;
        const filter = {};
        if (req.user?.role === 'customer') {
            const customer = await Customer_js_1.Customer.findOne({ user: req.user._id });
            if (!customer) {
                res.json({ success: true, payments: [], count: 0 });
                return;
            }
            filter.customer = customer._id;
        }
        if (status && status !== 'all') {
            filter.status = status;
        }
        if (search) {
            filter.$or = [
                { paymentId: { $regex: String(search), $options: 'i' } },
                { gatewayTransactionId: { $regex: String(search), $options: 'i' } },
                { gatewayOrderId: { $regex: String(search), $options: 'i' } },
            ];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const payments = await Payment_js_1.Payment.find(filter)
            .populate('customer invoice subscription')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await Payment_js_1.Payment.countDocuments(filter);
        res.json({
            success: true,
            payments,
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
exports.getPayments = getPayments;
// 5. Retry Failed Payment
const retryFailedPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment_js_1.Payment.findById(id).populate('invoice');
        if (!payment) {
            res.status(404).json({ success: false, message: 'Payment not found.' });
            return;
        }
        payment.retryCount += 1;
        payment.nextRetryAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await payment.save();
        await (0, auditLogger_js_1.logAudit)({
            user: req.user,
            action: 'PAYMENT_RETRY_SCHEDULED',
            entity: 'Payment',
            entityId: payment._id.toString(),
            details: { retryCount: payment.retryCount },
            req,
        });
        res.json({
            success: true,
            message: `Payment retry attempt #${payment.retryCount} scheduled for ${payment.paymentId}.`,
            payment,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.retryFailedPayment = retryFailedPayment;
