"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Settings, User, Moon, Sun, Monitor, Building2, FileText, Palette, Shield, ChevronLeft, Loader2, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth/context";
import { useThemeStore, useCompanyStore } from "@/lib/store";
import { USER_ROLES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { INDUSTRIES, type IndustryType, getNavSections } from "@/lib/industry-modules";

const BASE_TABS = ["پروفایل من", "ظاهر و تم", "اعلان‌ها", "امنیت"] as const;
const ADMIN_TABS = ["پروفایل من", "تنظیمات شرکت", "قالب فاکتور", "ظاهر و تم", "اعلان‌ها", "امنیت"] as const;

const INVOICE_COLORS = [
  { label: "طلایی", value: "#d4a843" },
  { label: "آبی", value: "#3b82f6" },
  { label: "سبز", value: "#22c55e" },
  { label: "بنفش", value: "#8b5cf6" },
  { label: "قرمز", value: "#ef4444" },
];

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const isAdmin = user?.role === "admin";
  const tabs = isAdmin ? ADMIN_TABS : BASE_TABS;
  const [activeTab, setActiveTab] = useState<string>(tabs[0]);
  const { theme, setTheme } = useTheme();
  const {
    reducedMotion, setReducedMotion,
    useShamsiDate, setUseShamsiDate,
    useEnglishNumbers, setUseEnglishNumbers,
  } = useThemeStore();
  const { settings: company, updateSettings } = useCompanyStore();
  const [industryType, setIndustryType] = useState<IndustryType>(
    (user?.tenant?.industryType as IndustryType) ?? "GENERAL"
  );
  const [savingCompany, setSavingCompany] = useState(false);

  const saveCompanySettings = async () => {
    setSavingCompany(true);
    try {
      await apiClient.put("/settings", {
        name: company.name,
        legalName: company.legalName,
        taxId: company.taxId,
        registrationNumber: company.registrationNumber,
        phone: company.phone,
        email: company.email,
        website: company.website,
        address: company.address,
        logoUrl: company.logoUrl,
        timezone: company.timezone,
        currency: company.currency,
        primaryColor: company.primaryColor,
        industryType,
      });
      await refreshUser();
      toast.success("تنظیمات شرکت ذخیره شد — منوی سایدبار آپدیت شد");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err instanceof Error ? err.message : null) ??
        "خطا در ذخیره تنظیمات";
      toast.error(msg);
    } finally {
      setSavingCompany(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          تنظیمات
        </h1>
      </motion.div>

      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

        {/* ─── پروفایل من ─── */}
        {activeTab === "پروفایل من" && (
          <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center text-2xl font-bold text-black">
                {user?.name.slice(0, 1)}
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-lg">{user?.name}</h2>
                <p className="text-muted-foreground text-sm">
                  {user?.role ? USER_ROLES[user.role]?.label : ""}
                </p>
              </div>
            </div>
            {[
              { label: "نام کامل", value: user?.name ?? "" },
              { label: "ایمیل", value: user?.email ?? "" },
              { label: "شماره موبایل", value: user?.phone ?? "" },
            ].map(({ label, value }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
                <input
                  defaultValue={value}
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            ))}
            <button
              onClick={() => toast.success("اطلاعات ذخیره شد")}
              className="px-5 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow"
            >
              ذخیره تغییرات
            </button>
          </div>
        )}

        {/* ─── تنظیمات شرکت (فقط admin) ─── */}
        {activeTab === "تنظیمات شرکت" && isAdmin && (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">اطلاعات شرکت</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {(
                  [
                    { label: "نام شرکت", key: "name" },
                    { label: "نام قانونی", key: "legalName" },
                    { label: "شناسه مالیاتی", key: "taxId" },
                    { label: "شماره ثبت", key: "registrationNumber" },
                    { label: "تلفن", key: "phone" },
                    { label: "ایمیل", key: "email" },
                    { label: "وب‌سایت", key: "website" },
                  ] as { label: string; key: keyof typeof company }[]
                ).map(({ label, key }) => (
                  <div key={key} className={key === "legalName" ? "col-span-2" : ""}>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
                    <input
                      value={(company[key] as string) ?? ""}
                      onChange={(e) => updateSettings({ [key]: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">آدرس</label>
                  <input
                    value={company.address ?? ""}
                    onChange={(e) => updateSettings({ address: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">لوگوی شرکت</h3>
              </div>
              <div className="flex items-center gap-4">
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt="logo"
                    className="w-16 h-16 rounded-xl object-contain bg-muted border border-border"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-muted border border-dashed border-border flex items-center justify-center text-muted-foreground text-xs">
                    بدون لوگو
                  </div>
                )}
                <div className="flex-1">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">آدرس URL لوگو</label>
                  <input
                    value={company.logoUrl ?? ""}
                    onChange={(e) => updateSettings({ logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
            </div>

            {/* ─── Industry Type ─── */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">نوع کسب‌وکار</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                با تغییر این مورد، منوی سایدبار بر اساس ماژول‌های مرتبط با صنعت شما آپدیت می‌شود
              </p>
              <div className="grid grid-cols-4 gap-2">
                {INDUSTRIES.map((ind) => {
                  const selected = industryType === ind.type;
                  return (
                    <button
                      key={ind.type}
                      onClick={() => setIndustryType(ind.type)}
                      className={cn(
                        "rounded-xl border p-3 text-center transition-all space-y-1.5",
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-muted/30 hover:border-border-strong hover:bg-muted"
                      )}
                    >
                      <span className="text-2xl">{ind.icon}</span>
                      <p className={cn("text-xs font-medium leading-tight", selected ? "text-primary" : "text-muted-foreground")}>
                        {ind.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─── Module Selection (GENERAL only) ─── */}
            {industryType === "GENERAL" && (
              <GeneralModuleSelector
                selectedModules={company.selectedModules ?? []}
                onChange={(modules) => updateSettings({ selectedModules: modules })}
              />
            )}

            <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">منطقه زمانی و ارز</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">منطقه زمانی</label>
                  <select
                    value={company.timezone ?? "Asia/Tehran"}
                    onChange={(e) => updateSettings({ timezone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Asia/Tehran">ایران (Asia/Tehran)</option>
                    <option value="Asia/Dubai">دبی (Asia/Dubai)</option>
                    <option value="Europe/London">لندن (Europe/London)</option>
                    <option value="Europe/Berlin">برلین (Europe/Berlin)</option>
                    <option value="America/New_York">نیویورک (America/New_York)</option>
                    <option value="America/Los_Angeles">لس‌آنجلس (America/Los_Angeles)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">واحد پول</label>
                  <select
                    value={company.currency ?? "IRR"}
                    onChange={(e) => updateSettings({ currency: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="IRR">ریال ایران (IRR)</option>
                    <option value="IRT">تومان (IRT)</option>
                    <option value="USD">دلار آمریکا (USD)</option>
                    <option value="EUR">یورو (EUR)</option>
                    <option value="AED">درهم امارات (AED)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">رنگ برند (White-Label)</h3>
              </div>
              <p className="text-xs text-muted-foreground">رنگ اصلی برند شما در تمام رابط کاربری اعمال می‌شود</p>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={company.primaryColor ?? "#d4a843"}
                  onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                  className="w-12 h-12 rounded-xl border border-border cursor-pointer bg-transparent"
                />
                <div className="flex-1 space-y-2">
                  <input
                    value={company.primaryColor ?? "#d4a843"}
                    onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                    placeholder="#d4a843"
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {["#d4a843", "#6366f1", "#22c55e", "#ef4444", "#f97316", "#0ea5e9", "#8b5cf6"].map((c) => (
                      <button
                        key={c}
                        onClick={() => updateSettings({ primaryColor: c })}
                        className="w-7 h-7 rounded-lg border-2 transition-all hover:scale-110"
                        style={{ backgroundColor: c, borderColor: company.primaryColor === c ? "white" : "transparent" }}
                      />
                    ))}
                  </div>
                </div>
                <div
                  className="w-24 h-12 rounded-xl flex items-center justify-center text-xs font-semibold text-white"
                  style={{ backgroundColor: company.primaryColor ?? "#d4a843" }}
                >
                  پیش‌نمایش
                </div>
              </div>
            </div>

            <button
              onClick={saveCompanySettings}
              disabled={savingCompany}
              className="px-5 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow disabled:opacity-60 flex items-center gap-2"
            >
              {savingCompany && <Loader2 className="w-4 h-4 animate-spin" />}
              ذخیره تنظیمات
            </button>
          </div>
        )}

        {/* ─── قالب فاکتور (فقط admin) ─── */}
        {activeTab === "قالب فاکتور" && isAdmin && (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">رنگ اصلی فاکتور</h3>
              </div>
              <div className="flex gap-3 flex-wrap">
                {INVOICE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => updateSettings({ invoiceColor: c.value })}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                      company.invoiceColor === c.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-border-strong"
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: c.value }} />
                    <span className="text-xs text-muted-foreground">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">متن پاورقی فاکتور</h3>
              </div>
              <textarea
                value={company.invoiceFooter ?? ""}
                onChange={(e) => updateSettings({ invoiceFooter: e.target.value })}
                rows={3}
                placeholder="متنی که در پایین هر فاکتور نمایش داده می‌شود..."
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
            </div>

            {/* پیش‌نمایش فاکتور */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
              <h3 className="font-semibold text-foreground text-sm">پیش‌نمایش</h3>
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="h-2" style={{ backgroundColor: company.invoiceColor ?? "#d4a843" }} />
                <div className="p-4 bg-background">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      {company.logoUrl ? (
                        <img src={company.logoUrl} alt="logo" className="h-8 object-contain" />
                      ) : (
                        <p className="font-bold text-foreground">{company.name || "نام شرکت"}</p>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">شماره فاکتور</p>
                      <p className="text-sm font-bold text-foreground">#INV-001</p>
                    </div>
                  </div>
                  <div className="h-px bg-border mb-3" />
                  <div className="flex justify-between text-xs text-muted-foreground mb-3">
                    <span>خدمات طراحی وب‌سایت</span>
                    <span>۱۰,۰۰۰,۰۰۰ تومان</span>
                  </div>
                  <div className="h-px bg-border mb-3" />
                  <p className="text-xs text-muted-foreground text-center">{company.invoiceFooter}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => toast.success("قالب فاکتور ذخیره شد")}
              className="px-5 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow"
            >
              ذخیره قالب
            </button>
          </div>
        )}

        {/* ─── ظاهر و تم ─── */}
        {activeTab === "ظاهر و تم" && (
          <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">تم رنگی</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: "dark", label: "دارک", icon: Moon },
                  { key: "light", label: "لایت", icon: Sun },
                  { key: "system", label: "سیستم", icon: Monitor },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                      theme === key
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">تنظیمات نمایش</h3>
              {[
                { label: "کاهش انیمیشن‌ها", desc: "مناسب برای کاربرانی که به حرکت حساسیت دارند", value: reducedMotion, onChange: setReducedMotion },
                { label: "تاریخ شمسی", desc: "نمایش تاریخ‌ها به صورت شمسی", value: useShamsiDate, onChange: setUseShamsiDate },
                { label: "اعداد انگلیسی", desc: "نمایش اعداد با رقم‌های انگلیسی", value: useEnglishNumbers, onChange: setUseEnglishNumbers },
              ].map(({ label, desc, value, onChange }) => (
                <div key={label} className="flex items-center justify-between p-4 rounded-xl bg-muted">
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => onChange(!value)}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors duration-200",
                      value ? "bg-primary" : "bg-border-strong"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200",
                        value ? "right-1" : "right-6"
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── امنیت ─── */}
        {activeTab === "امنیت" && (
          <div className="space-y-3">
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">امنیت حساب</h3>
              </div>
              <Link
                href="/settings/sessions"
                className="flex items-center justify-between p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <div>
                    <p className="text-sm font-medium text-foreground">مدیریت جلسات</p>
                    <p className="text-xs text-muted-foreground mt-0.5">مشاهده و مدیریت دستگاه‌های وارد شده</p>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            </div>
          </div>
        )}

        {/* ─── اعلان‌ها ─── */}
        {activeTab === "اعلان‌ها" && (
          <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
            <h3 className="font-semibold text-foreground mb-4">تنظیمات اعلان</h3>
            {[
              { label: "فاکتورهای معوق", desc: "اعلان برای فاکتورهایی که سررسیدشان گذشته" },
              { label: "ددلاین پروژه", desc: "یادآوری ۳ روز قبل از ددلاین" },
              { label: "تسک‌های جدید", desc: "وقتی تسکی به شما واگذار می‌شود" },
              { label: "پیام‌های جدید", desc: "اعلان برای پیام‌های تیم" },
              { label: "امضای قرارداد", desc: "وقتی مشتری قرارداد را امضا می‌کند" },
              { label: "یادآور follow-up", desc: "یادآوری پیگیری لیدها" },
            ].map(({ label, desc }) => (
              <div key={label} className="flex items-center justify-between p-4 rounded-xl bg-muted">
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <button className="relative w-11 h-6 rounded-full bg-primary transition-colors">
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white shadow" />
                </button>
              </div>
            ))}
          </div>
        )}

      </motion.div>
    </div>
  );
}

// ─── General Module Selector ──────────────────────────────────────────────────
function GeneralModuleSelector({
  selectedModules,
  onChange,
}: {
  selectedModules: string[];
  onChange: (modules: string[]) => void;
}) {
  const sections = getNavSections("GENERAL").filter((s) => s.label !== null);
  const allHrefs = sections.flatMap((s) => s.items.map((i) => i.href));
  const effective = selectedModules.length === 0 ? allHrefs : selectedModules;

  const toggle = (href: string) => {
    const next = effective.includes(href) ? effective.filter((h) => h !== href) : [...effective, href];
    onChange(next.length === allHrefs.length ? [] : next);
  };

  const toggleSection = (label: string) => {
    const sec = sections.find((s) => s.label === label);
    if (!sec) return;
    const hrefs = sec.items.map((i) => i.href);
    const allSel = hrefs.every((h) => effective.includes(h));
    const next = allSel
      ? effective.filter((h) => !hrefs.includes(h))
      : [...new Set([...effective, ...hrefs])];
    onChange(next.length === allHrefs.length ? [] : next);
  };

  return (
    <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">انتخاب ماژول‌ها (حالت عمومی)</h3>
        </div>
        <button onClick={() => onChange([])} className="text-xs text-primary hover:underline">انتخاب همه</button>
      </div>
      <p className="text-xs text-muted-foreground">صفحاتی که در منوی سایدبار نمایش داده شوند را انتخاب کنید</p>

      <div className="space-y-2 max-h-80 overflow-y-auto pe-1">
        {sections.map((section) => {
          const hrefs = section.items.map((i) => i.href);
          const selCount = hrefs.filter((h) => effective.includes(h)).length;
          const allSel = selCount === hrefs.length;
          const someSel = selCount > 0 && !allSel;

          return (
            <div key={section.label} className="rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => toggleSection(section.label!)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/50 hover:bg-muted transition-colors"
              >
                <span className="text-sm font-medium text-foreground">{section.label}</span>
                <div className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                  allSel ? "bg-primary border-primary" : someSel ? "bg-primary/30 border-primary/50" : "border-border"
                )}>
                  {allSel && <Check className="w-3 h-3 text-primary-foreground" />}
                  {someSel && <div className="w-2 h-0.5 bg-primary rounded-full" />}
                </div>
              </button>
              <div className="px-4 py-2 grid grid-cols-2 gap-1.5">
                {section.items.map((item) => {
                  const checked = effective.includes(item.href);
                  return (
                    <button
                      key={item.href}
                      onClick={() => toggle(item.href)}
                      className={cn(
                        "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all text-right",
                        checked
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all",
                        checked ? "bg-primary border-primary" : "border-border"
                      )}>
                        {checked && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                      </div>
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {effective.length} از {allHrefs.length} صفحه فعال — تغییرات فوری در سایدبار اعمال می‌شود
      </p>
    </div>
  );
}
