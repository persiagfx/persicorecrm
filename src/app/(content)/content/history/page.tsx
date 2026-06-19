"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useContentAuth } from "@/lib/content-auth/context";
import { useRouter } from "next/navigation";
import { History, ArrowRight, Instagram, MessageCircle, FileText, Mail, MessageSquare, Trash2, Copy, Check, Search, Filter, Sparkles } from "lucide-react";
import { toast } from "sonner";

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  telegram: MessageCircle,
  bale: MessageSquare,
  blog: FileText,
  email: Mail,
  sms: MessageSquare,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "from-pink-500 to-purple-600",
  telegram: "from-sky-400 to-blue-600",
  bale: "from-emerald-400 to-teal-600",
  blog: "from-amber-400 to-orange-600",
  email: "from-violet-400 to-purple-600",
  sms: "from-rose-400 to-red-600",
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "اینستاگرام", telegram: "تلگرام", bale: "بله", blog: "مقاله", email: "ایمیل", sms: "پیامک",
};

interface HistoryItem {
  id: string;
  platform: string;
  language: string;
  topic: string;
  tone: string;
  contentType: string;
  textOutput: string;
  imageUrl?: string;
  seoScore?: number;
  createdAt: string;
}

export default function HistoryPage() {
  const { user, isLoading } = useContentAuth();
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [platform, setPlatform] = useState("");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("content-token") || localStorage.getItem("crm-token") : null;

  useEffect(() => {
    if (!isLoading && !user) router.push("/content/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetchHistory();
  }, [page, platform, user]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), ...(platform ? { platform } : {}) });
      const res = await fetch(`/api/content/history?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setItems(data.data?.items ?? []);
      setPages(data.data?.pages ?? 1);
      setTotal(data.data?.total ?? 0);
    } catch { toast.error("خطا در بارگذاری تاریخچه"); }
    finally { setLoading(false); }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("آیا مطمئن هستید؟")) return;
    await fetch(`/api/content/history/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("حذف شد");
  };

  const copyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("کپی شد");
  };

  const filtered = search ? items.filter((i) => i.topic.includes(search) || i.textOutput.includes(search)) : items;

  if (isLoading) return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050508] text-white" dir="rtl">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-violet-600/8 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <header className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => router.push("/content")}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm">
            <ArrowRight className="w-4 h-4" /> برگشت
          </button>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-violet-400" />
            <h1 className="font-bold text-white">تاریخچه محتوا</h1>
          </div>
          <span className="text-white/30 text-sm mr-auto">{total} محتوا</span>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در موضوع یا محتوا..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pr-10 pl-4 py-2.5 text-white/70 placeholder-white/20 focus:outline-none focus:border-violet-500/40 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-white/30" />
            <div className="flex gap-1.5">
              {["", "instagram", "telegram", "blog", "email"].map((p) => (
                <button key={p} onClick={() => { setPlatform(p); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    platform === p ? "bg-violet-500/20 border-violet-500/30 text-violet-300" : "bg-white/3 border-white/8 text-white/40 hover:bg-white/5"
                  }`}>
                  {p ? PLATFORM_LABELS[p] : "همه"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white/3 border border-white/8 rounded-2xl p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/8" />
                  <div className="flex-1">
                    <div className="h-4 bg-white/8 rounded mb-2 w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-white/5 rounded" />
                  <div className="h-3 bg-white/5 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <History className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/30">هیچ محتوایی یافت نشد</p>
            <button onClick={() => router.push("/content")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm hover:bg-violet-500/20 transition-all">
              <Sparkles className="w-4 h-4" /> تولید محتوای جدید
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((item, i) => {
                const Icon = PLATFORM_ICONS[item.platform] ?? FileText;
                const gradient = PLATFORM_COLORS[item.platform] ?? "from-violet-500 to-indigo-500";
                const isExpanded = expandedId === item.id;
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden hover:border-white/12 transition-all group">
                    <div className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white/85 text-sm truncate">{item.topic}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-white/30 text-xs">{PLATFORM_LABELS[item.platform]}</span>
                            {item.seoScore !== undefined && (
                              <span className={`text-xs px-1.5 py-0.5 rounded-md ${item.seoScore >= 70 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                                SEO {item.seoScore}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => copyText(item.textOutput, item.id)}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-white/30 hover:text-white/70 transition-all">
                            {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => deleteItem(item.id)}
                            className="p-1.5 hover:bg-rose-500/10 rounded-lg text-white/30 hover:text-rose-400 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className={`text-white/40 text-xs leading-6 ${isExpanded ? "" : "line-clamp-3"}`}>
                        {item.textOutput}
                      </p>
                      {item.textOutput.length > 200 && (
                        <button onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="text-violet-400 text-xs mt-1 hover:text-violet-300 transition-colors">
                          {isExpanded ? "کمتر" : "بیشتر..."}
                        </button>
                      )}
                    </div>

                    <div className="border-t border-white/5 px-5 py-2.5 flex items-center justify-between">
                      <span className="text-white/20 text-xs">
                        {new Date(item.createdAt).toLocaleDateString("fa-IR")}
                      </span>
                      <div className="flex items-center gap-1">
                        {item.imageUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" title="تصویر دارد" />}
                        <span className="text-white/20 text-xs">{item.language === "fa" ? "فارسی" : "English"}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5 disabled:opacity-30 transition-all text-sm">
                  قبلی
                </button>
                <span className="text-white/40 text-sm">{page} از {pages}</span>
                <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                  className="px-4 py-2 rounded-xl border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5 disabled:opacity-30 transition-all text-sm">
                  بعدی
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
