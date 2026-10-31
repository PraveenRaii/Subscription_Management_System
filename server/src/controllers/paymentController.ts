import { Response } from 'express';
import { Payment } from '../models/Payment.js';
import { Invoice } from '../models/Invoice.js';
import { Subscription } from '../models/Subscription.js';
import { Customer } from '../models/Customer.js';
import { Transaction } from '../models/Transaction.js';
import { AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/auditLogger.js';
import { createRazorpayOrder, verifyPaymentSignature, initiateRefund } from '../services/razorpayService.js';

// 1. Create Razorpay Payment Order
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { invoiceId, paymentMethod = 'razorpay' } = req.body;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    if (invoice.status === 'paid') {
      res.status(400).json({ success: false, message: 'Invoice has already been settled and paid.' });
      return;
    }

    const order = await createRazorpayOrder({
      amount: invoice.totalAmount,
      currency: invoice.currency,
      receipt: invoice.invoiceNumber,
      notes: {
        invoiceId: invoice._id.toString(),
        customerEmail: invoice.customerEmail,
        customerName: invoice.customerName,
      },
    });

    res.json({
      success: true,
      order,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_subflow_demo9928',
      invoice: {
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.totalAmount,
        currency: invoice.currency,
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Verify Razorpay Payment (Server-side verification)
export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      invoiceId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentMethod = 'razorpay',
    } = req.body;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      // Record failed payment attempt
      await Payment.create({
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

      await logAudit({
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
      await Subscription.findByIdAndUpdate(invoice.subscription, {
        status: 'active',
        gracePeriodEndsAt: undefined,
      });
    }

    // Create Payment Record
    const paymentId = `PAY-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const payment = await Payment.create({
      paymentId,
      invoice: invoice._id,
      subscription: invoice.subscription,
      customer: invoice.customer,
      amount: invoice.totalAmount,
      currency: invoice.currency,
      paymentMethod,
      status: 'success',
      gatewayOrderId: razorpay_order_id,
      gatewayTransactionId: razorpay_payment_id,
      gatewaySignature: razorpay_signature,
    });

    // Create Ledger Transaction
    await Transaction.create({
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
    const customer = await Customer.findById(invoice.customer);
    if (customer) {
      customer.totalSpent += invoice.totalAmount;
      customer.lifetimeValue += invoice.totalAmount;
      customer.churnRiskScore = Math.max(5, customer.churnRiskScore - 15);
      customer.churnRiskLevel = customer.churnRiskScore > 60 ? 'High' : customer.churnRiskScore > 30 ? 'Medium' : 'Low';
      await customer.save();
    }

    await logAudit({
      user: req.user,
      action: 'PAYMENT_SUCCESS',
      entity: 'Payment',
      entityId: payment._id.toString(),
      details: {
        paymentId,
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
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Process Refund
export const processRefund = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { paymentId, amount, reason } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment record not found.' });
      return;
    }

    if (payment.status === 'refunded') {
      res.status(400).json({ success: false, message: 'This payment has already been completely refunded.' });
      return;
    }

    const refundAmount = amount ? Number(amount) : payment.amount;
    const refundResult = await initiateRefund(payment.gatewayTransactionId || `pay_sim_${payment._id}`, refundAmount, {
      reason: reason || 'Customer refund request',
    });

    payment.status = refundAmount >= payment.amount ? 'refunded' : 'partially_refunded';
    payment.refundedAmount += refundAmount;
    payment.refundReason = reason || 'Customer requested refund';
    await payment.save();

    // Create refund ledger transaction
    await Transaction.create({
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

    await logAudit({
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
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. List Payments & Transactions
export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const filter: any = {};

    if (req.user?.role === 'customer') {
      const customer = await Customer.findOne({ user: req.user._id });
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
    const payments = await Payment.find(filter)
      .populate('customer invoice subscription')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Payment.countDocuments(filter);

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
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Retry Failed Payment
export const retryFailedPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id).populate('invoice');

    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment not found.' });
      return;
    }

    payment.retryCount += 1;
    payment.nextRetryAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await payment.save();

    await logAudit({
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
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
