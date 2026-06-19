"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Star, TrendingUp, Users, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toJalali } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface NpsResponse {
  id: string;
  submittedAt: string;
  score: number | null;
  comment: string;
  respondentId: string | null;
  formTitle: string;
  tenantId: string | null;
}

interface NpsData {
  responses: NpsResponse[];
  average: number | null;
  npsScore: number | null;
  total: number;
}

function scoreColor(score: number): string {
  if (score <= 6) return "text-red-400 bg-red-500/10 border-red-500/20";
  if (score <= 8) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
  return "text-green-400 bg-green-500/10 border-green-500/20";
}

function scoreLabel(score: number): string {
  if (score <= 6) return "ناراضی";
  if (score <= 8) return "خنثی";
  return "طرفدار";
}

function npsScoreColor(score: number): string {
  if (score < 0) return "text-red-400";
  if (score < 30) return "text-yellow-400";
  return "text-green-400";
}

export default function AdminNpsPage() {
  const [data, setData] = useState<NpsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    apiClient.get("/admin/nps")
      .then((r) => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const promoters = data?.responses.filter((r) => r.score !== null && r.score >= 9).length ?? 0;
  const passives = data?.responses.filter((r) => r.score !== null && r.score >= 7 && r.score <= 8).length ?? 0;
  const detractors = data?.responses.filter((r) => r.score !== null && r.score !== null && r.score <= 6).length ?? 0;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">نتایج NPS</h1>
          <p className="text-sm text-white/35 mt-0.5">نظرسنجی رضایت مشتریان (Net Promoter Score)</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white text-xs transition-colors disabled:opacity-40">
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          بروزرسانی
        </button>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* NPS Score */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
              className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.07] col-span-2 lg:col-span-1">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-violet-400" />
                </div>
              </div>
              <p className={cn("text-3xl font-bold tabular-nums", data?.npsScore !== null ? npsScoreColor(data!.npsScore!) : "text-white/30")}>
                {data?.npsScore !== null ? data!.npsScore : "—"}
              </p>
              <p className="text-xs text-white/40 mt-0.5">امتیاز NPS</p>
              <p className="text-[10px] text-white/25 mt-1">از ۱۰۰- تا ۱۰۰</p>
            </motion.div>

            {/* Average */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.07]">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Star className="w-4 h-4 text-amber-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">
                {data?.average !== null ? data!.average : "—"}
              </p>
              <p className="text-xs text-white/40 mt-0.5">میانگین امتیاز</p>
              <p className="text-[10px] text-white/25 mt-1">از ۱۰</p>
            </motion.div>

            {/* Total */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.07]">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">{data?.total ?? 0}</p>
              <p className="text-xs text-white/40 mt-0.5">کل پاسخ‌دهندگان</p>
            </motion.div>

            {/* Breakdown */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.07] space-y-2">
              <p className="text-xs text-white/40 mb-3">توزیع پاسخ‌ها</p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-green-400">طرفداران</span>
                <span className="text-sm font-bold text-green-400">{promoters}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-yellow-400">خنثی</span>
                <span className="text-sm font-bold text-yellow-400">{passives}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-red-400">ناراضیان</span>
                <span className="text-sm font-bold text-red-400">{detractors}</span>
              </div>
            </motion.div>
          </div>

          {/* Responses table */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white/70">پاسخ‌های دریافتی</h3>
            </div>
            {(data?.responses.length ?? 0) === 0 ? (
              <div className="text-center py-16 text-white/20">
                <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">هنوز پاسخی دریافت نشده</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="text-right text-[10px] font-semibold text-white/25 uppercase tracking-wider px-5 py-3">تاریخ</th>
                      <th className="text-right text-[10px] font-semibold text-white/25 uppercase tracking-wider px-5 py-3">امتیاز</th>
                      <th className="text-right text-[10px] font-semibold text-white/25 uppercase tracking-wider px-5 py-3">وضعیت</th>
                      <th className="text-right text-[10px] font-semibold text-white/25 uppercase tracking-wider px-5 py-3">نظر</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {data!.responses.map((r) => (
                      <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 text-xs text-white/45 whitespace-nowrap">
                          {toJalali(r.submittedAt)}
                        </td>
                        <td className="px-5 py-3.5">
                          {r.score !== null ? (
                            <span className={cn(
                              "inline-flex items-center justify-center w-9 h-9 rounded-xl border text-sm font-bold",
                              scoreColor(r.score)
                            )}>
                              {r.score}
                            </span>
                          ) : (
                            <span className="text-white/20 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {r.score !== null && (
                            <span className={cn(
                              "text-[11px] px-2.5 py-1 rounded-lg border",
                              scoreColor(r.score)
                            )}>
                              {scoreLabel(r.score)}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-white/55 max-w-xs">
                          {r.comment || <span className="text-white/20 italic">بدون نظر</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
