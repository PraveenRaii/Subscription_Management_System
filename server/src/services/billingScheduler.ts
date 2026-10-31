import cron from 'node-cron';
import { Subscription } from '../models/Subscription.js';
import { Invoice } from '../models/Invoice.js';
import { InvoiceItem } from '../models/InvoiceItem.js';
import { Customer } from '../models/Customer.js';
import { Plan } from '../models/Plan.js';
import { Payment } from '../models/Payment.js';
import { Notification } from '../models/Notification.js';
import { generateInvoicePdfBuffer } from './invoicePdfService.js';
import { sendInvoiceEmail, sendRenewalReminderEmail } from './emailService.js';

export async function runBillingCycleNow() {
  console.log('[BillingScheduler] Running automated billing & subscription lifecycle check...');
  const now = new Date();
  let renewedCount = 0;
  let reminderCount = 0;
  let overdueCount = 0;

  try {
    // 1. Process Due Renewals
    const dueSubscriptions = await Subscription.find({
      status: 'active',
      autoRenew: true,
      renewalDate: { $lte: now },
    }).populate('customer plan');

    for (const sub of dueSubscriptions) {
      const customer: any = sub.customer;
      const plan: any = sub.plan;
      if (!customer || !plan) continue;

      const periodStart = sub.renewalDate;
      const periodEnd = new Date(periodStart);

      switch (sub.billingFrequency) {
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

      const idempotencyKey = `INV-REC-${sub.subscriptionId}-${periodStart.toISOString().substring(0, 10)}`;

      // Check if invoice already exists
      const existingInvoice = await Invoice.findOne({ idempotencyKey });
      if (existingInvoice) continue;

      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 7); // 7-day payment window

      const newInvoice = await Invoice.create({
        invoiceNumber,
        subscription: sub._id,
        customer: customer._id,
        customerName: customer.companyName || customer.user?.name || 'Customer',
        customerEmail: customer.user?.email || 'customer@subflow.io',
        billingAddress: customer.billingAddress,
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
        issueDate: now,
        dueDate,
        status: 'unpaid',
        currency: sub.currency,
        subtotal: sub.unitPrice * sub.quantity,
        taxRate: sub.taxRate,
        taxAmount: sub.taxAmount,
        discountAmount: sub.discountAmount,
        totalAmount: sub.totalAmount,
        amountPaid: 0,
        amountRemaining: sub.totalAmount,
        idempotencyKey,
        notes: `Automated recurring invoice for ${plan.name} (${sub.billingFrequency})`,
      });

      await InvoiceItem.create({
        invoice: newInvoice._id,
        description: `${plan.name} - ${sub.billingFrequency.toUpperCase()} Recurring License (${sub.seatCount} seats)`,
        quantity: sub.quantity,
        unitPrice: sub.unitPrice,
        taxRate: sub.taxRate,
        taxAmount: sub.taxAmount,
        amount: sub.totalAmount,
        type: 'subscription',
      });

      // Advance subscription periods
      sub.currentPeriodStart = periodStart;
      sub.currentPeriodEnd = periodEnd;
      sub.renewalDate = periodEnd;
      await sub.save();

      // Generate PDF & send notification
      try {
        const pdfBuffer = await generateInvoicePdfBuffer(newInvoice);
        await sendInvoiceEmail(newInvoice, pdfBuffer);
      } catch (err: any) {
        console.warn('Could not generate/send email for recurring invoice:', err.message);
      }

      // In-app notification
      if (customer.user) {
        await Notification.create({
          recipient: customer.user._id || customer.user,
          title: 'New Subscription Invoice Generated',
          message: `Invoice ${invoiceNumber} for ${plan.name} (${sub.currency} ${sub.totalAmount}) is ready for payment.`,
          type: 'billing',
          priority: 'normal',
          actionUrl: `/portal/invoices/${newInvoice._id}`,
        });
      }

      renewedCount++;
    }

    // 2. Renewal Reminders (3 days before renewal)
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStart = new Date(threeDaysFromNow);
    threeDaysStart.setHours(0, 0, 0, 0);
    const threeDaysEnd = new Date(threeDaysFromNow);
    threeDaysEnd.setHours(23, 59, 59, 999);

    const upcomingSubs = await Subscription.find({
      status: 'active',
      autoRenew: true,
      renewalDate: { $gte: threeDaysStart, $lte: threeDaysEnd },
    }).populate('customer plan');

    for (const sub of upcomingSubs) {
      const customer: any = sub.customer;
      const plan: any = sub.plan;
      if (customer?.user?.email) {
        await sendRenewalReminderEmail(customer.user.email, sub.subscriptionId, sub.renewalDate, plan?.name || 'SaaS Plan');
        reminderCount++;
      }
    }

    // 3. Mark Overdue Invoices
    const overdueInvoices = await Invoice.find({
      status: 'unpaid',
      dueDate: { $lt: now },
    });

    for (const inv of overdueInvoices) {
      inv.status = 'overdue';
      await inv.save();

      if (inv.subscription) {
        await Subscription.findByIdAndUpdate(inv.subscription, {
          status: 'in_grace_period',
          gracePeriodEndsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days grace buffer
          $push: {
            activityTimeline: {
              event: 'grace_period',
              description: `Invoice ${inv.invoiceNumber} overdue. 7-day grace period initiated.`,
              timestamp: now,
              actor: 'Billing Engine',
            },
          },
        });
      }
      overdueCount++;
    }

    // 4. Process Free Trial Expirations (Auto-convert or Auto-cancel)
    let trialsConverted = 0;
    let trialsCancelled = 0;
    const expiredTrials = await Subscription.find({
      status: 'trialing',
      $or: [{ trialEndsAt: { $lte: now } }, { currentPer