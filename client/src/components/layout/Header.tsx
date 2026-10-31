import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency, Currency } from '../../context/CurrencyContext';
import { useLanguage, Language } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Sun,
  Moon,
  Bell,
  Check,
  ChevronDown,
  User as UserIcon,
  LogOut,
  ShieldAlert,
  Sparkles,
  Camera,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ProfileModal } from '../common/ProfileModal';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const { language, setLanguage } = useLanguage();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      {/* Left: Mobile hamburger & current workspace */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-orange-500 md:hidden rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Billflow Engine 2.0</span>
          <span className="text-zinc-400">/</span>
          <span className="text-orange-600 dark:text-orange-400 font-semibold uppercase tracking-wider">
            {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'staff' ? 'Staff Portal' : 'Customer Workspace'}
          </span>
        </div>
      </div>

      {/* Right controls: Currency, Language, Theme, Notifications, User menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Currency Switcher */}
        <div className="relative">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>

        {/* Language Switcher */}
        <div className="hidden md:block">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="text-xs font-semibold px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer uppercase"
          >
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="fr">FR</option>
            <option value="de">DE</option>
            <option value="hi">HI</option>
          </select>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle Dark / Light Theme"
          className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-orange-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-zinc-600 dark:text-zinc-400 hover:text-orange-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-orange-600 rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl z-50 p-3 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-zinc-900 dark:text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-md">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 my-2">
                {notifications.length === 0 ? (
                  <p className="py-6 text-center text-xs text-zinc-400">No notifications right now.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => markAsRead(n._id)}
                      className={`p-2.5 rounded-lg transition-colors cursor-pointer text-xs ${
                        n.isRead ? 'opacity-65 hover:bg-zinc-50 dark:hover:bg-zinc-800/40' : 'bg-orange-50/50 dark:bg-orange-950/20 hover:bg-orange-100/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{n.title}</span>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-orange-500 mt-1 shrink-0"></span>}
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <span className="text-[10px] text-zinc-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50 transition-all bg-zinc-50 dark:bg-zinc-900"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-bold">
                {user?.name?.[0] || 'U'}
              </div>
            )}
            <div className="text-left hidden lg:block leading-tight">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[120px]">{user?.name}</p>
              <p className="text-[10px] text-zinc-400 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-2 z-50 text-xs animate-fade-in">
              <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                <p className="font-semibold text-zinc-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:text-orange-600 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-orange-500" />
                  <span>Edit Profile &amp; Photo</span>
                </button>

                {user?.role === 'customer' ? (
                  <Link
                    to="/portal"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:text-orange-600 rounded-lg"
                  >
                    <UserIcon className="w-3.5 h-3.5" /> Customer Portal
                  </Link>
                ) : (
                  <Link
                    to="/admin"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:text-orange-600 rounded-lg"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" /> Admin Dashboard
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg font-medium text-left cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Profile & Photo Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </header>
  );
};
