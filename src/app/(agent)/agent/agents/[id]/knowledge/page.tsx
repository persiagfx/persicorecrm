"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAgentAuth } from "@/lib/agent-auth/context";
import Link from "next/link";

interface KnowledgeItem { id: string; title: string; type: string; content: string; tokens: number; sourceUrl?: string; createdAt: string; }

function apiFetch(path: string, options?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("agent-token") || localStorage.getItem("crm-token") : null;
  return fetch(`/api/agent${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options?.headers ?? {}) },
  });
}

type AddMode = "text" | "url";

export default function KnowledgePage() {
  const { user, isLoading } = useAgentAuth();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>("text");

  // Text form
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  // URL crawl form
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawling, setCrawling] = useState(false);
  const [crawlResult, setCrawlResult] = useState<{ pageTitle: string; chunksCreated: number; totalChars: number } | null>(null);
  const [crawlError, setCrawlError] = useState("");

  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { if (!isLoading && !user) router.push("/agent/login"); }, [user, isLoading, router]);

  const load = () => {
    setLoading(true);
    apiFetch(`/agents/${id}/knowledge`).then((r) => r.json()).then((d) => { setItems(d.data ?? []); setLoading(false); });
  };
  useEffect(() => { if (user && id) load(); }, [user, id]);

  const save = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    await apiFetch(`/agents/${id}/knowledge`, { method: "POST", body: JSON.stringify({ type: "TEXT", title, content }) });
    setTitle(""); setContent(""); setShowForm(false);
    load();
    setSaving(false);
  };

  const crawl = async () => {
    if (!crawlUrl.trim()) return;
    setCrawling(true);
    setCrawlError("");
    setCrawlResult(null);
    try {
      const r = await apiFetch(`/agents/${id}/knowledge/crawl`, { method: "POST", body: JSON.stringify({ url: crawlUrl }) });
      const d = await r.json();
      if (!r.ok || d.error) { setCrawlError(d.message ?? d.error ?? "خطا"); }
      else {
        setCrawlResult(d.data);
        setCrawlUrl("");
        load();
      }
    } catch { setCrawlError("خطای شبکه"); }
    finally { setCrawling(false); }
  };

  const remove = async (knowledgeId: string) => {
    setDeleting(knowledgeId);
    await apiFetch(`/agents/${id}/knowledge?knowledgeId=${knowledgeId}`, { method: "DELETE" });
    setItems((prev) => prev.filter((k) => k.id !== knowledgeId));
    setDeleting(null);
  };

  const TYPE_ICON: Record<string, string> = { TEXT: "📝", FILE: "📎", URL: "🔗" };
  const TYPE_LABEL: Record<string, string> = { TEXT: "متن", FILE: "فایل", URL: "وب‌سایت" };

  return (
    <div className="min-h-screen bg-[#07071a] text-white" dir="rtl">
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href={`/agent/agents/${id}`} className="text-white/40 hover:text-white text-sm transition-colors">← بازگشت</Link>
          <span className="text-white/20">/</span>
          <span className="font-medium">دانش‌پایه</span>
          <div className="mr-auto flex items-center gap-2">
            <span className="text-xs text-white/40">{items.length} مورد</span>
            <button
              onClick={() => { setShowForm(!showForm); setCrawlResult(null); setCrawlError(""); }}
              className="bg-[#5b6cff] hover:bg-[#4a5ae8] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              + افزودن دانش
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {showForm && (
          <div className="bg-white/3 border border-[#5b6cff]/30 rounded-2xl p-6 mb-6">
            {/* Mode tabs */}
            <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-5">
              {([["text", "📝 متن مستقیم"], ["url", "🌐 خزیدن سایت"]] as [AddMode, string][]).map(([m, l]) => (
                <button
                  key={m}
                  onClick={() => { setAddMode(m); setCrawlResult(null); setCrawlError(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${addMode === m ? "bg-[#5b6cff] text-white" : "text-white/50 hover:text-white"}`}
                >
                  {l}
                </button>
              ))}
            </div>

            {addMode === "text" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">عنوان</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: سوالات متداول، ساعت کاری، ..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#5b6cff]/50 text-sm transition-colors" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">محتوا</label>
                  <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="اطلاعات کسب‌وکار خود را اینجا وارد کنید..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#5b6cff]/50 text-sm transition-colors resize-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={save} disabled={saving || !title.trim() || !content.trim()} className="bg-[#5b6cff] hover:bg-[#4a5ae8] disabled:opacity-40 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors">
                    {saving ? "در حال ذخیره..." : "ذخیره"}
                  </button>
                  <button onClick={() => setShowForm(false)} className="text-white/50 hover:text-white px-4 py-2 rounded-xl text-sm transition-colors">لغو</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">آدرس صفحه سایت</label>
                  <div className="flex gap-2">
                    <input
                      value={crawlUrl}
                      onChange={(e) => setCrawlUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && crawl()}
                      placeholder="https://example.com/about"
                      dir="ltr"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#5b6cff]/50 text-sm transition-colors"
                    />
                    <button
                      onClick={crawl}
                      disabled={crawling || !crawlUrl.trim()}
                      className="bg-[#5b6cff] hover:bg-[#4a5ae8] disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
                    >
                      {crawling ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          در حال خزیدن...
                        </span>
                      ) : "خزیدن"}
                    </button>
                  </div>
                  <p className="text-xs text-white/30 mt-2">
                    سیستم متن صفحه رو استخراج می‌کنه و به دانش‌پایه اضافه می‌کنه. حداکثر ۵ بخش از هر صفحه.
                  </p>
                </div>

                {crawlError && (
                  <div className="bg-red-500/10 border border-red-500/25 text-red-300 text-sm rounded-xl px-4 py-3">
                    ❌ {crawlError}
                  </div>
                )}

                {crawlResult && (
                  <div className="bg-green-500/10 border border-green-500/25 text-green-300 text-sm rounded-xl px-4 py-3 space-y-1">
                    <div className="font-medium">✅ صفحه با موفقیت خزیده شد!</div>
                    <div className="text-green-300/70">عنوان: {crawlResult.pageTitle}</div>
                    <div className="text-green-300/70">{crawlResult.chunksCreated} بخش · {crawlResult.totalChars.toLocaleString()} کاراکتر استخراج شد</div>
                  </div>
                )}

                <button onClick={() => setShowForm(false)} className="text-white/50 hover:text-white px-4 py-2 rounded-xl text-sm transition-colors">بستن</button>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-white/40">در حال بارگذاری...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">📚</div>
            <p className="text-white/50 mb-4">هنوز دانشی اضافه نشده</p>
            <button onClick={() => setShowForm(true)} className="text-[#5b6cff] hover:underline text-sm">+ افزودن اولین بخش</button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-white/3 border border-white/10 hover:border-white/15 rounded-2xl p-4 transition-all">
                <div className="flex items-start gap-3">
                  <div className="text-lg flex-shrink-0 mt-0.5">{TYPE_ICON[item.type] ?? "📄"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{item.title}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-white/8 text-white/40">{TYPE_LABEL[item.type] ?? item.type}</span>
                    </div>
                    <div className="text-white/40 text-xs line-clamp-2 leading-relaxed">{item.content}</div>
                    {item.sourceUrl && (
                      <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#5b6cff]/60 hover:text-[#5b6cff] mt-1 block truncate transition-colors">
                        {item.sourceUrl}
                      </a>
                    )}
                    <div className="text-white/25 text-xs mt-2">{item.tokens.toLocaleString()} توکن</div>
                  </div>
                  <button onClick={() => remove(item.id)} disabled={deleting === item.id} className="text-red-400/50 hover:text-red-400 text-sm transition-colors disabled:opacity-40 flex-shrink-0 px-2 py-1 rounded-lg hover:bg-red-500/10">
                    {deleting === item.id ? "..." : "حذف"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
