"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Eye, Globe, Lock, ExternalLink, Pencil, Trash2, Briefcase, CheckCircle2, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { STATUS_LABEL, STATUS_COLOR, PROJECT_TYPE_LABEL } from "@/components/proposal/ProposalTypes";
import type { ProposalStatus, ProjectType } from "@/components/proposal/ProposalTypes";

interface ProposalItem {
  id: string; slug: string; status: ProposalStatus; isPublished: boolean;
  clientName: string; clientCompany: string | null;
  projectTitle: string; projectType: ProjectType;
  primaryColor: string; secondaryColor: string;
  views: number; viewedAt: string | null; validUntil: string | null;
  createdAt: string; updatedAt: string;
}

const STATUS_ICON: Record<ProposalStatus, React.ElementType> = {
  draft: Clock, sent: Globe, viewed: Eye, accepted: CheckCircle2, rejected: XCircle,
};

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetch = () => {
    setLoading(true);
    apiClient.get("/admin/proposals")
      .then(r => setProposals(r.data.data ?? []))
      .catch(() => toast.error("خطا در دریافت"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/admin/proposals/${id}`);
      setProposals(prev => prev.filter(p => p.id !== id));
      toast.success("حذف شد");
    } catch { toast.error("خطا"); }
    setDeleteId(null);
  };

  const togglePublish = async (p: ProposalItem) => {
    try {
      await apiClient.put(`/admin/proposals/${p.id}`, { isPublished: !p.isPublished });
      setProposals(prev => prev.map(x => x.id === p.id ? { ...x, isPublished: !x.isPublished } : x));
      toast.success(p.isPublished ? "غیرفعال شد" : "منتشر شد");
    } catch { toast.error("خطا"); }
  };

  const stats = {
    total: proposals.length,
    accepted: proposals.filter(p => p.status === "accepted").length,
    sent: proposals.filter(p => ["sent", "viewed"].includes(p.status)).length,
    draft: proposals.filter(p => p.status === "draft").length,
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">پروپزال‌ها</h1>
          <p className="text-sm text-white/40 mt-1">{proposals.length} پروپزال</p>
        </div>
        <Link href="/admin/proposals/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:opacity-90">
          <Plus className="w-4 h-4" />پروپزال جدید
        </Link>
      </div>

      {/* Stats */}
      {!loading && proposals.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "کل", value: stats.total, color: "violet" },
            { label: "تأییدشده", value: stats.accepted, color: "green" },
            { label: "ارسال‌شده", value: stats.sent, color: "blue" },
            { label: "پیش‌نویس", value: stats.draft, color: "white" },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
              <p className={`text-2xl font-bold text-${s.color}-400`}>{s.value}</p>
              <p className="text-xs text-white/40 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-24">
          <Briefcase className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <p className="text-white/30">هنوز پروپزالی ساخته نشده</p>
          <Link href="/admin/proposals/new" className="mt-4 inline-block px-6 py-2.5 rounded-xl bg-violet-600/20 text-violet-300 text-sm hover:bg-violet-600/30 transition-colors">
            اولین پروپزال را بسازید
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proposals.map((p, i) => {
            const StatusIcon = STATUS_ICON[p.status];
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="group rounded-2xl bg-white/[0.03] border border-white/10 hover:border-violet-500/20 transition-all overflow-hidden">
                {/* Color bar */}
                <div className="h-1" style={{ background: `linear-gradient(90deg, ${p.primaryColor}, ${p.secondaryColor})` }} />
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: `linear-gradient(135deg, ${p.primaryColor}40, ${p.secondaryColor}40)`, border: `1px solid ${p.primaryColor}40` }}>
                      {p.clientName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate text-sm">{p.projectTitle}</h3>
                      <p className="text-xs text-white/50 truncate">{p.clientName}{p.clientCompany ? ` · ${p.clientCompany}` : ""}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${STATUS_COLOR[p.status]}`}>
                      <StatusIcon className="w-2.5 h-2.5" />{STATUS_LABEL[p.status]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40">
                      {PROJECT_TYPE_LABEL[p.projectType]}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-white/30 mr-auto">
                      <Eye className="w-3 h-3" />{p.views}
                    </span>
                  </div>

                  {p.validUntil && (
                    <p className="text-[10px] text-white/30 mb-3">
                      اعتبار تا: {new Date(p.validUntil).toLocaleDateString("fa-IR")}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5">
                    <Link href={`/admin/proposals/${p.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 text-white/60 text-xs hover:bg-violet-600/20 hover:text-violet-300 transition-all">
                      <Pencil className="w-3 h-3" />ویرایش
                    </Link>
                    <button onClick={() => togglePublish(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 text-white/60 text-xs hover:bg-green-500/10 hover:text-green-400 transition-all">
                      {p.isPublished ? <><Lock className="w-3 h-3" />پنهان</> : <><Globe className="w-3 h-3" />انتشار</>}
                    </button>
                    {p.isPublished && (
                      <a href={`/proposal/${p.slug}`} target="_blank" rel="noreferrer"
                        className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-violet-400 hover:bg-violet-500/10 transition-all">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button onClick={() => setDeleteId(p.id)}
                      className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={() => setDeleteId(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#141419] border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center">
              <Trash2 className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <h3 className="font-bold text-white mb-2">حذف پروپزال؟</h3>
              <p className="text-sm text-white/40 mb-5">این عمل قابل برگشت نیست</p>
              <div className="flex gap-3">
                <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium">حذف</button>
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/60 text-sm">انصراف</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
