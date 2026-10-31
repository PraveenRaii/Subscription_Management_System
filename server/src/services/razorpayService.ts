import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const keyId = process.env.RAZORPAY_KEY_ID || '';
const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
const simulationAllowed = process.env.NODE_ENV !== 'production';

let razorpayInstance: any = null;
try {
  if (keyId && keySecret) razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
} catch (err: any) {
  console.warn('Razorpay initialization note:', err.message);
}

export interface CreateOrderParams {
  amount: number; // in currency units (e.g. INR)
  currency: 'INR' | 'USD' | 'EUR';
  receipt: string;
  notes?: Record<string, any>;
}

export async function createRazorpayOrder(params: CreateOrderParams) {
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
    } catch (err: any) {
      throw new Error('Unable to create Razorpay order. Please try again.');
    }
  }

  if (!simulationAllowed) throw new Error('Razorpay is not configured.');

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

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  if (orderId.startsWith('order_sim_')) {
    return simulationAllowed && paymentId.startsWith('pay_sim_') && signature.startsWith('sig_sim_');
  }

  if (!keySecret || !signature) return false;

  try {
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const expected = Buffer.from(generatedSignature, 'hex');
    const received = Buffer.from(signature, 'hex');
    return expected.length === received.length && crypto.timingSafeEqual(expected, received);
  } catch (err) {
    return false;
  }
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  try {
    if (!webhookSecret || !signature) return false;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    const expected = Buffer.from(expectedSignature, 'hex');
    const received = Buffer.from(signature, 'hex');
    return expected.length === received.length && crypto.timingSafeEqual(expected, received);
  } catch (err) {
    return false;
  }
}

export async function initiateRefund(paymentId: string, amount: number, notes?: Record<string, any>) {
  const amountInSubunits = Math.round(amount * 100);

  if (paymentId.startsWith('pay_sim_')) {
    if (!simulationAllowed) throw new Error('Simulated refunds are disabled in production.');
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
    } catch (err: any) {
      throw new Error('Razorpay refund failed. The refund was not recorded.');
    }
  }
  throw new Error('Razorpay is not configured; refund was not processed.');
}
