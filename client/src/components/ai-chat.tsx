import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, RotateCcw, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const BRAND  = "#1B4FE4";
const PURPLE = "#8B5CF6";

const SUGGESTED_PROMPTS = [
  "How much did I spend this month?",
  "Am I on track with my savings goals?",
  "What's my biggest expense category?",
  "Should I pay off debt or invest?",
  "What's my current net worth?",
  "Calculate my Zakat for this year",
];

type Message = { role: "user" | "assistant"; content: string; ts: Date };

async function sendChat(message: string, history: Message[]): Promise<string> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      message,
      history: history.map(m => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) throw new Error("Chat request failed");
  const data = await res.json();
  return data.reply || "I'm not sure how to answer that.";
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map(i => (
        <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: BRAND, animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}

export function FloatingAIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    const userMsg: Message = { role: "user", content: msg, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const reply = await sendChat(msg, messages);
      setMessages(prev => [...prev, { role: "assistant", content: reply, ts: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting right now. Please try again.", ts: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const clearChat = () => setMessages([]);

  return (
    <>
      {/* floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all duration-200 hover:scale-105 active:scale-95"
        style={{ background: `linear-gradient(135deg, ${BRAND}, ${PURPLE})` }}
        data-testid="button-ai-chat-toggle"
        aria-label="Open AI assistant">
        {open ? <X className="w-6 h-6 text-white" /> : <Sparkles className="w-6 h-6 text-white" />}
      </button>

      {/* panel */}
      <div className={cn(
        "fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-24px)] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-all duration-300 bg-white dark:bg-gray-900",
        open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
      )} style={{ height: 520 }}>

        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50/60 to-purple-50/60 dark:from-blue-950/30 dark:to-purple-950/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${BRAND}, ${PURPLE})` }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-white">Wealthly AI</p>
              <p className="text-[10px] text-gray-400">Your personal finance assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button onClick={clearChat} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Clear chat">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/50">
          {messages.length === 0 ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${BRAND}, ${PURPLE})` }}>
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm border border-gray-100 dark:border-gray-700 max-w-[85%]">
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                    Hi! I'm your Wealthly AI assistant. I have full access to your financial data and can help you understand your spending, track goals, and make smarter money decisions.
                  </p>
                </div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1 pt-1">Try asking me:</p>
              <div className="space-y-1.5">
                {SUGGESTED_PROMPTS.map(p => (
                  <button key={p} onClick={() => handleSend(p)}
                    className="w-full text-left px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all flex items-center justify-between group shadow-sm">
                    {p}
                    <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600 group-hover:text-blue-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, i) => (
                <div key={i} className={cn("flex gap-2.5", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
                  {m.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 self-end"
                      style={{ background: `linear-gradient(135deg, ${BRAND}, ${PURPLE})` }}>
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                    m.role === "user"
                      ? "text-white rounded-tr-sm"
                      : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm"
                  )}
                    style={m.role === "user" ? { background: `linear-gradient(135deg, ${BRAND}, ${PURPLE})` } : {}}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${BRAND}, ${PURPLE})` }}>
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm shadow-sm">
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* input */}
        <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything about your finances…"
              className="flex-1 text-sm bg-transparent outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              disabled={loading}
              data-testid="input-ai-chat"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
              style={{ backgroundColor: input.trim() && !loading ? BRAND : "#E2E8F0" }}>
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <p className="text-[10px] text-center text-gray-300 dark:text-gray-600 mt-1.5">Powered by GPT · Based on your live financial data</p>
        </div>
      </div>
    </>
  );
}
