import React, { useEffect, useState } from 'react';
import { Customer } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { exportToCSV } from '../../services/exportUtils';
import { InvoiceStatusBadge } from '../../components/common/InvoiceStatusBadge';
import {
  Users,
  Search,
  Eye,
  Download,
  AlertTriangle,
  Gift,
  Building,
  Mail,
  Phone,
  X,
  CreditCard,
  Repeat,
} from 'lucide-react';

export const CustomerManagerPage: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const { showToast } = useNotifications();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Customer Details Modal
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get(`/customers?churnRiskLevel=${riskFilter}&search=${searchTerm}`);
      if (res.success) {
        setCustomers(res.customers || []);
      }
    } catch (err: any) {
      showToast('Failed to load customers', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [riskFilter, searchTerm]);

  const viewDetails = async (cust: Customer) => {
    setSelectedCustomer(cust);
    try {
      const res: any = await api.get(`/customers/${cust._id}`);
      if (res.success) {
        setCustomerDetails(res);
        setShowModal(true);
      }
    } catch (err) {
      showToast('Error loading customer record', 'error');
    }
  };

  const handleExport = () => {
    if (customers.length > 0) {
      const rows = customers.map((c) => ({
        CustomerId: c.customerId,
        Company: c.companyName,
        Currency: c.currency,
        TotalSpent: c.totalSpent,
        LTV: c.lifetimeValue,
        ChurnRisk: `${c.churnRiskScore}% (${c.churnRiskLevel})`,
        ReferralCode: c.referralCode,
        Status: c.status,
      }));
      exportToCSV('SubFlow_Customers', rows);
      showToast('Customer CRM data exported', 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            Customer Relationship &amp; Account Vault
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Accounts, Lifetime Value metrics, churn risk indicators, and referral program trackers.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Customers</span>
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
            placeholder="Search company, ID, email..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['all', 'Low', 'Medium', 'High'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setRiskFilter(lvl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                riskFilter === lvl
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              {lvl === 'all' ? 'All Risks' : `${lvl} Risk`}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Table */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800/80 text-zinc-400 font-semibold uppercase text-[10px] bg-zinc-50/50 dark:bg-zinc-950/50">
                <th className="p-4">Customer ID</th>
                <th className="p-4">Organization / User</th>
                <th className="p-4">Tax / GSTIN</th>
                <th className="p-4">Total Spent</th>
                <th className="p-4">Lifetime Value</th>
                <th className="p-4">Churn Risk Score</th>
                <th className="p-4">Referral Code</th>
                <th className="p-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
              {customers.map((cust) => (
                <tr key={cust._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4 font-mono font-bold text-orange-600 dark:text-orange-400">
                    {cust.customerId}
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">{cust.companyName}</p>
                    <p className="text-[10px] text-zinc-400">
                      {typeof cust.user === 'object' ? (cust.user as any)?.name : 'Customer'}
                    </p>
                  </td>
                  <td className="p-4 font-mono text-zinc-500">{cust.taxId || 'Not provided'}</td>
                  <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(cust.totalSpent, cust.currency)}
                  </td>
                  <td className="p-4 font-bold text-orange-500">
                    {formatCurrency(cust.lifetimeValue, cust.currency)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cust.churnRiskLevel === 'Low'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : cust.churnRiskLevel === 'Medium'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}
                    >
                      {cust.churnRiskScore}% ({cust.churnRiskLevel})
                    </span>
                  </td>
                  <td className="p-4 font-mono text-[11px] text-zinc-400">
                    {cust.referralCode || 'REF-N/A'}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => viewDetails(cust)}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-orange-500 text-zinc-600 hover:text-orange-500 transition-colors"
                      title="View Customer Profile"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer 360 Details Modal */}
      {showModal && customerDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {customerDetails.customer?.companyName}
                </h3>
                <p className="text-xs text-zinc-400">
                  ID: <span className="font-mono text-orange-500">{customerDetails.customer?.customerId}</span> • Primary: {customerDetails.customer?.user?.email}
                </p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Total Revenue</span>
                <p className="text-lg font-black text-zinc-900 dark:text-white">
                  {formatCurrency(customerDetails.customer?.totalSpent)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Estimated LTV</span>
                <p className="text-lg font-black text-orange-500">
                  {formatCurrency(customerDetails.customer?.lifetimeValue)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Churn Risk</span>
                <p className="text-lg font-black text-rose-500">
                  {customerDetails.customer?.churnRiskScore}%
                </p>
              </div>
            </div>

            {/* Active Subscriptions */}
            <div className="space-y-4 mb-6">
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Subscriptions</h4>
              <div className="space-y-2">
                {customerDetails.subscriptions?.map((sub: any) => (
                  <div
                    key={sub._id}
                    className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{sub.plan?.name}</p>
                      <p className="text-[10px] text-zinc-400">
                        Renewal: {new Date(sub.renewalDate).toLocaleDateString()} • {sub.seatCount} Seats
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                      {sub.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Invoices */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Billing History</h4>
              <div className="space-y-2">
                {customerDetails.invoices?.map((inv: any) => (
                  <div
                    key={inv._id}
                    className="p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-orange-500">{inv.invoiceNumber}</span>
                      <span className="text-[10px] text-zinc-400 ml-2">
                        {new Date(inv.issueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{formatCurrency(inv.totalAmount, inv.currency)}</span>
                      <InvoiceStatusBadge status={inv.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
