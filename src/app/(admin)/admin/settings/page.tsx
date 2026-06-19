"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Save, Globe, Search, Share2, BookOpen, Plus, X } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

interface SiteSettings {
  siteName: string; siteTagline: string; siteDesc: string;
  logoUrl: string; faviconUrl: string; seoKeywords: string;
  googleAnalytics: string; twitter: string; instagram: string;
  linkedin: string; github: string;
  blogPostsPerPage: number; blogShowAuthor: boolean;
  navItems: { label: string; href: string }[];
  footerLinks: { label: string; href: string }[];
}

const EMPTY: SiteSettings = {
  siteName: "Persicore", siteTagline: "", siteDesc: "", logoUrl: "", faviconUrl: "",
  seoKeywords: "", googleAnalytics: "", twitter: "", instagram: "", linkedin: "", github: "",
  blogPostsPerPage: 9, blogShowAuthor: true, navItems: [], footerLinks: [],
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "seo" | "social" | "blog">("general");

  useEffect(() => {
    apiClient.get("/admin/settings")
      .then(r => setSettings({ ...EMPTY, ...r.data.data }))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await apiClient.put("/admin/settings", settings);
      toast.success("تنظیمات ذخیره شد ✓");
    } catch { toast.error("خطا در ذخیره"); }
    finally { setSaving(false); }
  };

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none focus:border-violet-500/50 transition-colors";
  const labelCls = "block text-xs font-medium text-white/40 mb-1.5";

  if (loading) return <div className="p-8"><div className="h-8 w-48 bg-white/5 animate-pulse rounded-xl" /></div>;

  return (
    <div className="p-8 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">تنظیمات سایت</h1>
          <p className="text-sm text-white/40 mt-1">persicore.ir و blog.persicore.ir</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
          <Save className="w-4 h-4" />{saving ? "در حال ذخیره..." : "ذخیره"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
        {([
          { id: "general", label: "عمومی", icon: Globe },
          { id: "seo", label: "SEO", icon: Search },
          { id: "social", label: "شبکه اجتماعی", icon: Share2 },
          { id: "blog", label: "بلاگ", icon: BookOpen },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id ? "bg-violet-600/30 text-violet-200" : "text-white/40 hover:text-white"
            }`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl space-y-5">

        {activeTab === "general" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>نام سایت</label>
                <input value={settings.siteName} onChange={e => setSettings(p => ({ ...p, siteName: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>شعار (Tagline)</label>
                <input value={settings.siteTagline} onChange={e => setSettings(p => ({ ...p, siteTagline: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>توضیح سایت</label>
              <textarea value={settings.siteDesc} onChange={e => setSettings(p => ({ ...p, siteDesc: e.target.value }))} rows={3} className={inputCls + " resize-none"} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>URL لوگو</label>
                <input value={settings.logoUrl} onChange={e => setSettings(p => ({ ...p, logoUrl: e.target.value }))} className={inputCls} dir="ltr" />
              </div>
              <div>
                <label className={labelCls}>URL فاوایکون</label>
                <input value={settings.faviconUrl} onChange={e => setSettings(p => ({ ...p, faviconUrl: e.target.value }))} className={inputCls} dir="ltr" />
              </div>
            </div>
            {/* Nav items */}
            <div>
              <label className={labelCls}>آیتم‌های منو</label>
              {settings.navItems.map((item, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={item.label} onChange={e => { const n = [...settings.navItems]; n[i] = { ...n[i], label: e.target.value }; setSettings(p => ({ ...p, navItems: n })); }}
                    className={inputCls} placeholder="عنوان" />
                  <input value={item.href} onChange={e => { const n = [...settings.navItems]; n[i] = { ...n[i], href: e.target.value }; setSettings(p => ({ ...p, navItems: n })); }}
                    className={inputCls} placeholder="/path" dir="ltr" />
                  <button onClick={() => setSettings(p => ({ ...p, navItems: p.navItems.filter((_, j) => j !== i) }))}
                    className="p-2 rounded-xl hover:bg-red-500/10 text-white/30 hover:text-red-400 shrink-0"><X className="w-4 h-4" /></button>
                </div>
              ))}
              <button onClick={() => setSettings(p => ({ ...p, navItems: [...p.navItems, { label: "", href: "" }] }))}
                className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 mt-1">
                <Plus className="w-3.5 h-3.5" />افزودن آیتم
              </button>
            </div>
          </>
        )}

        {activeTab === "seo" && (
          <>
            <div>
              <label className={labelCls}>کلیدواژه‌های پیش‌فرض سایت</label>
              <input value={settings.seoKeywords} onChange={e => setSettings(p => ({ ...p, seoKeywords: e.target.value }))} className={inputCls} dir="ltr" placeholder="keyword1, keyword2" />
            </div>
            <div>
              <label className={labelCls}>Google Analytics ID</label>
              <input value={settings.googleAnalytics} onChange={e => setSettings(p => ({ ...p, googleAnalytics: e.target.value }))} className={inputCls} dir="ltr" placeholder="G-XXXXXXXXXX" />
            </div>
            <div className="p-4 rounded-xl bg-violet-600/10 border border-violet-500/20">
              <p className="text-xs text-violet-300 font-medium mb-1">💡 راهنما</p>
              <p className="text-xs text-white/40">عنوان و توضیح SEO هر پست در صفحه ویرایش پست تنظیم می‌شود. این تنظیمات برای صفحه اصلی بلاگ استفاده می‌شوند.</p>
            </div>
          </>
        )}

        {activeTab === "social" && (
          <div className="grid grid-cols-2 gap-4">
            {([
              { key: "twitter", label: "Twitter / X", placeholder: "@username" },
              { key: "instagram", label: "Instagram", placeholder: "@username" },
              { key: "linkedin", label: "LinkedIn", placeholder: "company/persicore" },
              { key: "github", label: "GitHub", placeholder: "persicore" },
            ] as const).map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <input value={settings[key]} onChange={e => setSettings(p => ({ ...p, [key]: e.target.value }))}
                  className={inputCls} dir="ltr" placeholder={placeholder} />
              </div>
            ))}
          </div>
        )}

        {activeTab === "blog" && (
          <>
            <div>
              <label className={labelCls}>تعداد پست در هر صفحه</label>
              <input type="number" min={3} max={50} value={settings.blogPostsPerPage}
                onChange={e => setSettings(p => ({ ...p, blogPostsPerPage: Number(e.target.value) }))} className={inputCls} dir="ltr" />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div>
                <p className="text-sm text-white/70">نمایش اطلاعات نویسنده</p>
                <p className="text-xs text-white/30 mt-0.5">آواتار و نام نویسنده در پست‌ها</p>
              </div>
              <button onClick={() => setSettings(p => ({ ...p, blogShowAuthor: !p.blogShowAuthor }))}
                className={`w-11 h-6 rounded-full transition-colors relative ${settings.blogShowAuthor ? "bg-violet-600" : "bg-white/10"}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.blogShowAuthor ? "right-1" : "right-5"}`} />
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
