import React, { useState } from 'react';
import { api } from '../../services/api';
import { Bot, Send, Sparkles, User } from 'lucide-react';

export const CustomerAiAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Hello! I am your SubFlow Support Copilot. I can assist with questions regarding your active plan features, upcoming renewal dates, invoice receipts, seat upgrades, or plan comparisons. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const query = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: query }]);
    setIsTyping(true);

    try {
      const res: any = await api.post('/ai/chat', { message: query });
      setMessages((prev) => [...prev, { role: 'assistant', text: res.reply || 'Here is what you need to know.' }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'I am here to assist. For urgent account changes, you can also manage seats and invoices directly in your portal tabs.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const prompts = [
    'When is my next invoice renewal date?',
    'How do I add 2 more team members to my plan?',
    'What features are unlocked in the Enterprise tier?',
    'How does GST calculation work on our invoices?',
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">AI Support &amp; Billing Assistant</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          24/7 intelligent assistance powered by Google Gemini to resolve questions instantly.
        </p>
      </div>

      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-xs h-[580px] flex flex-col overflow-hidden">
        {/* Quick Prompts */}
        <div className="p-3 bg-orange-50/50 dark:bg-orange-950/20 border-b border-orange-100 dark:border-orange-900/30 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          {prompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInput(p);
              }}
              className="whitespace-nowrap px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-orange-500 font-medium transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[75%] p-4 rounded-2xl whitespace-pre-line leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-orange-500 text-white rounded-tr-none font-medium'
                    : 'bg-zinc-50 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200 dark:border-zinc-700/60'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-zinc-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
              <span>Gemini is finding an answer...</span>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question about invoices, plans, or features..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
