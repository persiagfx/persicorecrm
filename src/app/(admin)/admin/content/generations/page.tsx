"use client";

import { useState, useEffect } from "react";
import { FileText, Search, Filter, Instagram, MessageCircle, MessageSquare, Mail } from "lucide-react";

interface Gen {
  id: string;
  platform: string;
  language: string;
  topic: string;
  tone: string;
  contentType: string;
  keyword?: string;
  seoScore?: number;
  contentUserId?: string;
  crmUserId?: string;
  createdAt: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "اینستاگرام", telegram: "تلگرام", bale: "بله", blog: "مقاله", email: "ایمیل", sms: "پیامک",
};

export default function AdminContentGenerationsPage() {
  const [items, setItems] = useState<Gen[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [platform, setPlatform] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("admin-token") || localStorage.getItem("crm-token") : null;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), ...(platform ? { platform } : {}) });
    fetch(`/api/admin/content/generations?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        setItems(d.data?.items ?? []);
        setPages(d.data?.pages ?? 1);
        setTotal(d.data?.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [page, platform]);

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-violet-400" />
          <h1 className="text-xl font-bold text-white">تاریخچه تولیدها</h1>
          <span className="text-white/30 text-sm">{total} مورد</span>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/30" />
          {["", "instagram", "telegram", "blog", "email", "sms"].map((p) => (
            <button key={p} onClick={() => { setPlatform(p); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${platform === p ? "bg-violet-500/20 border-violet-500/30 text-violet-300" : "bg-white/3 border-white/8 text-white/40 hover:bg-white/5"}`}>
              {p ? PLATFORM_LABELS[p] : "همه"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-right px-4 py-3 text-white/40 font-medium">موضوع</th>
              <th className="text-right px-4 py-3 text-white/40 font-medium">پلتفرم</th>
              <th className="text-right px-4 py-3 text-white/40 font-medium">زبان</th>
              <th className="text-right px-4 py-3 text-white/40 font-medium">لحن</th>
              <th className="text-right px-4 py-3 text-white/40 font-medium">SEO</th>
              <th className="text-right px-4 py-3 text-white/40 font-medium">نوع کاربر</th>
              <th className="text-right px-4 py-3 text-white/40 font-medium">تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              : items.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-white/70 max-w-[200px] truncate">{item.topic}</td>
                    <td className="px-4 py-3 text-white/50">{PLATFORM_LABELS[item.platform] ?? item.platform}</td>
                    <td className="px-4 py-3 text-white/40">{item.language === "fa" ? "فارسی" : "English"}</td>
                    <td className="px-4 py-3 text-white/40">{item.tone}</td>
                    <td className="px-4 py-3">
                      {item.seoScore !== undefined
                        ? <span className={`text-xs px-2 py-0.5 rounded-full ${item.seoScore >= 70 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>{item.seoScore}</span>
                        : <span className="text-white/20">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.crmUserId ? "bg-blue-500/10 text-blue-400" : "bg-violet-500/10 text-violet-400"}`}>
                        {item.crmUserId ? "CRM" : "مستقل"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/30 text-xs">{new Date(item.createdAt).toLocaleDateString("fa-IR")}</td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!loading && items.length === 0 && <div className="py-10 text-center text-white/30">موردی یافت نشد</div>}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5 disabled:opacity-30 transition-all text-sm">قبلی</button>
          <span className="text-white/40 text-sm">{page} از {pages}</span>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
            className="px-4 py-2 rounded-xl border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5 disabled:opacity-30 transition-all text-sm">بعدی</button>
        </div>
      )}
    </div>
  );
}
