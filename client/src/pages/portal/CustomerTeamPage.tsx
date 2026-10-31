import React, { useEffect, useState } from 'react';
import { Subscription } from '../../types';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { Users, Plus, Mail, Shield, User, X } from 'lucide-react';

export const CustomerTeamPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'viewer'>('member');

  const fetchSub = async () => {
    try {
      const res: any = await api.get('/subscriptions');
      if (res.success && res.subscriptions?.length > 0) {
        setSubscription(res.subscriptions[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSub();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscription) return;
    try {
      await api.post(`/subscriptions/${subscription._id}/team-members`, {
        name,
        email,
        role,
      });
      showToast(`Invited ${name} to team seat!`, 'success');
      setShowModal(false);
      setName('');
      setEmail('');
      fetchSub();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Team Seat Management</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage coworkers who have access to your organization&apos;s workspace and API tokens.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
            Active Members ({subscription?.teamMembers?.length || 1} of {subscription?.seatCount || 5} Seats)
          </span>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {subscription?.teamMembers?.map((member: any, idx: number) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/30 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold flex items-center justify-center">
                  {member.name[0]}
                </div>
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white">{member.name}</p>
                  <p className="text-[11px] text-zinc-400">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  {member.role}
                </span>
                <span className="text-[10px] text-zinc-400">
                  Joined {new Date(member.addedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Invite Team Coworker</h3>
            <p className="text-xs text-zinc-500 mb-4">Assign one of your included team subscription seats.</p>

            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jessica Warren"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Work Email</label>
                <input
                  type="email"
                  placeholder="jessica@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Access Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                >
                  <option value="member">Member (Can manage API & usage)</option>
                  <option value="viewer">Viewer (Read-only billing access)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 mt-2"
              >
                Send Workspace Invite
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
