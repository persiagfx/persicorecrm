"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { BookOpenCheck, TrendingUp, CheckCircle2, XCircle, Minus } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Exam { id: string; title: string; totalPoints: number; passScore: number; type: string; }
interface Grade { examId: string; score: number | null; isPassed: boolean | null; outOf: number; }
interface Row {
  student: { id: string; name: string };
  grades: Grade[];
  avgScore: number | null;
  passedCount: number;
  completedCount: number;
}

export default function GradebookPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");

  useEffect(() => {
    apiClient.get("/education/courses").then(r => setCourses(r.data.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = selectedCourse ? `?courseId=${selectedCourse}` : "";
    apiClient.get(`/education/gradebook${q}`)
      .then(r => { setRows(r.data.data.rows ?? []); setExams(r.data.data.exams ?? []); })
      .catch(() => toast.error("خطا در بارگذاری"))
      .finally(() => setLoading(false));
  }, [selectedCourse]);

  const getScoreColor = (score: number | null, outOf: number, passScore?: number) => {
    if (score === null) return "text-muted-foreground";
    const pct = (score / outOf) * 100;
    if (pct >= 80) return "text-emerald-400";
    if (pct >= 60) return "text-amber-400";
    return "text-red-400";
  };

  const avgScore = rows.filter(r => r.avgScore !== null);
  const classAvg = avgScore.length ? Math.round(avgScore.reduce((s, r) => s + (r.avgScore ?? 0), 0) / avgScore.length) : null;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpenCheck className="w-6 h-6 text-primary" />دفتر نمرات
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">نمرات تمام دانش‌آموزان در آزمون‌های مختلف</p>
      </motion.div>

      <div className="flex items-center gap-4">
        <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
          className="px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-primary">
          <option value="">همه دوره‌ها</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{rows.length} دانش‌آموز</span>
          <span>{exams.length} آزمون</span>
          {classAvg !== null && (
            <span className="flex items-center gap-1 font-medium text-foreground">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />میانگین کلاس: {classAvg}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-12 rounded-xl bg-card animate-pulse border border-border" />)}</div>
      ) : exams.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground rounded-2xl bg-card border border-border">
          <BookOpenCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />آزمون منتشرشده‌ای یافت نشد
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium sticky right-0 bg-muted/50 min-w-[160px]">دانش‌آموز</th>
                  {exams.map(e => (
                    <th key={e.id} className="text-center px-3 py-3 text-muted-foreground font-medium min-w-[90px]">
                      <div className="text-xs leading-tight">{e.title}</div>
                      <div className="text-[10px] text-muted-foreground/60 mt-0.5">از {e.totalPoints}</div>
                    </th>
                  ))}
                  <th className="text-center px-3 py-3 text-muted-foreground font-medium min-w-[80px]">میانگین</th>
                  <th className="text-center px-3 py-3 text-muted-foreground font-medium min-w-[80px]">قبول</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(row => (
                  <tr key={row.student.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 sticky right-0 bg-card border-l border-border">
                      <p className="font-medium text-foreground">{row.student.name}</p>
                    </td>
                    {row.grades.map(g => (
                      <td key={g.examId} className="px-3 py-3 text-center">
                        {g.score !== null ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={cn("font-bold text-base", getScoreColor(g.score, g.outOf))}>
                              {Math.round(g.score)}
                            </span>
                            {g.isPassed === true
                              ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              : g.isPassed === false
                              ? <XCircle className="w-3 h-3 text-red-400" />
                              : null}
                          </div>
                        ) : (
                          <Minus className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-center">
                      {row.avgScore !== null
                        ? <span className={cn("font-bold", getScoreColor(row.avgScore, 100))}>{row.avgScore}</span>
                        : <Minus className="w-4 h-4 text-muted-foreground/40 mx-auto" />}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs text-muted-foreground">
                        {row.passedCount}/{row.completedCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
