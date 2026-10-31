import { Request, Response } from 'express';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { verifyWebhookSignature } from '../services/razorpayService.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Subscription } from '../models/Subscription.js';

export const handleRazorpayWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const rawBody = JSON.stringify(req.body);

    const isValid = signature ? verifyWebhookSignature(rawBody, signature) : true; // In dev sandbox, accept

    const event = req.body.event || 'unknown';
    const payload = req.body.payload || {};
    const eventId = `EVT-${Date.now()}-${Math.floor(Math.random() * 9000)}`;

    const webhookDoc = await WebhookEvent.create({
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
        const paymentRecord = await Payment.findOne({ gatewayOrderId: orderId });
        if (paymentRecord) {
          paymentRecord.status = 'success';
          paymentRecord.gatewayTransactionId = p.id;
          await paymentRecord.save();

          await Invoice.findByIdAndUpdate(paymentRecord.invoice, {
            status: 'paid',
            paidAt: new Date(),
          });
        }
      }
    }

    res.status(200).json({ status: 'ok', received: true });
  } catch (err: any) {
    console.error('Webhook processing error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getWebhookEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await WebhookEvent.find().sort({ createdAt: -1 }).limit(50);
    res.json({
      success: true,
      events,
      count: events.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
