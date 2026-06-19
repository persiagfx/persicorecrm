"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAgentAuth } from "@/lib/agent-auth/context";
import Link from "next/link";

interface Conversation {
  id: string; sessionId: string; visitorName?: string; visitorEmail?: string;
  visitorPhone?: string; messageCount: number; leadCreated: boolean;
  startedAt: string; lastMessageAt: string;
  messages?: { role: string; content: string; createdAt: string }[];
}

function apiFetch(path: string) {
  const token = typeof window !== "undefined" ? localStorage.getItem("agent-token") || localStorage.getItem("crm-token") : null;
  return fetch(`/api/agent${path}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
}

export default function ConversationsPage() {
  const { user, isLoading } = useAgentAuth();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);

  useEffect(() => { if (!isLoading && !user) router.push("/agent/login"); }, [user, isLoading, router]);
  useEffect(() => {
    if (user && id) {
      apiFetch(`/agents/${id}/conversations`).then((r) => r.json()).then((d) => {
        setConversations(d.data?.conversations ?? []); setLoading(false);
      });
    }
  }, [user, id]);

  const loadMessages = async (convId: string) => {
    setSelected(convId);
    const res = await apiFetch(`/agents/${id}/conversations`);
    const d = await res.json();
    const conv = d.data?.conversations?.find((c: Conversation) => c.id === convId);
    setMessages(conv?.messages ?? []);
  };

  const selectedConv = conversations.find((c) => c.id === selected);

  return (
    <div className="min-h-screen bg-[#07071a] text-white" dir="rtl">
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link href={`/agent/agents/${id}`} className="text-white/40 hover:text-white text-sm transition-colors">← بازگشت</Link>
          <span className="text-white/20">/</span>
          <span className="font-medium">مکالمات</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 flex gap-4 h-[calc(100vh-73px)]">
        {/* List */}
        <div className="w-80 flex-shrink-0 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-white/40 text-sm text-center py-10">در حال بارگذاری...</div>
          ) : conversations.length === 0 ? (
            <div className="text-white/40 text-sm text-center py-10">هنوز مکالمه‌ای نیست</div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadMessages(conv.id)}
                className={`w-full text-right p-3 rounded-xl border transition-all ${
                  selected === conv.id ? "border-[#5b6cff]/50 bg-[#5b6cff]/10" : "border-white/10 hover:border-white/20 bg-white/3"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{conv.visitorName ?? "بازدیدکننده ناشناس"}</span>
                  {conv.leadCreated && <span className="text-xs text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full">لید</span>}
                </div>
                <div className="text-xs text-white/40">{conv.messageCount} پیام</div>
                {conv.visitorPhone && <div className="text-xs text-white/40">{conv.visitorPhone}</div>}
              </button>
            ))
          )}
        </div>

        {/* Detail */}
        <div className="flex-1 bg-white/3 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-white/40">یک مکالمه را انتخاب کنید</div>
          ) : (
            <>
              <div className="border-b border-white/10 px-4 py-3 flex items-center gap-3">
                <span className="font-medium">{selectedConv?.visitorName ?? "بازدیدکننده"}</span>
                {selectedConv?.visitorEmail && <span className="text-sm text-white/40">{selectedConv.visitorEmail}</span>}
                {selectedConv?.visitorPhone && <span className="text-sm text-white/40">{selectedConv.visitorPhone}</span>}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-3 py-2.5 rounded-2xl text-sm ${
                      m.role === "user" ? "bg-[#5b6cff] text-white" : "bg-white/8 text-white/90"
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
