"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, User, Save } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

function makeSlug(name: string) {
  return name.replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "");
}

export default function NewResumePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "", fullNameFa: "", title: "", titleFa: "",
    slug: "", email: "", phone: "", location: "", locationFa: "",
    theme: "dark", accentColor: "#8B5CF6", lang: "bilingual",
  });
  const [slugManual, setSlugManual] = useState(false);

  const handleNameChange = (name: string) => {
    setForm(p => ({ ...p, fullName: name, slug: slugManual ? p.slug : makeSlug(name) }));
  };

  const handleCreate = useCallback(async () => {
    if (!form.fullName || !form.title) { toast.error("نام و عنوان الزامی است"); return; }
    setSaving(true);
    try {
      const res = await apiClient.post("/admin/resumes", form);
      toast.success("رزومه ساخته شد");
      router.push(`/admin/resumes/${res.data.data.id}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "خطا");
    } finally { setSaving(false); }
  }, [form, router]);

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none focus:border-violet-500/50 transition-colors";
  const labelCls = "block text-xs font-medium text-white/40 mb-1.5";

  return (
    <div className="p-8 max-w-2xl" dir="rtl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/resumes" className="text-white/30 hover:text-white transition-colors">
          <ChevronRight className="w-5 h-5 rotate-180" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">رزومه جدید</h1>
          <p className="text-sm text-white/40 mt-1">اطلاعات پایه رو وارد کن</p>
        </div>
      </div>

      <div className="space-y-5 bg-white/[0.03] border border-white/10 rounded-2xl p-6">
        {/* نام */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>نام کامل (انگلیسی) *</label>
            <input value={form.fullName} onChange={e => handleNameChange(e.target.value)} placeholder="Arian Mirnazari" dir="ltr" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>نام کامل (فارسی)</label>
            <input value={form.fullNameFa} onChange={e => setForm(p => ({ ...p, fullNameFa: e.target.value }))} placeholder="آرین میرنظری" className={inputCls} />
          </div>
        </div>

        {/* عنوان */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>عنوان شغلی (انگلیسی) *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Frontend Developer" dir="ltr" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>عنوان شغلی (فارسی)</label>
            <input value={form.titleFa} onChange={e => setForm(p => ({ ...p, titleFa: e.target.value }))} placeholder="توسعه‌دهنده فرانت‌اند" className={inputCls} />
          </div>
        </div>

        {/* Slug */}
        <div>
          <label className={labelCls}>URL رزومه (slug)</label>
          <input value={form.slug} onChange={e => { setForm(p => ({ ...p, slug: e.target.value })); setSlugManual(true); }} dir="ltr" placeholder="ArianMirnazari" className={inputCls} />
          <p className="text-[10px] text-white/25 mt-1">resume.persicore.ir/{form.slug || "..."}</p>
        </div>

        {/* تماس */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>ایمیل</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} dir="ltr" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>تلفن</label>
            <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} dir="ltr" className={inputCls} />
          </div>
        </div>

        {/* تم */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>تم</label>
            <select value={form.theme} onChange={e => setForm(p => ({ ...p, theme: e.target.value }))} className={inputCls}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>زبان</label>
            <select value={form.lang} onChange={e => setForm(p => ({ ...p, lang: e.target.value }))} className={inputCls}>
              <option value="bilingual">دوزبانه</option>
              <option value="fa">فارسی</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>رنگ accent</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.accentColor} onChange={e => setForm(p => ({ ...p, accentColor: e.target.value }))}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" />
              <input value={form.accentColor} onChange={e => setForm(p => ({ ...p, accentColor: e.target.value }))} dir="ltr"
                className={inputCls} placeholder="#8B5CF6" />
            </div>
          </div>
        </div>

        <button onClick={handleCreate}
          disabled={saving || (!form.fullName.trim() && !form.fullNameFa.trim()) || (!form.title.trim() && !form.titleFa.trim())}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? "در حال ساختن..." : "ساختن رزومه و ادامه"}
        </button>
      </div>
    </div>
  );
}
