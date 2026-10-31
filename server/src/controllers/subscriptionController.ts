import { Response } from 'express';
import { Subscription } from '../models/Subscription.js';
import { Plan } from '../models/Plan.js';
import { Customer } from '../models/Customer.js';
import { Invoice } from '../models/Invoice.js';
import { InvoiceItem } from '../models/InvoiceItem.js';
import { UsageRecord } from '../models/UsageRecord.js';
import { Notification } from '../models/Notification.js';
import { CreditNote } from '../models/CreditNote.js';
import { AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/auditLogger.js';
import { generateInvoicePdfBuffer } from '../services/invoicePdfService.js';
import { sendInvoiceEmail } from '../services/emailService.js';

export const getSubscriptions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter: any = {};

    // Customer can only view their own
    if (req.user?.role === 'customer') {
      const customer = await Customer.findOne({ user: req.user._id });
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
    const subscriptions = await Subscription.find(filter)
      .populate('customer plan')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Subscription.countDocuments(filter);

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
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getSubscriptionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findById(id).populate({
      path: 'customer',
      populate: { path: 'user', select: 'name email phoneNumber' },
    }).populate('plan');

    if (!subscription) {
      res.status(404).json({ success: false, message: 'Subscription not found.' });
      return;
    }

    // Authorization check
    if (req.user?.role === 'customer') {
      const customer = await Customer.findOne({ user: req.user._id });
      if (!customer || subscription.customer._id.toString() !== customer._id.toString()) {
        res.status(403).json({ success: false, message: 'Unauthorized to view this subscription.' });
        return;
      }
    }

    // Invoices and Usage history
    const invoices = await Invoice.find({ subscription: subscription._id }).sort({ createdAt: -1 });
    const usageRecords = await UsageRecord.find({ subscription: subscription._id }).sort({ recordedAt: -1 }).limit(10);

    res.json({
      success: true,
      subscription,
      invoices,
      usageRecords,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create / Activate New Subscription
export const createSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { planId, customerId, billingFrequency, quantity = 1, seatCount = 1, autoRenew = true } = req.body;

    const plan = await Plan.findById(planId);
    if (!plan) {
      res.status(404).json({ success: false, message: 'Selected plan not found.' });
      return;
    }

    let customerDoc: any;
    if (req.user?.role === 'customer') {
      customerDoc = await Customer.findOne({ user: req.user._id });
    } else {
      customerDoc = await Customer.findById(customerId);
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

    const subscription = await Subscription.create({
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

    const invoice = await Invoice.create({
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

    await InvoiceItem.create({
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
      const pdfBuffer = await generateInvoicePdfBuffer(invoice);
      await sendInvoiceEmail(invoice, pdfBuffer);
    } catch (err: any) {
      console.warn('Invoice email notice:', err.message);
    }

    await logAudit({
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
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Pause Subscription
export const pauseSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findById(id);

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

    await logAudit({
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
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Resume Subscription
export const resumeSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findById(id);

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

    await logAudit({
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
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Renew Subscription Manually
export const renewSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findById(id).populate('plan customer');

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

    const customer: any = subscription.customer;
    const plan: any = subscription.plan;
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const newInvoice = await Invoice.create({
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

    await InvoiceItem.create({
      invoice: newInvoice._id,
      description: `Subscription Renewal - ${plan?.name}`,
      quantity: subscription.quantity,
      unitPrice: subscription.unitPrice,
      amount: subscription.totalAmount,
      taxRate: subscription.taxRate,
      taxAmount: subscription.taxAmount,
    });

    await logAudit({
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
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Preview Proration Before Changing Plan
export const previewProration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { targetPlanId } = req.body;

    const subscription = await Subscription.findById(id).populate('plan');
    if (!subscription) {
      res.status(404).json({ success: false, message: 'Subscription not found.' });
      return;
    }

    const targetPlan = await Plan.findById(targetPlanId);
    if (!targetPlan) {
      res.status(404).json({ success: false, message: 'Target plan not found.' });
      return;
    }

    const now = new Date();
    const periodStart = new Date(subscription.currentPeriodStart);
    const periodEnd = new Date(subscription.currentPeriodEnd);
    const totalMs = Math.max(1, periodEnd.getTime() - periodStart.getTime());
    const remainingMs = Math.max(0, periodEnd.getTime() - now.getTime());

    const totalDays = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)));
    const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
    const remainingRatio = remainingDays / totalDays;

    const currentBasePrice = subscription.unitPrice * subscription.quantity;
    const unusedCredit = Math.round(currentBasePrice * remainingRatio * 100) / 100;

    const targetBasePrice =
      (subscription.currency === 'USD'
        ? targetPlan.priceUSD
        : subscription.currency === 'EUR'
        ? targetPlan.priceEUR
        : targetPlan.priceINR) * subscription.quantity;
    const targetProratedCharge = Math.round(targetBasePrice * remainingRatio * 100) / 100;

    const netAdjustment = Math.round((targetProratedCharge - unusedCredit) * 100) / 100;
    const taxRate = subscription.taxRate || 18;
    const taxAmount = netAdjustment > 0 ? Math.round(((netAdjustment * taxRate) / 100) * 100) / 100 : 0;
    const totalDueToday = netAdjustment > 0 ? Math.round((netAdjustment + taxAmount) * 100) / 100 : 0;
    const surplusCredit = netAdjustment < 0 ? Math.abs(netAdjustment) : 0;

    const isUpgrade = targetBasePrice >= currentBasePrice;

    res.json({
      success: true,
      preview: {
        currentPlan: (subscription.plan as any)?.name,
        targetPlan: targetPlan.name,
        type: isUpgrade ? 'upgrade' : 'downgrade',
        totalDaysInCycle: totalDays,
        daysRemaining: remainingDays,
        currentPlanCost: currentBasePrice,
        unusedCredit,
        targetPlanFullCost: targetBasePrice,
        targetPlanProratedCost: targetProratedCharge,
        netAdjustment,
        taxRate,
        taxAmount,
        totalDueToday,
        surplusCreditApplied: surplusCredit,
        currency: subscription.currency,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Upgrade / Downgrade Plan with Mathematical Proration
export const changePlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { targetPlanId } = req.body;

    const subscription = await Subscription.findById(id).populate('plan customer');
    if (!subscription) {
      res.status(404).json({ success: false, message: 'Subscription not found.' });
      return;
    }

    const targetPlan = await Plan.findById(targetPlanId);
    if (!targetPlan) {
      res.status(404).json({ success: false, message: 'Target plan not found.' });
      return;
    }

    const oldPlan: any = subscription.plan;
    const customer: any = subscription.customer;

    // Proration Calculation
    const now = new Date();
    const periodStart = new Date(subscription.currentPeriodStart);
    const periodEnd = new Date(subscription.currentPeriodEnd);
    const totalMs = Math.max(1, periodEnd.getTime() - periodStart.getTime());
    const remainingMs = Math.max(0, periodEnd.getTime() - now.getTime());

    const totalDays = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)));
    const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
    const remainingRatio = remainingDays / totalDays;

    const currentBasePrice = subscription.unitPrice * subscription.quantity;
    const unusedCredit = Math.round(currentBasePrice * remainingRatio * 100) / 100;

    const newUnitPrice =
      subscription.currency === 'USD'
        ? targetPlan.priceUSD
        : subscription.currency === 'EUR'
        ? targetPlan.priceEUR
        : targetPlan.priceINR;
    const newBasePrice = newUnitPrice * subscription.quantity;
    const targetProratedCharge = Math.round(newBasePrice * remainingRatio * 100) / 100;

    const netAdjustment = Math.round((targetProratedCharge - unusedCredit) * 100) / 100;
    const taxRate = subscription.taxRate || 18;
    const taxAmount = netAdjustment > 0 ? Math.round(((netAdjustment * taxRate) / 100) * 100) / 100 : 0;
    const totalDueToday = netAdjustment > 0 ? Math.round((netAdjustment + taxAmount) * 100) / 100 : 0;
    const surplusCredit = netAdjustment < 0 ? Math.abs(netAdjustment) : 0;

    const changeType = newBasePrice >= currentBasePrice ? 'UPGRADE' : 'DOWNGRADE';
    let proratedInvoice = null;
    let creditNote = null;

    // If upgrade: generate immediate adjustment invoice for difference
    if (netAdjustment > 0 && totalDueToday > 0) {
      const invoiceNumber = `INV-PRO-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      proratedInvoice = await Invoice.create({
        invoiceNumber,
        subscription: subscription._id,
        customer: customer._id,
        customerName: customer.companyName || 'Customer',
        customerEmail: customer.user?.email || 'billing@subflow.io',
        billingAddress: customer.billingAddress,
        billingPeriodStart: now,
        billingPeriodEnd: periodEnd,
        issueDate: now,
        dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days due
        status: 'unpaid',
        currency: subscription.currency,
        subtotal: netAdjustment,
        taxRate,
        taxAmount,
        discountAmount: 0,
        totalAmount: totalDueToday,
        amountPaid: 0,
        amountRemaining: totalDueToday,
        idempotencyKey: `INV-PRORATE-${subscription.subscriptionId}-${Date.now()}`,
        notes: `Prorated adjustment: ${oldPlan.name} upgraded to ${targetPlan.name} for ${remainingDays} remaining days.`,
      });

      await InvoiceItem.create({
        invoice: proratedInvoice._id,
        description: `Prorated Plan Upgrade (${remainingDays} days remaining): ${oldPlan.name} -> ${targetPlan.name}`,
        quantity: 1,
        unitPrice: netAdjustment,
        taxRate,
        taxAmount,
        amount: totalDueToday,
        type: 'subscription',
      });
    }

    // If downgrade: issue credit note and store credit balance
    if (surplusCredit > 0) {
      const creditNoteNumber = `CN-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      creditNote = await CreditNote.create({
        creditNoteNumber,
        invoice: subscription._id as any,
        customer: customer._id,
        amount: surplusCredit,
        currency: subscription.currency,
        reason: 'plan_downgrade_proration',
        description: `Unused balance credit from downgrade: ${oldPlan.name} to ${targetPlan.name} (${remainingDays} days).`,
        status: 'issued',
      });

      subscription.prorationCreditBalance = (subscription.prorationCreditBalance || 0) + surplusCredit;
    }

    // Update Subscription State
    subscription.plan = targetPlan._id;
    subscription.unitPrice = newUnitPrice;
    subscription.taxAmount = Math.round((newUnitPrice * subscription.quantity * taxRate) / 100);
    subscription.totalAmount = newUnitPrice * subscription.quantity + subscription.taxAmount;

    // Push Activity Timeline Entry
    if (!subscription.activityTimeline) subscription.activityTimeline = [];
    subscription.activityTimeline.push({
      event: changeType.toLowerCase(),
      description:
        changeType === 'UPGRADE'
          ? `Upgraded from ${oldPlan.name} to ${targetPlan.name}. Prorated charge: ${subscription.currency} ${totalDueToday} (${remainingDays} days remaining).`
          : `Downgraded from ${oldPlan.name} to ${targetPlan.name}. Prorated credit stored: ${subscription.currency} ${surplusCredit}.`,
      timestamp: new Date(),
      actor: req.user?.name || 'Customer',
      metadata: { fromPlan: oldPlan.name, toPlan: targetPlan.name, netAdjustment, remainingDays },
    });

    await subscription.save();

    await logAudit({
      user: req.user,
      action: `SUBSCRIPTION_${changeType}`,
      entity: 'Subscription',
      entityId: subscription._id.toString(),
      details: {
        fromPlan: oldPlan.name,
        toPlan: targetPlan.name,
        proratedAdjustment: netAdjustment,
        totalDueToday,
        surplusCredit,
      },
      req,
    });

    res.json({
      success: true,
      message: `Subscription successfully transitioned to ${targetPlan.name} with mathematical proration.`,
      changeType,
      subscription,
      proration: {
        totalDaysInCycle: totalDays,
        daysRemaining: remainingDays,
        unusedCredit,
        targetPlanProratedCost: targetProratedCharge,
        netAdjustment,
        totalDueToday,
        surplusCredit,
      },
      invoice: proratedInvoice,
      creditNote,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Subscription Activity Timeline
export const getSubscriptionTimeline = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findById(id).select('subscriptionId activityTimeline plan customer').populate('plan');

    if (!subscription) {
      res.status(404).json({ success: false, message: 'Subscription not found.' });
      return;
    }

    res.json({
      success: true,
      subscriptionId: subscription.subscriptionId,
      timeline: subscription.activityTimeline || [],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Cancel Subscription
export const cancelSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      res.status(404).json({ success: false, message: 'Subscription not found.' });
      return;
    }

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.cancelReason = reason || 'Customer requested cancellation';
    subscription.autoRenew = false;
    await subscription.save();

    await logAudit({
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
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add Team Member to Subscription
export const addTeamMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, role = 'member' } = req.body;

    if (!name || !email) {
      res.status(400).json({ success: false, message: 'Name and email are required.' });
      return;
    }

    const subscription = await Subscription.findById(id);
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
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Record Usage Record (Usage-based billing)
export const recordUsage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { metric, quantity, unit, unitRate } = req.body;

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      res.status(404).json({ success: false, message: 'Subscription not found.' });
      return;
    }

    const usageRecord = await UsageRecord.create({
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
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
