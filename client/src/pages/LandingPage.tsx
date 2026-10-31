import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import {
  Repeat,
  Sparkles,
  Bot,
  CreditCard,
  FileText,
  ShieldCheck,
  TrendingUp,
  Zap,
  CheckCircle,
  ArrowRight,
  Sun,
  Moon,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { formatCurrency, symbol } = useCurrency();
  const { theme, toggleTheme } = useTheme();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const pricingPlans = [
    {
      name: 'Starter Edition',
      category: 'Starter',
      badge: 'Startups',
      priceMonthly: 4999,
      priceYearly: 49990,
      description: 'Everything required to launch automated SaaS subscription billing and invoicing.',
      features: [
        'Up to 500 active subscriptions',
        'Automated Razorpay UPI & Card checkout',
        'GST & tax compliant PDF invoices',
        'Customer Self-Service portal',
        'Basic revenue & churn telemetry',
        'Standard email notifications',
      ],
      cta: 'Start Free Trial',
      popular: false,
    },
    {
      name: 'Professional Tier',
      category: 'Professional',
      badge: 'Most Popular',
      priceMonthly: 14999,
      priceYearly: 149990,
      description: 'Ideal for scaling businesses seeking automated revenue intelligence and churn prevention.',
      features: [
        'Up to 5,000 active subscriptions',
        'Google Gemini AI Revenue & Churn Forecasts',
        'Custom quotation builder with Net-30 terms',
        'Automated dunning & payment retry scheduling',
        'Multi-currency billing (INR, USD, EUR)',
        'Usage-based metered billing records',
        'Priority 24/7 technical assistance',
      ],
      cta: 'Scale with Pro',
      popular: true,
    },
    {
      name: 'Enterprise Scale',
      category: 'Enterprise',
      badge: 'High Growth',
      priceMonthly: 39999,
      priceYearly: 399990,
      description: 'Custom infrastructure, unlimited volume, team seats, and white-labeled invoices.',
      features: [
        'Unlimited subscriptions & metered volume',
        'Full Gemini AI Intelligence Suite & Chat Copilot',
        'Custom multi-seat team management',
        'Complete audit log trail & webhook mesh',
        'Dedicated SLA & custom payment routing',
        'Named Customer Success Account Manager',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  const faqs = [
    {
      q: 'How does the Razorpay integration work in Billflow 2.0?',
      a: 'Billflow 2.0 integrates natively with Razorpay test mode, supporting UPI, credit/debit cards, and NetBanking. Payments are strictly verified server-side with HMAC-SHA256 signatures, and webhooks automatically update invoice and subscription statuses.',
    },
    {
      q: 'How do the Google Gemini AI Intelligence features generate insights?',
      a: 'The platform aggregates your historical billing ledgers, usage frequency, and customer interactions. Gemini analyzes these cohorts to forecast future MRR, assess churn risk scores (0-100), recommend plan upgrades, and answer real-time financial questions in the AI Copilot.',
    },
    {
      q: 'Can customers manage their own team members and invoices?',
      a: 'Yes! Billflow 2.0 provides a dedicated Customer Self-Service Portal where customers can view their active subscriptions, download GST-compliant PDF invoices, pay via Razorpay, invite team members, and check usage quotas without contacting support.',
    },
    {
      q: 'How does duplicate invoice prevention work?',
      a: 'Every recurring billing invoice is backed by an automated cryptographic idempotency key generated from the subscription ID and billing period. The scheduler guarantees that even under network retries, an invoice cannot be generated twice.',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-orange-500 selection:text-white transition-colors duration-200">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 h-16 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-4 sm:px-8">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/25">
              <Repeat className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-lg tracking-tight">
              Bill<span className="text-orange-500">flow</span>
            </span>
            <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 px-1.5 py-0.5 bg-orange-500/10 rounded-md">
              2.0
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            <a href="#features" className="hover:text-orange-500 transition-colors">Features</a>
            <a href="#ai-intelligence" className="hover:text-orange-500 transition-colors">AI Intelligence</a>
            <a href="#pricing" className="hover:text-orange-500 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-orange-500 transition-colors">FAQ</a>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-orange-500 rounded-lg"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated ? (
              user?.role === 'customer' ? (
                <Link
                  to="/portal/subscriptions"
                  className="whitespace-nowrap text-[11px] sm:text-xs font-bold px-2.5 sm:px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5"
                >
                  <span>My Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <Link
                  to="/admin"
                  className="whitespace-nowrap text-[11px] sm:text-xs font-bold px-2.5 sm:px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5"
                >
                  <span>Admin Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex whitespace-nowrap text-xs font-semibold px-3 sm:px-4 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="whitespace-nowrap text-[11px] sm:text-xs font-bold px-2.5 sm:px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-orange-500/10 dark:bg-orange-500/15 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center">
          <div className="mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-2 px-3 py-1.5 rounded-2xl sm:rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[11px] sm:text-xs font-bold mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="min-w-0 text-center">Billflow 2.0 • AI-Powered Revenue Intelligence Platform</span>
          </div>

          <h1 className="text-3xl min-[380px]:text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-zinc-900 dark:text-white max-w-4xl mx-auto leading-[1.12]">
            Transform Recurring Billing into an{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600">
              Intelligent Revenue Engine
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Automate the entire subscription lifecycle, simplify Razorpay billing, eliminate revenue churn with Google Gemini AI, and empower customers through self-service portals.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-xl shadow-orange-500/30 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>Explore Demo Accounts</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/portal"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4 text-orange-500" />
              <span>Customer Portal View</span>
            </Link>
          </div>

          {/* Quick Metrics Ticker */}
          <div className="mt-14 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
            <div className="p-3 text-center">
              <p className="text-2xl font-black text-orange-600 dark:text-orange-400">INR 4.85 L</p>
              <p className="text-[11px] font-semibold text-zinc-500">Current MRR (+14.2%)</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-2xl font-black text-zinc-900 dark:text-white">96.8%</p>
              <p className="text-[11px] font-semibold text-zinc-500">Collection Velocity</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-2xl font-black text-emerald-500">2.1%</p>
              <p className="text-[11px] font-semibold text-zinc-500">Low Churn Rate</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-2xl font-black text-amber-500">Gemini 1.5</p>
              <p className="text-[11px] font-semibold text-zinc-500">AI Intelligence Core</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-20 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/40 dark:bg-zinc-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-2">
              Comprehensive Platform Capabilities
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
              Engineered for Scalable SaaS Operations
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:border-orange-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
                <Repeat className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-zinc-900 dark:text-white mb-2">Lifecycle Management</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Automate activations, pausing, resumes, upgrades, and cancellations with grace period rules and team seat management.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:border-orange-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-zinc-900 dark:text-white mb-2">Smart GST Invoicing</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Automatically generate downloadable PDF tax invoices with 18% GST calculation, coupon deductions, and duplicate prevention.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:border-orange-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
                <CreditCard className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-zinc-900 dark:text-white mb-2">Razorpay Payment Engine</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Support UPI, Cards, and NetBanking with HMAC server verification, automated retry scheduling, and instant refunds.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:border-orange-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
                <Bot className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-zinc-900 dark:text-white mb-2">Gemini AI Copilot</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Interactive AI Assistant to answer queries about revenue, customers, churn, and financial forecasts with real numbers.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:border-orange-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-zinc-900 dark:text-white mb-2">Predictive Revenue Analytics</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Forecast 6-month ARR run-rates, evaluate customer churn risk scores, and view interactive Recharts growth trends.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:border-orange-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-zinc-900 dark:text-white mb-2">Role-Based Security & Audit</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Strict isolation between Super Admin, Staff, and Customer portals with tamper-proof audit trails and rate limiting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-2">
              Transparent SaaS Pricing
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
              Pick the Perfect Plan for Your Growth
            </h3>

            {/* Monthly vs Annual Toggle */}
            <div className="mt-6 flex w-fit max-w-full flex-wrap items-center justify-center gap-1 sm:gap-3 p-1 rounded-2xl sm:rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm mx-auto">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap ${
                  billingCycle === 'monthly'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all flex flex-wrap items-center justify-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <span>Yearly Commitment</span>
                <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-extrabold">
                  Save 2 Months
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`p-7 rounded-3xl border transition-all relative flex flex-col justify-between ${
                  plan.popular
                    ? 'border-orange-500 bg-white dark:bg-zinc-900 shadow-2xl shadow-orange-500/10 ring-2 ring-orange-500/20'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-orange-500 text-white text-[11px] font-extrabold tracking-wider uppercase shadow-md shadow-orange-500/25">
                    {plan.badge}
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-zinc-900 dark:text-white">{plan.name}</h4>
                    {!plan.popular && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">{plan.description}</p>

                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-zinc-900 dark:text-white">
                      {formatCurrency(billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly)}
                    </span>
                    <span className="text-xs font-semibold text-zinc-400">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>

                  <div className="space-y-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-300">
                        <CheckCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  to={isAuthenticated ? (user?.role === 'customer' ? '/portal/subscriptions' : '/admin') : '/register'}
                  className={`mt-8 w-full py-3 rounded-xl font-bold text-xs text-center transition-all ${
                    plan.popular
                      ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25'
                      : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-20 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-2">
              Frequently Asked Questions
            </h2>
            <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-white">
              Everything You Need to Know
            </h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left font-bold text-sm text-zinc-900 dark:text-white flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-orange-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-10 px-4 sm:px-8 bg-white dark:bg-zinc-950 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-xs">
              B
            </div>
            <span className="font-bold text-zinc-900 dark:text-white">Billflow 2.0</span>
            <span>• AI-Powered SaaS Subscription & Revenue Intelligence Platform</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <a href="mailto:coder4986@gmail.com" className="text-orange-500 hover:underline font-medium">
              Help Desk: coder4986@gmail.com
            </a>
            <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">•</span>
            <p>© 2026 Billflow Technologies Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
