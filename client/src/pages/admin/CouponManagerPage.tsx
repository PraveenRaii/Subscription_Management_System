import React, { useEffect, useState } from 'react';
import { Coupon } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { Tag, Plus, CheckCircle2, XCircle, Search, Calendar, X } from 'lucide-react';

export const CouponManagerPage: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const { showToast } = useNotifications();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // New Coupon Modal
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(20);
  const [minPurchase, setMinPurchase] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState(5000);
  const [maxRedemptions, setMaxRedemptions] = useState(100);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get(`/coupons?search=${searchTerm}`);
      if (res.success) setCoupons(res.coupons || []);
    } catch (err: any) {
      showToast('Error loading coupons', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [searchTerm]);

  const handleToggle = async (id: string) => {
    try {
      const res: any = await api.put(`/coupons/${id}/toggle`);
      showToast(res.message, 'info');
      fetchCoupons();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/coupons', {
        code,
        name,
        discountType,
        discountValue,
        minPurchaseAmount: minPurchase,
        maxDiscountAmount: maxDiscount,
        maxRedemptions,
      });
      showToast('Promotional coupon created successfully!', 'success');
      setShowModal(false);
      setCode('');
      setName('');
      fetchCoupons();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            Coupons &amp; Promotional Deals
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Configure percentage and fixed discount vouchers, redemption ceilings, and auto-applied offers.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Coupon</span>
        </button>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {coupons.map((c) => (
          <div
            key={c._id}
            className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
              c.isActive
                ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-xs'
                : 'border-zinc-200 dark:border-zinc-800/50 bg-zinc-100/50 dark:bg-zinc-900/30 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-sm font-extrabold text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  {c.code}
                </span>
                <button
                  onClick={() => handleToggle(c._id)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    c.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-200 text-zinc-500'
                  }`}
                >
                  {c.isActive ? 'Active' : 'Disabled'}
                </button>
              </div>

              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{c.name}</h4>
              <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{c.description || 'General promotion'}</p>

              <div className="my-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Discount:</span>
                  <span className="font-bold text-orange-500">
                    {c.discountType === 'percentage' ? `${c.discountValue}%` : formatCurrency(c.discountValue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Redemptions:</span>
                  <span className="font-mono">{c.redemptionCount} / {c.maxRedemptions}</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-zinc-400 flex items-center gap-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <Calendar className="w-3 h-3" />
              Expires {new Date(c.endDate).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {/* Create Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 bg-zinc-950/70 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Create Promotional Code</h3>
            <p className="text-xs text-zinc-500 mb-4">Set discount value, redemption quotas, and limits.</p>

            <form onSubmit={handleCreateCoupon} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Coupon Code</label>
                <input
                  type="text"
                  placeholder="e.g. FLASH30"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono font-bold uppercase text-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Campaign Title</label>
                <input
                  type="text"
                  placeholder="e.g. Q4 Growth Discount"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Value</label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    value={maxRedemptions}
                    onChange={(e) => setMaxRedemptions(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Max Discount Cap</label>
                  <input
                    type="number"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/25 mt-2"
              >
                Create Coupon
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
