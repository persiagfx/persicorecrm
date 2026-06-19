"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, ArrowRight } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

const cls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/50 placeholder:text-white/20";
const lbl = "block text-xs font-medium text-white/50 mb-2";

const PROJECT_TYPES = [
  { value: "website", label: "طراحی سایت" },
  { value: "app", label: "اپلیکیشن موبایل" },
  { value: "ecommerce", label: "فروشگاه آنلاین" },
  { value: "crm", label: "CRM / نرم‌افزار" },
  { value: "other", label: "سایر" },
];

export default function NewProposalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    clientName: "",
    clientCompany: "",
    clientEmail: "",
    projectTitle: "",
    projectSubtitle: "",
    projectType: "website",
    primaryColor: "#8B5CF6",
    secondaryColor: "#EC4899",
    agencyName: "Persicore",
  });

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName.trim()) return toast.error("نام مشتری الزامی است");
    if (!form.projectTitle.trim()) return toast.error("عنوان پروژه الزامی است");

    setLoading(true);
    try {
      const res = await apiClient.post("/admin/proposals", form);
      toast.success("پروپزال ساخته شد");
      router.push(`/admin/proposals/${res.data.data.id}`);
    } catch {
      toast.error("خطا در ساخت پروپزال");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin/proposals" className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-white transition-colors">
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">پروپزال جدید</h1>
            <p className="text-xs text-white/40 mt-0.5">اطلاعات اولیه را وارد کنید</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">اطلاعات مشتری</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={lbl}>نام مشتری *</label>
                <input value={form.clientName} onChange={e => set("clientName", e.target.value)} placeholder="علی احمدی" className={cls} />
              </div>
              <div>
                <label className={lbl}>نام شرکت</label>
                <input value={form.clientCompany} onChange={e => set("clientCompany", e.target.value)} placeholder="شرکت ABC" className={cls} />
              </div>
              <div>
                <label className={lbl}>ایمیل</label>
                <input type="email" value={form.clientEmail} onChange={e => set("clientEmail", e.target.value)} dir="ltr" placeholder="client@email.com" className={cls} />
              </div>
            </div>
          </div>

          {/* Project */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">اطلاعات پروژه</h2>
            <div>
              <label className={lbl}>عنوان پروژه *</label>
              <input value={form.projectTitle} onChange={e => set("projectTitle", e.target.value)} placeholder="طراحی سایت آگهی املاک" className={cls} />
            </div>
            <div>
              <label className={lbl}>زیرعنوان</label>
              <input value={form.projectSubtitle} onChange={e => set("projectSubtitle", e.target.value)} placeholder="یک توضیح کوتاه..." className={cls} />
            </div>
            <div>
              <label className={lbl}>نوع پروژه</label>
              <div className="grid grid-cols-3 gap-2">
                {PROJECT_TYPES.map(t => (
                  <button key={t.value} type="button"
                    onClick={() => set("projectType", t.value)}
                    className={`py-2 rounded-xl text-xs border transition-all ${form.projectType === t.value ? "border-violet-500/50 bg-violet-600/20 text-violet-300" : "border-white/10 text-white/40 hover:border-white/20"}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">رنگ‌بندی</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>رنگ اصلی</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.primaryColor} onChange={e => set("primaryColor", e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                  <span className="text-xs text-white/40 font-mono">{form.primaryColor}</span>
                </div>
              </div>
              <div>
                <label className={lbl}>رنگ ثانوی</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.secondaryColor} onChange={e => set("secondaryColor", e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                  <span className="text-xs text-white/40 font-mono">{form.secondaryColor}</span>
                </div>
              </div>
            </div>
            {/* Preview */}
            <div className="h-10 rounded-xl" style={{ background: `linear-gradient(90deg, ${form.primaryColor}, ${form.secondaryColor})`, opacity: 0.8 }} />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            <Briefcase className="w-4 h-4" />
            {loading ? "در حال ساخت..." : "ساخت پروپزال و رفتن به ویرایشگر"}
          </button>
        </form>
      </div>
    </div>
  );
}
