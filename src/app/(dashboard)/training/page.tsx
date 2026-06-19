"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GraduationCap, BookOpen, Clock, User, Play, CheckCircle2, Search, ChevronRight } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  title: string;
  description: string | null;
  instructor: string | null;
  duration: string | null;
  category: string;
  fileUrl: string | null;
  isActive: boolean;
  _count: { enrollments: number };
  myEnrollment?: { completedAt: string | null; score: number | null };
}

const CATEGORY_LABELS: Record<string, string> = {
  technical: "فنی", soft_skills: "مهارت‌های نرم", compliance: "انطباق",
  leadership: "رهبری", product: "محصول",
};

const CATEGORY_COLORS: Record<string, string> = {
  technical: "blue", soft_skills: "purple", compliance: "orange",
  leadership: "emerald", product: "pink",
};

export default function TrainingPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const load = () => {
    setLoading(true);
    apiClient.get("/hr/training")
      .then(r => setCourses(r.data?.data ?? []))
      .catch(() => toast.error("خطا در دریافت دوره‌ها"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const enroll = async (courseId: string) => {
    setEnrolling(courseId);
    try {
      await apiClient.post(`/hr/training/${courseId}/enroll`, {});
      toast.success("ثبت‌نام شدید ✓");
      load();
    } catch {
      toast.error("خطا در ثبت‌نام");
    } finally {
      setEnrolling(null);
    }
  };

  const categories = ["all", ...Array.from(new Set(courses.map(c => c.category)))];
  const filtered = courses.filter(c =>
    (activeCategory === "all" || c.category === activeCategory) &&
    (!search || c.title.includes(search) || c.description?.includes(search))
  );

  const enrolledCount = courses.filter(c => c.myEnrollment).length;
  const completedCount = courses.filter(c => c.myEnrollment?.completedAt).length;

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            دوره‌های آموزشی
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {courses.length} دوره · {enrolledCount} ثبت‌نام · {completedCount} تکمیل‌شده
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "کل دوره‌ها", value: courses.length, icon: BookOpen, color: "text-blue-400 bg-blue-500/10" },
          { label: "ثبت‌نام من", value: enrolledCount, icon: GraduationCap, color: "text-purple-400 bg-purple-500/10" },
          { label: "تکمیل‌شده", value: completedCount, icon: CheckCircle2, color: "text-emerald-400 bg-emerald-500/10" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl bg-card border border-border flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..."
            className="w-full pe-10 ps-4 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-xl overflow-x-auto">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>
              {cat === "all" ? "همه" : CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>دوره‌ای یافت نشد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course, i) => {
            const col = CATEGORY_COLORS[course.category] ?? "slate";
            const enrolled = !!course.myEnrollment;
            const completed = !!course.myEnrollment?.completedAt;
            return (
              <motion.div key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="p-5 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all group flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold bg-${col}-500/10 text-${col}-400`}>
                    {CATEGORY_LABELS[course.category] ?? course.category}
                  </span>
                  {completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : enrolled ? (
                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">در حال یادگیری</span>
                  ) : null}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{course.title}</h3>
                  {course.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {course.instructor && <span className="flex items-center gap-1"><User className="w-3 h-3" />{course.instructor}</span>}
                  {course.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration}</span>}
                  <span>{course._count.enrollments} نفر</span>
                </div>

                <div className="flex gap-2 pt-1">
                  {course.fileUrl && (
                    <a href={course.fileUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 flex-1 py-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition-colors justify-center">
                      <Play className="w-3.5 h-3.5" /> شروع دوره
                    </a>
                  )}
                  {!enrolled ? (
                    <button onClick={() => enroll(course.id)} disabled={enrolling === course.id}
                      className="flex-1 py-2 rounded-xl gradient-brand text-black text-xs font-semibold disabled:opacity-50">
                      {enrolling === course.id ? "..." : "ثبت‌نام"}
                    </button>
                  ) : (
                    <button onClick={() => setSelectedCourse(course)}
                      className="flex-1 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                      جزئیات <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
