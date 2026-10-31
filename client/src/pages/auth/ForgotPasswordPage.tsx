import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { Repeat, Mail, ArrowRight, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [demoLink, setDemoLink] = useState('');
  const { showToast } = useNotifications();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const res: any = await api.post('/auth/forgot-password', { email });
      setResetSent(true);
      if (res.demoResetUrl) setDemoLink(res.demoResetUrl);
      showToast(res.message, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-zinc-900 dark:text-zinc-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/25">
            <Repeat className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="font-black text-2xl tracking-tight text-zinc-900 dark:text-white">
            Sub<span className="text-orange-500">Flow</span> 2.0
          </span>
        </Link>
        <h2 className="text-2xl font-extrabold tracking-tight">Forgot Password</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          We will send you secure password reset instructions.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900/90 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800">
          {!resetSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Your Account Email
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? 'Sending instructions...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base">Check Your Inbox</h4>
              <p className="text-xs text-zinc-500">
                If an account exists for <strong>{email}</strong>, you will receive a reset link shortly.
              </p>
              {demoLink && (
                <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-500/20 text-xs">
                  <p className="font-semibold text-orange-600 dark:text-orange-400 mb-1">Direct Reset Link (Demo):</p>
                  <a href={demoLink} className="text-orange-500 underline break-all font-mono text-[10px]">
                    {demoLink}
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-orange-500 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
