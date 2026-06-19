"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Tag, Plus, X, Users, Zap, Eye, EyeOff, Info, ArrowLeft, Send } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SegmentFilters {
  industry?: string;
  minContractValue?: number;
  maxContractValue?: number;
  tags?: string[];
  status?: string;
  city?: string;
}

interface Segment {
  id: string;
  name: string;
  description: string | null;
  filters: SegmentFilters;
  isActive: boolean;
  createdAt: string;
  clientIds?: string[];
  _count?: { members: number };
}

interface Campaign {
  id: string;
  title: string;
  channel: string;
  status: string;
}

const INDUSTRIES = ["نرم‌افزار", "صنعت", "تجارت", "خدمات", "آموزش", "پزشکی", "رسانه", "ساختمان", "غذا", "سایر"];
const CLIENT_STATUSES = [
  { value: "active", label: "فعال" },
  { value: "inactive", label: "غیرفعال" },
  { value: "prospect", label: "بالقوه" },
];

const SEGMENT_USES = [
  { icon: "📧", title: "کمپین ایمیل", desc: "ارسال ایمیل هدفمند به این گروه", href: "/marketing/email" },
  { icon: "📢", title: "کمپین تبلیغاتی", desc: "اجرای کمپین برای این سگمنت", href: "/marketing/campaigns" },
  { icon: "⚡", title: "سرنخ‌های مرتبط", desc: "مشاهده لیدهای این گروه مشتری", href: "/leads" },
  { icon: "👥", title: "مشتریان فیلترشده", desc: "مشاهده مشتریان این سگمنت", href: "/clients" },
];

const emptyForm = {
  name: "", description: "",
  industry: "", minValue: "", maxValue: "", status: "", city: "", tags: "",
};

