import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, User, Minimize2, Maximize2 } from 'lucide-react';
import { api } from '../../services/api';

export const AiAssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Hello! I am your SubFlow 2.0 AI Business Intelligence & Financial Copilot. Ask me anything about MRR, churn forecasting, payment collections, or retention strategies.',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || input).trim();
    if (!q || isTyping) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setIsTyping(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: m.text,
      }));

      const res: any = await api.post('/ai/chat', {
        message: q,
        history,
      });

      setMessages((prev) => [...prev, { role: 'assistant', text: res.reply || 'Analysis complete.' }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'I encountered an issue retrieving real-time telemetry. Please verify server connection.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    'What is our current MRR & growth rate?',
    'Which accounts are at risk of churning?',
    'Summarize our collection health & unpaid invoices',
    'Recommend retention offers for at-risk clients',
  ];

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-xl shadow-orange-500/30 hover:scale-105 transition-all group"
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <span>AI Intelligence Assistant</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        </button>
      )}

      {/* Floating Chat Drawer / Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full sm:w-[420px] h-[560px] max-h-[85vh] rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  SubFlow AI Copilot
                  <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded-full font-semibold">Gemini</span>
                </h4>
                <p className="text-[11px] text-orange-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span> Live Business Telemetry
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-orange-50/50 dark:bg-orange-950/20 border-b border-orange-100 dark:border-orange-900/30 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
            <Sparkles className="w-3 h-3 text-orange-500 shrink-0" />
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full border border-orange-200 dark:border-orange-800 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-orange-500 hover:text-orange-500 font-medium transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] p-3 rounded-2xl whitespace-pre-line leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-orange-500 text-white rounded-tr-none font-medium'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200 dark:border-zinc-700/60'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 items-center text-zinc-400 text-xs">
                <div className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask SubFlow AI Copilot..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-40 transition-all shadow-md shadow-orange-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
