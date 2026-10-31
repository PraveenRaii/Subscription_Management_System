import React, { useEffect, useState } from 'react';
import { Invoice } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { exportToCSV } from '../../services/exportUtils';
import { RazorpayCheckoutModal } from '../../components/common/RazorpayCheckoutModal';
import { InvoiceStatusBadge } from '../../components/common/InvoiceStatusBadge';
import {
  FileText,
  Search,
  Download,
  Mail,
  CreditCard,
  XCircle,
  Tag,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  RotateCcw,
} from 'lucide-react';

export const InvoiceManagerPage: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const { showToast } = useNotifications();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);
  const [creditNoteAmount, setCreditNoteAmount] = useState<number>(0);
  const [creditNoteReason, setCreditNoteReason] = useState('refund');
  const [creditNoteDescription, setCreditNoteDescription] = useState('');
  const [isIssuingCreditNote, setIsIssuingCreditNote] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get(`/invoices?status=${statusFilter}&search=${searchTerm}`);
      if (res.success) {
        setInvoices(res.invoices || []);
      }
    } catch (err: any) {
      showToast('Error loading invoices', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, searchTerm]);

  const handleSendEmail = async (id: string, invNum: string) => {
    try {
      await api.post(`/invoices/${id}/send-email`);
      showToast(`Invoice ${invNum} emailed to customer successfully!`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCancelInvoice = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this invoice?')) return;
    try {
      await api.post(`/invoices/${id}/cancel`);
      showToast('Invoice marked as cancelled', 'warning');
      fetchInvoices();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !couponCode) return;
    try {
      await api.post(`/invoices/${selectedInvoice._id}/apply-coupon`, { couponCode });
      showToast('Coupon applied and invoice totals adjusted!', 'success');
      setShowCouponModal(false);
      setCouponCode('');
      fetchInvoices();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleIssueCreditNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !creditNoteAmount) return;
    setIsIssuingCreditNote(true);
    try {
      const res: any = await api.post('/credit-notes', {
        invoiceId: selectedInvoice._id,
        amount: creditNoteAmount,
        reason: creditNoteReason,
        description: creditNoteDescription,
      });
      showToast(res.message || 'Credit note issued successfully!', 'success');
      setShowCreditNoteModal(false);
      fetchInvoices();
    } catch (err: any) {
      showToast(err.message || 'Failed to issue credit note', 'error');
    } finally {
      setIsIssuingCreditNote(false);
    }
  };

  const viewInvoiceDetails = async (inv: Invoice) => {
    setSelectedInvoice(inv);
    try {
      const res: any = await api.get(`/invoices/${inv._id}`);
      if (res.success) {
        setInvoiceDetails(res);
        setShowDetailsModal(true);
      }
    } catch (err: any) {
      showToast('Failed to load invoice items', 'error');
    }
  };

  const handleExport = () => {
    if (invoices.length > 0) {
      const rows = invoices.map((i) => ({
        InvoiceNumber: i.invoiceNumber,
        Customer: i.customerName,
        Email: i.customerEmail,
        IssueDate: new Date(i.issueDate).toLocaleDateString(),
        DueDate: new Date(i.dueDate).toLocaleDateString(),
        Subtotal: i.subtotal,
        TaxAmount: i.taxAmount,
        Discount: i.discountAmount,
        Total: i.totalAmount,
        Status: i.status,
      }));
      exportToCSV('Billflow_Invoices', rows);
      showToast('Exported invoices to CSV', 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            Smart Billing &amp; Invoice System
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Automated recurring invoices with 18% GST calculation, PDF downloads, and Razorpay settlements.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Invoices</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoice number, client..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['all', 'paid', 'unpaid', 'overdue', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                statusFilter === st
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800/80 text-zinc-400 font-semibold uppercase text-[10px] bg-zinc-50/50 dark:bg-zinc-950/50">
                <th className="p-4">Invoice #</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Issue Date</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Subtotal</th>
                <th className="p-4">GST (18%)</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-zinc-400">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-orange-600 dark:text-orange-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{inv.customerName}</p>
                      <p className="text-[10px] text-zinc-400">{inv.customerEmail}</p>
                    </td>
                    <td className="p-4 text-zinc-500">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-zinc-500">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-mono text-zinc-600 dark:text-zinc-300">
                      {formatCurrency(inv.subtotal, inv.currency)}
                    </td>
                    <td className="p-4 font-mono text-zinc-500">
                      {formatCurrency(inv.taxAmount, inv.currency)}
                    </td>
                    <td className="p-4 font-bold text-zinc-900 dark:text-white">
                      {formatCurrency(inv.totalAmount, inv.currency)}
                      {inv.discountAmount > 0 && (
                        <span className="block text-[10px] text-emerald-500 font-semibold">
                          -{formatCurrency(inv.discountAmount, inv.currency)} ({inv.discountCode})
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Item Breakdown */}
                        <button
                          onClick={() => viewInvoiceDetails(inv)}
                          title="View Invoice Items"
                          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-orange-500"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Direct PDF Download */}
                        <a
                          href={`/api/invoices/${inv._id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          title="Download PDF"
                          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-orange-500"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        {/* Send Email */}
                        <button
                          onClick={() => handleSendEmail(inv._id, inv.invoiceNumber)}
                          title="Send Email with PDF"
                          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-blue-500"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>

                        {/* Issue Credit Note / Refund Adjustment */}
                        {inv.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setCreditNoteAmount(inv.amountRemaining > 0 ? inv.amountRemaining : inv.totalAmount);
                              setCreditNoteReason('refund');
                              setCreditNoteDescription(`Credit adjustment for invoice ${inv.invoiceNumber}`);
                              setShowCreditNoteModal(true);
                            }}
                            title="Issue Credit Note / Refund"
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-purple-500"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Pay with Razorpay (if unpaid) */}
                        {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setShowPayModal(true);
                            }}
                            title="Pay with Razorpay"
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-emerald-500"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Apply Coupon (if unpaid) */}
                        {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setShowCouponModal(true);
                            }}
                            title="Apply Discount Coupon"
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-amber-500"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Void / Cancel */}
                        {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancelInvoice(inv._id)}
                            title="Void Invoice"
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-rose-500"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Apply Coupon */}
      {showCouponModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowCouponModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Apply Promotional Coupon</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Apply discount code to Invoice #{selectedInvoice.invoiceNumber}
            </p>

            <form onSubmit={handleApplyCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Coupon Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. BILLFLOW20"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs uppercase font-mono font-bold text-orange-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
              >
                Apply Discount
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: View Item Breakdown */}
      {showDetailsModal && invoiceDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowDetailsModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
                  {invoiceDetails.invoice?.invoiceNumber}
                </span>
              </div>
              <InvoiceStatusBadge status={invoiceDetails.invoice?.status} />
            </div>

            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Invoice Line Items</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Billed to {invoiceDetails.invoice?.customerName} ({invoiceDetails.invoice?.customerEmail})
            </p>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 mb-4">
              {invoiceDetails.items?.map((it: any) => (
                <div key={it._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-zinc-800 dark:text-zinc-200">{it.description}</p>
                    <p className="text-[10px] text-zinc-400">
                      Qty: {it.quantity} × {formatCurrency(it.unitPrice)} (Tax: {it.taxRate}%)
                    </p>
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(it.amount)}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoiceDetails.invoice?.subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>GST ({invoiceDetails.invoice?.taxRate}%):</span>
                <span>{formatCurrency(invoiceDetails.invoice?.taxAmount)}</span>
              </div>
              {invoiceDetails.invoice?.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-500 font-semibold">
                  <span>Discount:</span>
                  <span>-{formatCurrency(invoiceDetails.invoice?.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-zinc-900 dark:text-white pt-2 border-t border-zinc-200 dark:border-zinc-700">
                <span>Total Amount:</span>
                <span className="text-orange-500">{formatCurrency(invoiceDetails.invoice?.totalAmount)}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <a
                href={`/api/invoices/${invoiceDetails.invoice?._id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center font-bold text-xs hover:border-orange-500 transition-colors"
              >
                Download PDF
              </a>
              {invoiceDetails.invoice?.status !== 'paid' && (
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedInvoice(invoiceDetails.invoice);
                    setShowPayModal(true);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
                >
                  Pay with Razorpay
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Credit Note / Refund Modal */}
      {showCreditNoteModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowCreditNoteModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <RotateCcw className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Issue Credit Note / Refund</h3>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Adjustment for <strong className="font-mono text-orange-500">{selectedInvoice.invoiceNumber}</strong> ({selectedInvoice.customerName})
            </p>

            <form onSubmit={handleIssueCreditNote} className="space-y-4">
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-xs space-y-1">
                <div className="flex justify-between text-zinc-500">
                  <span>Invoice Total:</span>
                  <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                    {formatCurrency(selectedInvoice.totalAmount, selectedInvoice.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Balance Outstanding:</span>
                  <span className="font-mono font-bold text-rose-500">
                    {formatCurrency(selectedInvoice.amountRemaining, selectedInvoice.currency)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Credit Note Amount ({selectedInvoice.currency})
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedInvoice.totalAmount}
                  step="any"
                  value={creditNoteAmount}
                  onChange={(e) => setCreditNoteAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono font-bold text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Reason for Credit Adjustment
                </label>
                <select
                  value={creditNoteReason}
                  onChange={(e) => setCreditNoteReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                >
                  <option value="refund">Customer Refund</option>
                  <option value="billing_error">Billing / Pricing Discrepancy</option>
                  <option value="service_credit">SLA Outage / Service Credit</option>
                  <option value="plan_downgrade_proration">Plan Downgrade Proration</option>
                  <option value="goodwill">Commercial Goodwill Discount</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Description / Internal Memo
                </label>
                <textarea
                  rows={2}
                  value={creditNoteDescription}
                  onChange={(e) => setCreditNoteDescription(e.target.value)}
                  placeholder="Notes explaining why this credit note was authorized..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isIssuingCreditNote}
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-orange-500/25 transition-all"
              >
                {isIssuingCreditNote ? 'Processing Credit Note...' : 'Authorize & Issue Credit Note'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Razorpay Checkout Modal */}
      {showPayModal && selectedInvoice && (
        <RazorpayCheckoutModal
          invoice={selectedInvoice}
          isOpen={showPayModal}
          onClose={() => setShowPayModal(false)}
          onSuccess={() => {
            fetchInvoices();
          }}
        />
      )}
    </div>
  );
};
