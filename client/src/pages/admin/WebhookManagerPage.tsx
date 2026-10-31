import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { Webhook, Play, CheckCircle2, Copy, Shield, Terminal, ArrowRight } from 'lucide-react';

export const WebhookManagerPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const webhookUrl = `${window.location.origin}/api/webhooks/razorpay`;

  const fetchEvents = async () => {
    try {
      const res: any = await api.get('/webhooks/events');
      if (res.success) setEvents(res.events || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'info');
  };

  const handleTestWebhook = async () => {
    try {
      await fetch('/api/webhooks/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'payment.captured',
          payload: {
            payment: {
              entity: {
                id: `pay_test_${Date.now()}`,
                amount: 1499900,
                status: 'captured',
              },
            },
          },
        }),
      });
      showToast('Test payment.captured webhook dispatched and processed!', 'success');
      fetchEvents();
    } catch (err) {
      showToast('Error sending webhook test', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            Webhooks &amp; Gateway Integrations
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Configure external Razorpay event handlers and inspect delivered webhook payloads.
          </p>
        </div>

        <button
          onClick={handleTestWebhook}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all self-start sm:self-auto"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Simulate Gateway Webhook</span>
        </button>
      </div>

      {/* Webhook Configuration Card */}
      <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
        <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
          <Webhook className="w-4 h-4 text-orange-500" /> Active Webhook Endpoint
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400">Listener URL</span>
              <p className="font-mono text-xs text-orange-500 font-bold truncate">{webhookUrl}</p>
            </div>
            <button
              onClick={() => copyToClipboard(webhookUrl)}
              className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400">HMAC Signing Secret</span>
              <p className="font-mono text-xs text-zinc-700 dark:text-zinc-300 font-bold">whsec_billflow_orange_webhook_key</p>
            </div>
            <button
              onClick={() => copyToClipboard('whsec_billflow_orange_webhook_key')}
              className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Webhook Event Logs */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
            Delivered Webhook Events
          </span>
          <span className="text-xs text-zinc-400">{events.length} Recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-semibold text-[10px] bg-zinc-50/50 dark:bg-zinc-950/50 font-sans uppercase">
                <th className="p-4">Event ID</th>
                <th className="p-4">Type</th>
                <th className="p-4">Source</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-[11px]">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-zinc-400 font-sans">
                    No webhook events recorded yet. Click &quot;Simulate Gateway Webhook&quot; to test.
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr key={ev._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                    <td className="p-4 font-bold text-orange-500">{ev.eventId}</td>
                    <td className="p-4 text-zinc-900 dark:text-zinc-100 font-bold">{ev.eventType}</td>
                    <td className="p-4 text-zinc-500 uppercase">{ev.source}</td>
                    <td className="p-4 text-zinc-400 font-sans">{new Date(ev.createdAt).toLocaleTimeString()}</td>
                    <td className="p-4 font-sans">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                        {ev.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right font-sans">
                      <button
                        onClick={() => setSelectedEvent(ev)}
                        className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-orange-500 text-zinc-600 dark:text-zinc-300 text-xs font-semibold"
                      >
                        Payload
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payload Drawer / Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 bg-zinc-950/70 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 relative">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
            >
              ✕
            </button>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
              Event Payload: {selectedEvent.eventType}
            </h3>
            <p className="text-xs text-zinc-500 mb-4">{selectedEvent.eventId}</p>

            <pre className="p-4 rounded-2xl bg-zinc-950 text-orange-400 font-mono text-[11px] max-h-72 overflow-y-auto">
              {JSON.stringify(selectedEvent.payload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
