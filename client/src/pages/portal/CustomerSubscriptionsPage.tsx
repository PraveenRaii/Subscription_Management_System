import React, { useEffect, useState } from 'react';
import { Subscription, Plan } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import {
  Repeat,
  Calendar,
  Users,
  TrendingUp,
  Pause,
  Play,
  XCircle,
  CheckCircle,
  Sparkles,
  ArrowRight,
  X,
  Plus,
  CreditCard,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { RazorpayCheckoutModal } from '../../components/common/RazorpayCheckoutModal';

export const CustomerSubscriptionsPage: React.FC = () => {
  const { formatCurrency, currency } = useCurrency();
  const { showToast } = useNotifications();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to New Plan Modal
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [selectedNewPlan, setSelectedNewPlan] = useState<Plan | null>(null);
  const [newSeats, setNewSeats] = useState(1);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [activeInvoiceForPayment, setActiveInvoiceForPayment] = useState<any | null>(null);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);

  // Upgrade Modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [targetPlanId, setTargetPlanId] = useState('');

  const fetchCustomerSubs = async () => {
    setIsLoading(true);
    try {
      const [sRes, pRes]: any = await Promise.all([
        api.get('/subscriptions'),
        api.get('/plans'),
      ]);
      if (sRes.success) setSubscriptions(sRes.subscriptions || []);
      if (pRes.success) setPlans(pRes.plans || []);
    } catch (err: any) {
      showToast('Error loading your subscriptions', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerSubs();
  }, []);

  const handlePause = async (id: string) => {
    try {
      await api.post(`/subscriptions/${id}/pause`);
      showToast('Your subscription is now paused.', 'info');
      fetchCustomerSubs();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleResume = async (id: string) => {
    try {
      await api.post(`/subscriptions/${id}/resume`);
      showToast('Subscription resumed and active!', 'success');
      fetchCustomerSubs();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this plan? You will retain access until the current period ends.')) return;
    try {
      await api.post(`/subscriptions/${id}/cancel`, { reason: 'Cancelled via customer portal' });
      showToast('Subscription has been cancelled.', 'warning');
      fetchCustomerSubs();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleConfirmUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub || !targetPlanId) return;
    try {
      await api.post(`/subscriptions/${selectedSub._id}/change-plan`, { targetPlanId });
      showToast('Subscription plan upgraded successfully!', 'success');
      setShowUpgradeModal(false);
      fetchCustomerSubs();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSubscribeNewPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNewPlan) return;
    setIsSubscribing(true);
    try {
      const res: any = await api.post('/subscriptions', {
        planId: selectedNewPlan._id,
        seatCount: Number(newSeats) || 1,
      });
      if (res.success) {
        showToast(`Subscribed to ${selectedNewPlan.name} successfully! Initial invoice created.`, 'success');
        setShowSubscribeModal(false);
        fetchCustomerSubs();
        if (res.invoice) {
          setActiveInvoiceForPayment(res.invoice);
          setShowRazorpayModal(true);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Subscription failed', 'error');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">My Active Subscriptions</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage your plan renewals, team seats, upgrades, and billing preferences.
          </p>
        </div>

        <button
          onClick={() => {
            if (plans.length > 0) setSelectedNewPlan(plans[0]);
            setShowSubscribeModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Subscribe to New Plan</span>
        </button>
      </div>

      {subscriptions.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <Repeat className="w-10 h-10 text-orange-500 mx-auto mb-3" />
          <h3 className="font-bold text-base text-zinc-900 dark:text-white">No Active Subscriptions</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto mb-6">
            You do not currently have an active plan. Select a tier to activate recurring access and unlock platform features.
          </p>
          <button
            onClick={() => {
              if (plans.length > 0) setSelectedNewPlan(plans[0]);
              setShowSubscribeModal(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/25 transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Browse Plans &amp; Subscribe</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub) => (
            <div
              key={sub._id}
              className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-zinc-900 dark:text-white">{sub.plan?.name}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      sub.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : sub.status === 'pending_approval'
                        ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] animate-pulse'
                        : sub.status === 'paused'
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    }`}
                  >
                    {sub.status === 'pending_approval' ? 'Pending Admin Approval' : sub.status}
                  </span>
                </div>

                {sub.status === 'pending_approval' && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Your request has been submitted. An administrator will review and activate your subscription shortly.</span>
                  </div>
                )}

                <p className="text-xs text-zinc-400">
                  Subscription ID: <span className="font-mono text-orange-500">{sub.subscriptionId}</span> • Frequency: {sub.billingFrequency}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600 dark:text-zinc-300 pt-2">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-orange-500" />
                    Next Renewal: {new Date(sub.renewalDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Users className="w-3.5 h-3.5 text-orange-500" />
                    {sub.seatCount} Team Seats ({sub.teamMembers?.length || 1} Assigned)
                  </span>
                </div>
              </div>

              {/* Pricing & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 self-stretch md:self-auto justify-between border-t md:border-t-0 pt-4 md:pt-0 border-zinc-100 dark:border-zinc-800">
                <div className="text-left md:text-right">
                  <p className="text-xs text-zinc-400">Recurring Price</p>
                  <p className="text-2xl font-black text-zinc-900 dark:text-white">
                    {formatCurrency(sub.totalAmount, sub.currency)}
                  </p>
                  <p className="text-[10px] text-zinc-400">incl. 18% GST</p>
                </div>

                <div className="flex items-center gap-2">
                  {sub.status === 'pending_approval' ? (
                    <span className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Awaiting Admin Approval</span>
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setSelectedSub(sub);
                          setShowUpgradeModal(true);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Change Plan</span>
                      </button>

                      {sub.status === 'active' ? (
                        <button
                          onClick={() => handlePause(sub._id)}
                          className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 text-zinc-600 dark:text-zinc-300 hover:text-amber-500 text-xs font-semibold transition-colors"
                          title="Pause billing temporarily"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      ) : sub.status === 'paused' ? (
                        <button
                          onClick={() => handleResume(sub._id)}
                          className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 text-zinc-600 dark:text-zinc-300 hover:text-emerald-500 text-xs font-semibold transition-colors"
                          title="Resume billing"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      ) : null}

                      {sub.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCancel(sub._id)}
                          className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-rose-500 text-zinc-600 dark:text-zinc-300 hover:text-rose-500 text-xs font-semibold transition-colors"
                          title="Cancel Subscription"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upgrade / Downgrade Modal */}
      {showUpgradeModal && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 bg-zinc-950/70 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Upgrade or Adjust Plan</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Switching from <strong>{selectedSub.plan?.name}</strong> to a higher or customized tier.
            </p>

            <form onSubmit={handleConfirmUpgrade} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Choose New Plan
                </label>
                <select
                  value={targetPlanId}
                  onChange={(e) => setTargetPlanId(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                >
                  <option value="">Select available plan...</option>
                  {plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} - {formatCurrency(p.priceINR)} / {p.billingFrequency}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/25"
              >
                Apply Plan Change
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Subscribe to New Plan Modal */}
      {showSubscribeModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 bg-zinc-950/75 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 md:p-8 relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowSubscribeModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-orange-500" />
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Choose Your Subscription Plan</h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
              Submit your subscription request. An administrator will review and authorize your account before billing activation.
            </p>

            <div className="flex-1 overflow-y-auto pr-1 space-y-6">
              {/* Plan Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {plans.map((p) => {
                  const isSelected = selectedNewPlan?._id === p._id;
                  const planPrice = currency === 'USD' ? p.priceUSD : currency === 'EUR' ? p.priceEUR : p.priceINR;
                  return (
                    <div
                      key={p._id}
                      onClick={() => {
                        setSelectedNewPlan(p);
                        setNewSeats(p.minSeats || 1);
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-orange-500/5 ring-2 ring-orange-500/20 shadow-sm'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-zinc-900 dark:text-white">{p.name}</span>
                        {isSelected && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mb-3">{p.description || 'Full-featured enterprise plan'}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-zinc-900 dark:text-white font-mono">
                          {formatCurrency(planPrice)}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-semibold uppercase">
                          / {p.billingFrequency}
                        </span>
                      </div>
                      {p.isTeamPlan && (
                        <span className="mt-2 inline-block text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                          Includes {p.minSeats} seats (+{formatCurrency(p.seatPrice)}/seat)
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Selected Plan Details & Seats */}
              {selectedNewPlan && (
                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <span>Plan Configuration</span>
                    <span className="text-orange-500 font-bold">{selectedNewPlan.name}</span>
                  </div>

                  {selectedNewPlan.isTeamPlan && (
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          Team Seats
                        </label>
                        <span className="text-[10px] text-zinc-400">
                          Minimum {selectedNewPlan.minSeats} seats included
                        </span>
                      </div>
                      <input
                        type="number"
                        min={selectedNewPlan.minSeats || 1}
                        value={newSeats}
                        onChange={(e) => setNewSeats(Math.max(selectedNewPlan.minSeats || 1, Number(e.target.value)))}
                        className="w-20 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono font-bold text-center"
                      />
                    </div>
                  )}

                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 space-y-1 text-xs text-zinc-500">
                    <div className="flex justify-between">
                      <span>Base Plan Price:</span>
                      <span className="font-mono text-zinc-800 dark:text-zinc-200">
                        {formatCurrency(
                          currency === 'USD'
                            ? selectedNewPlan.priceUSD
                            : currency === 'EUR'
                            ? selectedNewPlan.priceEUR
                            : selectedNewPlan.priceINR
                        )}
                      </span>
                    </div>
                    {selectedNewPlan.isTeamPlan && newSeats > selectedNewPlan.minSeats && (
                      <div className="flex justify-between">
                        <span>Extra Seats ({newSeats - selectedNewPlan.minSeats}):</span>
                        <span className="font-mono text-zinc-800 dark:text-zinc-200">
                          +{formatCurrency((newSeats - selectedNewPlan.minSeats) * selectedNewPlan.seatPrice)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>GST (18% Standard SAC 997331):</span>
                      <span className="font-mono text-zinc-800 dark:text-zinc-200">
                        {formatCurrency(
                          Math.round(
                            ((currency === 'USD'
                              ? selectedNewPlan.priceUSD
                              : currency === 'EUR'
                              ? selectedNewPlan.priceEUR
                              : selectedNewPlan.priceINR) +
                              (selectedNewPlan.isTeamPlan && newSeats > selectedNewPlan.minSeats
                                ? (newSeats - selectedNewPlan.minSeats) * selectedNewPlan.seatPrice
                                : 0)) *
                              0.18
                          )
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-sm text-zinc-900 dark:text-white pt-2 border-t border-zinc-200 dark:border-zinc-700">
                      <span>Total Due Today:</span>
                      <span className="text-orange-500 font-mono text-base">
                        {formatCurrency(
                          Math.round(
                            ((currency === 'USD'
                              ? selectedNewPlan.priceUSD
                              : currency === 'EUR'
                              ? selectedNewPlan.priceEUR
                              : selectedNewPlan.priceINR) +
                              (selectedNewPlan.isTeamPlan && newSeats > selectedNewPlan.minSeats
                                ? (newSeats - selectedNewPlan.minSeats) * selectedNewPlan.seatPrice
                                : 0)) *
                              1.18
                          )
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowSubscribeModal(false)}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubscribeNewPlan}
                disabled={!selectedNewPlan || isSubscribing}
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-orange-500/25 transition-all flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSubscribing ? 'Submitting Request...' : 'Submit Request for Admin Approval'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Razorpay Checkout Modal after initial subscription */}
      {showRazorpayModal && activeInvoiceForPayment && (
        <RazorpayCheckoutModal
          invoice={activeInvoiceForPayment}
          isOpen={showRazorpayModal}
          onClose={() => {
            setShowRazorpayModal(false);
            setActiveInvoiceForPayment(null);
            fetchCustomerSubs();
          }}
          onSuccess={() => {
            setShowRazorpayModal(false);
            setActiveInvoiceForPayment(null);
            fetchCustomerSubs();
            showToast('Payment verified successfully! Your subscription is active.', 'success');
          }}
        />
      )}
    </div>
  );
};
