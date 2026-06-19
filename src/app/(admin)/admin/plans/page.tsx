"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap, Edit3, Save, X, Users, Building2, HardDrive,
  Check, Plus, Trash2, Star, Crown, Rocket, Package
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

interface PlanConfig {
  id: string;
  key: string;
  name: string;
  nameFa: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxUsers: number;
  maxClients: number;
  maxStorageGb: number;
  features: string[];
  isActive: boolean;
  order: number;
  color: string;
  badge: string | null;
}

const ALL_FEATURES = [
  { key: "clients", label: "مدیریت مشتریان" },
  { key: "leads", label: "مدیریت لیدها" },
  { key: "projects", label: "مدیریت پروژه" },
  { key: "invoices", label: "فاکتور و پیش‌فاکتور" },
  { key: "time_tracking", label: "تایمر و ردیابی زمان" },
  { key: "contracts", label: "قراردادها" },
  { key: "tickets", label: "تیکت پشتیبانی" },
  { key: "wiki", label: "ویکی داخلی" },
  { key: "files", label: "مدیریت فایل" },
  { key: "payroll", label: "حقوق و دستمزد" },
  { key: "campaigns", label: "کمپین مارکتینگ" },
  { key: "portal", label: "پورتال مشتری" },
  { key: "api_access", label: "دسترسی API" },
  { key: "analytics_advanced", label: "تحلیل پیشرفته" },
  { key: "email_campaigns", label: "ایمیل مارکتینگ" },
  { key: "custom_domain", label: "دامنه اختصاصی" },
  { key: "white_label", label: "White Label" },
  { key: "dedicated_support", label: "پشتیبانی اختصاصی" },
];

const PLAN_ICONS: Record<string, React.ReactNode> = {
  trial: <Package className="w-5 h-5" />,
  starter: <Rocket className="w-5 h-5" />,
  pro: <Zap className="w-5 h-5" />,
  enterprise: <Crown className="w-5 h-5" />,
};

