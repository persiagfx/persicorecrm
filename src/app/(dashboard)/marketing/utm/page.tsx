"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link2, Plus, X, Copy, Check, MousePointerClick, ExternalLink, Megaphone, Search } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import Link from "next/link";

interface UTMLink {
  id: string;
  title: string;
  baseUrl: string;
  source: string;
  medium: string;
  campaignName: string;
  content: string | null;
  clicks: number;
  createdBy: { name: string };
  createdAt: string;
}

interface Campaign { id: string; title: string; channel: string; }

const SOURCES = [
  { value: "google", label: "Google" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "direct", label: "Direct" },
  { value: "referral", label: "Referral" },
];

const MEDIUMS = [
  { value: "cpc", label: "CPC (تبلیغ کلیکی)" },
  { value: "email", label: "Email" },
  { value: "social", label: "Social" },
  { value: "organic", label: "Organic" },
  { value: "referral", label: "Referral" },
  { value: "banner", label: "Banner" },
];

export default function UTMPage() {
  const [links, setLinks] = useState<UTMLink[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    title: "", baseUrl: "", source: "", medium: "", campaign: "", content: "", term: "",
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/marketing/utm-links");
    const d = await r.json();
    setLinks(d.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    apiClient.get("/campaigns?perPage=100").then(r => setCampaigns(r.data?.data ?? [])).catch((err) => console.error(err));
  }, []);

  const handleCreate = async () => {
    if (!form.title || !form.baseUrl || !form.source || !form.medium) {
      toast.error("عنوان، URL، source و medium الزامی‌اند"); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/marketing/utm-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("لینک UTM ساخته شد");
      setShowModal(false);
      setForm({ title: "", baseUrl: "", source: "", medium: "", campaign: "", content: "", term: "" });
      load();
    } catch { toast.error("خطا در ساخت لینک"); }
    finally { setSaving(false); }
  };

  const buildUrl = (l: UTMLink) => {
    const params = new URLSearchParams({ utm_source: l.source, utm_medium: l.medium });
    if (l.campaignName) params.set("utm_campaign", l.campaignName);
    if (l.content) params.set("utm_content", l.content);
    const base = l.baseUrl.includes("?") ? l.baseUrl + "&" : l.baseUrl + "?";
    return base + params.toString();
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success("لینک کپی شد");
  };

  const filtered = links.filter(l => !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.source.includes(search) || l.campaignName?.includes(search));

  const inputCls = "w-full bg-background/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Link2 className="w-6 h-6 text-primary" />
            UTM لینک‌ها
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{links.length} لینک · ردیابی منبع ترافیک کمپین‌ها</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/marketing/analytics"
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card text-muted-foreground text-sm hover:text-foreground transition-colors">
            مشاهده آنالیتیکس
          </Link>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm">
            <Plus className="w-4 h-4" />لینک جدید
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "کل لینک‌ها", value: links.length, icon: Link2, color: "text-primary bg-primary/10" },
          { label: "کل کلیک‌ها", value: links.reduce((s, l) => s + l.clicks, 0), icon: MousePointerClick, color: "text-blue-400 bg-blue-500/10" },
          { label: "کمپین‌های متصل", value: new Set(links.map(l => l.campaignName).filter(Boolean)).size, icon: Megaphone, color: "text-emerald-400 bg-emerald-500/10" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl bg-card border border-border flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{s.value.toLocaleString("fa-IR")}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو در لینک‌ها..."
          className="w-full pe-10 ps-4 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-card border border-border animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Link2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لینکی وجود ندارد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l, i) => {
            const fullUrl = buildUrl(l);
            return (
              <motion.div key={l.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-foreground text-sm">{l.title}</p>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{l.source}</span>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{l.medium}</span>
                      {l.campaignName && <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{l.campaignName}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono truncate" dir="ltr">{fullUrl}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" />{l.clicks} کلیک</span>
                      <span>توسط: {l.createdBy?.name}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a href={fullUrl} target="_blank" rel="noreferrer"
                      className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button onClick={() => handleCopy(fullUrl, l.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${copied === l.id ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"}`}>
                      {copied === l.id ? <><Check className="w-3.5 h-3.5" />کپی شد</> : <><Copy className="w-3.5 h-3.5" />کپی</>}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-card">
                <h3 className="font-bold text-foreground flex items-center gap-2"><Link2 className="w-5 h-5 text-primary" />UTM لینک جدید</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">عنوان لینک *</label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={inputCls} placeholder="مثلاً: کمپین پاییز گوگل" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">URL پایه *</label>
                  <input value={form.baseUrl} onChange={e => setForm(p => ({ ...p, baseUrl: e.target.value }))} className={inputCls} dir="ltr" placeholder="https://yoursite.com" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">utm_source *</label>
                    <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} className={inputCls}>
                      <option value="">انتخاب...</option>
                      {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">utm_medium *</label>
                    <select value={form.medium} onChange={e => setForm(p => ({ ...p, medium: e.target.value }))} className={inputCls}>
                      <option value="">انتخاب...</option>
                      {MEDIUMS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">utm_campaign (کمپین)</label>
                    <select value={form.campaign} onChange={e => setForm(p => ({ ...p, campaign: e.target.value }))} className={inputCls}>
                      <option value="">بدون کمپین</option>
                      {campaigns.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">utm_content</label>
                    <input value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} className={inputCls} dir="ltr" placeholder="banner-v1" />
                  </div>
                </div>

                {/* Preview */}
                {form.baseUrl && form.source && form.medium && (
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">پیش‌نمایش لینک:</p>
                    <p className="text-xs font-mono text-primary break-all" dir="ltr">
                      {form.baseUrl}?utm_source={form.source}&utm_medium={form.medium}
                      {form.campaign && `&utm_campaign=${form.campaign}`}
                      {form.content && `&utm_content=${form.content}`}
                    </p>
                  </div>
                )}
              </div>
              <div className="p-5 border-t border-border flex gap-3">
                <button onClick={handleCreate} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm disabled:opacity-50">
                  {saving ? "در حال ساخت..." : "ساخت لینک UTM"}
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
