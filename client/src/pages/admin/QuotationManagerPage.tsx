import React, { useEffect, useState } from 'react';
import { Quotation } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import {
  FileCheck,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Send,
  Trash2,
  X,
  Building,
} from 'lucide-react';

export const QuotationManagerPage: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const { showToast } = useNotifications();

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // New Quotation Modal
  const [showModal, setShowModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [templateName, setTemplateName] = useState('Standard Enterprise SaaS Quotation');
  const [validDays, setValidDays] = useState(30);
  const [items, setItems] = useState([
    { name: 'Enterprise Scale License (Annual)', description: 'Dedicated node & 25 seats', quantity: 1, unitPrice: 380000, discount: 20000 },
  ]);

  const fetchQuotations = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get(`/quotations?search=${searchTerm}`);
      if (res.success) setQuotations(res.quotations || []);
    } catch (err: any) {
      showToast('Failed to load quotations', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [searchTerm]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { name: '', description: '', quantity: 1, unitPrice: 0, discount: 0 },
    ]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Computations
  const subtotal = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0) - (Number(it.discount) || 0),
    0
  );
  const taxAmount = Math.round((subtotal * 18) / 100);
  const grandTotal = subtotal + taxAmount;

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/quotations', {
        customerName,
        customerEmail,
        companyName,
        templateName,
        validDays,
        items,
      });
      showToast('Quotation created successfully!', 'success');
      setShowModal(false);
      fetchQuotations();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.put(`/quotations/${id}/status`, { status });
      showToast(`Quotation status updated to ${status}`, 'success');
      fetchQuotations();
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
            Custom Quotation &amp; Proposal Builder
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Design enterprise price proposals with multi-line items, GST calculation, and templates.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Quotation</span>
        </button>
      </div>

      {/* Quotations List */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800/80 text-zinc-400 font-semibold uppercase text-[10px] bg-zinc-50/50 dark:bg-zinc-950/50">
                <th className="p-4">Quotation #</th>
                <th className="p-4">Client / Company</th>
                <th className="p-4">Template</th>
                <th className="p-4">Subtotal</th>
                <th className="p-4">Grand Total</th>
                <th className="p-4">Valid Until</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
              {quotations.map((q) => (
                <tr key={q._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4 font-mono font-bold text-orange-600 dark:text-orange-400">
                    {q.quotationNumber}
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">{q.companyName || q.customerName}</p>
                    <p className="text-[10px] text-zinc-400">{q.customerEmail}</p>
                  </td>
                  <td className="p-4 text-zinc-500">{q.templateName}</td>
                  <td className="p-4 font-mono">{formatCurrency(q.subtotal, q.currency)}</td>
                  <td className="p-4 font-bold text-zinc-900 dark:text-white">
                    {formatCurrency(q.grandTotal, q.currency)}
                  </td>
                  <td className="p-4 text-zinc-500">{new Date(q.validUntil).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        q.status === 'accepted'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : q.status === 'sent'
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {q.status === 'draft' && (
                        <button
                          onClick={() => handleStatusChange(q._id, 'sent')}
                          className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-orange-500 text-xs text-orange-500"
                        >
                          Mark Sent
                        </button>
                      )}
                      {q.status === 'sent' && (
                        <button
                          onClick={() => handleStatusChange(q._id, 'accepted')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-xs font-bold"
                        >
                          Accept
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Quotation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Create Custom Quotation</h3>
            <p className="text-xs text-zinc-500 mb-4">Draft bespoke pricing, services, and payment terms.</p>

            <form onSubmit={handleCreateQuotation} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    placeholder="e.g. David Henderson"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Vortex Global Corp"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                  placeholder="david@vortex.io"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>

              {/* Line Items Builder */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Line Items &amp; Services</h4>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-xs font-bold text-orange-500 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>

                {items.map((it, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder="Item name (e.g. Annual License)"
                        value={it.name}
                        onChange={(e) => updateItem(idx, 'name', e.target.value)}
                        required
                        className="flex-1 px-2.5 py-1.5 rounded-lg border text-xs bg-white dark:bg-zinc-900"
                      />
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} className="text-rose-500 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-zinc-400">Qty</span>
                        <input
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                          className="w-full p-1.5 rounded-lg border text-xs bg-white dark:bg-zinc-900"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400">Rate (INR)</span>
                        <input
                          type="number"
                          value={it.unitPrice}
                          onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                          className="w-full p-1.5 rounded-lg border text-xs bg-white dark:bg-zinc-900"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400">Discount (INR)</span>
                        <input
                          type="number"
                          value={it.discount}
                          onChange={(e) => updateItem(idx, 'discount', e.target.value)}
                          className="w-full p-1.5 rounded-lg border text-xs bg-white dark:bg-zinc-900"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-500/20 text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%):</span>
                  <span className="font-mono">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-orange-600 dark:text-orange-400 pt-1 border-t border-orange-500/30">
                  <span>Grand Total:</span>
                  <span className="font-mono">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
              >
                Create Quotation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