const BADGE_OPTIONS = [
  { value: "", label: "بدون نشان" },
  { value: "popular", label: "محبوب‌ترین" },
  { value: "best_value", label: "بهترین ارزش" },
  { value: "new", label: "جدید" },
];

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PlanConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [newFeature, setNewFeature] = useState("");

  const load = async () => {
    try {
      const r = await apiClient.get("/admin/plans");
      setPlans(r.data.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (plan: PlanConfig) => {
    setEditing({ ...plan, features: [...(plan.features ?? [])] });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await apiClient.patch(`/admin/plans/${editing.id}`, editing);
      toast.success("پلن ذخیره شد ✓");
      setEditing(null);
      load();
    } catch { toast.error("خطا در ذخیره"); }
    finally { setSaving(false); }
  };

  const toggleFeature = (key: string) => {
    if (!editing) return;
    const has = editing.features.includes(key);
    setEditing(p => p ? ({
      ...p,
      features: has ? p.features.filter(f => f !== key) : [...p.features, key],
    }) : null);
  };

  const fmt = (n: number) => n === 0 ? "رایگان" : n.toLocaleString("fa-IR") + " ت";

  const planBadgeLabel = (b: string | null) => BADGE_OPTIONS.find(o => o.value === (b ?? ""))?.label;

  if (loading) return (
    <div className="p-8 grid grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-72 rounded-2xl bg-white/5 animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="p-8 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-white">مدیریت پلن‌ها</h1>
        <p className="text-sm text-white/40 mt-1">قیمت، محدودیت و ویژگی‌های هر پلن را تنظیم کنید</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {plans.map((plan, idx) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07 }}
            className="relative rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 hover:border-white/20 transition-colors"
          >
            {plan.badge && (
              <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full text-xs font-bold text-black"
                style={{ background: plan.color }}>
                {plan.badge === "popular" ? "محبوب‌ترین" : plan.badge === "best_value" ? "بهترین ارزش" : plan.badge}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                  style={{ background: plan.color + "33", color: plan.color }}>
                  {PLAN_ICONS[plan.key] ?? <Zap className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{plan.nameFa}</p>
                  <p className="text-xs text-white/40">{plan.name}</p>
                </div>
              </div>
              <button onClick={() => openEdit(plan)}
                className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-white/40">ماهانه</span>
                <span className="text-white font-semibold">{fmt(plan.monthlyPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">سالانه</span>
                <span className="text-white/70">{fmt(plan.yearlyPrice)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Users, label: "کاربر", value: plan.maxUsers === 999 ? "∞" : plan.maxUsers },
                { icon: Building2, label: "مشتری", value: plan.maxClients === 9999 ? "∞" : plan.maxClients },
                { icon: HardDrive, label: "GB", value: plan.maxStorageGb },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white/5 rounded-xl p-2 text-center">
                  <Icon className="w-3.5 h-3.5 text-white/40 mx-auto mb-0.5" />
                  <p className="text-xs font-bold text-white">{value}</p>
                  <p className="text-[10px] text-white/30">{label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-xs text-white/40 font-medium">امکانات ({plan.features?.length ?? 0})</p>
              <div className="flex flex-wrap gap-1">
                {(plan.features ?? []).slice(0, 5).map(f => (
                  <span key={f} className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-white/50">{f}</span>
                ))}
                {(plan.features?.length ?? 0) > 5 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-white/30">+{plan.features.length - 5}</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-0.5 rounded-full ${plan.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                {plan.isActive ? "فعال" : "غیرفعال"}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setEditing(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0f0f1a] z-10">
                <h3 className="text-lg font-bold text-white">ویرایش پلن {editing.nameFa}</h3>
                <button onClick={() => setEditing(null)} className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="نام فارسی" value={editing.nameFa}
                    onChange={v => setEditing(p => p ? ({ ...p, nameFa: v }) : null)} />
                  <Field label="نام انگلیسی" value={editing.name}
                    onChange={v => setEditing(p => p ? ({ ...p, name: v }) : null)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <NumField label="قیمت ماهانه (تومان)" value={editing.monthlyPrice}
                    onChange={v => setEditing(p => p ? ({ ...p, monthlyPrice: v }) : null)} />
                  <NumField label="قیمت سالانه (تومان)" value={editing.yearlyPrice}
                    onChange={v => setEditing(p => p ? ({ ...p, yearlyPrice: v }) : null)} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <NumField label="حداکثر کاربر" value={editing.maxUsers}
                    onChange={v => setEditing(p => p ? ({ ...p, maxUsers: v }) : null)} />
                  <NumField label="حداکثر مشتری" value={editing.maxClients}
                    onChange={v => setEditing(p => p ? ({ ...p, maxClients: v }) : null)} />
                  <NumField label="فضا (GB)" value={editing.maxStorageGb}
                    onChange={v => setEditing(p => p ? ({ ...p, maxStorageGb: v }) : null)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">رنگ</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={editing.color}
                        onChange={e => setEditing(p => p ? ({ ...p, color: e.target.value }) : null)}
                        className="w-10 h-10 rounded-lg border-0 bg-transparent cursor-pointer" />
                      <input value={editing.color} onChange={e => setEditing(p => p ? ({ ...p, color: e.target.value }) : null)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white/70 text-sm focus:outline-none focus:border-violet-500/50" dir="ltr" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">نشان (Badge)</label>
                    <select value={editing.badge ?? ""}
                      onChange={e => setEditing(p => p ? ({ ...p, badge: e.target.value || null }) : null)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none">
                      {BADGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/40 mb-3">امکانات</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_FEATURES.map(f => {
                      const active = editing.features.includes(f.key);
                      return (
                        <button key={f.key} onClick={() => toggleFeature(f.key)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-right transition-all ${
                            active ? "bg-violet-600/20 border border-violet-500/40 text-violet-200" : "bg-white/5 border border-white/10 text-white/40 hover:text-white"
                          }`}>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${active ? "bg-violet-500" : "bg-white/10"}`}>
                            {active && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-sm text-white/70">فعال بودن پلن</span>
                  <button onClick={() => setEditing(p => p ? ({ ...p, isActive: !p.isActive }) : null)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${editing.isActive ? "bg-violet-600" : "bg-white/10"}`}>
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${editing.isActive ? "right-1" : "right-5"}`} />
                  </button>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 flex gap-3">
                <button onClick={save} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50">
                  <Save className="w-4 h-4" />{saving ? "در حال ذخیره..." : "ذخیره"}
                </button>
                <button onClick={() => setEditing(null)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm">
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

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-1.5">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-1.5">{label}</label>
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none focus:border-violet-500/50 transition-colors" dir="ltr" />
    </div>
  );
}
