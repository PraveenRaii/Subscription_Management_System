import React, { useEffect, useState } from 'react';
import { Product, Plan } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Tag,
  Clock,
  Layers,
  X,
  Sparkles,
} from 'lucide-react';

export const ProductPlanManagerPage: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<'plans' | 'products'>('plans');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Product Form
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<'SaaS' | 'API' | 'Analytics' | 'Addon' | 'Support'>('SaaS');
  const [prodDesc, setProdDesc] = useState('');
  const [prodTags, setProdTags] = useState('Core, SaaS');

  // Plan Form
  const [planName, setPlanName] = useState('');
  const [planCategory, setPlanCategory] = useState<'Starter' | 'Professional' | 'Enterprise'>('Starter');
  const [planFrequency, setPlanFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [planPriceINR, setPlanPriceINR] = useState(9999);
  const [planTrialDays, setPlanTrialDays] = useState(14);
  const [planGraceDays, setPlanGraceDays] = useState(7);
  const [planIsTeam, setPlanIsTeam] = useState(false);
  const [planSeatPrice, setPlanSeatPrice] = useState(1500);
  const [planMinSeats, setPlanMinSeats] = useState(1);
  const [planFeatures, setPlanFeatures] = useState('Unlimited API access\nGST Compliant Invoicing\nPriority Support');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pRes, plRes]: any = await Promise.all([api.get('/products'), api.get('/plans')]);
      if (pRes.success) setProducts(pRes.products || []);
      if (plRes.success) setPlans(plRes.plans || []);
    } catch (err: any) {
      showToast('Error loading products & plans', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/products', {
        name: prodName,
        category: prodCategory,
        description: prodDesc,
        tags: prodTags.split(',').map((t) => t.trim()),
      });
      showToast('Product created successfully!', 'success');
      setShowProductModal(false);
      setProdName('');
      setProdDesc('');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/plans', {
        name: planName,
        category: planCategory,
        billingFrequency: planFrequency,
        priceINR: planPriceINR,
        trialDays: planTrialDays,
        gracePeriodDays: planGraceDays,
        isTeamPlan: planIsTeam,
        seatPrice: planSeatPrice,
        minSeats: planMinSeats,
        features: planFeatures.split('\n').filter((f) => f.trim()),
      });
      showToast('Billing plan created successfully!', 'success');
      setShowPlanModal(false);
      setPlanName('');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Delete this product and its variants?')) return;
    try {
      await api.delete(`/products/${id}`);
      showToast('Product removed', 'info');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('Delete this billing plan?')) return;
    try {
      await api.delete(`/plans/${id}`);
      showToast('Plan removed', 'info');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
            Products &amp; Plans Catalog
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Configure multi-tier pricing plans, trial periods, variants, and optional add-ons.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeTab === 'plans' ? (
            <button
              onClick={() => setShowPlanModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Plan</span>
            </button>
          ) : (
            <button
              onClick={() => setShowProductModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 w-fit">
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'plans'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Billing Plans ({plans.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'products'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Catalog ({products.length})</span>
        </button>
      </div>

      {/* Plans View */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                plan.isPopular
                  ? 'border-orange-500 bg-white dark:bg-zinc-900 shadow-xl ring-1 ring-orange-500/30'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                    {plan.category}
                  </span>
                  <button
                    onClick={() => handleDeletePlan(plan._id)}
                    className="text-zinc-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{plan.name}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  {plan.description || 'Configured SaaS subscription plan'}
                </p>

                <div className="my-5 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-zinc-900 dark:text-white">
                    {formatCurrency(plan.priceINR)}
                  </span>
                  <span className="text-xs text-zinc-400">/{plan.billingFrequency}</span>
                </div>

                {/* Plan Highlights */}
                <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300 mb-6">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    <span>Trial: {plan.trialDays} days • Grace: {plan.gracePeriodDays} days</span>
                  </div>
                  {plan.isTeamPlan && (
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <Tag className="w-3.5 h-3.5 text-orange-500" />
                      <span>Team Plan: {formatCurrency(plan.seatPrice)}/seat (min {plan.minSeats})</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5">
                    {plan.features?.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span className="text-[11px]">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                <span className="font-mono">{plan.planId}</span>
                <span className="text-emerald-500">Active</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Products View */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((prod) => (
            <div
              key={prod._id}
              className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                    {prod.category}
                  </span>
                  <button
                    onClick={() => handleDeleteProduct(prod._id)}
                    className="text-zinc-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-base font-bold text-zinc-900 dark:text-white">{prod.name}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  {prod.description}
                </p>

                {/* Tags */}
                <div className="flex items-center flex-wrap gap-1.5 my-4">
                  {prod.tags?.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                <span className="font-mono text-[10px]">{prod.productId}</span>
                <span>{prod.variantsCount || 1} Variants</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Create Product */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowProductModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Create Product</h3>
            <p className="text-xs text-zinc-500 mb-4">Add a new SaaS module or add-on service.</p>

            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Product Name</label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  required
                  placeholder="e.g. AI Workflow Automation Engine"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Category</label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                >
                  <option value="SaaS">SaaS Platform</option>
                  <option value="API">Developer API</option>
                  <option value="Analytics">Analytics</option>
                  <option value="Addon">Optional Add-on</option>
                  <option value="Support">Support</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                <textarea
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  rows={2}
                  placeholder="Module summary..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={prodTags}
                  onChange={(e) => setProdTags(e.target.value)}
                  placeholder="SaaS, AI, Enterprise"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
              >
                Create Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Plan */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPlanModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Create Billing Plan</h3>
            <p className="text-xs text-zinc-500 mb-4">Set pricing, billing cycle, trial days, and team seat pricing.</p>

            <form onSubmit={handleCreatePlan} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    required
                    placeholder="e.g. Growth Pro Tier"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Category</label>
                  <select
                    value={planCategory}
                    onChange={(e) => setPlanCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Frequency</label>
                  <select
                    value={planFrequency}
                    onChange={(e) => setPlanFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Price (INR)</label>
                  <input
                    type="number"
                    value={planPriceINR}
                    onChange={(e) => setPlanPriceINR(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Trial (Days)</label>
                  <input
                    type="number"
                    value={planTrialDays}
                    onChange={(e) => setPlanTrialDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Grace Period (Days)</label>
                  <input
                    type="number"
                    value={planGraceDays}
                    onChange={(e) => setPlanGraceDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                  />
                </div>
              </div>

              {/* Team Plan Toggle */}
              <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={planIsTeam}
                    onChange={(e) => setPlanIsTeam(e.target.checked)}
                    className="rounded text-orange-500 focus:ring-orange-500"
                  />
                  <span>Enable Team / Seat-Based Pricing</span>
                </label>
                {planIsTeam && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <span className="text-[10px] text-zinc-400">Seat Price (INR)</span>
                      <input
                        type="number"
                        value={planSeatPrice}
                        onChange={(e) => setPlanSeatPrice(Number(e.target.value))}
                        className="w-full p-1.5 rounded-lg border text-xs bg-white dark:bg-zinc-900"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400">Min Seats</span>
                      <input
                        type="number"
                        value={planMinSeats}
                        onChange={(e) => setPlanMinSeats(Number(e.target.value))}
                        className="w-full p-1.5 rounded-lg border text-xs bg-white dark:bg-zinc-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Features (one per line)
                </label>
                <textarea
                  value={planFeatures}
                  onChange={(e) => setPlanFeatures(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
              >
                Create Billing Plan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
