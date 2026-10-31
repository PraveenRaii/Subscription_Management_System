import React, { useEffect, useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { UserCheck, Plus, Mail, Shield, X, Lock } from 'lucide-react';

export const StaffManagerPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password@123');
  const [department, setDepartment] = useState<'Billing' | 'Support' | 'Sales' | 'Operations'>('Billing');
  const [designation, setDesignation] = useState('Billing Operations Analyst');

  const fetchStaff = async () => {
    try {
      const res: any = await api.get('/staff');
      if (res.success) setStaffList(res.staff || []);
    } catch (err: any) {
      showToast('Error loading staff directory', 'error');
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/staff', {
        name,
        email,
        password,
        department,
        designation,
      });
      showToast(`Staff member ${name} created successfully!`, 'success');
      setShowModal(false);
      setName('');
      setEmail('');
      fetchStaff();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            Staff &amp; Operator Management
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Admin-only staff provisioning, departmental assignments, and role-based permissions.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Staff</span>
        </button>
      </div>

      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-semibold uppercase text-[10px] bg-zinc-50/50 dark:bg-zinc-950/50">
                <th className="p-4">Employee ID</th>
                <th className="p-4">Name &amp; Email</th>
                <th className="p-4">Department</th>
                <th className="p-4">Designation</th>
                <th className="p-4">Permissions</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium">
              {staffList.map((st) => (
                <tr key={st._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4 font-mono font-bold text-orange-500">{st.employeeId}</td>
                  <td className="p-4">
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">{st.user?.name}</p>
                    <p className="text-[10px] text-zinc-400">{st.user?.email}</p>
                  </td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-300 font-semibold">{st.department}</td>
                  <td className="p-4 text-zinc-500">{st.designation}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {st.permissions?.map((p: string, idx: number) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[9px] font-semibold text-zinc-500">
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Invite Staff Member</h3>
            <p className="text-xs text-zinc-500 mb-4">Grant limited administrative and billing access.</p>

            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Vikram Seth"
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
                  placeholder="vikram@billflow.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                  >
                    <option value="Billing">Billing</option>
                    <option value="Support">Support</option>
                    <option value="Sales">Sales</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Temporary Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 mt-2"
              >
                Provision Staff Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
