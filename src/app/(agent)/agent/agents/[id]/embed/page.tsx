"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAgentAuth } from "@/lib/agent-auth/context";
import Link from "next/link";

function apiFetch(path: string) {
  const token = typeof window !== "undefined" ? localStorage.getItem("agent-token") || localStorage.getItem("crm-token") : null;
  return fetch(`/api/agent${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

export default function EmbedPage() {
  const { user, isLoading } = useAgentAuth();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [agentName, setAgentName] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://agent.persicore.ir";

  useEffect(() => {
    if (!isLoading && !user) router.push("/agent/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && id) {
      apiFetch(`/agents/${id}`).then((r) => r.json()).then((d) => setAgentName(d.data?.name ?? ""));
    }
  }, [user, id]);

  const copyCode = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const scriptCode = `<script src="${baseUrl}/agent-widget.js" data-agent-id="${id}" async></script>`;
  const wpShortcode = `[persicore_agent id="${id}"]`;
  const reactCode = `import AgentWidget from '@persicore/agent-widget';
// در کامپوننت خود:
<AgentWidget agentId="${id}" />`;

  return (
    <div className="min-h-screen bg-[#07071a] text-white" dir="rtl">
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href={`/agent/agents/${id}`} className="text-white/40 hover:text-white text-sm transition-colors">← بازگشت</Link>
          <span className="text-white/20">/</span>
          <span className="font-medium">کد نصب — {agentName}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">نصب روی سایت</h1>
          <p className="text-white/50">یکی از روش‌های زیر را انتخاب کنید</p>
        </div>

        {/* HTML/Script */}
        <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center text-xl">🌐</div>
            <div>
              <h3 className="font-semibold">HTML / هر سایتی</h3>
              <p className="text-sm text-white/50">یک خط کد قبل از &lt;/body&gt; قرار دهید</p>
            </div>
          </div>
          <div className="bg-black/40 rounded-xl p-4 font-mono text-sm text-green-300/90 break-all mb-3">
            {scriptCode}
          </div>
          <button
            onClick={() => copyCode(scriptCode, "script")}
            className="text-sm px-4 py-2 rounded-xl border border-white/15 hover:border-white/30 text-white/60 hover:text-white transition-all"
          >
            {copied === "script" ? "✅ کپی شد" : "کپی کد"}
          </button>
        </div>

        {/* WordPress */}
        <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-xl">🔵</div>
            <div>
              <h3 className="font-semibold">وردپرس</h3>
              <p className="text-sm text-white/50">پلاگین رو نصب کنید و Shortcode استفاده کنید</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-white/60 mb-2">۱. پلاگین را دانلود و نصب کنید</p>
              <a
                href={`/api/agent/wordpress-plugin?agentId=${id}`}
                download={`persicore-agent-${id}.php`}
                className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-[#5b6cff]/15 border border-[#5b6cff]/30 text-[#5b6cff] hover:bg-[#5b6cff]/25 transition-all"
              >
                ⬇️ دانلود پلاگین وردپرس
              </a>
            </div>
            <div>
              <p className="text-sm text-white/60 mb-2">۲. Shortcode را در هر جایی استفاده کنید</p>
              <div className="bg-black/40 rounded-xl p-4 font-mono text-sm text-green-300/90 mb-3">
                {wpShortcode}
              </div>
              <button
                onClick={() => copyCode(wpShortcode, "wp")}
                className="text-sm px-4 py-2 rounded-xl border border-white/15 hover:border-white/30 text-white/60 hover:text-white transition-all"
              >
                {copied === "wp" ? "✅ کپی شد" : "کپی Shortcode"}
              </button>
            </div>
          </div>
        </div>

        {/* Agent ID */}
        <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">شناسه ایجنت</h3>
            <button
              onClick={() => copyCode(id, "id")}
              className="text-sm px-3 py-1.5 rounded-lg border border-white/15 hover:border-white/30 text-white/60 hover:text-white transition-all"
            >
              {copied === "id" ? "✅ کپی شد" : "کپی"}
            </button>
          </div>
          <div className="bg-black/40 rounded-xl p-4 font-mono text-sm text-white/70">
            {id}
          </div>
          <p className="text-xs text-white/40 mt-2">این شناسه را در تنظیمات پلاگین یا هر ابزار دیگری وارد کنید</p>
        </div>

        {/* Instructions HTML */}
        <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">📖 راهنمای نصب — HTML / هر سایت</h3>
          <ol className="space-y-4 text-sm text-white/70">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">۱</span>
              <div>
                <p className="font-medium text-white mb-1">فایل HTML سایت را باز کنید</p>
                <p className="text-white/50">وارد فایل اصلی سایت یا template مورد استفاده شوید.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">۲</span>
              <div>
                <p className="font-medium text-white mb-1">کد زیر را قبل از تگ <code className="text-violet-300">&lt;/body&gt;</code> قرار دهید</p>
                <div className="bg-black/40 rounded-lg p-3 font-mono text-xs text-green-300/90 mt-2 break-all">{scriptCode}</div>
                <button onClick={() => copyCode(scriptCode, "script2")} className="mt-2 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  {copied === "script2" ? "✅ کپی شد" : "کپی کد"}
                </button>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">۳</span>
              <div>
                <p className="font-medium text-white">فایل را ذخیره و سایت را رفرش کنید</p>
                <p className="text-white/50">ایجنت به صورت یک دکمه شناور در گوشه پایین سایت ظاهر می‌شود.</p>
              </div>
            </li>
          </ol>
        </div>

        {/* Instructions WordPress */}
        <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">📖 راهنمای نصب — وردپرس</h3>
          <ol className="space-y-4 text-sm text-white/70">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">۱</span>
              <div>
                <p className="font-medium text-white mb-1">پلاگین را دانلود کنید</p>
                <a href={`/api/agent/wordpress-plugin?agentId=${id}`} download={`persicore-agent-${id}.php`} className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  ⬇️ دانلود فایل پلاگین (.php)
                </a>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">۲</span>
              <div>
                <p className="font-medium text-white mb-1">پلاگین را آپلود کنید</p>
                <p className="text-white/50">وارد پیشخوان وردپرس شوید ← <strong className="text-white/70">افزونه‌ها</strong> ← <strong className="text-white/70">افزودن جدید</strong> ← <strong className="text-white/70">بارگذاری افزونه</strong> — فایل دانلود‌شده را انتخاب کنید.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">۳</span>
              <div>
                <p className="font-medium text-white mb-1">افزونه را فعال کنید</p>
                <p className="text-white/50">روی «نصب» و سپس «فعال‌سازی» کلیک کنید. ایجنت به طور خودکار روی تمام صفحات سایت ظاهر می‌شود.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">۴</span>
              <div>
                <p className="font-medium text-white mb-1">یا از Shortcode استفاده کنید</p>
                <p className="text-white/50 mb-1">اگر می‌خواهید ایجنت فقط در صفحه خاصی نمایش داده شود، این shortcode را در محتوای آن صفحه قرار دهید:</p>
                <div className="bg-black/40 rounded-lg p-2 font-mono text-xs text-green-300/90">{wpShortcode}</div>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
