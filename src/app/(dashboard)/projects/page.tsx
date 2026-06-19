"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Search, Briefcase, Calendar, X, Users } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import type { ProjectStatus } from "@/types";
import { formatPrice, toJalali } from "@/lib/utils";
import { cn } from "@/lib/utils";

const statusLabels: Record<ProjectStatus, { label: string; color: string }> = {
  planning: { label: "برنامه‌ریزی", color: "text-blue-400 bg-blue-500/10" },
  in_progress: { label: "در حال انجام", color: "text-amber-500 bg-amber-500/10" },
  review: { label: "بررسی", color: "text-purple-400 bg-purple-500/10" },
  completed: { label: "تکمیل شده", color: "text-emerald-500 bg-emerald-500/10" },
  on_hold: { label: "متوقف", color: "text-orange-400 bg-orange-500/10" },
  cancelled: { label: "لغو شده", color: "text-slate-400 bg-slate-500/10" },
};

const COLOR_OPTIONS = [
  "from-amber-500 to-orange-500",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-500",
  "from-blue-500 to-cyan-500",
  "from-rose-500 to-pink-500",
  "from-indigo-500 to-blue-600",
];

interface ProjectClient {
  id: string;
  companyName: string;
}

interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  spent: number;
  colorHash: string;
  deadline: string;
  memberIds: string[];
  tags: string[];
  client?: ProjectClient;
  clientId: string;
}

// ─── New Project Modal ────────────────────────────────────────────────
function NewProjectModal({
  clients,
  onClose,
  onAdd,
}: {
  clients: ProjectClient[];
  onClose: () => void;
  onAdd: (p: Project) => void;
}) {
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [budget, setBudget] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !clientId || !startDate || !deadline) return;
    setLoading(true);
    try {
      const res = await apiClient.post("/projects", {
        name: name.trim(),
        clientId,
        description: description.trim() || undefined,
        status: "planning",
        budget: Number(budget) || 0,
        startDate,
        deadline,
        memberIds: [],
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        colorHash: selectedColor,
      });
      onAdd(res.data.data);
      toast.success("پروژه جدید ایجاد شد");
      onClose();
    } catch {
      toast.error("خطا در ایجاد پروژه");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            پروژه جدید
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">نام پروژه *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: طراحی وب‌سایت شرکت آلفا"
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">مشتری *</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">انتخاب مشتری...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">تاریخ شروع *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">ددلاین *</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">بودجه (تومان)</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="مثال: 50000000"
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">توضیحات</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="شرح کوتاه پروژه..."
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">تگ‌ها (با کاما جدا کنید)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="مثال: وب‌سایت, UI/UX"
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">رنگ پروژه</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={cn(
                    "w-8 h-8 rounded-full bg-gradient-to-r transition-all",
                    c,
                    selectedColor === c ? "ring-2 ring-primary ring-offset-2 ring-offset-card scale-110" : "opacity-70 hover:opacity-100"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm hover:bg-muted/80 transition-colors">
            انصراف
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !clientId || !startDate || !deadline || loading}
            className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "در حال ذخیره..." : "ایجاد پروژه"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<ProjectClient[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ perPage: "100" });
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    apiClient.get(`/projects?${params}`)
      .then((res) => setProjects(res.data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => {
    apiClient.get("/clients?perPage=100")
      .then((res) => setClients(res.data.data ?? []))
      .catch(console.error);
  }, []);

  const filtered = projects;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" />
            پروژه‌ها
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{projects.length} پروژه</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow"
          >
            <Plus className="w-4 h-4" />پروژه جدید
          </motion.button>
        </div>
      </motion.div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter("all")}
          className={cn("px-3 py-1.5 rounded-lg text-sm transition-all", statusFilter === "all"
            ? "bg-primary/10 text-primary border border-primary/30"
            : "bg-card text-muted-foreground border border-border hover:text-foreground")}
        >
          همه ({projects.length})
        </button>
        {(Object.keys(statusLabels) as ProjectStatus[]).map((s) => {
          const count = projects.filter((p) => p.status === s).length;
          if (!count) return null;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn("px-3 py-1.5 rounded-lg text-sm transition-all", statusFilter === s
                ? "bg-primary/10 text-primary border border-primary/30"
                : "bg-card text-muted-foreground border border-border hover:text-foreground")}
            >
              {statusLabels[s].label} ({count})
            </button>
          );
        })}
        <div className="relative ms-auto">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو..."
            className="pe-10 ps-4 py-2 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-56"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((project, i) => {
              const cfg = statusLabels[project.status];
              const isOverBudget = project.spent > project.budget;
              return (
                <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }} layout>
                  <Link href={`/projects/${project.id}`}>
                    <motion.div whileHover={{ y: -3 }} className="rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-card-hover overflow-hidden cursor-pointer transition-all">
                      <div className={cn("h-2 w-full bg-gradient-to-r", project.colorHash)} />
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{project.client?.companyName}</p>
                          </div>
                          <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium ms-2 shrink-0", cfg.color)}>
                            {cfg.label}
                          </span>
                        </div>
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-muted-foreground">پیشرفت</span>
                            <span className="font-medium text-foreground">{project.progress}٪</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${project.progress}%` }}
                              transition={{ duration: 1, ease: "easeOut", delay: i * 0.05 + 0.2 }}
                              className={cn("h-full rounded-full bg-gradient-to-r", project.colorHash)}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{toJalali(project.deadline)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <span className={isOverBudget ? "text-red-500" : ""}>{formatPrice(project.spent, true)}</span>
                            <span>/</span>
                            <span>{formatPrice(project.budget, true)}</span>
                          </div>
                        </div>
                        {project.tags.slice(0, 2).map((t) => (
                          <span key={t} className="inline-block px-2 py-0.5 rounded-md text-[10px] bg-muted text-muted-foreground mr-1">{t}</span>
                        ))}
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-muted-foreground">
              <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>پروژه‌ای یافت نشد</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showNewModal && (
          <NewProjectModal
            clients={clients}
            onClose={() => setShowNewModal(false)}
            onAdd={(p) => setProjects((prev) => [p, ...prev])}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
