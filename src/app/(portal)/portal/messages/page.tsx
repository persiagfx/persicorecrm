"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { MessageSquare, Send, Wifi, WifiOff } from "lucide-react";
import { usePortal, portalFetch } from "@/lib/portal-context";
import { cn } from "@/lib/utils";
import { toJalali } from "@/lib/utils";

interface Message {
  id: string;
  authorType: string;
  authorName: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export default function PortalMessagesPage() {
  const { user, token } = usePortal();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  const load = () => {
    portalFetch("/api/portal/messages", {}, token)
      .then((r) => r.json())
      .then((d) => setMessages(d.data ?? []))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  // Initial load
  useEffect(() => { load(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // SSE connection for real-time messages
  useEffect(() => {
    if (!token) return;

    const connect = () => {
      const es = new EventSource(`/api/portal/stream?token=${encodeURIComponent(token)}`);
      esRef.current = es;

      es.onopen = () => setConnected(true);

      es.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          if (event.type === "portal.message.new") {
            const msg = event.data as Message;
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        } catch { /* ignore parse errors */ }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        esRef.current = null;
        // reconnect after 5s
        setTimeout(connect, 5000);
      };
    };

    connect();
    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [token]);

  const handleSend = async () => {
    if (!text.trim() || isSending) return;
    setIsSending(true);
    const content = text.trim();
    setText("");
    try {
      const res = await portalFetch("/api/portal/messages", {
        method: "POST",
        body: JSON.stringify({ content }),
      }, token);
      const d = await res.json();
      setMessages((prev) => {
        if (prev.some((m) => m.id === d.data?.id)) return prev;
        return [...prev, d.data];
      });
    } catch {
      setText(content);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-3xl mx-auto" dir="rtl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 pb-4 border-b border-border shrink-0">
        <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-teal-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">چت با تیم پرسی‌کور</h1>
          <p className="text-xs text-muted-foreground">پیام‌های شما به تیم پشتیبانی ارسال می‌شود</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {connected ? (
            <><Wifi className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">زنده</span></>
          ) : (
            <><WifiOff className="w-3.5 h-3.5 text-yellow-400" /><span className="text-yellow-400">در حال اتصال...</span></>
          )}
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">هنوز پیامی ارسال نشده</p>
            <p className="text-sm mt-1">اولین پیام خود را بنویسید</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className={cn("flex gap-3", m.authorType === "client" ? "flex-row-reverse" : "flex-row")}>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1",
                m.authorType === "client" ? "bg-blue-500/20 text-blue-400" : "bg-teal-500/20 text-teal-400"
              )}>
                {m.authorName.charAt(0)}
              </div>
              <div className={cn("max-w-[70%]", m.authorType === "client" ? "items-end" : "items-start", "flex flex-col gap-1")}>
                <p className="text-xs text-muted-foreground">
                  {m.authorName} · {toJalali(m.createdAt)}
                </p>
                <div className={cn("px-4 py-3 rounded-2xl text-sm leading-relaxed",
                  m.authorType === "client"
                    ? "bg-gradient-to-br from-blue-500/15 to-teal-500/10 border border-blue-500/20 text-foreground"
                    : "bg-card border border-border text-foreground"
                )}>
                  {m.content}
                </div>
              </div>
            </motion.div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 pt-4 border-t border-border">
        <div className="flex gap-3 items-end">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="پیام خود را بنویسید... (Enter برای ارسال)"
            rows={2}
            className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 resize-none"
          />
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!text.trim() || isSending}
            className="w-11 h-11 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
            {isSending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
