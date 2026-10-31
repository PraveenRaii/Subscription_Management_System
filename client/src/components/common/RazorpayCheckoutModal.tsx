import React, { useState } from 'react';
import { Invoice } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { CreditCard, QrCode, Building, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';

interface RazorpayModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RazorpayCheckoutModal: React.FC<RazorpayModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { formatCurrency } = useCurrency();
  const { showToast } = useNotifications();

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'checkout' | 'success'>('checkout');

  if (!isOpen) return null;

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      // 1. Create Order on backend
      const orderRes: any = await api.post('/payments/create-order', {
        invoiceId: invoice._id,
        paymentMethod,
      });

      const { order, keyId } = orderRes;

      // 2. If browser has window.Razorpay loaded and not simulated, try Razorpay checkout
      if ((window as any).Razorpay && !order.isSimulated) {
        const options = {
          key: keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'SubFlow 2.0',
          description: `Invoice #${invoice.invoiceNumber}`,
          order_id: order.id,
          handler: async function (response: any) {
            await verifyPaymentOnServer(order.id, response.razorpay_payment_id, response.razorpay_signature);
          },
          prefill: {
            name: invoice.customerName,
            email: invoice.customerEmail,
          },
          theme: {
            color: '#f97316', // Orange theme!
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        setIsProcessing(false);
        return;
      }

      // 3. Simulated instant test mode settlement
      setTimeout(async () => {
        const simPaymentId = `pay_sim_${Date.now()}`;
        const simSignature = `sig_sim_${Date.now()}`;
        await verifyPaymentOnServer(order.id, simPaymentId, simSignature);
      }, 1200);
    } catch (err: any) {
      setIsProcessing(false);
      showToast(err.message || 'Payment initiation failed', 'error');
    }
  };

  const verifyPaymentOnServer = async (orderId: string, paymentId: string, signature: string) => {
    try {
      await api.post('/payments/verify', {
        invoiceId: invoice._id,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        paymentMethod,
      });

      setStep('success');
      setIsProcessing(false);
      showToast(`Payment of ${formatCurrency(invoice.totalAmount, invoice.currency)} verified successfully!`, 'success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1800);
    } catch (err: any) {
      setIsProcessing(false);
      showToast(err.message || 'Payment verification failed', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'checkout' ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                Razorpay Checkout (Test Mode)
              </span>
            </div>

            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Pay Invoice</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Invoice #{invoice.invoiceNumber} for {invoice.customerName}
            </p>

            {/* Total Due Banner */}
            <div className="my-5 p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Total Amount Due</p>
                <p className="text-2xl font-black text-orange-600 dark:text-orange-400">
                  {formatCurrency(invoice.totalAmount, invoice.currency)}
                </p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5" /> 256-bit Encrypted
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 mb-6">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Select Payment Method</p>

              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <QrCode className="w-4 h-4 text-orange-500" />
                  <span>UPI (Google Pay, PhonePe, Paytm, BHIM)</span>
                </div>
                {paymentMethod === 'upi' && <span className="w-2 h-2 rounded-full bg-orange-500"></span>}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMethod === 'card'
                    ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-orange-500" />
                  <span>Credit / Debit Cards (Visa, Mastercard, RuPay)</span>
                </div>
                {paymentMethod === 'card' && <span className="w-2 h-2 rounded-full bg-orange-500"></span>}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('netbanking')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMethod === 'netbanking'
                    ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Building className="w-4 h-4 text-orange-500" />
                  <span>Net Banking (HDFC, ICICI, SBI, Axis)</span>
                </div>
                {paymentMethod === 'netbanking' && <span className="w-2 h-2 rounded-full bg-orange-500"></span>}
              </button>
            </div>

            {/* Pay Action */}
            <button
              onClick={handlePay}
              disabled={isProcessing}
              className="w-full py-3.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Processing with Razorpay...
                </>
              ) : (
                `Pay ${formatCurrency(invoice.totalAmount, invoice.currency)} Now`
              )}
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Payment Successful!</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              Invoice #{invoice.invoiceNumber} has been marked as PAID. Your subscription status is active.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
