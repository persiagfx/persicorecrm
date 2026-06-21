"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Palette, MessageSquare, Upload, CheckCircle2, Clock, AlertCircle, XCircle, Send, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { RoleGuard } from "@/components/common/RoleGuard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ApprovalStatus = "pending" | "in_review" | "approved" | "revision_needed";

const APPROVAL_CONFIG: Record<ApprovalStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending:          { label: "در انتظار بررسی", icon: Clock,         color: "text-amber-400",   bg: "bg-amber-500/10" },
  in_review:        { label: "در حال بررسی",    icon: AlertCircle,   color: "text-blue-400",    bg: "bg-blue-500/10" },
  approved:         { label: "تایید شد",         icon: CheckCircle2,  color: "text-emerald-400", bg: "bg-emerald-500/10" },
  revision_needed:  { label: "نیاز به تغییر",   icon: XCircle,       color: "text-red-400",     bg: "bg-red-500/10" },
};

interface FileItem {
  id: string; name: string; type: string; size: number;
  url: string; approvalStatus: string; designComments: unknown[];
  version: number; createdAt: string; projectId: string | null;
}

export default function DesignReviewPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | "all">("all");
  const [saving, setSaving] = useState(false);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      // دریافت فایل‌های تصویری از DB
      const res = await apiClient.get("/file-items?type=image");
      setFiles(res.data.data ?? []);
    } catch { toast.error("خطا در بارگذاری فایل‌ها"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const active = files.find((f) => f.id === activeId);
  const filtered = statusFilter === "all" ? files : files.filter((f) => f.approvalStatus === statusFilter);

  const updateStatus = async (id: string, status: ApprovalStatus) => {
    setSaving(true);
    try {
      await apiClient.patch(`/file-items/${id}`, { approvalStatus: status });
      setFiles((p) => p.map((f) => f.id === id ? { ...f, approvalStatus: status } : f));
      toast.success(`وضعیت به "${APPROVAL_CONFIG[status].label}" تغییر کرد`);
    } catch { toast.error("خطا در ذخیره"); }
    finally { setSaving(false); }
  };

  const addComment = async (fileId: string) => {
    if (!newComment.trim()) return;
    setSaving(true);
    try {
      await apiClient.patch(`/file-items/${fileId}`, {
        comment: newComment.trim(),
        authorName: user?.name ?? "تیم",
      });
      setFiles((p) => p.map((f) => f.id === fileId ? {
        ...f,
        designComments: [
          ...(Array.isArray(f.designComments) ? f.designComments : []),
          { text: newComment.trim(), authorName: user?.name ?? "تیم", authorType: "team", createdAt: new Date().toISOString() },
        ],
      } : f));
      setNewComment("");
      toast.success("کامنت اضافه شد");
    } catch { toast.error("خطا در ارسال کامنت"); }
    finally { setSaving(false); }
  };

  const stats = {
    total: files.length,
    approved: files.filter((f) => f.approvalStatus === "approved").length,
    revision: files.filter((f) => f.approvalStatus === "revision_needed").length,
    pending: files.filter((f) => f.approvalStatus === "pending" || f.approvalStatus === "in_review").length,
  };

  return (
    <RoleGuard roles={["admin", "designer", "project_manager", "developer"]} fallback={
      <div className="p-12 text-center text-muted-foreground">دسترسی مجاز نیست.</div>
    }>
      <div className="space-y-5">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Palette className="w-6 h-6 text-primary" />بررسی و تایید دیزاین
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">مدیریت نسخه‌ها، بازخورد و فرآیند تایید طراحی</p>
          </div>
          <button onClick={fetchFiles} disabled={loading}
            className="p-2 rounded-xl bg-muted border border-border text-muted-foreground hover:text-foreground disabled:opacity-50">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </motion.div>

        {/* آمار */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "کل فایل‌ها",     value: stats.total,    color: "text-foreground",   bg: "bg-card" },
            { label: "تایید شده",      value: stats.approved, color: "text-emerald-400", bg: "bg-emerald-500/5" },
            { label: "در انتظار",      value: stats.pending,  color: "text-blue-400",    bg: "bg-blue-500/5" },
            { label: "نیاز به تغییر", value: stats.revision, color: "text-red-400",     bg: "bg-red-500/5" },
          ].map((s) => (
            <div key={s.label} className={cn("p-4 rounded-2xl border border-border", s.bg)}>
              <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* فیلتر */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
          <button onClick={() => setStatusFilter("all")}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              statusFilter === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            همه
          </button>
          {(Object.keys(APPROVAL_CONFIG) as ApprovalStatus[]).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                statusFilter === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {APPROVAL_CONFIG[s].label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-card border border-border animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center text-muted-foreground">
            <Palette className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>هیچ فایل طراحی‌ای یافت نشد</p>
            <p className="text-xs mt-1">برای افزودن، از صفحه فایل‌ها آپلود کنید</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* لیست فایل‌ها */}
            <div className="lg:col-span-2 space-y-3">
              {filtered.map((file) => {
                const status = (file.approvalStatus as ApprovalStatus) in APPROVAL_CONFIG
                  ? (file.approvalStatus as ApprovalStatus) : "pending";
                const cfg = APPROVAL_CONFIG[status];
                const Icon = cfg.icon;
                const isActive = activeId === file.id;
                const comments = Array.isArray(file.designComments) ? file.designComments as { text: string; authorName: string; createdAt: string }[] : [];

                return (
                  <div key={file.id} onClick={() => setActiveId(isActive ? null : file.id)}
                    className={cn("p-4 rounded-2xl border cursor-pointer transition-all",
                      isActive ? "border-primary/40 bg-primary/5" : "border-border bg-card hover:border-primary/20")}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                        {file.name.split(".").pop()?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                            نسخه {file.version}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{comments.length} کامنت</span>
                        </div>
                      </div>
                      <span className={cn("flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium", cfg.bg, cfg.color)}>
                        <Icon className="w-3 h-3" />{cfg.label}
                      </span>
                    </div>

                    {isActive && (
                      <div className="mt-4 space-y-3 border-t border-border pt-4" onClick={(e) => e.stopPropagation()}>
                        {/* preview */}
                        {file.url && file.type.startsWith("image/") && (
                          <img src={file.url} alt={file.name} className="w-full max-h-48 object-contain rounded-xl bg-muted" />
                        )}

                        {/* تغییر وضعیت */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">تغییر وضعیت تایید</p>
                          <div className="flex gap-2 flex-wrap">
                            {(Object.keys(APPROVAL_CONFIG) as ApprovalStatus[]).map((s) => {
                              const c = APPROVAL_CONFIG[s];
                              return (
                                <button key={s} onClick={() => updateStatus(file.id, s)} disabled={saving}
                                  className={cn("px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
                                    status === s ? `${c.bg} ${c.color} border-transparent` : "border-border text-muted-foreground hover:text-foreground")}>
                                  {c.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* آپلود نسخه جدید */}
                        {["admin", "designer"].includes(user?.role ?? "") && (
                          <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-primary/40 text-primary text-xs hover:bg-primary/5 transition-colors cursor-pointer w-fit">
                            <Upload className="w-3.5 h-3.5" />آپلود نسخه {file.version + 1}
                            <input type="file" accept="image/*,.pdf,.fig,.svg" className="hidden"
                              onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (!f) return;
                                const fd = new FormData();
                                fd.append("file", f);
                                fd.append("projectId", file.projectId ?? "");
                                try {
                                  await apiClient.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
                                  toast.success("نسخه جدید آپلود شد");
                                  fetchFiles();
                                } catch { toast.error("خطا در آپلود"); }
                              }} />
                          </label>
                        )}

                        {/* کامنت‌ها */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />بازخورد و کامنت
                          </p>
                          <div className="space-y-2 max-h-40 overflow-y-auto mb-2">
                            {comments.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic">هنوز کامنتی ثبت نشده</p>
                            ) : comments.map((c, idx) => (
                              <div key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-muted/50">
                                <div className="w-6 h-6 rounded-full gradient-brand flex items-center justify-center text-[9px] font-bold text-black shrink-0">
                                  {c.authorName?.slice(0, 1)}
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-foreground">{c.authorName}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">{c.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input value={newComment} onChange={(e) => setNewComment(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && addComment(file.id)}
                              placeholder="بازخورد یا توضیحات..."
                              className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/40" />
                            <button onClick={() => addComment(file.id)} disabled={saving}
                              className="px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50">
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* خلاصه */}
            <div className="p-5 rounded-2xl bg-card border border-border space-y-3 h-fit">
              <h3 className="font-semibold text-foreground text-sm">وضعیت کلی</h3>
              {(Object.keys(APPROVAL_CONFIG) as ApprovalStatus[]).map((s) => {
                const cfg = APPROVAL_CONFIG[s];
                const count = files.filter((f) => f.approvalStatus === s).length;
                const pct = files.length > 0 ? Math.round((count / files.length) * 100) : 0;
                const barColors: Record<ApprovalStatus, string> = {
                  approved: "#34d399", in_review: "#60a5fa",
                  revision_needed: "#f87171", pending: "#fbbf24",
                };
                return (
                  <div key={s}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={cfg.color}>{cfg.label}</span>
                      <span className="text-muted-foreground">{count} فایل</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColors[s] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
