import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Gift, Copy, Sparkles, CheckCircle2, Share2, Award } from 'lucide-react';

export const CustomerReferralPage: React.FC = () => {
  const { customer } = useAuth();
  const { showToast } = useNotifications();

  const referralCode = customer?.referralCode || 'REF-ACME2026';
  const referralUrl = `${window.location.origin}/register?ref=${referralCode}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(referralUrl);
    showToast('Referral link copied to clipboard!', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Referrals &amp; Reward Credits</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Invite other businesses to Billflow 2.0 and earn 20% recurring billing credits on every successful referral.
        </p>
      </div>

      {/* Rewards Overview Card */}
      <div className="p-8 rounded-3xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold mb-2">
              <Gift className="w-3.5 h-3.5" /> Billflow Partner Program
            </div>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white">
              Earn Credits on Every Referral
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md">
              Share your link with founders and finance teams. When they subscribe to any paid plan, you both receive 1,000 billing points.
            </p>
          </div>

          <div className="text-center p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-orange-500/30 shadow-md">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Your Balance</span>
            <p className="text-3xl font-black text-orange-500 mt-1">{customer?.rewardPoints || 1250}</p>
            <span className="text-xs font-bold text-zinc-500">Reward Points</span>
          </div>
        </div>

        {/* Copy Link Bar */}
        <div className="mt-8 p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex-1 truncate">
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">Your Unique Referral Link</span>
            <span className="font-mono text-xs text-orange-500 font-bold truncate block">{referralUrl}</span>
          </div>
          <button
            onClick={copyUrl}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Link</span>
          </button>
        </div>
      </div>

      {/* How it Works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <span className="w-7 h-7 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-xs mb-3">
            1
          </span>
          <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">Share Referral Link</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Send your unique referral URL to friends, community, or partners.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <span className="w-7 h-7 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-xs mb-3">
            2
          </span>
          <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">They Activate Plan</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Your referral creates an account and launches their automated billing workflow.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <span className="w-7 h-7 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-xs mb-3">
            3
          </span>
          <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">Earn Recurring Credits</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Points are automatically deducted from your upcoming renewal invoices.
          </p>
        </div>
      </div>
    </div>
  );
};
