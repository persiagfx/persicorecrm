"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Play, Square, Clock, Plus, X } from "lucide-react";
import { useTimerStore } from "@/lib/store";
import { apiClient } from "@/lib/api/client";
import { formatDuration, toJalali } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

interface Project { id: string; name: string; }
interface Task { id: string; title: string; projectId: string; }
interface TimeEntry { id: string; notes: string | null; durationSeconds: number; startedAt: string; task: { title: string } | null; project: { name: string }; }

export default function TimerPage() {
  const { isRunning, taskTitle, projectId: runningProjectId, elapsedSeconds, startTimer, stopTimer, tick } = useTimerStore();
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [weekData, setWeekData] = useState<{ day: string; hours: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ projectId: "", notes: "", hours: "", minutes: "", date: new Date().toISOString().slice(0, 10) });

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, entriesRes] = await Promise.all([
        apiClient.get("/projects?perPage=100"),
        apiClient.get("/time-entries"),
      ]);
      setProjects(projRes.data?.data ?? []);
      const entries: TimeEntry[] = entriesRes.data?.data ?? [];

      // فیلتر امروز
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setTodayEntries(entries.filter((e) => new Date(e.startedAt) >= today));

      // هفته‌ای
      const DAYS_FA = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - ((now.getDay() + 1) % 7));
      weekStart.setHours(0, 0, 0, 0);

      const wd = DAYS_FA.map((day, i) => {
        const dayStart = new Date(weekStart);
        dayStart.setDate(weekStart.getDate() + i);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);
        const secs = entries
          .filter((e) => { const d = new Date(e.startedAt); return d >= dayStart && d <= dayEnd; })
          .reduce((s, e) => s + e.durationSeconds, 0);
        return { day, hours: Math.round((secs / 3600) * 10) / 10 };
      });
      setWeekData(wd);
    } catch {
      toast.error("خطا در دریافت داده‌ها");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!selectedProject) { setTasks([]); setSelectedTask(""); return; }
    apiClient.get(`/tasks?projectId=${selectedProject}`).then((r) => setTasks(r.data?.data ?? [])).catch((err) => console.error(err));
  }, [selectedProject]);

  const handleStart = () => {
    if (!selectedProject) { toast.error("ابتدا پروژه را انتخاب کنید"); return; }
    const task = tasks.find((t) => t.id === selectedTask);
    startTimer(task?.id ?? "", task?.title ?? "بدون تسک", selectedProject);
  };

  const handleStop = async () => {
    stopTimer();
    try {
      // به‌روزرسانی time entry در DB
      await apiClient.post("/time-entries", { projectId: runningProjectId, taskId: selectedTask || undefined });
    } catch { /* در store نگه می‌دارد */ }
    await fetchData();
  };

  const handleManualEntry = async () => {
    const durationSeconds = (parseInt(manualForm.hours || "0") * 3600) + (parseInt(manualForm.minutes || "0") * 60);
    if (!manualForm.projectId || durationSeconds < 60) { toast.error("پروژه و مدت زمان (حداقل ۱ دقیقه) الزامی است"); return; }
    try {
      const startedAt = new Date(manualForm.date);
      startedAt.setHours(8, 0, 0, 0);
      await apiClient.post("/time-entries", {
        projectId: manualForm.projectId,
        notes: manualForm.notes,
        _manual: true,
        startedAt: startedAt.toISOString(),
        durationSeconds,
      });
      toast.success("ورودی دستی ثبت شد");
      setShowManual(false);
      setManualForm({ projectId: "", notes: "", hours: "", minutes: "", date: new Date().toISOString().slice(0, 10) });
      fetchData();
    } catch { toast.error("خطا در ثبت"); }
  };

  const totalToday = todayEntries.reduce((s, e) => s + e.durationSeconds, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary" />تایمر و گزارش زمان
        </h1>
      </motion.div>

      {/* Main Timer */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="p-8 rounded-2xl bg-card border border-border text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsla(43,74%,56%,0.06),transparent_70%)]" />
        <div className="relative">
          <motion.div animate={isRunning ? { scale: [1, 1.01, 1] } : {}} transition={{ duration: 1, repeat: Infinity }}
            className="text-7xl font-mono tabular-nums font-bold text-foreground mb-6 tracking-tight">
            {formatDuration(elapsedSeconds)}
          </motion.div>

          {isRunning ? (
            <div className="mb-6">
              <p className="text-muted-foreground mb-1">در حال ردیابی</p>
              <p className="font-semibold text-foreground">{taskTitle || "بدون تسک"}</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 justify-center mb-6 max-w-sm mx-auto">
              <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="">انتخاب پروژه</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="">انتخاب تسک (اختیاری)</option>
                {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
          )}

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={isRunning ? handleStop : handleStart}
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto font-bold text-lg transition-all ${
              isRunning ? "bg-destructive text-white shadow-lg shadow-destructive/30" : "gradient-brand text-black gold-glow"
            }`}>
            {isRunning ? <Square className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current" />}
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">امروز</h2>
            <span className="text-primary font-mono tabular-nums">{formatDuration(totalToday)}</span>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : todayEntries.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">هنوز زمانی امروز ردیابی نشده</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {todayEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors">
                  <div>
                    <p className="text-sm font-medium text-foreground">{entry.task?.title ?? entry.notes ?? "بدون تسک"}</p>
                    <p className="text-xs text-muted-foreground">{entry.project?.name}</p>
                  </div>
                  <span className="font-mono text-sm text-foreground tabular-nums">{formatDuration(entry.durationSeconds)}</span>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => setShowManual(true)}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Plus className="w-3.5 h-3.5" />ثبت دستی
          </button>
        </motion.div>

        {/* Week Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="font-semibold text-foreground mb-4">این هفته</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 14%)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(240 5% 65%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(240 5% 65%)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(240 10% 6%)", border: "1px solid hsl(240 6% 14%)", borderRadius: 12, fontSize: 12 }}
                formatter={(v) => [`${v} ساعت`, ""]} />
              <Bar dataKey="hours" fill="hsl(43 74% 56%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Modal: ثبت دستی */}
      {showManual && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowManual(false)}>
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">ثبت دستی زمان</h3>
              <button onClick={() => setShowManual(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <select value={manualForm.projectId} onChange={(e) => setManualForm((p) => ({ ...p, projectId: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm">
              <option value="">انتخاب پروژه *</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">ساعت</label>
                <input type="number" min={0} max={23} value={manualForm.hours}
                  onChange={(e) => setManualForm((p) => ({ ...p, hours: e.target.value }))}
                  placeholder="0" className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">دقیقه</label>
                <input type="number" min={0} max={59} value={manualForm.minutes}
                  onChange={(e) => setManualForm((p) => ({ ...p, minutes: e.target.value }))}
                  placeholder="0" className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm" />
              </div>
            </div>
            <input type="date" value={manualForm.date} onChange={(e) => setManualForm((p) => ({ ...p, date: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm" />
            <input value={manualForm.notes} onChange={(e) => setManualForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="توضیحات (اختیاری)" className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm" />
            <div className="flex gap-3">
              <button onClick={() => setShowManual(false)}
                className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm">انصراف</button>
              <button onClick={handleManualEntry}
                className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow">ثبت</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
