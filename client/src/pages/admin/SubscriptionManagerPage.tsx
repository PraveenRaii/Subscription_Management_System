import React, { useEffect, useState } from 'react';
import { Subscription, Plan, Customer } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import {
  Repeat,
  Search,
  Filter,
  Plus,
  Play,
  Pause,
  RefreshCw,
  TrendingUp,
  XCircle,
  Users,
  Activity,
  Calendar,
  X,
  CheckCircle,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  DollarSign,
} from 'lucide-react';

export const SubscriptionManagerPage: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const { showToast } = useNotifications();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

  // Proration & Timeline states
  const [prorationPreview, setProrationPreview] = useState<any>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  // Form states
  const [newSubCustomer, setNewSubCustomer] = useState('');
  const [newSubPlan, setNewSubPlan] = useState('');
  const [newSubSeats, setNewSubSeats] = useState(1);
  const [targetPlanId, setTargetPlanId] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [usageMetric, setUsageMetric] = useState('api_calls');
  const [usageQuantity, setUsageQuantity] = useState(1000);

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get(`/subscriptions?status=${statusFilter}&search=${searchTerm}`);
      if (res.success) {
        setSubscriptions(res.subscriptions || []);
      }
    } catch (err: any) {
      showToast('Failed to load subscriptions', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const pRes: any = await api.get('/plans');
      if (pRes.success) setPlans(pRes.plans || []);
      const cRes: any = await api.get('/customers');
      if (cRes.success) setCustomers(cRes.customers || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchFormData();
  }, []);

  // Action handlers
  const handlePause = async (id: string) => {
    try {
      await api.post(`/subscriptions/${id}/pause`);
      showToast('Subscription paused successfully', 'info');
      fetchSubscriptions();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleResume = async (id: string) => {
    try {
      await api.post(`/subscriptions/${id}/resume`);
      showToast('Subscription resumed and active', 'success');
      fetchSubscriptions();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRenew = async (id: string) => {
    try {
      await api.post(`/subscriptions/${id}/renew`);
      showToast('Subscription renewed and invoice generated', 'success');
      fetchSubscriptions();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this subscription?')) return;
    try {
      await api.post(`/subscriptions/${id}/cancel`, { reason: 'Admin cancelled subscription' });
      showToast('Subscription cancelled', 'warning');
      fetchSubscriptions();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleApprove = async (id: string, subId: string) => {
    try {
      const res: any = await api.post(`/subscriptions/${id}/approve`);
      showToast(res.message || `Subscription ${subId} approved and activated!`, 'success');
      fetchSubscriptions();
    } catch (err: any) {
      showToast(err.message || 'Approval failed', 'error');
    }
  };

  const handleReject = async (id: string, subId: string) => {
    const reason = window.prompt(`Enter reason for declining ${subId}:`, 'Account details not verified');
    if (reason === null) return;
    try {
      const res: any = await api.post(`/subscriptions/${id}/reject`, { reason });
      showToast(res.message || `Subscription ${subId} rejected`, 'info');
      fetchSubscriptions();
    } catch (err: any) {
      showToast(err.message || 'Reject failed', 'error');
    }
  };

  const fetchProrationPreview = async (planId: string, sub?: Subscription) => {
    const activeSub = sub || selectedSub;
    if (!activeSub || !planId) return;
    setIsLoadingPreview(true);
    try {
      const res: any = await api.post(`/subscriptions/${activeSub._id}/preview-proration`, { targetPlanId: planId });
      if (res.success) {
        setProrationPreview(res.preview);
      }
    } catch (err: any) {
      console.error(err);
      setProrationPreview(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleOpenTimeline = async (sub: Subscription) => {
    setSelectedSub(sub);
    setShowTimelineModal(true);
    setIsLoadingTimeline(true);
    try {
      const res: any = await api.get(`/subscriptions/${sub._id}/timeline`);
      if (res.success) {
        setTimelineEvents(res.timeline || []);
      }
    } catch (err: any) {
      showToast('Failed to load activity timeline', 'error');
    } finally {
      setIsLoadingTimeline(false);
    }
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCustomer || !newSubPlan) {
      showToast('Please select customer and plan', 'warning');
      return;
    }
    try {
      await api.post('/subscriptions', {
        customerId: newSubCustomer,
        planId: newSubPlan,
        seatCount: newSubSeats,
      });
      showToast('Subscription activated successfully!', 'success');
      setShowCreateModal(false);
      fetchSubscriptions();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleChangePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub || !targetPlanId) return;
    try {
      const res: any = await api.post(`/subscriptions/${selectedSub._id}/change-plan`, { targetPlanId });
      showToast(res.message || 'Plan changed successfully with mathematical proration', 'success');
      setShowChangePlanModal(false);
      setProrationPreview(null);
      setTargetPlanId('');
      fetchSubscriptions();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub || !memberName || !memberEmail) return;
    try {
      await api.post(`/subscriptions/${selectedSub._id}/team-members`, {
        name: memberName,
        email: memberEmail,
      });
      showToast(`Invited ${memberName} to team`, 'success');
      setMemberName('');
      setMemberEmail('');
      setShowTeamModal(false);
      fetchSubscriptions();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRecordUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    try {
      await api.post(`/subscriptions/${selectedSub._id}/usage`, {
        metric: usageMetric,
        quantity: usageQuantity,
      });
      showToast(`Recorded ${usageQuantity} ${usageMetric} usage`, 'success');
      setShowUsageModal(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            Subscription Management
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage recurring lifecycle, team seats, metered usage, upgrades, and renewals.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Subscription</span>
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
            placeholder="Search by ID or customer..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['all', 'pending_approval', 'active', 'paused', 'past_due', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 shrink-0 ${
                statusFilter === st
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              {st === 'pending_approval' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
              {st === 'pending_approval' ? 'Pending Approval' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800/80 text-zinc-400 font-semibold uppercase text-[10px] bg-zinc-50/50 dark:bg-zinc-950/50">
                <th className="p-4">Subscription ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Plan &amp; Seats</th>
                <th className="p-4">Billing Frequency</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Renewal Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-400">
                    No subscriptions match your search filter.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub: any) => (
                  <tr key={sub._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-orange-600 dark:text-orange-400">
                      {sub.subscriptionId}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">
                        {sub.customer?.companyName || 'Corporate Client'}
                      </p>
                      <p className="text-[10px] text-zinc-400">{sub.customer?.customerId}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-zinc-900 dark:text-zinc-200">{sub.plan?.name}</p>
                      <p className="text-[10px] text-zinc-400">{sub.seatCount} Team Seats</p>
                    </td>
                    <td className="p-4 capitalize text-zinc-600 dark:text-zinc-400">
                      {sub.billingFrequency}
                    </td>
                    <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(sub.totalAmount, sub.currency)}
                    </td>
                    <td className="p-4 text-zinc-500">
                      {new Date(sub.renewalDate).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : sub.status === 'pending_approval'
                            ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] animate-pulse'
                            : sub.status === 'paused'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : sub.status === 'past_due'
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            : 'bg-zinc-500/10 text-zinc-400'
                        }`}
                      >
                        {sub.status === 'pending_approval' ? 'PENDING APPROVAL' : sub.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Approval Controls for Pending Requests */}
                        {sub.status === 'pending_approval' && (
                          <>
                            <button
                              onClick={() => handleApprove(sub._id, sub.subscriptionId)}
                              title="Approve Subscription"
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] shadow-xs flex items-center gap-1 transition-all mr-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleReject(sub._id, sub.subscriptionId)}
                              title="Reject Request"
                              className="px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 text-[11px] font-semibold transition-all mr-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {sub.status === 'active' ? (
                          <button
                            onClick={() => handlePause(sub._id)}
                            title="Pause Subscription"
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-amber-500"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        ) : sub.status === 'paused' ? (
                          <button
                            onClick={() => handleResume(sub._id)}
                            title="Resume Subscription"
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-emerald-500"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        ) : null}

                        {sub.status !== 'pending_approval' && (
                          <button
                            onClick={() => handleRenew(sub._id)}
                            title="Renew Now"
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-orange-500"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedSub(sub);
                            setProrationPreview(null);
                            setTargetPlanId('');
                            setShowChangePlanModal(true);
                          }}
                          title="Upgrade / Downgrade with Proration"
                          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-blue-500"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenTimeline(sub)}
                          title="View Activity Timeline"
                          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-amber-500"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedSub(sub);
                            setShowTeamModal(true);
                          }}
                          title="Team Seats"
                          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-purple-500"
                        >
                          <Users className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedSub(sub);
                            setShowUsageModal(true);
                          }}
                          title="Record Usage"
                          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-emerald-500"
                        >
                          <Activity className="w-3.5 h-3.5" />
                        </button>

                        {sub.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancel(sub._id)}
                            title="Cancel Subscription"
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

      {/* Modal 1: Create Subscription */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Create New Subscription</h3>
            <p className="text-xs text-zinc-500 mb-4">Activate a new recurring plan for an onboarded customer.</p>

            <form onSubmit={handleCreateSubscription} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Customer
                </label>
                <select
                  value={newSubCustomer}
                  onChange={(e) => setNewSubCustomer(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.companyName} ({c.customerId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Plan</label>
                <select
                  value={newSubPlan}
                  onChange={(e) => setNewSubPlan(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                >
                  <option value="">Select plan...</option>
                  {plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} - {formatCurrency(p.priceINR)} / {p.billingFrequency}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Team Seats
                </label>
                <input
                  type="number"
                  min={1}
                  value={newSubSeats}
                  onChange={(e) => setNewSubSeats(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/25"
              >
                Activate Subscription
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Change Plan (Upgrade / Downgrade) */}
      {showChangePlanModal && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowChangePlanModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Upgrade / Downgrade Plan</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Current Plan: <strong>{selectedSub.plan?.name}</strong> ({selectedSub.subscriptionId})
            </p>

            <form onSubmit={handleChangePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Target Plan
                </label>
                <select
                  value={targetPlanId}
                  onChange={(e) => {
                    setTargetPlanId(e.target.value);
                    fetchProrationPreview(e.target.value);
                  }}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                >
                  <option value="">Choose new plan...</option>
                  {plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({formatCurrency(p.priceINR)} / {p.billingFrequency})
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Proration Breakdown Card */}
              {isLoadingPreview ? (
                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-center text-xs text-zinc-400">
                  Calculating proration adjustments...
                </div>
              ) : prorationPreview ? (
                <div className="p-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-orange-500/10">
                    <span className="font-bold flex items-center gap-1.5 text-zinc-900 dark:text-white">
                      {prorationPreview.type === 'upgrade' ? (
                        <>
                          <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                            Plan Upgrade
                          </span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-4 h-4 text-amber-500" />
                          <span className="text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-[10px]">
                            Plan Downgrade
                          </span>
                        </>
                      )}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {prorationPreview.daysRemaining} of {prorationPreview.totalDaysInCycle} days remaining
                    </span>
                  </div>

                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400 text-[11px]">
                    <span>Unused Credit ({prorationPreview.currentPlan}):</span>
                    <span className="font-mono text-zinc-800 dark:text-zinc-200">
                      - {formatCurrency(prorationPreview.unusedCredit, prorationPreview.currency)}
                    </span>
                  </div>

                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400 text-[11px]">
                    <span>Prorated Cost ({prorationPreview.targetPlan}):</span>
                    <span className="font-mono text-zinc-800 dark:text-zinc-200">
                      + {formatCurrency(prorationPreview.targetPlanProratedCost, prorationPreview.currency)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-orange-500/10 flex justify-between items-center font-bold">
                    <span className="text-zinc-900 dark:text-white">
                      {prorationPreview.type === 'upgrade' ? 'Net Charge Due Today:' : 'Credit Added to Balance:'}
                    </span>
                    <span
                      className={`text-sm font-mono ${
                        prorationPreview.type === 'upgrade'
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {prorationPreview.type === 'upgrade'
                        ? formatCurrency(prorationPreview.totalDueToday, prorationPreview.currency)
                        : formatCurrency(prorationPreview.surplusCreditApplied, prorationPreview.currency)}
                    </span>
                  </div>
                </div>
              ) : null}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/25"
              >
                Confirm Plan Transition with Proration
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Team Seats */}
      {showTeamModal && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowTeamModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Team Members & Seats</h3>
            <p className="text-xs text-zinc-500 mb-3">
              Allocated Seats: {selectedSub.teamMembers?.length || 0} / {selectedSub.seatCount}
            </p>

            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {selectedSub.teamMembers?.map((m: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-xs">
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">{m.name}</p>
                    <p className="text-[10px] text-zinc-400">{m.email}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 uppercase">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddMember} className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Invite New Member</h4>
              <input
                type="text"
                placeholder="Full Name"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
              />
              <input
                type="email"
                placeholder="Work Email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
              >
                Send Invite
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Record Usage */}
      {showUsageModal && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowUsageModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Log Metered Usage</h3>
            <p className="text-xs text-zinc-500 mb-4">Record consumption for {selectedSub.subscriptionId}</p>

            <form onSubmit={handleRecordUsage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Metric</label>
                <select
                  value={usageMetric}
                  onChange={(e) => setUsageMetric(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                >
                  <option value="api_calls">API Calls</option>
                  <option value="storage_gb">Storage (GB)</option>
                  <option value="compute_hours">Compute Hours</option>
                  <option value="bandwidth_gb">Bandwidth (GB)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={usageQuantity}
                  onChange={(e) => setUsageQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
              >
                Record Usage Record
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Modal 5: Activity Timeline */}
      {showTimelineModal && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setShowTimelineModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <History className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Subscription Activity Timeline</h3>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Audit trail and lifecycle transitions for <strong className="font-mono text-orange-500">{selectedSub.subscriptionId}</strong>
            </p>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {isLoadingTimeline ? (
                <div className="py-8 text-center text-xs text-zinc-400">Loading activity timeline...</div>
              ) : timelineEvents.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400">No events logged yet for this subscription.</div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
                  {timelineEvents.map((evt, idx) => (
                    <div key={idx} className="relative group">
                      {/* Timeline Dot */}
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-orange-500 ring-4 ring-orange-500/20" />
                      
                      <div className="p-3.5 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                            {evt.event}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {new Date(evt.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-800 dark:text-zinc-200 font-medium mt-1">
                          {evt.description}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-1">
                          Triggered by: <span className="text-zinc-600 dark:text-zinc-300 font-semibold">{evt.actor || 'System'}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => setShowTimelineModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-200"
              >
                Close Timeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
