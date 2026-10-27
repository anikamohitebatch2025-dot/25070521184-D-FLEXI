import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, Dumbbell, MessageSquare, Flame, CheckCircle, ChevronDown, RefreshCw } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
  source?: string;
}

export const FitnessAIChatbot: React.FC = () => {
  const { user, activeMembership } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'coach',
      text: `Hey athlete! I am **Coach FLEXI**, your dedicated AI Strength & Sports Nutrition Specialist.\n\nWhether you need form cues on your bench press, high-protein meal planning, or customized programming, I'm in your corner. What are we crushing today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'How much protein do I need daily for muscle growth?',
    'Give me a 4-day powerbuilding workout split',
    'How do I fix lower back fatigue during deadlifts?',
    'What should I eat before and after morning training?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/fitness-coach', {
        message: textToSend,
        context: {
          userName: user?.name,
          membership: activeMembership?.plan?.name || 'General Access',
          role: user?.role,
        },
      });

      if (res.data?.success) {
        const coachMsg: ChatMessage = {
          id: `coach-${Date.now()}`,
          sender: 'coach',
          text: res.data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: res.data.source,
        };
        setMessages(prev => [...prev, coachMsg]);
      } else {
        throw new Error(res.data?.message || 'Failed to get coach response');
      }
    } catch (err: any) {
      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'coach',
        text: "I'm having a brief connection drop with the coaching server. Remember the baseline: stay in a slight caloric surplus with 2.0g protein/kg for size, or 400 kcal deficit with heavy lifting for leanness. Hydrate with 3+ liters of water today!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-[#ff6a00] to-[#e05500] text-white font-heading text-lg font-black tracking-wider uppercase shadow-2xl shadow-[#ff6a00]/40 hover:scale-105 active:scale-95 transition-all group"
          aria-label="Open AI Fitness Coach"
        >
          <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white animate-spin-slow" />
          </div>
          <span>Coach FLEXI AI</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[440px] h-[600px] max-h-[85vh] bg-[#121214] border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#18181b] to-[#141416] border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6a00] to-[#d64e00] flex items-center justify-center text-white shadow-md shadow-[#ff6a00]/25">
                <Dumbbell className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-lg font-black tracking-wider text-white uppercase">
                    Coach FLEXI
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                    Live AI
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Elite Strength & Sports Nutrition Engine
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setMessages([messages[0]])}
                title="Reset conversation"
                className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800/60 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800/60 transition-colors"
                title="Minimize Coach"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar (visible when only 1 or 2 messages) */}
          {messages.length <= 2 && (
            <div className="p-3 bg-neutral-900/70 border-b border-neutral-800/80 overflow-x-auto flex gap-2 no-scrollbar">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p)}
                  className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-[#ff6a00]/20 hover:border-[#ff6a00]/50 border border-neutral-700 text-[11px] text-neutral-300 hover:text-white font-medium transition-all shrink-0"
                >
                  ⚡ {p}
                </button>
              ))}
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#ff6a00] text-white rounded-tr-none font-medium shadow-md shadow-[#ff6a00]/20'
                      : 'bg-neutral-800/80 border border-neutral-700/60 text-neutral-200 rounded-tl-none whitespace-pre-line'
                  }`}
                >
                  {m.text}
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-neutral-500 px-1">
                  <span>{m.timestamp}</span>
                  {m.source && (
                    <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-semibold">
                      • {m.source === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'Coach FLEXI Engine'}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-3 bg-neutral-800/50 rounded-2xl max-w-[65%] border border-neutral-700/50 text-neutral-400 text-xs animate-pulse">
                <Sparkles className="w-4 h-4 text-[#ff6a00] animate-spin" />
                <span>Coach FLEXI analyzing biomechanics & protocol...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-[#18181b] border-t border-neutral-800">
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-1.5 focus-within:border-[#ff6a00] transition-colors">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about workouts, macros, protein, form cues..."
                className="flex-1 bg-transparent text-white text-xs placeholder:text-neutral-500 focus:outline-none py-1.5"
                disabled={loading}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="p-2 rounded-lg bg-[#ff6a00] disabled:bg-neutral-800 text-white disabled:text-neutral-600 transition-colors"
                title="Send to Coach"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="mt-1.5 px-1 flex items-center justify-between text-[10px] text-neutral-500">
              <span>Backed by certified sports science & biomechanics.</span>
              <span>Model: gemini-3.8-flash</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
