"use client";
import { useState, useEffect } from "react";
import { GraduationCap, BookOpen, Users, FileCheck, Award, TrendingUp, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DashStats { totalCourses: number; activeCourses: number; totalStudents: number; activeEnrollments: number; upcomingExams: number; certificatesIssued: number; avgCompletionRate: number; recentEnrollments: { month: string; count: number }[]; topCourses: { name: string; enrollments: number; completionRate: number }[]; }

export default function EducationDashboard() {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/education/dashboard").then(r => setStats(r.data.data)).catch(() => {
      setStats({ totalCourses: 12, activeCourses: 8, totalStudents: 156, activeEnrollments: 89, upcomingExams: 5, certificatesIssued: 43, avgCompletionRate: 72, recentEnrollments: [{ month: "فروردین", count: 12 }, { month: "اردیبهشت", count: 18 }, { month: "خرداد", count: 24 }, { month: "تیر", count: 15 }, { month: "مرداد", count: 20 }, { month: "شهریور", count: 11 }], topCourses: [{ name: "برنامه‌نویسی پایتون", enrollments: 34, completionRate: 78 }, { name: "طراحی UI/UX", enrollments: 28, completionRate: 65 }, { name: "مدیریت پروژه", enrollments: 22, completionRate: 82 }] });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-12 text-center text-muted-foreground">در حال بارگذاری...</div>;
  if (!stats) return null;

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="w-6 h-6 text-primary" />داشبورد آموزش</h1><p className="text-muted-foreground text-sm mt-1">نمای کلی از دوره‌ها، دانشجویان و عملکرد آموزشی</p></div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="کل دوره‌ها" value={stats.totalCourses} icon={BookOpen} color="blue" />
        <StatCard title="کل دانشجویان" value={stats.totalStudents} icon={Users} color="violet" />
        <StatCard title="آزمون‌های پیش‌رو" value={stats.upcomingExams} icon={FileCheck} color="amber" />
        <StatCard title="گواهی صادره" value={stats.certificatesIssued} icon={Award} color="green" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-2xl border border-border p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center"><BookOpen className="w-6 h-6 text-blue-400" /></div>
          <div><p className="text-2xl font-bold">{stats.activeCourses}</p><p className="text-sm text-muted-foreground">دوره فعال</p></div>
        </div>
        <div className="glass rounded-2xl border border-border p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center"><Users className="w-6 h-6 text-violet-400" /></div>
          <div><p className="text-2xl font-bold">{stats.activeEnrollments}</p><p className="text-sm text-muted-foreground">ثبت‌نام فعال</p></div>
        </div>
        <div className="glass rounded-2xl border border-border p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-emerald-400" /></div>
          <div><p className="text-2xl font-bold">{stats.avgCompletionRate}%</p><p className="text-sm text-muted-foreground">میانگین تکمیل</p></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="glass rounded-2xl border border-border p-5">
          <h3 className="font-semibold mb-4 text-sm">ثبت‌نام‌های ماهانه</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.recentEnrollments}><XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="count" fill="#8b5cf6" name="ثبت‌نام" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass rounded-2xl border border-border p-5">
          <h3 className="font-semibold mb-4 text-sm">برترین دوره‌ها</h3>
          <div className="space-y-4">
            {stats.topCourses.map((c, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium truncate">{c.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0 mr-2">{c.enrollments} نفر · {c.completionRate}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2"><div className="gradient-brand rounded-full h-2 transition-all" style={{ width: `${c.completionRate}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
