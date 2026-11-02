import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Bot, Send, X, Minimize2, Maximize2, Trash2,
  Copy, Check, ShieldCheck, AlertCircle, Phone, CornerDownLeft, RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AIAssistantWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}! 👋 I am **SmartHostel AI**, your campus residential assistant.\n\nI can answer official hostel policies (curfews, outpasses, mess timings) or securely check your personal room allocation, fee balance, and complaint tickets.\n\nHow can I help you today?`,
      citations: ['Residential_Handbook_2026.pdf - Student Guidelines'],
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [crisisAlert, setCrisisAlert] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Fetch quick prompt suggestions on mount / role change
  useEffect(() => {
    if (user) {
      api.get('/ai/suggestions')
        .then(res => {
          if (res.data?.suggestions) {
            setSuggestions(res.data.suggestions);
          }
        })
        .catch(() => {
          setSuggestions([
            'What is the curfew timing on weekdays?',
            'Check my room allocation and roommates',
            'How do I apply for an outpass?',
            'What are the daily mess timings?'
          ]);
        });
    }
  }, [user]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: text,
        conversationHistory: messages.slice(-4).map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }))
      });

      const data = res.data;
      if (data.crisisIntercept) {
        setCrisisAlert(data.helplines);
      }

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || "I'm sorry, I couldn't process that query. Please try again.",
        citations: data.citations || [],
        toolExecuted: data.toolExecuted || null,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('AI Assistant API Error:', err);
      const errorMsg = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: "⚠️ Sorry, I encountered a temporary connection issue. Please ensure the backend server is running and try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setCrisisAlert(null);
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        text: `Chat session reset. How may I assist you with hostel guidelines or your resident status?`,
        citations: ['Residential_Handbook_2026.pdf'],
        timestamp: new Date()
      }
    ]);
  };

  // Basic markdown-like formatter for bolding, bullet points, and links
  const renderFormattedText = (content) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      // Bold handling
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic handling
      formattedLine = formattedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');

      if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
        return (
          <li
            key={i}
            className="ml-4 list-disc text-slate-800 text-xs sm:text-sm my-0.5"
            dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[•\-]\s*/, '') }}
          />
        );
      }

      if (line.trim().match(/^\d+\.\s+/)) {
        return (
          <p
            key={i}
            className="text-slate-800 text-xs sm:text-sm my-1 pl-2 font-medium"
            dangerouslySetInnerHTML={{ __html: formattedLine }}
          />
        );
      }

      if (!line.trim()) {
        return <div key={i} className="h-1.5" />;
      }

      return (
        <p
          key={i}
          className="text-slate-800 text-xs sm:text-sm my-0.5 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-medium text-xs sm:text-sm"
            aria-label="Open SmartHostel AI Assistant"
          >
            <div className="relative">
              <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white animate-ping" />
            </div>
            <span className="font-semibold tracking-wide">Ask SmartHostel AI</span>
          </button>
        </div>
      )}

      {/* Chat Window Dialog */}
      {isOpen && (
        <div
          className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col transition-all duration-300 overflow-hidden ${
            isExpanded
              ? 'w-[95vw] sm:w-[680px] h-[85vh] max-h-[820px]'
              : 'w-[92vw] sm:w-[420px] h-[580px] max-h-[90vh]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-0.5 shadow-md flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-wide truncate">SmartHostel AI</h3>
                  <span className="bg-teal-500/20 text-teal-300 text-[10px] font-semibold px-1.5 py-0.2 rounded border border-teal-500/30">
                    24/7 Online
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  <span>Session Scoped • Zero Data Leakage</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-300">
              <button
                onClick={clearChat}
                title="Reset Conversation"
                className="p-1.5 hover:bg-slate-700/60 rounded-lg transition-colors hover:text-white"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Restore Size' : 'Expand View'}
                className="p-1.5 hover:bg-slate-700/60 rounded-lg transition-colors hover:text-white hidden sm:block"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                className="p-1.5 hover:bg-rose-500/30 rounded-lg transition-colors hover:text-rose-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Crisis Intercept Banner */}
          {crisisAlert && (
            <div className="bg-rose-50 border-b border-rose-200 p-3 flex items-start gap-2.5 text-rose-900 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Campus Care & Wellness Intercept Triggered</p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  We care deeply about your safety. If you need urgent support, call{' '}
                  <a href="tel:14416" className="font-bold underline text-rose-800">
                    Tele-MANAS (14416)
                  </a>{' '}
                  or{' '}
                  <a href="tel:9876543211" className="font-bold underline text-rose-800">
                    Chief Warden (9876543211)
                  </a>
                  .
                </p>
              </div>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/60">
            {messages.map((m) => {
              const isAssistant = m.sender === 'assistant';
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 shadow-xs text-xs sm:text-sm ${
                      isAssistant
                        ? 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-sm'
                        : 'bg-gradient-to-br from-teal-600 to-emerald-600 text-white rounded-tr-sm'
                    }`}
                  >
                    {/* Tool execution badge */}
                    {m.toolExecuted && (
                      <div className="mb-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Tool Executed: {m.toolExecuted}</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      {isAssistant ? (
                        renderFormattedText(m.text)
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                      )}
                    </div>

                    {/* Official Citations */}
                    {m.citations && m.citations.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {m.citations.map((c, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200"
                          >
                            📖 {c}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Copy button for Assistant */}
                    {isAssistant && (
                      <div className="mt-2 flex items-center justify-end">
                        <button
                          onClick={() => handleCopy(m.id, m.text)}
                          className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-xs flex items-center gap-2 text-xs text-slate-500">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                  <span>Consulting handbook policies & scoped records...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions Bar */}
          {suggestions.length > 0 && (
            <div className="px-3 py-2 bg-slate-100/90 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto custom-scrollbar whitespace-nowrap">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Suggestions:
              </span>
              {suggestions.slice(0, 4).map((sugg, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(sugg)}
                  disabled={loading}
                  className="text-[11px] bg-white hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 transition-all shrink-0 font-medium shadow-2xs"
                >
                  {sugg}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask curfews, your room, outpasses, fees..."
                className="flex-1 bg-slate-100 hover:bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-md shadow-teal-600/20 flex items-center justify-center shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>SmartHostel AI • Zero-Shot NLP Triage</span>
              <span>Residential Handbook 2026</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

