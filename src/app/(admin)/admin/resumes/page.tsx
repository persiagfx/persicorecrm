"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Eye, Globe, Lock, ExternalLink, Pencil, Trash2, User } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

interface ResumeItem {
  id: string; slug: string; fullName: string; fullNameFa: string | null;
  title: string; titleFa: string | null; avatar: string | null;
  isPublished: boolean; views: number; theme: string; updatedAt: string;
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetch = () => {
    setLoading(true);
    apiClient.get("/admin/resumes")
      .then(r => setResumes(r.data.data ?? []))
      .catch(() => toast.error("خطا در دریافت"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/admin/resumes/${id}`);
      setResumes(prev => prev.filter(r => r.id !== id));
      toast.success("حذف شد");
    } catch { toast.error("خطا"); }
    setDeleteId(null);
  };

  const togglePublish = async (r: ResumeItem) => {
    try {
      await apiClient.put(`/admin/resumes/${r.id}`, { isPublished: !r.isPublished });
      setResumes(prev => prev.map(x => x.id === r.id ? { ...x, isPublished: !x.isPublished } : x));
      toast.success(r.isPublished ? "غیرفعال شد" : "منتشر شد");
    } catch { toast.error("خطا"); }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">رزومه‌ها</h1>
          <p className="text-sm text-white/40 mt-1">{resumes.length} رزومه</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/resumes/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:opacity-90">
            <Plus className="w-4 h-4" />رزومه جدید
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : resumes.length === 0 ? (
        <div className="text-center py-20">
          <User className="w-12 h-12 mx-auto mb-4 text-white/10" />
          <p className="text-white/30 font-medium">هیچ رزومه‌ای ثبت نشده</p>
          <p className="text-white/15 text-sm mt-1 mb-6">اولین رزومه را از دکمه بالا بسازید</p>
          <Link href="/admin/resumes/new" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:opacity-90">
            <Plus className="w-4 h-4" />رزومه جدید
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="group p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-violet-500/20 transition-all">
              <div className="flex items-start gap-3 mb-4">
                {r.avatar ? (
                  <img src={r.avatar} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-lg font-bold text-white shrink-0">
                    {r.fullName.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">{r.fullName}</h3>
                  {r.fullNameFa && <p className="text-xs text-white/40 mt-0.5">{r.fullNameFa}</p>}
                  <p className="text-xs text-violet-400 mt-0.5 truncate">{r.title}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${r.isPublished ? "text-green-400 bg-green-500/10 border-green-500/20" : "text-white/40 bg-white/5 border-white/10"}`}>
                  {r.isPublished ? <><Globe className="w-2.5 h-2.5" />منتشر</> : <><Lock className="w-2.5 h-2.5" />پیش‌نویس</>}
                </span>
                <span className="flex items-center gap-1 text-xs text-white/30">
                  <Eye className="w-3 h-3" />{r.views}
                </span>
                <span className="text-[10px] text-white/20 mr-auto">/{r.slug}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Link href={`/admin/resumes/${r.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 text-white/60 text-xs hover:bg-violet-600/20 hover:text-violet-300 transition-all">
                  <Pencil className="w-3 h-3" />ویرایش
                </Link>
                <button onClick={() => togglePublish(r)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 text-white/60 text-xs hover:bg-green-500/10 hover:text-green-400 transition-all">
                  {r.isPublished ? <><Lock className="w-3 h-3" />پنهان</> : <><Globe className="w-3 h-3" />انتشار</>}
                </button>
                {r.isPublished && (
                  <a href={`/resume/${r.slug}`} target="_blank" rel="noreferrer"
                    className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-violet-400 hover:bg-violet-500/10 transition-all">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button onClick={() => setDeleteId(r.id)}
                  className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
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
              <h3 className="font-bold text-white mb-2">حذف رزومه؟</h3>
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
