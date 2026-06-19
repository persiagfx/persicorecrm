"use client";

import { useState, useEffect, useCallback } from "react";
import { Webhook, Plus, Trash2, TestTube2, ToggleLeft, ToggleRight, X, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ALL_EVENTS = [
  { value: "lead.created", label: "لید جدید (lead.created)" },
  { value: "lead.won", label: "لید برنده (lead.won)" },
  { value: "invoice.paid", label: "فاکتور پرداخت‌شده (invoice.paid)" },
  { value: "form.submitted", label: "فرم ارسال‌شده (form.submitted)" },
  { value: "project.completed", label: "پروژه تکمیل‌شده (project.completed)" },
];

interface WebhookItem {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string | null;
  isActive: boolean;
}

interface TestResult {
  success: boolean;
  statusCode: number;
  response: string;
}

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("crm-token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function WebhooksSettingsPage() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult | "loading">>({});

  // Form state
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [formSecret, setFormSecret] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/webhooks", { headers: authHeaders() });
      const json = await res.json();
      setWebhooks(json.data ?? []);
    } catch {
      toast.error("خطا در بارگذاری webhooks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  function resetForm() {
    setFormName("");
    setFormUrl("");
    setFormEvents([]);
    setFormSecret("");
  }

  async function handleCreate() {
    if (!formName.trim() || !formUrl.trim() || formEvents.length === 0) {
      toast.error("نام، URL و حداقل یک رویداد الزامی است");
      return;
    }
    setFormSaving(true);
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name: formName, url: formUrl, events: formEvents, secret: formSecret || undefined }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? "خطا در ایجاد webhook");
        return;
      }
      toast.success("Webhook ایجاد شد");
      setShowModal(false);
      resetForm();
      fetchWebhooks();
    } catch {
      toast.error("خطا در اتصال به سرور");
    } finally {
      setFormSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("آیا از حذف این webhook مطمئن هستید؟")) return;
    try {
      const res = await fetch(`/api/webhooks/${id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) { toast.error("خطا در حذف"); return; }
      toast.success("Webhook حذف شد");
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    } catch {
      toast.error("خطا در اتصال");
    }
  }

  async function handleToggle(wh: WebhookItem) {
    try {
      const res = await fetch(`/api/webhooks/${wh.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ isActive: !wh.isActive }),
      });
      if (!res.ok) { toast.error("خطا در بروزرسانی"); return; }
      setWebhooks((prev) => prev.map((w) => w.id === wh.id ? { ...w, isActive: !wh.isActive } : w));
    } catch {
      toast.error("خطا در اتصال");
    }
  }

  async function handleTest(id: string) {
    setTestResults((prev) => ({ ...prev, [id]: "loading" }));
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: "POST", headers: authHeaders() });
      const json = await res.json();
      const result: TestResult = json.data ?? { success: false, statusCode: 0, response: "خطا" };
      setTestResults((prev) => ({ ...prev, [id]: result }));
      if (result.success) {
        toast.success(`تست موفق — کد ${result.statusCode}`);
      } else {
        toast.error(`تست ناموفق — کد ${result.statusCode}`);
      }
    } catch {
      setTestResults((prev) => ({ ...prev, [id]: { success: false, statusCode: 0, response: "خطا در اتصال" } }));
      toast.error("خطا در ارسال تست");
    }
  }

  function toggleEvent(ev: string) {
    setFormEvents((prev) => prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]);
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/10">
            <Webhook className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Webhooks</h1>
            <p className="text-sm text-white/50">رویدادها را به سرویس‌های خارجی ارسال کنید</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          افزودن Webhook
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
        </div>
      ) : webhooks.length === 0 ? (
        <div className="text-center py-16 text-white/40">
          <Webhook className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>هیچ webhook‌ای تنظیم نشده</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh) => {
            const testResult = testResults[wh.id];
            return (
              <div
                key={wh.id}
                className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white truncate">{wh.name}</span>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          wh.isActive
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-white/10 text-white/40"
                        )}
                      >
                        {wh.isActive ? "فعال" : "غیرفعال"}
                      </span>
                    </div>
                    <p className="text-sm text-white/50 truncate mt-0.5">{wh.url}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(wh)}
                      title={wh.isActive ? "غیرفعال کردن" : "فعال کردن"}
                      className="text-white/50 hover:text-white transition-colors"
                    >
                      {wh.isActive
                        ? <ToggleRight className="w-5 h-5 text-emerald-400" />
                        : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    {/* Test */}
                    <button
                      onClick={() => handleTest(wh.id)}
                      disabled={testResult === "loading"}
                      title="ارسال تست"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {testResult === "loading"
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <TestTube2 className="w-4 h-4" />}
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(wh.id)}
                      title="حذف"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Events */}
                <div className="flex flex-wrap gap-1.5">
                  {(wh.events as string[]).map((ev) => (
                    <span
                      key={ev}
                      className="text-xs bg-violet-500/15 text-violet-300 px-2 py-0.5 rounded-full"
                    >
                      {ev}
                    </span>
                  ))}
                </div>

                {/* Test result */}
                {testResult && testResult !== "loading" && (
                  <div
                    className={cn(
                      "flex items-start gap-2 text-xs rounded-lg p-2",
                      testResult.success ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"
                    )}
                  >
                    {testResult.success
                      ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      : <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                    <span>
                      کد {testResult.statusCode}{testResult.response ? ` — ${testResult.response.slice(0, 100)}` : ""}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="font-semibold text-white">افزودن Webhook</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm text-white/60 mb-1">نام</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثلاً: Slack Notifications"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500"
                />
              </div>
              {/* URL */}
              <div>
                <label className="block text-sm text-white/60 mb-1">URL</label>
                <input
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://example.com/webhook"
                  dir="ltr"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500"
                />
              </div>
              {/* Events */}
              <div>
                <label className="block text-sm text-white/60 mb-2">رویدادها</label>
                <div className="space-y-2">
                  {ALL_EVENTS.map((ev) => (
                    <label key={ev.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formEvents.includes(ev.value)}
                        onChange={() => toggleEvent(ev.value)}
                        className="w-4 h-4 accent-violet-500"
                      />
                      <span className="text-sm text-white/80">{ev.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Secret */}
              <div>
                <label className="block text-sm text-white/60 mb-1">Secret (اختیاری)</label>
                <input
                  value={formSecret}
                  onChange={(e) => setFormSecret(e.target.value)}
                  placeholder="کلید مخفی برای امضای HMAC"
                  dir="ltr"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-white/10">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleCreate}
                disabled={formSaving}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {formSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                ذخیره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
