import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { ThreeDBackground } from '../../components/common/ThreeDBackground';
import { Repeat, Lock, Mail, ArrowRight, Eye, EyeOff, Sparkles, Shield, User, Users } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const res: any = await api.post('/auth/login', { email, password });
      login(res.token, res.user, res.customer);
      showToast(`Welcome back, ${res.user.name}!`, 'success');

      if (res.user.role === 'customer') {
        navigate('/portal');
      } else {
        navigate('/admin');
      }
    } catch (err: any) {
      showToast(err.message || 'Login failed. Please check credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick 1-click Demo Fill
  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password@123');
  };

  const handleGoogleLogin = async () => {
    showToast('Google sign-in is not configured. Please use email and password.', 'info');
  };

  return (
    <div className="relative min-h-screen bg-transparent flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-zinc-900 dark:text-zinc-100 overflow-hidden">
      {/* Full-Screen 3D Geometric Matrix & Wave Background Animation */}
      <ThreeDBackground />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-transform">
            <Repeat className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="font-black text-2xl tracking-tight text-zinc-900 dark:text-white">
            Bill<span className="text-orange-500">flow</span> 2.0
          </span>
        </Link>
        <h2 className="text-2xl font-extrabold tracking-tight">Sign in to your account</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Or{' '}
          <Link to="/register" className="font-semibold text-orange-500 hover:text-orange-600">
            create a new customer account
          </Link>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="backdrop-blur-2xl bg-white/80 dark:bg-zinc-900/80 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-zinc-200/70 dark:border-zinc-800/80 shadow-orange-500/10">
          {/* Quick Demo Selector */}
          <div className="mb-6 p-3.5 rounded-2xl border border-orange-500/30 bg-orange-500/5">
            <p className="text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> 1-Click Demo Logins
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@subflow.io')}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 hover:border-orange-500 text-left transition-colors flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5 text-orange-500" />
                <span>Super Admin</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('staff@subflow.io')}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 hover:border-orange-500 text-left transition-colors flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>Staff Member</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('acme@corp.com')}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 hover:border-orange-500 text-left transition-colors flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5 text-emerald-500" />
                <span>Acme Corp (INR)</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('elena@apexfin.com')}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 hover:border-orange-500 text-left transition-colors flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5 text-amber-500" />
                <span>Apex FinTech (USD)</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('vikram@cloudmatrix.dev')}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 hover:border-orange-500 text-left transition-colors flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5 text-red-500" />
                <span>CloudMatrix (Grace)</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('david@zephyrstudio.design')}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 hover:border-orange-500 text-left transition-colors flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5 text-purple-500" />
                <span>Zephyr (Trial EUR)</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@subflow.io"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-semibold text-orange-500 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Signing in...
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Google OAuth Alternative */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white dark:bg-zinc-900 text-zinc-400 font-semibold">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              type="button"
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google Account</span>
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
          Need billing or account help? Email us at{' '}
          <a href="mailto:coder4986@gmail.com" className="font-semibold text-orange-500 hover:underline">
            coder4986@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
};
