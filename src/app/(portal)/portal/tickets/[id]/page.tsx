"use client";

import { use, useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Headphones, ArrowRight, Send, CheckCircle2, Clock, AlertCircle, Star } from "lucide-react";
import Link from "next/link";
import { usePortal, portalFetch } from "@/lib/portal-context";
import { cn } from "@/lib/utils";
import { toJalali } from "@/lib/utils";

interface Reply {
  id: string;
  authorType: string;
  authorName: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  resolvedAt: string | null;
  satisfactionScore: number | null;
  replies: Reply[];
}

const PRIORITY_COLOR: Record<string, string> = {
  high: "text-red-400 bg-red-500/10",
  medium: "text-amber-400 bg-amber-500/10",
  low: "text-emerald-400 bg-emerald-500/10",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  open: { label: "باز", color: "text-blue-400", icon: Clock },
  in_progress: { label: "در حال بررسی", color: "text-amber-400", icon: Clock },
  closed: { label: "بسته شده", color: "text-emerald-400", icon: CheckCircle2 },
  pending: { label: "معلق", color: "text-muted-foreground", icon: AlertCircle },
};

function SatisfactionRating({
  ticket,
  onRated,
  token,
}: {
  ticket: Ticket;
  onRated: (score: number) => void;
  token: string | null;
}) {
  const [hovered, setHovered] = useState(0);
  const [saving, setSaving] = useState(false);

  if (ticket.satisfactionScore) {
    return (
      <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className={cn("w-5 h-5", i <= ticket.satisfactionScore! ? "fill-amber-400 text-amber-400" : "text-muted")} />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">امتیاز شما ثبت شد — ممنون از بازخورد شما</p>
      </div>
    );
  }

  const handleRate = async (score: number) => {
    setSaving(true);
    try {
      await portalFetch(`/api/portal/tickets/${ticket.id}`, {
        method: "PATCH",
        body: JSON.stringify({ satisfactionScore: score }),
      }, token);
      onRated(score);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-card border border-border">
      <p className="text-sm font-medium text-foreground mb-3">از پشتیبانی راضی بودید؟ امتیاز دهید</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => handleRate(i)}
            disabled={saving}
            className="transition-transform hover:scale-110 disabled:opacity-50"
          >
            <Star className={cn("w-7 h-7 transition-colors", i <= hovered ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PortalTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token } = usePortal();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    portalFetch(`/api/portal/tickets/${id}`, {}, token)
      .then((r) => r.json())
      .then((d) => setTicket(d.data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [id, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.replies.length]);

  const handleSend = async () => {
    if (!reply.trim() || isSending) return;
    setIsSending(true);
    try {
      const res = await portalFetch(`/api/portal/tickets/${id}/replies`, {
        method: "POST",
        body: JSON.stringify({ content: reply.trim() }),
      }, token);
      const d = await res.json();
      setTicket((prev) => prev ? { ...prev, replies: [...prev.replies, d.data] } : prev);
      setReply("");
    } catch {
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="py-20 text-center text-muted-foreground" dir="rtl">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p>تیکت یافت نشد</p>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;

  return (
    <div className="space-y-5 max-w-3xl mx-auto" dir="rtl">
      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/portal/tickets" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />پشتیبانی
        </Link>
        <span className="text-muted-foreground">·</span>
        <span className="text-foreground truncate">{ticket.title}</span>
      </motion.div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-2xl bg-card border border-border">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
            <Headphones className="w-5 h-5 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground">{ticket.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={cn("flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium", cfg.color, "bg-muted")}>
                <cfg.icon className="w-3 h-3" />{cfg.label}
              </span>
              <span className={cn("px-2.5 py-1 rounded-lg text-xs font-medium", PRIORITY_COLOR[ticket.priority] ?? "text-muted-foreground bg-muted")}>
                {ticket.priority === "high" ? "اولویت بالا" : ticket.priority === "low" ? "اولویت پایین" : "اولویت متوسط"}
              </span>
              <span className="text-xs text-muted-foreground">{toJalali(ticket.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{ticket.description}</p>
        </div>
      </motion.div>

      {/* Replies */}
      <div className="space-y-3">
        {ticket.replies.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className={cn("flex gap-3", r.authorType === "client" ? "flex-row-reverse" : "flex-row")}>
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1",
              r.authorType === "client" ? "bg-blue-500/20 text-blue-400" : "bg-violet-500/20 text-violet-400"
            )}>
              {r.authorName.charAt(0)}
            </div>
            <div className={cn("max-w-[75%]", r.authorType === "client" ? "items-end" : "items-start", "flex flex-col gap-1")}>
              <p className="text-xs text-muted-foreground">
                {r.authorName} · {toJalali(r.createdAt)}
              </p>
              <div className={cn("px-4 py-3 rounded-2xl text-sm leading-relaxed",
                r.authorType === "client"
                  ? "bg-gradient-to-br from-blue-500/15 to-teal-500/10 border border-blue-500/20 text-foreground"
                  : "bg-card border border-border text-foreground"
              )}>
                {r.content}
              </div>
            </div>
          </motion.div>
        ))}

        {ticket.replies.length === 0 && (
          <div className="py-10 text-center text-muted-foreground text-sm">
            هنوز پاسخی ارسال نشده است
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      {ticket.status !== "closed" ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-card border border-border">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleSend(); }}
            placeholder="پاسخ خود را بنویسید... (Ctrl+Enter برای ارسال)"
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 resize-none mb-3"
          />
          <div className="flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleSend}
              disabled={!reply.trim() || isSending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed">
              {isSending ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />در حال ارسال...</>
              ) : (
                <><Send className="w-4 h-4" />ارسال پاسخ</>
              )}
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-400">این تیکت بسته شده است.</p>
          </div>
          {/* Satisfaction rating */}
          <SatisfactionRating ticket={ticket} onRated={(score) => setTicket((prev) => prev ? { ...prev, satisfactionScore: score } : prev)} token={token} />
        </div>
      )}
    </div>
  );
}
