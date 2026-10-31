import React, { useEffect, useState } from 'react';
import { Payment } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { exportToCSV } from '../../services/exportUtils';
import {
  CreditCard,
  Search,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  X,
  ShieldCheck,
} from 'lucide-react';

export const PaymentManagerPage: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const { showToast } = useNotifications();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Refund Modal
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('Customer requested refund');

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get(`/payments?status=${statusFilter}&search=${searchTerm}`);
      if (res.success) {
        setPayments(res.payments || []);
      }
    } catch (err: any) {
      showToast('Error loading payments', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, searchTerm]);

  const handleRetry = async (id: string) => {
    try {
      await api.post(`/payments/${id}/retry`);
      showToast('Payment retry scheduled in Razorpay queue', 'info');
      fetchPayments();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    try {
      await api.post('/payments/refund', {
        paymentId: selectedPayment._id,
        amount: refundAmount,
        reason: refundReason,
      });
      showToast(`Refund of ${formatCurrency(refundAmount, selectedPayment.currency)} processed.`, 'success');
      setShowRefundModal(false);
      fetchPayments();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleExport = () => {
    if (payments.length > 0) {
      const rows = payments.map((p) => ({
        PaymentId: p.paymentId,
        Customer: p.customer?.companyName || 'Customer',
        Amount: p.amount,
        Currency: p.currency,
        Method: p.paymentMethod,
        GatewayTransactionId: p.gatewayTransactionId || '',
        Status: p.status,
        Date: new Date(p.createdAt).toLocaleDateString(),
      }));
      exportToCSV('Billflow_Payments', rows);
      showToast('Payments exported to CSV', 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            Payment Operations &amp; Settlements
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Razorpay UPI, card, and NetBanking ledger, retry scheduler, and partial/full refund manager.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Payments</span>
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
            placeholder="Search payment ID, transaction ref..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['all', 'success', 'failed', 'refunded'].map((st) => (
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

      {/* Payments Table */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800/80 text-zinc-400 font-semibold uppercase text-[10px] bg-zinc-50/50 dark:bg-zinc-950/50">
                <th className="p-4">Payment ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Method</th>
                <th className="p-4">Gateway Reference</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                payments.map((pay) => (
                  <tr key={pay._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-orange-600 dark:text-orange-400">
                      {pay.paymentId}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">
                        {pay.customer?.companyName || 'Corporate Client'}
                      </p>
                      <p className="text-[10px] text-zinc-400">{pay.customer?.customerId}</p>
                    </td>
                    <td className="p-4 font-bold text-zinc-900 dark:text-white">
                      {formatCurrency(pay.amount, pay.currency)}
                      {pay.refundedAmount > 0 && (
                        <span className="block text-[10px] text-rose-500 font-semibold">
                          Refunded: {formatCurrency(pay.refundedAmount, pay.currency)}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-300">
                        {pay.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-zinc-500">
                      {pay.gatewayTransactionId || pay.gatewayOrderId || 'Internal Settle'}
                    </td>
                    <td className="p-4 text-zinc-500">
                      {new Date(pay.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          pay.status === 'success'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : pay.status === 'failed'
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}
                      >
                        {pay.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {pay.status === 'success' && pay.refundedAmount < pay.amount && (
                          <button
                            onClick={() => {
                              setSelectedPayment(pay);
                              setRefundAmount(pay.amount - pay.refundedAmount);
                              setShowRefundModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-orange-500 text-zinc-700 dark:text-zinc-300 hover:text-orange-500 text-[11px] font-semibold transition-colors flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" /> Refund
                          </button>
                        )}

                        {pay.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(pay._id)}
                            className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold transition-colors flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" /> Retry ({pay.retryCount})
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

      {/* Process Refund Modal */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 bg-zinc-950/70 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4">
          <div className="w-full max-w-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowRefundModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Process Gateway Refund</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Refund for Payment {selectedPayment.paymentId} (Max: {formatCurrency(selectedPayment.amount - selectedPayment.refundedAmount, selectedPayment.currency)})
            </p>

            <form onSubmit={handleProcessRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Refund Amount ({selectedPayment.currency})
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedPayment.amount - selectedPayment.refundedAmount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Refund Reason
                </label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Accidental duplicate charge or plan downgrade"
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/25"
              >
                Confirm and Issue Refund
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
