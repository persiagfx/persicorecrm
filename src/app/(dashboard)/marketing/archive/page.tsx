"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Archive, Search, X, RotateCcw, Calendar, User } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import type { ContentPiece } from "@/types";
import { RoleGuard } from "@/components/common/RoleGuard";

const TYPE_LABELS: Record<string, string> = {
  blog: "بلاگ", social: "شبکه اجتماعی", email: "ایمیل",
  video: "ویدیو", infographic: "اینفوگرافیک", other: "سایر",
};
const CHANNEL_LABELS: Record<string, string> = {
  google: "گوگل", instagram: "اینستاگرام", linkedin: "لینکدین",
  email: "ایمیل", sms: "پیامک", content: "وب", other: "سایر",
};

const TYPE_OPTIONS = [{ value: "", label: "همه نوع‌ها" }, ...Object.entries(TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))];
const CHANNEL_OPTIONS = [{ value: "", label: "همه کانال‌ها" }, ...Object.entries(CHANNEL_LABELS).map(([k, v]) => ({ value: k, label: v }))];

export default function ContentArchivePage() {
  const [pieces, setPieces] = useState<ContentPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterChannel, setFilterChannel] = useState("");
  const [viewingPiece, setViewingPiece] = useState<ContentPiece | null>(null);

  useEffect(() => {
    apiClient.get<{ data: ContentPiece[] }>("/content-pieces?status=archived")
      .then(res => setPieces(res.data.data ?? []))
      .catch(() => setPieces([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = pieces.filter(p => {
    const matchSearch = !search || p.title.includes(search);
    const matchType = !filterType || p.type === filterType;
    const matchChannel = !filterChannel || p.channel === filterChannel;
    return matchSearch && matchType && matchChannel;
  });

  const restore = async (p: ContentPiece) => {
    try {
      await apiClient.put(`/content-pieces/${p.id}`, { status: "published", archived: false });
      setPieces(prev => prev.filter(x => x.id !== p.id));
      if (viewingPiece?.id === p.id) setViewingPiece(null);
    } catch {
      // silently ignore — the item stays in the list if the request fails
    }
  };

  const getUserName = (uid: string) => uid ? "کاربر" : "—";

  return (
    <RoleGuard roles={["admin", "marketing"]}>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Archive className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">آرشیو محتوا</h1>
            <p className="text-sm text-muted-foreground">{pieces.length} محتوای آرشیوشده</p>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی عنوان..."
              className="input-field w-full pr-9"
            />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input-field">
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)} className="input-field">
            {CHANNEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="card p-16 flex items-center justify-center text-muted-foreground text-sm">
            در حال بارگذاری...
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-16 flex flex-col items-center gap-3 text-center">
            <Archive className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">محتوای آرشیوشده‌ای پیدا نشد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => setViewingPiece(p)}
                className="card p-4 cursor-pointer hover:shadow-md transition-all group border-r-2 border-r-amber-500/40"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-medium">{TYPE_LABELS[p.type]}</span>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{CHANNEL_LABELS[p.channel]}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); restore(p); }}
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all shrink-0"
                    title="بازگردانی"
                  >
                    <RotateCcw className="w-3 h-3" />
                    بازگردانی
                  </button>
                </div>

                <h3 className="text-sm font-semibold mb-2 leading-tight line-clamp-2">{p.title}</h3>

                {p.body && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-3 leading-relaxed">
                    {p.body.replace(/^#+\s*/gm, "").substring(0, 150)}...
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{getUserName(p.assigneeId)}</span>
                  </div>
                  {(p.publishedAt || p.archivedAt) && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span dir="ltr">{new Date(p.archivedAt ?? p.publishedAt!).toLocaleDateString("fa-IR")}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <AnimatePresence>
          {viewingPiece && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setViewingPiece(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl"
              >
                <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-border shrink-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded border bg-amber-500/10 text-amber-600 border-amber-400/30">آرشیو</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{TYPE_LABELS[viewingPiece.type]}</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{CHANNEL_LABELS[viewingPiece.channel]}</span>
                    </div>
                    <h2 className="font-bold text-lg leading-tight">{viewingPiece.title}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{getUserName(viewingPiece.assigneeId)}</p>
                  </div>
                  <button onClick={() => setViewingPiece(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {viewingPiece.body ? (
                    <div className="prose prose-sm max-w-none text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                      {viewingPiece.body}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-8">متنی برای این محتوا ثبت نشده است</p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border shrink-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {viewingPiece.publishedAt && (
                      <span>منتشرشده: {new Date(viewingPiece.publishedAt).toLocaleDateString("fa-IR")}</span>
                    )}
                    {viewingPiece.archivedAt && (
                      <span> · آرشیو: {new Date(viewingPiece.archivedAt).toLocaleDateString("fa-IR")}</span>
                    )}
                  </div>
                  <button
                    onClick={() => restore(viewingPiece)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    بازگردانی به منتشرشده
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </RoleGuard>
  );
}
