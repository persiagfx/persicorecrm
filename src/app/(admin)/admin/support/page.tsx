"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare, ChevronRight, Send, Clock, CheckCircle2,
  AlertCircle, Tag, User, Building2, Search, X
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

interface Reply { id: string; authorType: string; authorName: string; content: string; createdAt: string; }
interface SupportReq {
  id: string; tenantId: string | null; userName: string; userEmail: string;
  subject: string; message: string; category: string; priority: string;
  status: string; adminNote: string | null; createdAt: string;
  replies: Reply[];
}

const STATUS_COLORS: Record<string, string> = {
  open: "text-amber-400 bg-amber-400/10",
  in_progress: "text-blue-400 bg-blue-400/10",
  waiting: "text-purple-400 bg-purple-400/10",
  resolved: "text-green-400 bg-green-400/10",
  closed: "text-white/30 bg-white/5",
};
const STATUS_LABELS: Record<string, string> = {
  open: "باز", in_progress: "در حال بررسی", waiting: "در انتظار", resolved: "حل شده", closed: "بسته"
};
const PRIORITY_COLORS: Record<string, string> = {
  low: "text-blue-400", medium: "text-amber-400", high: "text-orange-400", critical: "text-red-400"
};
const PRIORITY_LABELS: Record<string, string> = { low: "پایین", medium: "متوسط", high: "بالا", critical: "بحرانی" };
const CATEGORY_LABELS: Record<string, string> = { general: "عمومی", billing: "مالی", technical: "فنی", feature: "قابلیت" };

export default function SupportPage() {
  const [requests, setRequests] = useState<SupportReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SupportReq | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<Record<string, number>>({});

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const r = await apiClient.get(`/admin/support?${params}&perPage=50`);
      setRequests(r.data.data ?? []);
      const counts: Record<string, number> = {};
      for (const s of (r.data.meta?.statusCounts ?? [])) counts[s.status] = s._count;
      setStats(counts);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      await apiClient.patch(`/admin/support/${selected.id}`, { reply, status: selected.status === "open" ? "in_progress" : selected.status });
      toast.success("پاسخ ارسال شد ✓");
      setReply("");
      load();
      const r = await apiClient.get(`/admin/support/${selected.id}`);
      setSelected(r.data.data);
    } catch { toast.error("خطا در ارسال"); }
    finally { setSending(false); }
  };

  const changeStatus = async (status: string) => {
    if (!selected) return;
    try {
      await apiClient.patch(`/admin/support/${selected.id}`, { status });
      toast.success("وضعیت تغییر کرد");
      setSelected(p => p ? { ...p, status } : null);
      load();
    } catch { toast.error("خطا"); }
  };

  const filtered = requests.filter(r =>
    (!search || r.subject.includes(search) || r.userName.includes(search) || r.userEmail.includes(search))
  );

  const fmtDate = (d: string) => new Date(d).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" });

  const kpis = [
    { key: "open", label: "باز", color: "text-amber-400" },
    { key: "in_progress", label: "در بررسی", color: "text-blue-400" },
    { key: "resolved", label: "حل شده", color: "text-green-400" },
  ];

  return (
    <div className="p-8 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-white">تیکت‌های پشتیبانی</h1>
        <p className="text-sm text-white/40 mt-1">پاسخ به درخواست‌های کسب‌وکارها</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 max-w-lg">
        {kpis.map(k => (
          <div key={k.key} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <p className={`text-2xl font-bold ${k.color}`}>{stats[k.key] ?? 0}</p>
            <p className="text-xs text-white/40 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4 h-[calc(100vh-320px)]">
        {/* List */}
        <div className="col-span-2 flex flex-col gap-3">
          {/* Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pr-9 pl-3 py-2 text-sm text-white/70 focus:outline-none focus:border-violet-500/50" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {["", "open", "in_progress", "resolved", "closed"].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? "bg-violet-600/30 text-violet-200" : "text-white/40 hover:text-white bg-white/5"}`}>
                  {s === "" ? "همه" : STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? [...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
            )) : filtered.length === 0 ? (
              <div className="text-center py-12 text-white/30 text-sm">موردی یافت نشد</div>
            ) : filtered.map(req => (
              <button key={req.id} onClick={() => setSelected(req)}
                className={`w-full text-right p-3 rounded-xl border transition-all ${
                  selected?.id === req.id ? "border-violet-500/50 bg-violet-500/10" : "border-white/10 bg-white/5 hover:border-white/20"
                }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{req.subject}</p>
                    <p className="text-xs text-white/40 mt-0.5 truncate">{req.userName} · {req.userEmail}</p>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[req.status]}`}>
                    {STATUS_LABELS[req.status]}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs font-medium ${PRIORITY_COLORS[req.priority]}`}>
                    {PRIORITY_LABELS[req.priority]}
                  </span>
                  <span className="text-xs text-white/30">·</span>
                  <span className="text-xs text-white/30">{CATEGORY_LABELS[req.category]}</span>
                  <span className="text-xs text-white/30 mr-auto">{fmtDate(req.createdAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className="col-span-3 flex flex-col rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/30">
              <MessageSquare className="w-12 h-12 opacity-30" />
              <p className="text-sm">یک تیکت انتخاب کنید</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-white/10">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{selected.subject}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
                      <User className="w-3 h-3" />{selected.userName}
                      <span>·</span>
                      <span>{CATEGORY_LABELS[selected.category]}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={selected.status} onChange={e => changeStatus(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/70 focus:outline-none">
                      {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[selected.priority]} bg-white/10`}>
                      {PRIORITY_LABELS[selected.priority]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Original message */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{selected.userName}</span>
                      <span className="text-xs text-white/30">{fmtDate(selected.createdAt)}</span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-sm text-white/70 leading-relaxed">
                      {selected.message}
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {selected.replies.map(r => (
                  <div key={r.id} className={`flex gap-3 ${r.authorType === "admin" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${r.authorType === "admin" ? "bg-violet-500/20" : "bg-amber-500/20"}`}>
                      {r.authorType === "admin"
                        ? <CheckCircle2 className="w-4 h-4 text-violet-400" />
                        : <User className="w-4 h-4 text-amber-400" />}
                    </div>
                    <div className={`flex-1 ${r.authorType === "admin" ? "text-left" : ""}`} dir="rtl">
                      <div className={`flex items-center gap-2 mb-1 ${r.authorType === "admin" ? "justify-end" : ""}`}>
                        <span className="text-sm font-medium text-white">{r.authorName}</span>
                        <span className="text-xs text-white/30">{fmtDate(r.createdAt)}</span>
                      </div>
                      <div className={`rounded-xl p-3 text-sm leading-relaxed ${r.authorType === "admin" ? "bg-violet-600/20 text-violet-100" : "bg-white/5 text-white/70"}`}>
                        {r.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply box */}
              {selected.status !== "closed" && (
                <div className="p-4 border-t border-white/10 flex gap-2">
                  <textarea value={reply} onChange={e => setReply(e.target.value)}
                    placeholder="پاسخ خود را بنویسید..." rows={2}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 focus:outline-none resize-none"
                    onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) sendReply(); }} />
                  <button onClick={sendReply} disabled={sending || !reply.trim()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 flex items-center gap-2">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
