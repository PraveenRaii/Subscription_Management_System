"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoicePdfBuffer = generateInvoicePdfBuffer;
const pdfkit_1 = __importDefault(require("pdfkit"));
async function generateInvoicePdfBuffer(invoice, items = []) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new pdfkit_1.default({ margin: 40, size: 'A4' });
            const buffers = [];
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', (err) => reject(err));
            // Header Brand
            doc
                .fillColor('#ea580c') // Orange 600
                .fontSize(24)
                .font('Helvetica-Bold')
                .text('SUBFLOW 2.0', 40, 40);
            doc
                .fillColor('#71717a')
                .fontSize(9)
                .font('Helvetica')
                .text('AI-Powered SaaS Subscription & Revenue Intelligence Platform', 40, 68)
                .text('100 Innovation Park, Outer Ring Road, Bengaluru, KA 560103', 40, 80)
                .text('GSTIN: 29AABCS1429B1Z8 | HSN/SAC Code: 997331 (SaaS/Cloud Services)', 40, 92);
            // Status Badge
            const status = (invoice.status || 'UNPAID').toUpperCase();
            const statusColor = status === 'PAID' ? '#16a34a' : status === 'OVERDUE' ? '#dc2626' : '#ea580c';
            doc
                .rect(450, 40, 105, 24)
                .fillAndStroke(status === 'PAID' ? '#dcfce7' : '#ffedd5', statusColor);
            doc
                .fillColor(statusColor)
                .fontSize(11)
                .font('Helvetica-Bold')
                .text(status, 450, 47, { width: 105, align: 'center' });
            // Invoice Details Block
            doc
                .fillColor('#18181b')
                .fontSize(10)
                .font('Helvetica-Bold')
                .text('TAX INVOICE', 400, 75, { align: 'right' });
            doc
                .font('Helvetica')
                .fontSize(9)
                .fillColor('#52525b')
                .text(`Invoice No: ${invoice.invoiceNumber}`, 350, 90, { align: 'right' })
                .text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString('en-IN')}`, 350, 104, { align: 'right' })
                .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}`, 350, 118, { align: 'right' });
            // Divider Line
            doc
                .moveTo(40, 140)
                .lineTo(555, 140)
                .strokeColor('#e4e4e7')
                .stroke();
            // Bill To & Billing Period
            doc
                .fillColor('#71717a')
                .fontSize(9)
                .font('Helvetica-Bold')
                .text('BILLED TO:', 40, 155);
            doc
                .fillColor('#18181b')
                .fontSize(11)
                .font('Helvetica-Bold')
                .text(invoice.customerName || 'Valued Customer', 40, 170);
            doc
                .font('Helvetica')
                .fontSize(9)
                .fillColor('#52525b')
                .text(invoice.customerEmail || '', 40, 185)
                .text(invoice.billingAddress?.street || 'Corporate Office', 40, 198)
                .text(`${invoice.billingAddress?.city || 'Bengaluru'}, ${invoice.billingAddress?.state || 'KA'} - ${invoice.billingAddress?.postalCode || '560001'}`, 40, 211)
                .text(`Country: ${invoice.billingAddress?.country || 'India'}`, 40, 224);
            doc
                .fillColor('#71717a')
                .fontSize(9)
                .font('Helvetica-Bold')
                .text('BILLING PERIOD:', 350, 155, { align: 'right' });
            const periodStart = new Date(invoice.billingPeriodStart).toLocaleDateString('en-IN');
            const periodEnd = new Date(invoice.billingPeriodEnd).toLocaleDateString('en-IN');
            doc
                .font('Helvetica')
                .fontSize(9)
                .fillColor('#18181b')
                .text(`${periodStart} to ${periodEnd}`, 350, 170, { align: 'right' })
                .text(`Currency: ${invoice.currency}`, 350, 185, { align: 'right' });
            // Table Header
            const tableTop = 250;
            doc
                .rect(40, tableTop, 515, 22)
                .fill('#fff7ed'); // Orange 50
            doc
                .fillColor('#9a3412') // Orange 800
                .fontSize(9)
                .font('Helvetica-Bold')
                .text('DESCRIPTION', 50, tableTop + 6)
                .text('QTY', 310, tableTop + 6, { width: 40, align: 'center' })
                .text('UNIT PRICE', 360, tableTop + 6, { width: 65, align: 'right' })
                .text('TAX', 435, tableTop + 6, { width: 45, align: 'right' })
                .text('TOTAL', 490, tableTop + 6, { width: 55, align: 'right' });
            // Items Rows
            let y = tableTop + 28;
            const displayItems = items.length > 0
                ? items
                : [
                    {
                        description: 'Subscription Plan License & Automated Features',
                        quantity: 1,
                        unitPrice: invoice.subtotal,
                        taxRate: invoice.taxRate,
                        taxAmount: invoice.taxAmount,
                        amount: invoice.totalAmount,
                    },
                ];
            displayItems.forEach((item) => {
                doc
                    .fillColor('#18181b')
                    .fontSize(9)
                    .font('Helvetica')
                    .text(item.description, 50, y, { width: 250 })
                    .text(String(item.quantity), 310, y, { width: 40, align: 'center' })
                    .text(`${invoice.currency} ${item.unitPrice.toLocaleString('en-IN')}`, 360, y, { width: 65, align: 'right' })
                    .text(`${item.taxRate}%`, 435, y, { width: 45, align: 'right' })
                    .text(`${invoice.currency} ${item.amount.toLocaleString('en-IN')}`, 490, y, { width: 55, align: 'right' });
                y += 24;
            });
            // Bottom Divider
            doc
                .moveTo(40, y + 5)
                .lineTo(555, y + 5)
                .strokeColor('#e4e4e7')
                .stroke();
            // Totals & Indian GST Split
            const customerState = invoice.billingAddress?.state?.toLowerCase() || 'karnataka';
            const isInterstate = !customerState.includes('karnataka') && !customerState.includes('ka');
            const halfTax = Math.round((invoice.taxAmount / 2) * 100) / 100;
            const totalsY = y + 15;
            let curY = totalsY;
            doc
                .font('Helvetica')
                .fontSize(9)
                .fillColor('#52525b')
                .text('Taxable Subtotal:', 340, curY, { width: 130, align: 'right' })
                .text(`${invoice.currency} ${invoice.subtotal.toLocaleString('en-IN')}`, 480, curY, { width: 65, align: 'right' });
            curY += 15;
            if (invoice.currency === 'INR') {
                if (isInterstate) {
                    doc
                        .text('IGST (18% - Inter-State):', 340, curY, { width: 130, align: 'right' })
                        .text(`${invoice.currency} ${invoice.taxAmount.toLocaleString('en-IN')}`, 480, curY, { width: 65, align: 'right' });
                    curY += 15;
                }
                else {
                    doc
                        .text('CGST (9% - Central):', 340, curY, { width: 130, align: 'right' })
                        .text(`${invoice.currency} ${halfTax.toLocaleString('en-IN')}`, 480, curY, { width: 65, align: 'right' });
                    curY += 15;
                    doc
                        .text('SGST (9% - State):', 340, curY, { width: 130, align: 'right' })
                        .text(`${invoice.currency} ${halfTax.toLocaleString('en-IN')}`, 480, curY, { width: 65, align: 'right' });
                    curY += 15;
                }
            }
            else {
                doc
                    .text(`Tax (${invoice.taxRate}%):`, 340, curY, { width: 130, align: 'right' })
                    .text(`${invoice.currency} ${invoice.taxAmount.toLocaleString('en-IN')}`, 480, curY, { width: 65, align: 'right' });
                curY += 15;
            }
            if (invoice.discountAmount > 0) {
                doc
                    .text(`Discount (${invoice.discountCode || 'Applied'}):`, 340, curY, { width: 130, align: 'right' })
                    .text(`-${invoice.currency} ${invoice.discountAmount.toLocaleString('en-IN')}`, 480, curY, { width: 65, align: 'right' });
                curY += 15;
            }
            // Grand Total Box
            const grandTotalY = curY + 6;
            doc
                .rect(340, grandTotalY - 4, 215, 26)
                .fill('#ea580c'); // Orange background
            doc
                .fillColor('#ffffff')
                .fontSize(10)
                .font('Helvetica-Bold')
                .text('GRAND TOTAL:', 350, grandTotalY + 4)
                .text(`${invoice.currency} ${invoice.totalAmount.toLocaleString('en-IN')}`, 465, grandTotalY + 4, { width: 80, align: 'right' });
            // Notes & Footer
            doc
                .fillColor('#71717a')
                .fontSize(8)
                .font('Helvetica')
                .text('Notes: Payments can be made online via Razorpay (UPI, Credit/Debit Cards, NetBanking). This is a computer generated invoice and requires no physical signature.', 40, 690, { width: 515, align: 'center' })
                .text('Powered by SubFlow 2.0 • AI-Powered Subscription & Revenue Intelligence Platform', 40, 715, {
                width: 515,
                align: 'center',
            });
            doc.end();
        }
        catch (err) {
            reject(err);
        }
    });
}
