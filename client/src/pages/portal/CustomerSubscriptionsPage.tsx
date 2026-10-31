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
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const CustomerSubscriptionsPage: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const { showToast } = useNotifications();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">My Active Subscriptions</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Manage your plan renewals, team seats, upgrades, and billing preferences.
        </p>
      </div>

      {subscriptions.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <Repeat className="w-10 h-10 text-orange-500 mx-auto mb-3" />
          <h3 className="font-bold text-base text-zinc-900 dark:text-white">No Active Subscriptions</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            You do not currently have an active plan. Select a tier to activate recurring access.
          </p>
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
                        : sub.status === 'paused'
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>

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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upgrade / Downgrade Modal */}
      {showUpgradeModal && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
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
    </div>
  );
};
