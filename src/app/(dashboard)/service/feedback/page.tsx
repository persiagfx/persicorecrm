"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Star, ThumbsUp, MessageSquare, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { toJalali } from "@/lib/utils";
import { toast } from "sonner";

interface Feedback { id: string; requestId: string; score: number; comment?: string; submittedAt: string; request?: { number: string; title: string; }; }

function Stars({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-4 h-4 ${i <= score ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

export default function ServiceFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await apiClient.get("/service/feedback");
      setFeedbacks(r.data.data ?? []);
    } catch { toast.error("خطا در بارگذاری"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const avg = feedbacks.length ? feedbacks.reduce((a, f) => a + f.score, 0) / feedbacks.length : 0;
  const excellent = feedbacks.filter(f => f.score >= 4).length;
  const poor = feedbacks.filter(f => f.score <= 2).length;

  const SCORE_COLORS: Record<number, string> = { 1: "text-red-400 bg-red-500/10", 2: "text-orange-400 bg-orange-500/10", 3: "text-amber-400 bg-amber-500/10", 4: "text-emerald-400 bg-emerald-500/10", 5: "text-green-400 bg-green-500/10" };

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Star className="w-6 h-6 text-primary" />بازخورد مشتریان</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="کل بازخوردها" value={feedbacks.length} icon={MessageSquare} color="violet" />
        <StatCard title="میانگین امتیاز" value={avg.toFixed(1)} icon={Star} color="amber" />
        <StatCard title="رضایت عالی (۴+)" value={excellent} icon={ThumbsUp} color="emerald" />
        <StatCard title="نارضایتی (≤۲)" value={poor} icon={TrendingUp} color="red" />
      </div>

      {avg > 0 && (
        <div className="glass rounded-2xl border border-border p-5">
          <h3 className="font-semibold mb-3">توزیع امتیازات</h3>
          <div className="space-y-2">
            {[5,4,3,2,1].map(score => {
              const count = feedbacks.filter(f => f.score === score).length;
              const pct = feedbacks.length ? (count / feedbacks.length) * 100 : 0;
              return (
                <div key={score} className="flex items-center gap-3">
                  <div className="flex gap-0.5 w-20 shrink-0">{[1,2,3,4,5].map(i => <Star key={i} className={`w-3 h-3 ${i <= score ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />)}</div>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden"><div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
                  <span className="text-xs text-muted-foreground w-8 text-left">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loading ? <p className="text-center text-muted-foreground py-12">در حال بارگذاری...</p> : (
        <div className="space-y-3">
          {feedbacks.map(fb => (
            <motion.div key={fb.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  {fb.request && <p className="font-medium text-sm">{fb.request.title} <span className="text-xs text-muted-foreground">({fb.request.number})</span></p>}
                  <Stars score={fb.score} />
                  {fb.comment && <p className="text-sm text-muted-foreground mt-1">{fb.comment}</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${SCORE_COLORS[fb.score] ?? "text-muted-foreground bg-muted"}`}>{fb.score}/۵</span>
                  <span className="text-xs text-muted-foreground">{toJalali(fb.submittedAt)}</span>
                </div>
              </div>
            </motion.div>
          ))}
          {!feedbacks.length && <p className="text-center text-muted-foreground py-12">هنوز بازخوردی ثبت نشده</p>}
        </div>
      )}
    </div>
  );
}
