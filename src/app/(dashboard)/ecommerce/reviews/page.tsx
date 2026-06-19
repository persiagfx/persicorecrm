"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, Search, CheckCircle2, XCircle, Clock, Trash2, Eye, MessageSquare } from "lucide-react";
import { toJalali } from "@/lib/utils";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Review { id: string; productId?: string; productName: string; customerName: string; rating: number; title?: string; body: string; status: "pending"|"approved"|"rejected"; reply?: string; createdAt: string; isVerifiedPurchase: boolean; }

const STATUS_CFG = { pending: { label: "در انتظار بررسی", color: "text-amber-400 bg-amber-500/10" }, approved: { label: "تایید شده", color: "text-emerald-400 bg-emerald-500/10" }, rejected: { label: "رد شده", color: "text-red-400 bg-red-500/10" } };

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={cn("text-amber-400 fill-current", i > rating && "opacity-20")} style={{ width: size, height: size }} />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [selected, setSelected] = useState<Review | undefined>();
  const [reply, setReply] = useState("");

  const load = useCallback(async () => { try { const r = await apiClient.get("/ecommerce/reviews"); setReviews(r.data.data ?? []); } catch { toast.error("خطا"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: Review["status"]) => {
    try { await apiClient.patch(`/ecommerce/reviews/${id}`, { status }); toast.success("بروز شد"); load(); setSelected(prev => prev?.id === id ? { ...prev, status } : prev); } catch { toast.error("خطا"); }
  };
  const sendReply = async (id: string) => {
    if (!reply.trim()) return;
    try { await apiClient.patch(`/ecommerce/reviews/${id}`, { reply }); toast.success("پاسخ ثبت شد"); setReply(""); load(); } catch { toast.error("خطا"); }
  };
  const del = async (id: string) => { if (!confirm("حذف؟")) return; try { await apiClient.delete(`/ecommerce/reviews/${id}`); toast.success("حذف شد"); if (selected?.id === id) setSelected(undefined); load(); } catch { /**/ } };

  const filtered = reviews.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (ratingFilter !== "all" && r.rating !== Number(ratingFilter)) return false;
    if (search && !r.productName.includes(search) && !r.customerName.includes(search)) return false;
    return true;
  });

  const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) : 0;
  const pendingCount = reviews.filter(r => r.status === "pending").length;

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><Star className="w-6 h-6 text-primary" />نظرات مشتریان</h1></div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="کل نظرات" value={reviews.length} icon={MessageSquare} color="blue" />
        <StatCard title="در انتظار" value={pendingCount} icon={Clock} color="amber" />
        <StatCard title="تایید شده" value={reviews.filter(r => r.status === "approved").length} icon={CheckCircle2} color="green" />
        <StatCard title="میانگین امتیاز" value={avgRating.toFixed(1)} icon={Star} color="violet" />
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="w-full pe-10 ps-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
          <option value="all">همه وضعیت‌ها</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
          <option value="all">همه امتیازها</option>
          {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} ستاره</option>)}
        </select>
      </div>
      <div className="flex gap-5">
        <div className="flex-1 space-y-3">
          {loading ? <div className="p-12 text-center text-muted-foreground">در حال بارگذاری...</div> : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground glass rounded-2xl border border-border"><Star className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>نظری یافت نشد</p></div>
          ) : filtered.map(r => (
            <div key={r.id} onClick={() => { setSelected(r); setReply(r.reply ?? ""); }} className={cn("glass rounded-2xl border p-5 cursor-pointer hover:border-primary/30 transition-all", selected?.id === r.id && "border-primary/30 bg-primary/5")}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Stars rating={r.rating} />
                    {r.isVerifiedPurchase && <span className="text-xs text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">خرید تایید شده</span>}
                  </div>
                  <p className="font-semibold text-sm">{r.productName}</p>
                  <p className="text-xs text-muted-foreground">{r.customerName} · {toJalali(r.createdAt)}</p>
                  {r.title && <p className="font-medium text-sm mt-2">{r.title}</p>}
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.body}</p>
                  {r.reply && <p className="text-xs text-primary mt-2 border-t border-border pt-2"><MessageSquare className="w-3 h-3 inline ml-1" />پاسخ: {r.reply}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_CFG[r.status].color)}>{STATUS_CFG[r.status].label}</span>
                  <button onClick={e => { e.stopPropagation(); del(r.id); }} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {selected && (
          <div className="w-80 shrink-0 glass rounded-2xl border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">جزئیات نظر</p>
              <button onClick={() => setSelected(undefined)} className="text-muted-foreground hover:text-foreground">×</button>
            </div>
            <Stars rating={selected.rating} size={16} />
            <div className="space-y-1 text-sm">
              <p className="font-medium">{selected.productName}</p>
              <p className="text-muted-foreground">{selected.customerName} · {toJalali(selected.createdAt)}</p>
              {selected.title && <p className="font-medium mt-2">{selected.title}</p>}
              <p className="text-muted-foreground">{selected.body}</p>
            </div>
            {selected.status === "pending" && (
              <div className="flex gap-2 pt-2 border-t border-border">
                <button onClick={() => updateStatus(selected.id, "approved")} className="flex-1 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium flex items-center justify-center gap-1 hover:bg-emerald-500/20"><CheckCircle2 className="w-4 h-4" />تایید</button>
                <button onClick={() => updateStatus(selected.id, "rejected")} className="flex-1 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium flex items-center justify-center gap-1 hover:bg-red-500/20"><XCircle className="w-4 h-4" />رد</button>
              </div>
            )}
            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground mb-2">پاسخ فروشگاه</p>
              <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="پاسخ خود را بنویسید..." rows={3} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
              <button onClick={() => sendReply(selected.id)} className="w-full mt-2 py-2 rounded-xl gradient-brand text-black text-sm font-semibold">ثبت پاسخ</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
