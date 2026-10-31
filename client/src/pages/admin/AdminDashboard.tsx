import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { exportToCSV, exportToJSON } from '../../services/exportUtils';
import {
  TrendingUp,
  Users,
  Repeat,
  DollarSign,
  AlertTriangle,
  FileText,
  Zap,
  Download,
  Play,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { currency, formatCurrency, symbol } = useCurrency();
  const { showToast } = useNotifications();

  const [metrics, setMetrics] = useState<any>(null);
  const [revenueGrowth, setRevenueGrowth] = useState<any[]>([]);
  const [popularPlans, setPopularPlans] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningCycle, setIsRunningCycle] = useState(false);
  const [timePeriod, setTimePeriod] = useState('12m');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const data: any = await api.get(`/analytics/dashboard?currency=${currency}&period=${timePeriod}`);
      if (data.success) {
        setMetrics(data.metrics);
        setRevenueGrowth(data.revenueGrowth || []);
        setPopularPlans(data.popularPlans || []);
      }

      // Also fetch recent invoices
      const invData: any = await api.get('/invoices?limit=5');
      if (invData.success) {
        setRecentInvoices(invData.invoices || []);
      }
    } catch (err: any) {
      showToast('Error loading analytics telemetry', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currency, timePeriod]);

  // Run Recurring Billing Cycle
  const handleRunBillingCycle = async () => {
    setIsRunningCycle(true);
    try {
      const res: any = await api.post('/billing/run-cycle');
      showToast(
        `Automated cycle finished: ${res.result?.renewedCount || 0} renewed, ${res.result?.reminderCount || 0} reminders sent.`,
        'success'
      );
      fetchDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Billing cycle trigger failed', 'error');
    } finally {
      setIsRunningCycle(false);
    }
  };

  const handleExportCSV = () => {
    if (revenueGrowth.length > 0) {
      exportToCSV('SubFlow_Revenue_Growth', revenueGrowth);
      showToast('Revenue Growth exported to CSV', 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              Revenue Intelligence Dashboard
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              Live Real-Time
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Welcome back, <strong className="text-zinc-800 dark:text-zinc-200">{user?.name}</strong>. Centralized telemetry for subscriptions, billing, and Gemini forecasts.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Time Filter */}
          <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 text-xs font-semibold">
            <button
              onClick={() => setTimePeriod('30d')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                timePeriod === '30d' ? 'bg-orange-500 text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              30D
            </button>
            <button
              onClick={() => setTimePeriod('90d')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                timePeriod === '90d' ? 'bg-orange-500 text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              90D
            </button>
            <button
              onClick={() => setTimePeriod('12m')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                timePeriod === '12m' ? 'bg-orange-500 text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              12M
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export CSV</span>
          </button>

          {/* Trigger Automated Billing Cycle */}
          <button
            onClick={handleRunBillingCycle}
            disabled={isRunningCycle}
            title="Scan upcoming renewals, process auto-billing, and mark overdue invoices"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
          >
            {isRunningCycle ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Billing Scheduler...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Billing Cycle</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR Card */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-xs relative overflow-hidden group hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Monthly Recurring (MRR)
            </span>
            <span className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900 dark:text-white">
              {formatCurrency(metrics?.mrr || 485000)}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.2%
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">ARR Run-rate: {formatCurrency(metrics?.arr || 5820000)}</p>
        </div>

        {/* Active Subscriptions Card */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-xs hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Active Subscriptions
            </span>
            <span className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Repeat className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900 dark:text-white">
              {metrics?.activeSubscriptions || 142}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +8 this mo
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Total Customers: {metrics?.totalCustomers || 186}</p>
        </div>

        {/* Churn Rate Card */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-xs hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Cohort Churn Rate
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-500">
              {metrics?.churnRate || 2.1}%
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Optimal (&lt;3.5%)
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Average LTV: {formatCurrency(metrics?.customerLtv || 42800)}</p>
        </div>

        {/* Outstanding / Collection Efficiency */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-xs hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Outstanding Revenue
            </span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-500">
              {formatCurrency(metrics?.outstandingRevenue || 42500)}
            </span>
            <span className="text-xs font-bold text-zinc-400">
              {metrics?.failedPaymentsCount || 3} failed
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Collection Rate: {metrics?.collectionRate || 96.8}%</p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Growth Trend Area Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">
                Revenue Growth &amp; Target Forecast
              </h3>
              <p className="text-xs text-zinc-400">Monthly recurring billed revenue versus financial milestone</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-orange-500">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Actual Revenue
              </span>
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></span> Target
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueGrowth}>
                <defs>
                  <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a33" />
                <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${symbol}${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [formatCurrency(Number(value)), '']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f97316"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#orangeGrad)"
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke="#71717a"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="transparent"
                  name="Target"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Popular Plans Breakdown */}
        <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Popular Plans</h3>
              <Link to="/admin/products" className="text-xs font-bold text-orange-500 hover:underline">
                Manage Plans
              </Link>
            </div>
            <p className="text-xs text-zinc-400 mb-6">Distribution of subscribers across active tiers</p>

            <div className="space-y-4">
              {popularPlans.map((plan, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{plan.name}</span>
                    <span className="font-mono text-zinc-500">
                      {plan.subscribers} subs ({formatCurrency(plan.price)}/mo)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                      style={{ width: `${Math.min(100, (plan.subscribers / 45) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick AI Promotion Banner */}
          <div className="mt-6 p-4 rounded-2xl border border-orange-500/20 bg-orange-500/5">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemini Retention Optimization</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Automated retention campaign generated <strong>LOYALTY25</strong> coupon for 5 at-risk accounts.
            </p>
            <Link
              to="/admin/ai"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-600"
            >
              Open AI Intelligence Hub →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Recent Invoices</h3>
            <p className="text-xs text-zinc-400">Latest recurring billing invoices and payment statuses</p>
          </div>
          <Link to="/admin/invoices" className="text-xs font-bold text-orange-500 hover:underline">
            View All Invoices →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800/80 text-zinc-400 font-semibold uppercase text-[10px]">
                <th className="pb-3">Invoice Number</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Issue Date</th>
                <th className="pb-3">Due Date</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
              {recentInvoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 font-mono font-bold text-orange-600 dark:text-orange-400">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3">
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">{inv.customerName}</p>
                    <p className="text-[10px] text-zinc-400">{inv.customerEmail}</p>
                  </td>
                  <td className="py-3 text-zinc-500">
                    {new Date(inv.issueDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-zinc-500">
                    {new Date(inv.dueDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 font-bold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(inv.totalAmount, inv.currency)}
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : inv.status === 'overdue'
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}
                    >
                      {inv.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <a
                      href={`/api/invoices/${inv._id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-orange-500 text-zinc-700 dark:text-zinc-300 hover:text-orange-500 text-[11px] font-semibold transition-colors"
                    >
                      Download PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
