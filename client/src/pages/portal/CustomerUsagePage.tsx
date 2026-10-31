import React from 'react';
import { Activity, Database, Cpu, Users, HardDrive } from 'lucide-react';

export const CustomerUsagePage: React.FC = () => {
  const usageStats = [
    {
      metric: 'API Throughput & Requests',
      icon: Activity,
      used: 482500,
      limit: 1000000,
      unit: 'Calls',
      percent: 48.2,
      status: 'Normal',
    },
    {
      metric: 'Dedicated Storage Vault',
      icon: HardDrive,
      used: 142,
      limit: 500,
      unit: 'GB',
      percent: 28.4,
      status: 'Optimal',
    },
    {
      metric: 'Active Team Seat Allocations',
      icon: Users,
      used: 8,
      limit: 10,
      unit: 'Seats',
      percent: 80,
      status: 'High Usage',
    },
    {
      metric: 'Compute & Sharding Hours',
      icon: Cpu,
      used: 614,
      limit: 1000,
      unit: 'Hours',
      percent: 61.4,
      status: 'Normal',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Usage &amp; Quota Telemetry</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Real-time metered consumption against your active subscription tier limits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {usageStats.map((item, idx) => (
          <div
            key={idx}
            className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{item.metric}</h4>
                  <p className="text-[11px] text-zinc-400">
                    {item.used.toLocaleString()} / {item.limit.toLocaleString()} {item.unit}
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  item.percent > 75
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                }`}
              >
                {item.status}
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="w-full h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-zinc-400 font-medium">
                <span>{item.percent}% consumed</span>
                <span>{(100 - item.percent).toFixed(1)}% remaining</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
