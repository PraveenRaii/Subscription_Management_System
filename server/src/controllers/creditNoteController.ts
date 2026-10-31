import { Response } from 'express';
import { CreditNote } from '../models/CreditNote.js';
import { Invoice } from '../models/Invoice.js';
import { Customer } from '../models/Customer.js';
import { AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/auditLogger.js';

// Create Credit Note / Refund Adjustment
export const createCreditNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { invoiceId, amount, reason, description } = req.body;

    if (!invoiceId || !amount) {
      res.status(400).json({ success: false, message: 'Invoice ID and credit note amount are required.' });
      return;
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    if (amount > invoice.totalAmount) {
      res.status(400).json({ success: false, message: 'Credit note amount cannot exceed invoice total.' });
      return;
    }

    const creditNoteNumber = `CN-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const creditNote = await CreditNote.create({
      creditNoteNumber,
      invoice: invoice._id,
      customer: invoice.customer,
      amount: Number(amount),
      currency: invoice.currency,
      reason: reason || 'refund',
      description: description || 'Credit adjustment processed by billing operations.',
      status: 'issued',
    });

    // Adjust invoice balance if unpaid
    if (invoice.status === 'unpaid' || invoice.status === 'overdue') {
      invoice.amountRemaining = Math.max(0, invoice.amountRemaining - amount);
      if (invoice.amountRemaining === 0) {
        invoice.status = 'paid';
      } else {
        invoice.status = 'partially_paid';
      }
      await invoice.save();
    }

    await logAudit({
      user: req.user,
      action: 'CREDIT_NOTE_ISSUED',
      entity: 'CreditNote',
      entityId: creditNote._id.toString(),
      details: { creditNoteNumber, invoiceNumber: invoice.invoiceNumber, amount, reason },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Credit note ${creditNoteNumber} issued successfully.`,
      creditNote,
      invoice,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// List Credit Notes
export const getCreditNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerId, invoiceId } = req.query;
    const filter: any = {};

    if (req.user?.role === 'customer') {
      const customer = await Customer.findOne({ user: req.user._id });
      if (!customer) {
        res.json({ success: true, creditNotes: [] });
        return;
      }
      filter.customer = customer._id;
    } else if (customerId) {
      filter.customer = customerId;
    }

    if (invoiceId) {
      filter.invoice = invoiceId;
    }

    const creditNotes = await CreditNote.find(filter)
      .populate('invoice customer')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      creditNotes,
      count: creditNotes.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
