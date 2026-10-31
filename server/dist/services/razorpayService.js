"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRazorpayOrder = createRazorpayOrder;
exports.verifyPaymentSignature = verifyPaymentSignature;
exports.verifyWebhookSignature = verifyWebhookSignature;
exports.initiateRefund = initiateRefund;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const keyId = process.env.RAZORPAY_KEY_ID || '';
const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
const simulationAllowed = process.env.NODE_ENV !== 'production';
let razorpayInstance = null;
try {
    if (keyId && keySecret)
        razorpayInstance = new razorpay_1.default({ key_id: keyId, key_secret: keySecret });
}
catch (err) {
    console.warn('Razorpay initialization note:', err.message);
}
async function createRazorpayOrder(params) {
    const amountInSubunits = Math.round(params.amount * 100); // Paisa / Cents
    if (razorpayInstance) {
        try {
            const order = await razorpayInstance.orders.create({
                amount: amountInSubunits,
                currency: params.currency || 'INR',
                receipt: params.receipt,
                notes: params.notes || {},
            });
            return {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt,
                status: order.status,
                isSimulated: false,
            };
        }
        catch (err) {
            throw new Error('Unable to create Razorpay order. Please try again.');
        }
    }
    if (!simulationAllowed)
        throw new Error('Razorpay is not configured.');
    // Robust test/sandbox simulation order:
    const simOrderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
        id: simOrderId,
        amount: amountInSubunits,
        currency: params.currency || 'INR',
        receipt: params.receipt,
        status: 'created',
        isSimulated: true,
    };
}
function verifyPaymentSignature(orderId, paymentId, signature) {
    if (orderId.startsWith('order_sim_')) {
        return simulationAllowed && paymentId.startsWith('pay_sim_') && signature.startsWith('sig_sim_');
    }
    if (!keySecret || !signature)
        return false;
    try {
        const generatedSignature = crypto_1.default
            .createHmac('sha256', keySecret)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');
        const expected = Buffer.from(generatedSignature, 'hex');
        const received = Buffer.from(signature, 'hex');
        return expected.length === received.length && crypto_1.default.timingSafeEqual(expected, received);
    }
    catch (err) {
        return false;
    }
}
function verifyWebhookSignature(body, signature) {
    try {
        if (!webhookSecret || !signature)
            return false;
        const expectedSignature = crypto_1.default
            .createHmac('sha256', webhookSecret)
            .update(body)
            .digest('hex');
        const expected = Buffer.from(expectedSignature, 'hex');
        const received = Buffer.from(signature, 'hex');
        return expected.length === received.length && crypto_1.default.timingSafeEqual(expected, received);
    }
    catch (err) {
        return false;
    }
}
async function initiateRefund(paymentId, amount, notes) {
    const amountInSubunits = Math.round(amount * 100);
    if (paymentId.startsWith('pay_sim_')) {
        if (!simulationAllowed)
            throw new Error('Simulated refunds are disabled in production.');
        return { success: true, refundId: `rfnd_sim_${Date.now()}`, amount, status: 'processed' };
    }
    if (razorpayInstance) {
        try {
            const refund = await razorpayInstance.payments.refund(paymentId, {
                amount: amountInSubunits,
                notes: notes || {},
            });
            return {
                success: true,
                refundId: refund.id,
                amount: refund.amount / 100,
                status: refund.status,
            };
        }
        catch (err) {
            throw new Error('Razorpay refund failed. The refund was not recorded.');
        }
    }
    throw new Error('Razorpay is not configured; refund was not processed.');
}
