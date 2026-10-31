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
                    status: 'past_due',
                    gracePeriodEndsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days grace
                });
            }
            overdueCount++;
        }
        console.log(`[BillingScheduler] Completed cycle: ${renewedCount} renewed, ${reminderCount} reminders sent, ${overdueCount} invoices marked overdue.`);
    }
    catch (err) {
        console.error('[BillingScheduler] Error executing cycle:', err);
    }
    return { renewedCount, reminderCount, overdueCount };
}
function initBillingScheduler() {
    // Run daily at midnight: 0 0 * * *
    node_cron_1.default.schedule('0 0 * * *', async () => {
        await runBillingCycleNow();
    });
    console.log('[BillingScheduler] Recurring automated cron initialized (0 0 * * *).');
}
