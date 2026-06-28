"use client";
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "تمام‌وقت",
  part_time: "پاره‌وقت",
  contract: "قراردادی",
  internship: "کارآموزی",
};

interface Job {
  id: string;
  title: string;
  department: string | null;
  type: string;
  location: string | null;
  description: string | null;
  requirements: string | null;
  salaryFrom: number | null;
  salaryTo: number | null;
  deadline: string | null;
}

function JobDetailInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [applying, setApplying] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", coverLetter: "" });

  useEffect(() => {
    fetch(`/api/jobs/public?`)
      .then((r) => r.json())
      .then((d) => {
        const found = (d.data ?? []).find((j: Job) => j.id === id);
        if (found) setJob(found);
        else setNotFound(true);
        setLoading(false);
      });
  }, [id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setApplying(true);
    try {
      const r = await fetch(`/api/jobs/public/${id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (r.ok) setSubmitted(true);
      else setError(d.message ?? "خطایی رخ داد");
    } catch {
      setError("خطای شبکه");
    } finally {
      setApplying(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <p className="text-gray-400">در حال بارگذاری...</p>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <p className="text-gray-500 mb-4">این موقعیت شغلی یافت نشد یا بسته شده است</p>
        <Link href="/jobs" className="text-blue-600 hover:underline text-sm">بازگشت به لیست مشاغل</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/jobs" className="text-sm text-blue-600 hover:underline">← بازگشت به لیست مشاغل</Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Job Header */}
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-xl font-bold text-gray-900">{job!.title}</h1>
            <span className="bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-full shrink-0">
              {JOB_TYPE_LABELS[job!.type] ?? job!.type}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            {job!.department && <span>📁 {job!.department}</span>}
            {job!.location && <span>📍 {job!.location}</span>}
            {(job!.salaryFrom || job!.salaryTo) && (
              <span>💰 {job!.salaryFrom?.toLocaleString("fa-IR")}
                {job!.salaryFrom && job!.salaryTo ? " - " : ""}
                {job!.salaryTo?.toLocaleString("fa-IR")} تومان
              </span>
            )}
            {job!.deadline && (
              <span>⏰ مهلت: {new Date(job!.deadline).toLocaleDateString("fa-IR")}</span>
            )}
          </div>
        </div>

        {/* Description */}
        {job!.description && (
          <div className="bg-white border rounded-xl p-6">
            <h2 className="font-semibold text-gray-800 mb-3">شرح موقعیت شغلی</h2>
            <p className="text-gray-600 text-sm leading-7 whitespace-pre-wrap">{job!.description}</p>
          </div>
        )}

        {/* Requirements */}
        {job!.requirements && (
          <div className="bg-white border rounded-xl p-6">
            <h2 className="font-semibold text-gray-800 mb-3">شرایط و مهارت‌های مورد نیاز</h2>
            <p className="text-gray-600 text-sm leading-7 whitespace-pre-wrap">{job!.requirements}</p>
          </div>
        )}

        {/* Apply Form */}
        <div className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold text-gray-800 mb-4">ارسال رزومه</h2>
          {submitted ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-green-700 font-medium">درخواست شما با موفقیت ثبت شد</p>
              <p className="text-gray-500 text-sm mt-1">در صورت تطابق شرایط، با شما تماس خواهیم گرفت</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام و نام خانوادگی *</label>
                <input
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="نام کامل خود را وارد کنید"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">شماره تماس</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="09..."
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="example@email.com"
                    dir="ltr"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">معرفی مختصر (اختیاری)</label>
                <textarea
                  value={form.coverLetter}
                  onChange={(e) => setForm({ ...form, coverLetter: e.target.value })}
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="چرا برای این موقعیت مناسب هستید..."
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={applying}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                {applying ? "در حال ارسال..." : "ارسال درخواست"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  return <Suspense><JobDetailInner /></Suspense>;
}
