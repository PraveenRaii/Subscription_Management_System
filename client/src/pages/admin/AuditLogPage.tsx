import React, { useEffect, useState } from 'react';
import { AuditLog } from '../../types';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { ShieldCheck, Search, Filter, Terminal, User, Clock, Info } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const sev = severityFilter === 'all' ? '' : severityFilter;
      const res: any = await api.get(`/audit-logs?severity=${sev}&search=${searchTerm}`);
      if (res.success) setLogs(res.logs || []);
    } catch (err: any) {
      showToast('Error loading audit log records', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [severityFilter, searchTerm]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
          System Audit Trail &amp; Compliance Vault
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Tamper-evident activity logs recording actors, actions, timestamps, and IP addresses.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search action, actor, IP..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['all', 'info', 'warning', 'critical'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                severityFilter === sev
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-semibold uppercase text-[10px] bg-zinc-50/50 dark:bg-zinc-950/50">
                <th className="p-4">Action Event</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Entity</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Severity</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium font-mono text-[11px]">
              {logs.map((l) => (
                <tr key={l._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4 font-bold text-orange-600 dark:text-orange-400">{l.action}</td>
                  <td className="p-4 text-zinc-900 dark:text-zinc-100 font-sans">
                    <p className="font-bold">{l.userName}</p>
                    <p className="text-[10px] text-zinc-400 uppercase">{l.userRole}</p>
                  </td>
                  <td className="p-4 text-zinc-500">{l.entity}</td>
                  <td className="p-4 text-zinc-500">{l.ipAddress}</td>
                  <td className="p-4 text-zinc-500 font-sans">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 font-sans">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        l.severity === 'critical'
                          ? 'bg-rose-500/10 text-rose-500'
                          : l.severity === 'warning'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-emerald-500/10 text-emerald-500'
                      }`}
                    >
                      {l.severity}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-400 truncate max-w-xs">
                    {JSON.stringify(l.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
