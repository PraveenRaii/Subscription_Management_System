import React, { useEffect, useState } from 'react';
import { Invoice } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { RazorpayCheckoutModal } from '../../components/common/RazorpayCheckoutModal';
import { InvoiceStatusBadge } from '../../components/common/InvoiceStatusBadge';
import { FileText, Download, CreditCard, Tag, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export const CustomerInvoicesPage: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const { showToast } = useNotifications();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');

  const fetchCustomerInvoices = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get('/invoices');
      if (res.success) {
        setInvoices(res.invoices || []);
      }
    } catch (err: any) {
      showToast('Error loading your invoices', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerInvoices();
  }, []);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !couponCode) return;
    try {
      await api.post(`/invoices/${selectedInvoice._id}/apply-coupon`, { couponCode });
      showToast('Coupon applied and invoice totals reduced!', 'success');
      setShowCouponModal(false);
      setCouponCode('');
      fetchCustomerInvoices();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Billing &amp; Invoices</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          View receipts, download GST-compliant PDFs, and settle outstanding balances via Razorpay.
        </p>
      </div>

      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-semibold uppercase text-[10px] bg-zinc-50/50 dark:bg-zinc-950/50">
                <th className="p-4">Invoice #</th>
                <th className="p-4">Issue Date</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Subtotal</th>
                <th className="p-4">GST (18%)</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-400">
                    No invoices generated for your account yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-orange-600 dark:text-orange-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="p-4 text-zinc-500">{new Date(inv.issueDate).toLocaleDateString()}</td>
                    <td className="p-4 text-zinc-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
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
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/api/invoices/${inv._id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          title="Download PDF"
                          className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-orange-500 text-zinc-600 dark:text-zinc-300 hover:text-orange-500 text-[11px] font-semibold transition-colors flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> PDF
                        </a>

                        {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setShowCouponModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 text-amber-600 dark:text-amber-400 text-[11px] font-semibold"
                            >
                              Coupon
                            </button>

                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setShowPayModal(true);
                              }}
                              className="px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] shadow-sm flex items-center gap-1"
                            >
                              <CreditCard className="w-3 h-3" /> Pay Now
                            </button>
                          </>
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

      {/* Coupon Modal */}
      {showCouponModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowCouponModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Apply Discount Coupon</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Enter promotional or loyalty code for Invoice #{selectedInvoice.invoiceNumber}
            </p>

            <form onSubmit={handleApplyCoupon} className="space-y-4">
              <input
                type="text"
                placeholder="e.g. BILLFLOW20"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs uppercase font-mono font-bold text-orange-500"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
              >
                Apply Coupon Code
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
            fetchCustomerInvoices();
          }}
        />
      )}
    </div>
  );
};
