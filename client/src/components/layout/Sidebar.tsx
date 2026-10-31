import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  LayoutDashboard,
  Repeat,
  FileText,
  CreditCard,
  Package,
  Bot,
  Users,
  FileCheck,
  Tag,
  Calendar,
  UserCheck,
  ShieldCheck,
  Webhook,
  ExternalLink,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const isSuperAdmin = user?.role === 'super_admin';

  const navItems = [
    { to: '/admin', label: t('dashboard'), icon: LayoutDashboard, end: true },
    { to: '/admin/subscriptions', label: t('subscriptions'), icon: Repeat },
    { to: '/admin/invoices', label: t('invoices'), icon: FileText },
    { to: '/admin/payments', label: t('payments'), icon: CreditCard },
    { to: '/admin/products', label: t('products'), icon: Package },
    { to: '/admin/ai', label: t('ai_copilot'), icon: Bot, badge: 'Gemini' },
    { to: '/admin/customers', label: t('customers'), icon: Users },
    { to: '/admin/quotations', label: t('quotations'), icon: FileCheck },
    { to: '/admin/coupons', label: t('coupons'), icon: Tag },
    { to: '/admin/calendar', label: 'Renewal Calendar', icon: Calendar },
    ...(isSuperAdmin
      ? [
          { to: '/admin/staff', label: t('staff'), icon: UserCheck },
          { to: '/admin/audit-logs', label: t('audit_logs'), icon: ShieldCheck },
          { to: '/admin/webhooks', label: 'Webhooks & Events', icon: Webhook },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 border-r border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo and Brand */}
        <div>
          <div className="flex items-center justify-between h-16 px-6 border-b border-zinc-200 dark:border-zinc-800/80">
            <NavLink to="/admin" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform">
                <Repeat className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="leading-none">
                <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-white">
                  Sub<span className="text-orange-500">Flow</span>
                </span>
                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 ml-1 px-1 py-0.2 bg-orange-500/10 rounded">
                  2.0
                </span>
              </div>
            </NavLink>
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-600 md:hidden"
            >
              ✕
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Management
            </div>

            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border-l-4 border-orange-500 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="w-4 h-4 group-hover:text-orange-500 transition-colors" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer Quick Switcher */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
          <NavLink
            to="/portal"
            className="flex items-center justify-between p-2.5 rounded-xl border border-dashed border-orange-500/40 bg-orange-500/5 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 text-xs font-semibold transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Customer Self-Service
            </span>
            <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded font-bold">Portal</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
};
