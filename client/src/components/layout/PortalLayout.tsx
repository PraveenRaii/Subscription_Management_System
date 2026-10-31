import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency, Currency } from '../../context/CurrencyContext';
import { ProfileModal } from '../common/ProfileModal';
import {
  Repeat,
  FileText,
  Activity,
  Users,
  Bot,
  Gift,
  Settings,
  Sun,
  Moon,
  LogOut,
  Shield,
} from 'lucide-react';

export const PortalLayout: React.FC = () => {
  const { user, customer, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/portal', label: 'My Subscriptions', icon: Repeat, end: true },
    { to: '/portal/invoices', label: 'Billing & Invoices', icon: FileText },
    { to: '/portal/usage', label: 'Usage & Quota', icon: Activity },
    { to: '/portal/team', label: 'Team Seats', icon: Users },
    { to: '/portal/ai-assistant', label: 'AI Support Assistant', icon: Bot },
    { to: '/portal/referrals', label: 'Referral Rewards', icon: Gift },
    { to: '/portal/settings', label: 'Billing Profile', icon: Settings },
  ];

  return (
    <div className="min-h-screen min-w-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Portal Top Bar */}
      <header className="sticky top-0 z-40 h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/portal" className="flex min-w-0 items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Repeat className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="shrink-0 font-extrabold text-base tracking-tight text-zinc-900 dark:text-white">
              Bill<span className="text-orange-500">flow</span>
            </span>
            <span className="hidden sm:inline-flex text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 font-semibold border border-orange-200 dark:border-orange-900/60">
              Customer Portal
            </span>
          </Link>
        </div>

        {/* Right Portal Actions */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          {/* If user is admin/staff viewing portal, show shortcut to admin */}
          {(user?.role === 'super_admin' || user?.role === 'staff') && (
            <Link
              to="/admin"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold hover:bg-orange-500/20 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" /> Back to Admin
            </Link>
          )}

          {/* Currency */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none"
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>

          {/* Theme */}
          <button
            onClick={toggleTheme}
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-orange-500 rounded-lg"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50 bg-zinc-50 dark:bg-zinc-900 transition-all text-xs font-semibold"
            title="Manage Profile Photo"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full object-cover border border-orange-500" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-bold">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <span className="hidden sm:inline text-zinc-700 dark:text-zinc-300 max-w-[100px] truncate">
              {user?.name?.split(' ')[0]}
            </span>
          </button>

          {/* User Signout */}
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-xs flex items-center gap-1 font-semibold"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Customer Header Info Banner */}
      <div className="border-b border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 px-4 sm:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="min-w-0 break-words text-xl font-bold text-zinc-900 dark:text-white">
                {customer?.companyName || user?.name || 'Customer Account'}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                Verified Customer
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Customer ID: <span className="font-mono font-medium text-orange-500">{customer?.customerId || 'CUST-8001'}</span> • Primary Contact: <span className="break-all">{user?.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div className="p-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80">
              <p className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">Reward Credits</p>
              <p className="text-sm font-bold text-orange-500">{customer?.rewardPoints || 1250} pts</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto mt-6 flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {navLinks.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                }`
              }
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>

      {/* Customer Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};
