"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebhookEvents = exports.handleRazorpayWebhook = void 0;
const WebhookEvent_js_1 = require("../models/WebhookEvent.js");
const razorpayService_js_1 = require("../services/razorpayService.js");
const Invoice_js_1 = require("../models/Invoice.js");
const Payment_js_1 = require("../models/Payment.js");
const handleRazorpayWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const rawBody = JSON.stringify(req.body);
        const isValid = signature ? (0, razorpayService_js_1.verifyWebhookSignature)(rawBody, signature) : true; // In dev sandbox, accept
        const event = req.body.event || 'unknown';
        const payload = req.body.payload || {};
        const eventId = `EVT-${Date.now()}-${Math.floor(Math.random() * 9000)}`;
        const webhookDoc = await WebhookEvent_js_1.WebhookEvent.create({
            eventId,
            eventType: event,
            source: 'razorpay',
            payload: req.body,
            status: isValid ? 'processed' : 'failed',
            headers: req.headers,
        });
        if (event === 'payment.captured' && payload.payment?.entity) {
            const p = payload.payment.entity;
            const orderId = p.order_id;
            if (orderId) {
                const paymentRecord = await Payment_js_1.Payment.findOne({ gatewayOrderId: orderId });
                if (paymentRecord) {
                    paymentRecord.status = 'success';
                    paymentRecord.gatewayTransactionId = p.id;
                    await paymentRecord.save();
                    await Invoice_js_1.Invoice.findByIdAndUpdate(paymentRecord.invoice, {
                        status: 'paid',
                        paidAt: new Date(),
                    });
                }
            }
        }
        res.status(200).json({ status: 'ok', received: true });
    }
    catch (err) {
        console.error('Webhook processing error:', err.message);
        res.status(500).json({ error: err.message });
    }
};
exports.handleRazorpayWebhook = handleRazorpayWebhook;
const getWebhookEvents = async (req, res) => {
    try {
        const events = await WebhookEvent_js_1.WebhookEvent.find().sort({ createdAt: -1 }).limit(50);
        res.json({
            success: true,
            events,
            count: events.length,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getWebhookEvents = getWebhookEvents;
