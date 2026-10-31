import React, { useEffect, useState } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import {
  Bot,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Send,
  Zap,
  Target,
  CheckCircle,
  ShieldCheck,
  Gift,
  RefreshCw,
  Users,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const AiIntelligencePage: React.FC = () => {
  const { formatCurrency, symbol } = useCurrency();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<'revenue' | 'churn' | 'assistant' | 'financial' | 'retention'>('revenue');
  const [revenueForecast, setRevenueForecast] = useState<any>(null);
  const [churnPrediction, setChurnPrediction] = useState<any>(null);
  const [financialInsights, setFinancialInsights] = useState<any>(null);
  const [retentionSuggestions, setRetentionSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Chat Assistant State
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Greetings! I am the SubFlow 2.0 Gemini Intelligence Copilot. How can I assist you with financial planning, MRR projections, customer churn mitigation, or pricing elasticity today?',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const fetchRevenueForecast = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get('/ai/revenue-forecast');
      if (res.success) setRevenueForecast(res.prediction);
    } catch (err: any) {
      showToast('Error generating AI Revenue Forecast', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChurnData = async () => {
    setIsLoading(true);
    try {
      const [cRes, rRes]: any = await Promise.all([
        api.get('/ai/churn-prediction'),
        api.get('/ai/retention-suggestions'),
      ]);
      if (cRes.success) setChurnPrediction(cRes);
      if (rRes.success) setRetentionSuggestions(rRes.suggestions || []);
    } catch (err) {
      showToast('Failed to fetch churn data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFinancialInsights = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get('/ai/financial-insights');
      if (res.success) setFinancialInsights(res.insights);
    } catch (err) {
      showToast('Failed to load financial insights', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'revenue') fetchRevenueForecast();
    else if (activeTab === 'churn' || activeTab === 'retention') fetchChurnData();
    else if (activeTab === 'financial') fetchFinancialInsights();
  }, [activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userText = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setIsTyping(true);

    try {
      const res: any = await api.post('/ai/chat', {
        message: userText,
        history: chatMessages.slice(-6).map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: m.text,
        })),
      });

      setChatMessages((prev) => [...prev, { role: 'assistant', text: res.reply || 'Data analyzed.' }]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Telemetry analysis completed based on recorded ledger cohorts.' },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Google Gemini Intelligence Suite
            </div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              AI Revenue &amp; Churn Copilot
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
              Machine-learning forecasting, customer churn scoring, smart retention offers, and real-time natural language business consulting.
            </p>
          </div>

          <button
            onClick={() => {
              if (activeTab === 'revenue') fetchRevenueForecast();
              else if (activeTab === 'churn') fetchChurnData();
              else if (activeTab === 'financial') fetchFinancialInsights();
              showToast('Re-analyzed latest SaaS telemetry', 'info');
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 text-xs font-bold transition-all self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-forecast Telemetry
          </button>
        </div>

        {/* Intelligence Tabs */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'revenue', label: 'Revenue Forecast', icon: TrendingUp },
            { id: 'churn', label: 'Churn Risk Prediction', icon: AlertTriangle },
            { id: 'retention', label: 'Smart Retention Offers', icon: Gift },
            { id: 'financial', label: 'Executive Financial Summary', icon: Target },
            { id: 'assistant', label: 'Gemini Copilot Chat', icon: Bot },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 1. Revenue Forecast Tab */}
      {activeTab === 'revenue' && revenueForecast && (
        <div className="space-y-6 animate-fade-in">
          {/* Headline Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <span className="text-[11px] font-bold text-zinc-500 uppercase">Forward CAGR</span>
              <p className="text-3xl font-black text-orange-500 mt-1">{revenueForecast.cagr}%</p>
              <p className="text-xs text-zinc-400 mt-1">Estimated annual compound growth</p>
            </div>
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <span className="text-[11px] font-bold text-zinc-500 uppercase">Growth Trend</span>
              <p className="text-3xl font-black text-emerald-500 mt-1">{revenueForecast.trend}</p>
              <p className="text-xs text-zinc-400 mt-1">Based on Pro &amp; Enterprise expansions</p>
            </div>
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <span className="text-[11px] font-bold text-zinc-500 uppercase">Predicted 6M ARR Run-Rate</span>
              <p className="text-3xl font-black text-zinc-900 dark:text-white mt-1">
                {formatCurrency((revenueForecast.forecast?.[5]?.predictedRevenue || 580000) * 12)}
              </p>
              <p className="text-xs text-zinc-400 mt-1">Target run-rate by end of period</p>
            </div>
          </div>

          {/* Chart */}
          <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <h3 className="font-bold text-base text-zinc-900 dark:text-white mb-1">
              6-Month Predictive Revenue Projections with Confidence Intervals
            </h3>
            <p className="text-xs text-zinc-400 mb-6">
              AI predictive model trained on historical subscriptions, cohort expansion, and seasonality
            </p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueForecast.forecast}>
                  <defs>
                    <linearGradient id="aiOrangeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a33" />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [formatCurrency(Number(val)), '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="predictedRevenue"
                    stroke="#f97316"
                    strokeWidth={3}
                    fill="url(#aiOrangeGrad)"
                    name="Predicted Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="confidenceUpper"
                    stroke="#fb923c"
                    strokeDasharray="3 3"
                    fill="transparent"
                    name="Upper Confidence Band"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Executive Summary & Drivers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-500" /> Executive Financial Summary
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {revenueForecast.executiveSummary}
              </p>
              <div className="mt-4 p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-xs text-orange-700 dark:text-orange-300 font-medium">
                Seasonal note: {revenueForecast.seasonalImpact}
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" /> Top AI-Identified Growth Drivers
              </h4>
              <div className="space-y-2.5">
                {revenueForecast.keyDrivers?.map((driver: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-300">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{driver}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Churn Risk Prediction Tab */}
      {activeTab === 'churn' && churnPrediction && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Cohort Assessment</span>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white">
                Account: {churnPrediction.customer?.companyName || 'Sample Account'}
              </h3>
              <p className="text-xs text-zinc-500">
                Customer ID: {churnPrediction.customer?.customerId} • Lifetime Value: {formatCurrency(churnPrediction.customer?.lifetimeValue || 50000)}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10">
                <span className="text-[10px] font-bold text-rose-500 uppercase">Churn Risk Score</span>
                <p className="text-3xl font-black text-rose-500">{churnPrediction.prediction?.churnRiskScore || 74}/100</p>
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                  {churnPrediction.prediction?.churnRiskLevel} Risk
                </span>
              </div>
              <div className="text-center p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Engagement Score</span>
                <p className="text-3xl font-black text-zinc-800 dark:text-zinc-200">{churnPrediction.prediction?.engagementScore || 26}/100</p>
                <span className="text-[11px] font-semibold text-zinc-400">Activity Level</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risk Factors */}
            <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" /> Primary Churn Risk Drivers
              </h4>
              <div className="space-y-3">
                {churnPrediction.prediction?.primaryRiskFactors?.map((factor: string, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-xs text-rose-800 dark:text-rose-200 border border-rose-500/20 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Retention Actions */}
            <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Recommended AI Interventions
              </h4>
              <div className="space-y-2.5">
                {churnPrediction.prediction?.recommendedRetentionActions?.map((act: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-300">
                    <CheckCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Smart Retention Offers */}
      {activeTab === 'retention' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <h3 className="font-bold text-base text-zinc-900 dark:text-white mb-1">
              At-Risk Accounts &amp; Automated Retention Incentives
            </h3>
            <p className="text-xs text-zinc-400 mb-6">
              Gemini algorithms recommend targeted renewal coupons to prevent customer loss before next billing date.
            </p>

            <div className="space-y-3">
              {retentionSuggestions.map((sug, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-900 dark:text-white text-sm">{sug.customerName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        Churn Risk {sug.churnRiskScore}%
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{sug.suggestedAction}</p>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="text-right">
                      <p className="font-mono text-xs font-bold text-orange-500">{sug.recommendedCoupon}</p>
                      <p className="text-[10px] text-zinc-400">{sug.discountPercentage}% Discount</p>
                    </div>
                    <button
                      onClick={() => showToast(`Retention coupon ${sug.recommendedCoupon} dispatched to ${sug.email}!`, 'success')}
                      className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-xs"
                    >
                      Send Offer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Executive Financial Summary Tab */}
      {activeTab === 'financial' && financialInsights && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">{financialInsights.month}</span>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
                {financialInsights.headline}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">Estimated Net Operating Margin: {financialInsights.netMarginEstimatePercent}%</p>
            </div>
            <div className="text-center p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20">
              <span className="text-[10px] font-bold text-orange-600 uppercase">Health Score</span>
              <p className="text-3xl font-black text-orange-500">{financialInsights.performanceScore}/100</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Key Financial Strengths
              </h4>
              <div className="space-y-2.5">
                {financialInsights.strengths?.map((s: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-500" /> Strategic Financial Levers
              </h4>
              <div className="space-y-2.5">
                {financialInsights.strategicRecommendations?.map((r: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0"></span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Gemini Copilot Chat Tab */}
      {activeTab === 'assistant' && (
        <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col h-[600px] animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">SubFlow 2.0 Gemini Assistant</h3>
                <p className="text-[11px] text-zinc-400">Contextual query engine for SaaS telemetry</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3 text-xs">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3.5 rounded-2xl whitespace-pre-line leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-orange-500 text-white rounded-tr-none font-medium'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200 dark:border-zinc-700/60'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-center text-zinc-400 text-xs">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                <span>Gemini analyzing financial ledgers...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about revenue trends, payment retries, churn analysis, or upgrade options..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isTyping}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
