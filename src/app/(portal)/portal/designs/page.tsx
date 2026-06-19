"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, XCircle, MessageSquare, Clock, Image, X, Send } from "lucide-react";
import { portalFetch } from "@/lib/portal-context";
import { cn } from "@/lib/utils";

interface DesignComment {
  text: string;
  authorType: string;
  createdAt: string;
}

interface Design {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string | null;
  approvalStatus: string;
  designComments: DesignComment[];
  createdAt: string;
}

export default function PortalDesignsPage() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Design | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    portalFetch("/api/portal/designs")
      .then((r) => r.json())
      .then((d) => setDesigns(d.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleApproval = async (id: string, status: "approved" | "rejected") => {
    setSubmitting(true);
    try {
      const res = await portalFetch("/api/portal/designs", {
        method: "PATCH",
        body: JSON.stringify({ id, approvalStatus: status }),
      });
      const d = await res.json();
      const updated = d.data as Design;
      setDesigns((prev) => prev.map((d) => d.id === id ? { ...updated, designComments: Array.isArray(updated.designComments) ? updated.designComments as DesignComment[] : [] } : d));
      if (active?.id === id) setActive({ ...updated, designComments: Array.isArray(updated.designComments) ? updated.designComments as DesignComment[] : [] });
    } finally {
      setSubmitting(false);
    }
  };

  const handleComment = async () => {
    if (!active || !comment.trim()) return;
    setSubmitting(true);
    try {
      const res = await portalFetch("/api/portal/designs", {
        method: "PATCH",
        body: JSON.stringify({ id: active.id, comment: comment.trim() }),
      });
      const d = await res.json();
      const updated = d.data as Design;
      const mapped = { ...updated, designComments: Array.isArray(updated.designComments) ? updated.designComments as DesignComment[] : [] };
      setDesigns((prev) => prev.map((d) => d.id === active.id ? mapped : d));
      setActive(mapped);
      setComment("");
    } finally {
      setSubmitting(false);
    }
  };

  const statusLabel = (s: string) =>
    s === "approved" ? "تایید شده" : s === "rejected" ? "رد شده" : "در انتظار بررسی";

  const statusStyle = (s: string) =>
    s === "approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
    s === "rejected" ? "bg-red-500/10 text-red-400 border-red-500/20" :
    "bg-amber-500/10 text-amber-400 border-amber-500/20";

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Image className="w-5 h-5 text-teal-400" />بررسی طرح‌ها
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">طرح‌های ارسال‌شده برای تایید شما</p>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
        </div>
      ) : designs.length === 0 ? (
        <div className="text-center py-16">
          <Image className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground text-sm">هنوز طرحی برای بررسی وجود ندارد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {designs.map((design) => (
            <motion.div
              key={design.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card overflow-hidden hover:border-teal-400/30 transition-all cursor-pointer"
              onClick={() => setActive(design)}
            >
              <div className="aspect-video bg-muted relative overflow-hidden">
                {design.thumbnailUrl || design.url ? (
                  <img src={design.thumbnailUrl ?? design.url} alt={design.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-8 h-8 text-muted-foreground opacity-30" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full border", statusStyle(design.approvalStatus))}>
                    {statusLabel(design.approvalStatus)}
                  </span>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-foreground truncate">{design.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />{design.designComments.length} نظر
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(design.createdAt).toLocaleDateString("fa-IR")}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Design detail modal */}
      <AnimatePresence>
        {active && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setActive(null)}>
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                <div>
                  <h2 className="font-semibold text-foreground">{active.name}</h2>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full border mt-0.5 inline-block", statusStyle(active.approvalStatus))}>
                    {statusLabel(active.approvalStatus)}
                  </span>
                </div>
                <button onClick={() => setActive(null)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Image */}
                <div className="bg-muted/50 flex items-center justify-center p-4 max-h-72">
                  {active.url ? (
                    <img src={active.url} alt={active.name} className="max-h-64 object-contain rounded-lg" />
                  ) : (
                    <div className="w-full h-40 flex items-center justify-center text-muted-foreground">
                      <Image className="w-12 h-12 opacity-30" />
                    </div>
                  )}
                </div>

                {/* Approval buttons */}
                {active.approvalStatus === "pending" && (
                  <div className="flex gap-3 px-5 py-4 border-b border-border">
                    <button
                      onClick={() => handleApproval(active.id, "approved")}
                      disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />تایید
                    </button>
                    <button
                      onClick={() => handleApproval(active.id, "rejected")}
                      disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />رد
                    </button>
                  </div>
                )}

                {/* Comments */}
                <div className="p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-teal-400" />نظرات
                  </h3>
                  {active.designComments.length === 0 ? (
                    <p className="text-xs text-muted-foreground">نظری ثبت نشده</p>
                  ) : active.designComments.map((c, i) => (
                    <div key={i} className={cn("p-3 rounded-xl text-sm",
                      c.authorType === "client" ? "bg-teal-500/10 border border-teal-500/20 mr-4" : "bg-muted border border-border ml-4"
                    )}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {c.authorType === "client" ? "شما" : "تیم ما"}
                        </span>
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("fa-IR")}</span>
                      </div>
                      <p className="text-foreground">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply box */}
              <div className="px-5 py-3 border-t border-border flex gap-2 shrink-0">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                  placeholder="نظر شما..."
                  className="flex-1 px-3 py-2 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40"
                />
                <button
                  onClick={handleComment}
                  disabled={!comment.trim() || submitting}
                  className="px-3 py-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 transition-colors disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
