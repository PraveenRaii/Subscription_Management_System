"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBillingCycleNow = runBillingCycleNow;
exports.initBillingScheduler = initBillingScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const Subscription_js_1 = require("../models/Subscription.js");
const Invoice_js_1 = require("../models/Invoice.js");
const InvoiceItem_js_1 = require("../models/InvoiceItem.js");
const Payment_js_1 = require("../models/Payment.js");
const Notification_js_1 = require("../models/Notification.js");
const invoicePdfService_js_1 = require("./invoicePdfService.js");
const emailService_js_1 = require("./emailService.js");
async function runBillingCycleNow() {
    console.log('[BillingScheduler] Running automated billing & subscription lifecycle check...');
    const now = new Date();
    let renewedCount = 0;
    let reminderCount = 0;
    let overdueCount = 0;
    try {
        // 1. Process Due Renewals
        const dueSubscriptions = await Subscription_js_1.Subscription.find({
            status: 'active',
            autoRenew: true,
            renewalDate: { $lte: now },
        }).populate('customer plan');
        for (const sub of dueSubscriptions) {
            const customer = sub.customer;
            const plan = sub.plan;
            if (!customer || !plan)
                continue;
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
            const existingInvoice = await Invoice_js_1.Invoice.findOne({ idempotencyKey });
            if (existingInvoice)
                continue;
            const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
            const dueDate = new Date(now);
            dueDate.setDate(dueDate.getDate() + 7); // 7-day payment window
            const newInvoice = await Invoice_js_1.Invoice.create({
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
            await InvoiceItem_js_1.InvoiceItem.create({
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
                const pdfBuffer = await (0, invoicePdfService_js_1.generateInvoicePdfBuffer)(newInvoice);
                await (0, emailService_js_1.sendInvoiceEmail)(newInvoice, pdfBuffer);
            }
            catch (err) {
                console.warn('Could not generate/send email for recurring invoice:', err.message);
            }
            // In-app notification
            if (customer.user) {
                await Notification_js_1.Notification.create({
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
        const upcomingSubs = await Subscription_js_1.Subscription.find({
            status: 'active',
            autoRenew: true,
            renewalDate: { $gte: threeDaysStart, $lte: threeDaysEnd },
        }).populate('customer plan');
        for (const sub of upcomingSubs) {
            const customer = sub.customer;
            const plan = sub.plan;
            if (customer?.user?.email) {
                await (0, emailService_js_1.sendRenewalReminderEmail)(customer.user.email, sub.subscriptionId, sub.renewalDate, plan?.name || 'SaaS Plan');
                reminderCount++;
            }
        }
        // 3. Mark Overdue Invoices
        const overdueInvoices = await Invoice_js_1.Invoice.find({
            status: 'unpaid',
            dueDate: { $lt: now },
        });
        for (const inv of overdueInvoices) {
            inv.status = 'overdue';
            await inv.save();
            if (inv.subscription) {
                await Subscription_js_1.Subscription.findByIdAndUpdate(inv.subscription, {
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
        const expiredTrials = await Subscription_js_1.Subscription.find({
            status: 'trialing',
            $or: [{ trialEndsAt: { $lte: now } }, { currentPeriodEnd: { $lte: now } }],
        }).populate('customer plan');
        for (const sub of expiredTrials) {
            const customer = sub.customer;
            const plan = sub.plan;
            if (!customer || !plan)
                continue;
            if (sub.autoRenew) {
                sub.status = 'active';
                sub.trialEndsAt = undefined;
                sub.startDate = now;
                sub.currentPeriodStart = now;
                const nextPeriod = new Date(now);
                if (sub.billingFrequency === 'yearly')
                    nextPeriod.setFullYear(nextPeriod.getFullYear() + 1);
                else
                    nextPeriod.setMonth(nextPeriod.getMonth() + 1);
                sub.currentPeriodEnd = nextPeriod;
                sub.renewalDate = nextPeriod;
                if (!sub.activityTimeline)
                    sub.activityTimeline = [];
                sub.activityTimeline.push({
                    event: 'trial_converted',
                    description: `Free trial converted to active ${plan.name} subscription (${sub.billingFrequency}).`,
                    timestamp: now,
                    actor: 'Billing Engine',
                });
                await sub.save();
                const invNumber = `INV-TR-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
                await Invoice_js_1.Invoice.create({
                    invoiceNumber: invNumber,
                    subscription: sub._id,
                    customer: customer._id,
                    customerName: customer.companyName || 'Customer',
                    customerEmail: customer.user?.email || 'billing@subflow.io',
                    billingAddress: customer.billingAddress,
                    billingPeriodStart: now,
                    billingPeriodEnd: nextPeriod,
                    issueDate: now,
                    dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
                    status: 'unpaid',
                    currency: sub.currency,
                    subtotal: sub.unitPrice * sub.quantity,
                    taxRate: sub.taxRate,
                    taxAmount: sub.taxAmount,
                    totalAmount: sub.totalAmount,
                    amountPaid: 0,
                    amountRemaining: sub.totalAmount,
                    notes: `First billing invoice following conclusion of trial period for ${plan.name}.`,
                });
                trialsConverted++;
            }
            else {
                sub.status = 'cancelled';
                sub.cancelledAt = now;
                sub.cancelReason = 'Free trial expired without auto-renewal.';
                if (!sub.activityTimeline)
                    sub.activityTimeline = [];
                sub.activityTimeline.push({
                    event: 'cancelled',
                    description: 'Trial expired and was cancelled automatically.',
                    timestamp: now,
                    actor: 'Billing Engine',
                });
                await sub.save();
                trialsCancelled++;
            }
        }
        // 5. Dunning Engine: Retry Failed Payments on 3-day, 5-day, 7-day schedule
        let dunningRetriedCount = 0;
        let dunningSuspendedCount = 0;
        const failedPayments = await Payment_js_1.Payment.find({
            status: 'failed',
            retryCount: { $lt: 4 },
            $or: [{ nextRetryAt: { $lte: now } }, { nextRetryAt: { $exists: false } }],
        }).populate('customer invoice subscription');
        for (const pay of failedPayments) {
            pay.retryCount = (pay.retryCount || 0) + 1;
            if (pay.retryCount >= 3) {
                // Exceeded 3 attempts (Day 7 passed): auto-pause subscription and flag overdue
                if (pay.subscription) {
                    await Subscription_js_1.Subscription.findByIdAndUpdate(pay.subscription, {
                        status: 'paused',
                        pausedAt: now,
                        cancelReason: 'Suspended by automated dunning engine after 3 failed payment attempts.',
                        $push: {
                            activityTimeline: {
                                event: 'paused',
                                description: 'Subscription automatically suspended by Dunning Engine following 3 failed payment retries.',
                                timestamp: now,
                                actor: 'Dunning Engine',
                            },
                        },
                    });
                    dunningSuspendedCount++;
                }
                pay.nextRetryAt = undefined;
            }
            else {
                const delayDays = pay.retryCount === 1 ? 3 : pay.retryCount === 2 ? 5 : 7;
                pay.nextRetryAt = new Date(now.getTime() + delayDays * 24 * 60 * 60 * 1000);
                dunningRetriedCount++;
                const customer = pay.customer;
                if (customer?.user) {
                    await Notification_js_1.Notification.create({
                        recipient: customer.user._id || customer.user,
                        title: `Payment Attempt Failed (Attempt ${pay.retryCount} of 3)`,
                        message: `Your payment of ${pay.currency} ${pay.amount} for invoice ${pay.invoice?.invoiceNumber || ''} failed. Next retry in ${delayDays} days. Please update your payment method.`,
                        type: 'alert',
                        priority: 'high',
                    });
                }
            }
            await pay.save();
        }
        // 6. Enforce Grace Period Expiration
        let graceExpiredCount = 0;
        const expiredGraceSubs = await Subscription_js_1.Subscription.find({
            status: { $in: ['in_grace_period', 'past_due'] },
            gracePeriodEndsAt: { $lte: now },
        });
        for (const sub of expiredGraceSubs) {
            sub.status = 'paused';
            sub.pausedAt = now;
            if (!sub.activityTimeline)
                sub.activityTimeline = [];
            sub.activityTimeline.push({
                event: 'paused',
                description: 'Grace period expired without invoice settlement. Subscription auto-suspended.',
                timestamp: now,
                actor: 'Billing Engine',
            });
            await sub.save();
            graceExpiredCount++;
        }
        console.log(`[BillingScheduler] Completed cycle: ${renewedCount} renewed, ${reminderCount} reminders sent, ${overdueCount} overdue, ${trialsConverted} trials converted, ${dunningRetriedCount} dunning retries scheduled, ${dunningSuspendedCount} dunning suspensions, ${graceExpiredCount} grace period suspensions.`);
    }
    catch (err) {
        console.error('[BillingScheduler] Error executing cycle:', err);
    }
    return {
        renewedCount,
        reminderCount,
        overdueCount,
        trialsConverted: 0,
        dunningRetriedCount: 0,
        dunningSuspendedCount: 0,
    };
}
function initBillingScheduler() {
    // Run daily at midnight: 0 0 * * *
    node_cron_1.default.schedule('0 0 * * *', async () => {
        await runBillingCycleNow();
    });
    console.log('[BillingScheduler] Recurring automated cron initialized (0 0 * * *).');
}
