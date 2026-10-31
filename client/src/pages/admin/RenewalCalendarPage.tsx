import React, { useEffect, useState } from 'react';
import { Subscription, Invoice } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { Calendar, ChevronLeft, ChevronRight, Clock, Repeat, FileText, CheckCircle2 } from 'lucide-react';

export const RenewalCalendarPage: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const { showToast } = useNotifications();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sRes, iRes]: any = await Promise.all([
          api.get('/subscriptions?limit=50'),
          api.get('/invoices?limit=50'),
        ]);
        if (sRes.success) setSubscriptions(sRes.subscriptions || []);
        if (iRes.success) setInvoices(iRes.invoices || []);
      } catch (err) {
        showToast('Error loading calendar telemetry', 'error');
      }
    };
    fetchData();
  }, []);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Calendar matrix calculation
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }

  // Filter events for day
  const getEventsForDay = (date: Date) => {
    const dateStr = date.toISOString().substring(0, 10);
    const daySubs = subscriptions.filter(
      (s) => new Date(s.renewalDate).toISOString().substring(0, 10) === dateStr
    );
    const dayInvs = invoices.filter(
      (inv) => new Date(inv.dueDate).toISOString().substring(0, 10) === dateStr
    );
    return { daySubs, dayInvs };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            Subscription Renewal Calendar
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Visual calendar of upcoming auto-renewals, invoice due dates, and billing periods.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-extrabold text-sm px-3 py-1 text-zinc-900 dark:text-white">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-xs p-4 overflow-x-auto">
        <div className="min-w-[650px]">
          <div className="grid grid-cols-7 text-center font-bold text-xs text-zinc-400 uppercase tracking-wider pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-2 pt-3">
            {days.map((day, idx) => {
              if (!day) {
                return <div key={idx} className="h-28 rounded-2xl bg-zinc-50/30 dark:bg-zinc-950/20" />;
              }

              const { daySubs, dayInvs } = getEventsForDay(day);
              const isToday = day.toDateString() === new Date().toDateString();

              return (
                <div
                  key={idx}
                  className={`h-28 p-2 rounded-2xl border text-xs flex flex-col justify-between transition-colors overflow-hidden ${
                    isToday
                      ? 'border-orange-500 bg-orange-500/5'
                      : 'border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isToday ? 'w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center' : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {(daySubs.length > 0 || dayInvs.length > 0) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-16 scrollbar-none">
                    {daySubs.map((s) => (
                      <div
                        key={s._id}
                        className="px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[9px] font-bold truncate flex items-center gap-1"
                      >
                        <Repeat className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{s.plan?.name}</span>
                      </div>
                    ))}
                    {dayInvs.map((inv) => (
                      <div
                        key={inv._id}
                        className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500 text-[9px] font-bold truncate flex items-center gap-1"
                      >
                        <FileText className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{inv.invoiceNumber}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
