"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Settings, Save, Eye, EyeOff, Check, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

interface ContentSettings {
  freePlanLimit: number;
  proPlanLimit: number;
  plusPlanLimit: number;
  proPlanPrice: number;
  plusPlanPrice: number;
  apiKey: string;
  textModel: string;
  imageModel: string;
  isActive: boolean;
}

export default function AdminContentSettingsPage() {
  const [settings, setSettings] = useState<ContentSettings>({
    freePlanLimit: 5,
    proPlanLimit: 20,
    plusPlanLimit: 50,
    proPlanPrice: 0,
    plusPlanPrice: 0,
    apiKey: "",
    textModel: "gpt-5.4",
    imageModel: "gemini-3-pro-image-preview",
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("admin-token") || localStorage.getItem("crm-token") : null;

  useEffect(() => {
    fetch("/api/admin/content/settings", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.data) setSettings(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/content/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success("تنظیمات ذخیره شد");
    } catch { toast.error("خطا در ذخیره"); }
    finally { setSaving(false); }
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-white/50 text-sm mb-2">{label}</label>
      {children}
    </div>
  );

  const NumInput = ({ field, min = 0 }: { field: keyof ContentSettings; min?: number }) => (
    <input type="number" min={min} value={settings[field] as number}
      onChange={(e) => setSettings((s) => ({ ...s, [field]: parseInt(e.target.value) || 0 }))}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500/50 transition-all" dir="ltr" />
  );

  if (loading) return (
    <div className="p-6 space-y-4">
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 bg-white/3 rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="p-6 max-w-2xl" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-violet-400" />
          <h1 className="text-xl font-bold text-white">تنظیمات محصول Content</h1>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium shadow-lg disabled:opacity-50 text-sm">
          {saved ? <Check className="w-4 h-4" /> : saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? "ذخیره شد" : "ذخیره"}
        </motion.button>
      </div>

      <div className="space-y-6">
        {/* Product status */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <h3 className="text-white/60 font-medium mb-4">وضعیت محصول</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">فعال/غیرفعال کردن محصول</p>
              <p className="text-white/30 text-xs mt-0.5">در صورت غیرفعال بودن، کاربران نمی‌توانند محتوا تولید کنند</p>
            </div>
            <button onClick={() => setSettings((s) => ({ ...s, isActive: !s.isActive }))}
              className={`transition-colors ${settings.isActive ? "text-emerald-400" : "text-white/30"}`}>
              {settings.isActive ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
            </button>
          </div>
        </div>

        {/* Plan limits */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <h3 className="text-white/60 font-medium mb-4">محدودیت تولید ماهانه</h3>
          <div className="grid grid-cols-3 gap-4">
            <Field label="رایگان (تعداد)"><NumInput field="freePlanLimit" min={1} /></Field>
            <Field label="پرو (تعداد)"><NumInput field="proPlanLimit" min={1} /></Field>
            <Field label="پلاس (تعداد)"><NumInput field="plusPlanLimit" min={1} /></Field>
          </div>
        </div>

        {/* Prices */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <h3 className="text-white/60 font-medium mb-4">قیمت پلن‌ها (تومان)</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="پلن پرو"><NumInput field="proPlanPrice" /></Field>
            <Field label="پلن پلاس"><NumInput field="plusPlanPrice" /></Field>
          </div>
        </div>

        {/* AI Settings */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <h3 className="text-white/60 font-medium mb-4">تنظیمات هوش مصنوعی</h3>
          <div className="space-y-4">
            <Field label="کلید API">
              <div className="relative">
                <input type={showKey ? "text" : "password"} value={settings.apiKey}
                  onChange={(e) => setSettings((s) => ({ ...s, apiKey: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500/50 transition-all pl-12"
                  dir="ltr" placeholder="sk-..." />
                <button type="button" onClick={() => setShowKey(!showKey)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="مدل متن">
                <input value={settings.textModel} onChange={(e) => setSettings((s) => ({ ...s, textModel: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500/50 transition-all"
                  dir="ltr" />
              </Field>
              <Field label="مدل تصویر">
                <input value={settings.imageModel} onChange={(e) => setSettings((s) => ({ ...s, imageModel: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500/50 transition-all"
                  dir="ltr" />
              </Field>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
