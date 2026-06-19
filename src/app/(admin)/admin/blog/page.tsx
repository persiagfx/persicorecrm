"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Search, Eye, Clock, CheckCircle2, FileText,
  Pencil, Trash2, Star, MoreHorizontal, X, Filter,
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Post {
  id: string; title: string; slug: string; status: string;
  featured: boolean; views: number; readingTime: number;
  coverImage: string | null; tags: string[];
  author: { name: string; avatar: string | null };
  category: { name: string; color: string } | null;
  publishedAt: string | null; updatedAt: string;
}

const STATUS_CFG = {
  all: { label: "همه", color: "" },
  published: { label: "منتشر شده", color: "text-green-400 bg-green-500/10 border-green-500/20" },
  draft: { label: "پیش‌نویس", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  scheduled: { label: "زمان‌بندی شده", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ perPage: "50" });
      if (status !== "all") params.set("status", status);
      const res = await apiClient.get(`/admin/posts?${params}`);
      setPosts(res.data.data ?? []);
      setTotal(res.data.meta?.total ?? 0);
    } catch { toast.error("خطا در دریافت پست‌ها"); }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/admin/posts/${id}`);
      setPosts(prev => prev.filter(p => p.id !== id));
      toast.success("پست حذف شد");
    } catch { toast.error("خطا در حذف"); }
    setDeleteId(null);
  };

  const filtered = posts.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">پست‌های بلاگ</h1>
          <p className="text-sm text-white/40 mt-1">{total} پست در مجموع</p>
        </div>
        <Link href="/admin/blog/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />پست جدید
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
          <button key={key} onClick={() => setStatus(key)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-xl border transition-all",
              status === key
                ? "bg-violet-600/20 border-violet-500/30 text-violet-300"
                : "border-white/10 text-white/40 hover:text-white hover:border-white/20"
            )}>
            {cfg.label}
          </button>
        ))}
        <div className="relative flex-1 max-w-xs mr-auto">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pr-9 pl-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-white/30 text-sm">در حال بارگذاری...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">پستی یافت نشد</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["عنوان", "وضعیت", "دسته", "بازدید", "تاریخ", ""].map(h => (
                  <th key={h} className="text-right text-xs font-medium text-white/30 px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((post, i) => {
                  const cfg = STATUS_CFG[post.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.draft;
                  return (
                    <motion.tr key={post.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {post.coverImage && (
                            <img src={post.coverImage} alt="" className="w-10 h-7 object-cover rounded-lg opacity-70" />
                          )}
                          <div>
                            <Link href={`/admin/blog/${post.id}`}
                              className="text-sm font-medium text-white/80 hover:text-white transition-colors line-clamp-1">
                              {post.featured && <Star className="w-3 h-3 text-amber-400 inline ml-1.5 mb-0.5" />}
                              {post.title}
                            </Link>
                            <p className="text-[10px] text-white/30 mt-0.5">{post.readingTime} دقیقه مطالعه</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full border", cfg.color)}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {post.category ? (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: post.category.color + "22", color: post.category.color }}>
                            {post.category.name}
                          </span>
                        ) : <span className="text-white/20 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1 text-xs text-white/30">
                          <Eye className="w-3 h-3" />{post.views}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-white/30">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString("fa-IR")
                          : new Date(post.updatedAt).toLocaleDateString("fa-IR")}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/admin/blog/${post.id}`}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all">
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          <button onClick={() => setDeleteId(post.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeleteId(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#141419] border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="font-bold text-white mb-2">حذف پست؟</h3>
              <p className="text-sm text-white/40 mb-6">این عمل قابل برگشت نیست.</p>
              <div className="flex gap-3">
                <button onClick={() => handleDelete(deleteId!)}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600">
                  حذف
                </button>
                <button onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/60 text-sm hover:bg-white/10">
                  انصراف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