const emptyCampaignForm = { campaignId: "", message: "", subject: "" };

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);

  // Campaign modal state
  const [campaignModal, setCampaignModal] = useState<{ open: boolean; segment: Segment | null }>({ open: false, segment: null });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignForm, setCampaignForm] = useState(emptyCampaignForm);
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/customer-segments");
      const d = await r.json();
      setSegments(d.data ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const loadCampaigns = async () => {
    try {
      const r = await fetch("/api/campaigns");
      const d = await r.json();
      setCampaigns(d.data ?? []);
    } catch { /* silent */ }
  };

  const openCampaignModal = (seg: Segment) => {
    setCampaignModal({ open: true, segment: seg });
    setCampaignForm(emptyCampaignForm);
    loadCampaigns();
  };

  const handleSendCampaign = async () => {
    if (!campaignModal.segment) return;
    if (!campaignForm.campaignId) { toast.error("یک کمپین انتخاب کنید"); return; }
    if (!campaignForm.message.trim()) { toast.error("متن پیام الزامی است"); return; }
    setSending(true);
    try {
      const r = await fetch(`/api/customer-segments/${campaignModal.segment.id}/send-campaign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaignForm.campaignId,
          message: campaignForm.message,
          subject: campaignForm.subject || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? "خطا در ارسال"); return; }
      toast.success(`کمپین برای ${d.data?.sent ?? 0} مشتری ارسال شد`);
      setCampaignModal({ open: false, segment: null });
    } catch { toast.error("خطا در ارسال کمپین"); }
    finally { setSending(false); }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error("نام سگمنت الزامی است"); return; }
    setSaving(true);
    const filters: SegmentFilters = {};
    if (form.industry) filters.industry = form.industry;
    if (form.status) filters.status = form.status;
    if (form.city) filters.city = form.city;
    if (form.minValue) filters.minContractValue = Number(form.minValue);
    if (form.maxValue) filters.maxContractValue = Number(form.maxValue);
    if (form.tags) filters.tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);

    try {
      await fetch("/api/customer-segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, description: form.description, filters }),
      });
      toast.success("سگمنت ایجاد شد");
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch { toast.error("خطا در ایجاد سگمنت"); }
    finally { setSaving(false); }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/customer-segments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      setSegments(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
    } catch { toast.error("خطا"); }
  };

  const deleteSegment = async (id: string) => {
    if (!confirm("این سگمنت حذف شود؟")) return;
    try {
      await fetch(`/api/customer-segments/${id}`, { method: "DELETE" });
      setSegments(prev => prev.filter(s => s.id !== id));
      toast.success("حذف شد");
    } catch { toast.error("خطا در حذف"); }
  };

  const renderFilterSummary = (filters: SegmentFilters) => {
    const parts = [];
    if (filters.industry) parts.push(`صنعت: ${filters.industry}`);
    if (filters.status) parts.push(`وضعیت: ${CLIENT_STATUSES.find(s => s.value === filters.status)?.label ?? filters.status}`);
    if (filters.city) parts.push(`شهر: ${filters.city}`);
    if (filters.minContractValue) parts.push(`حداقل قرارداد: ${(filters.minContractValue / 1_000_000).toFixed(0)}م`);
    if (filters.maxContractValue) parts.push(`حداکثر قرارداد: ${(filters.maxContractValue / 1_000_000).toFixed(0)}م`);
    if (filters.tags?.length) parts.push(`تگ‌ها: ${filters.tags.join(", ")}`);
    return parts.length > 0 ? parts : ["بدون فیلتر خاص (همه مشتریان)"];
  };

  const inputCls = "w-full bg-background/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Tag className="w-6 h-6 text-primary" />
            سگمنت‌بندی مشتریان
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {segments.filter(s => s.isActive).length} سگمنت فعال — گروه‌بندی مشتریان برای کمپین و فروش هدفمند
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm">
          <Plus className="w-4 h-4" /> سگمنت جدید
        </button>
      </motion.div>

      {/* How segments are used */}
      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">سگمنت‌ها در کجا استفاده می‌شوند؟</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SEGMENT_USES.map(u => (
            <Link key={u.title} href={u.href}
              className="p-3 rounded-xl bg-background/50 border border-border hover:border-primary/30 transition-all group flex items-start gap-2">
              <span className="text-xl">{u.icon}</span>
              <div>
                <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">{u.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{u.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Segments Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-card border border-border animate-pulse" />)}
        </div>
      ) : segments.length === 0 ? (
        <div className="py-20 text-center">
          <Tag className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground mb-2">هنوز سگمنتی ندارید</p>
          <p className="text-muted-foreground text-sm">سگمنت‌ها به شما کمک می‌کنند مشتریان را گروه‌بندی کرده و کمپین هدفمند اجرا کنید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map((seg, i) => (
            <motion.div key={seg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn("p-4 rounded-2xl bg-card border transition-all hover:border-primary/30 group", !seg.isActive && "opacity-60 border-dashed")}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center text-black font-bold text-sm">
                    {seg.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{seg.name}</h3>
                    {seg._count && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />{seg._count.members} عضو
                      </p>
                    )}
                  </div>
                </div>
                <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", seg.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground")}>
                  {seg.isActive ? "فعال" : "غیرفعال"}
                </span>
              </div>

              {seg.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{seg.description}</p>}

              <div className="p-2.5 rounded-xl bg-muted/40 mb-3 space-y-0.5">
                {renderFilterSummary(seg.filters).map((f, fi) => (
                  <p key={fi} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-primary/40 shrink-0" />{f}
                  </p>
                ))}
              </div>

              <div className="flex gap-2">
                <Link href={`/clients?segment=${seg.id}`}
                  className="flex-1 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" />مشتریان
                </Link>
                <button onClick={() => openCampaignModal(seg)}
                  className="flex-1 py-1.5 rounded-xl gradient-brand text-black text-xs font-semibold flex items-center justify-center gap-1 hover:opacity-90 transition-opacity">
                  <Send className="w-3 h-3" />اجرای کمپین
                </button>
                <button onClick={() => toggleActive(seg.id, seg.isActive)}
                  className="p-1.5 rounded-xl border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground transition-colors">
                  {seg.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => deleteSegment(seg.id)}
                  className="p-1.5 rounded-xl border border-border hover:border-red-500/30 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Send Campaign Modal */}
      <AnimatePresence>
        {campaignModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setCampaignModal({ open: false, segment: null })}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  اجرای کمپین — {campaignModal.segment?.name}
                </h3>
                <button onClick={() => setCampaignModal({ open: false, segment: null })}
                  className="p-2 rounded-xl hover:bg-muted text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">انتخاب کمپین *</label>
                  <select value={campaignForm.campaignId}
                    onChange={e => setCampaignForm(p => ({ ...p, campaignId: e.target.value }))}
                    className={inputCls}>
                    <option value="">-- کمپین را انتخاب کنید --</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.channel})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">موضوع (اختیاری — برای ایمیل)</label>
                  <input value={campaignForm.subject}
                    onChange={e => setCampaignForm(p => ({ ...p, subject: e.target.value }))}
                    className={inputCls} placeholder="موضوع ایمیل..." />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">متن پیام *</label>
                  <textarea value={campaignForm.message}
                    onChange={e => setCampaignForm(p => ({ ...p, message: e.target.value }))}
                    rows={4} className={inputCls + " resize-none"}
                    placeholder="متن پیام یا ایمیل را وارد کنید..." />
                </div>
              </div>
              <div className="p-5 border-t border-border flex gap-3">
                <button onClick={handleSendCampaign} disabled={sending}
                  className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  {sending ? "در حال ارسال..." : "ارسال کمپین"}
                </button>
                <button onClick={() => setCampaignModal({ open: false, segment: null })}
                  className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm">
                  انصراف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  سگمنت جدید
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">نام سگمنت *</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="مثلاً: مشتریان VIP، استارتاپ‌ها" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">توضیحات</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
                    className={inputCls + " resize-none"} placeholder="این گروه چه ویژگی‌هایی دارد؟" />
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">معیارهای فیلتر</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">صنعت</label>
                      <select value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))} className={inputCls}>
                        <option value="">همه صنایع</option>
                        {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">وضعیت مشتری</label>
                      <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={inputCls}>
                        <option value="">همه وضعیت‌ها</option>
                        {CLIENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">حداقل ارزش قرارداد (تومان)</label>
                      <input type="number" value={form.minValue} onChange={e => setForm(p => ({ ...p, minValue: e.target.value }))} className={inputCls} dir="ltr" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">حداکثر ارزش قرارداد (تومان)</label>
                      <input type="number" value={form.maxValue} onChange={e => setForm(p => ({ ...p, maxValue: e.target.value }))} className={inputCls} dir="ltr" placeholder="بدون محدودیت" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">شهر</label>
                      <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className={inputCls} placeholder="تهران، اصفهان..." />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">تگ‌ها (با کاما جدا کنید)</label>
                      <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} className={inputCls} placeholder="vip, enterprise" dir="ltr" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-border flex gap-3">
                <button onClick={handleCreate} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm disabled:opacity-50">
                  {saving ? "در حال ذخیره..." : "ایجاد سگمنت"}
                </button>
                <button onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm">
                  انصراف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
