"use client";
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  salaryFrom: number | null;
  salaryTo: number | null;
  deadline: string | null;
  createdAt: string;
}

function JobsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const dept = searchParams.get("department") ?? "";
  const type = searchParams.get("type") ?? "";

  useEffect(() => {
    const params = new URLSearchParams();
    if (dept) params.set("department", dept);
    if (type) params.set("type", type);
    fetch(`/api/jobs/public?${params}`)
      .then((r) => r.json())
      .then((d) => { setJobs(d.data ?? []); setLoading(false); });
  }, [dept, type]);

  function filter(key: string, val: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (val) p.set(key, val); else p.delete(key);
    router.push(`/jobs?${p}`);
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">فرصت‌های شغلی</h1>
          <p className="text-gray-500 mt-1 text-sm">موقعیت‌های شغلی فعال را مشاهده و رزومه خود را ارسال کنید</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={type}
            onChange={(e) => filter("type", e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">همه نوع‌ها</option>
            {Object.entries(JOB_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="جستجو دپارتمان..."
            value={dept}
            onChange={(e) => filter("department", e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">در حال بارگذاری...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">موقعیت شغلی فعالی وجود ندارد</div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block bg-white border rounded-xl p-5 hover:shadow-md hover:border-blue-300 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">{job.title}</h2>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                      {job.department && <span>📁 {job.department}</span>}
                      {job.location && <span>📍 {job.location}</span>}
                      {job.deadline && (
                        <span>⏰ مهلت: {new Date(job.deadline).toLocaleDateString("fa-IR")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
                      {JOB_TYPE_LABELS[job.type] ?? job.type}
                    </span>
                    {(job.salaryFrom || job.salaryTo) && (
                      <span className="text-xs text-gray-500">
                        {job.salaryFrom?.toLocaleString("fa-IR")}
                        {job.salaryFrom && job.salaryTo ? " - " : ""}
                        {job.salaryTo?.toLocaleString("fa-IR")} تومان
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function JobsPage() {
  return <Suspense><JobsPageInner /></Suspense>;
}
