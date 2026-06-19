"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare, Send, Search, Plus, Phone, Video,
  MoreHorizontal, Check, CheckCheck, Paperclip, X, Users,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSSE } from "@/hooks/useSSE";

interface TeamMessage {
  id: string; conversationId: string; senderId: string;
  content: string; type: string; readBy: string[]; createdAt: string;
}

interface Conversation {
  id: string; participantIds: string[]; isGroup: boolean;
  groupName: string | null; isPinned: boolean;
  updatedAt: string;
  messages: TeamMessage[];
}

interface TeamUser { id: string; name: string; avatar: string | null; color: string; role: string; }

export default function MessagesPage() {
  const { user } = useAuth();
  const myId = user?.id ?? "";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [allUsers, setAllUsers] = useState<TeamUser[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showNewConv, setShowNewConv] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/messages");
      const convs: Conversation[] = res.data?.data ?? [];
      setConversations(convs);
      // only set active on first load (when nothing is active yet)
      setActiveConvId((prev) => prev ?? (convs.length > 0 ? convs[0].id : null));
    } catch { toast.error("خطا در بارگذاری پیام‌ها"); }
    finally { setLoading(false); }
  }, []); // no activeConvId dependency — avoids re-fetch loop on every conv switch

  useEffect(() => {
    fetchConversations();
    apiClient.get("/users").then((r) => setAllUsers(r.data?.data ?? [])).catch((err) => console.error(err));
  }, [fetchConversations]);

  useEffect(() => {
    if (!activeConvId) return;
    apiClient.get(`/messages/${activeConvId}`).then((r) => {
      setMessages(r.data?.data?.messages ?? r.data?.messages ?? []);
      // mark read
      apiClient.post("/messages", { _action: "mark_read", conversationId: activeConvId }).catch((err) => console.error(err));
    }).catch((err) => console.error(err));
  }, [activeConvId]);

  const handleSend = async () => {
    if (!input.trim() || !activeConvId) return;
    setSending(true);
    const optimistic: TeamMessage = {
      id: `tmp-${Date.now()}`, conversationId: activeConvId, senderId: myId,
      content: input.trim(), type: "text", readBy: [myId], createdAt: new Date().toISOString(),
    };
    setMessages((p) => [...p, optimistic]);
    setInput("");
    try {
      const res = await apiClient.post("/messages", {
        _action: "send_message", conversationId: activeConvId, content: optimistic.content,
      });
      const msg = res.data?.data ?? res.data;
      setMessages((p) => p.map((m) => m.id === optimistic.id ? msg : m));
      setConversations((p) => p.map((c) => c.id === activeConvId ? { ...c, updatedAt: new Date().toISOString(), messages: [msg] } : c));
    } catch {
      setMessages((p) => p.filter((m) => m.id !== optimistic.id));
      toast.error("خطا در ارسال پیام");
    } finally { setSending(false); }
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) { toast.error("حداقل یک نفر انتخاب کنید"); return; }
    setCreating(true);
    try {
      const isGroup = selectedUsers.length > 1;
      const res = await apiClient.post("/messages", {
        _action: "create_conversation",
        participantIds: selectedUsers,
        isGroup,
        groupName: isGroup ? (groupName || "گروه جدید") : undefined,
      });
      const newConv: Conversation = {
        ...(res.data?.data ?? res.data),
        messages: (res.data?.data ?? res.data).messages ?? [],
        participantIds: (() => {
          const ids = (res.data?.data ?? res.data).participantIds;
          return Array.isArray(ids) ? ids : JSON.parse(ids ?? "[]");
        })(),
      };
      setConversations((p) => [newConv, ...p]);
      setActiveConvId(newConv.id);
      setMessages([]);
      setShowNewConv(false);
      setSelectedUsers([]);
      setGroupName("");
      toast.success("گفتگو ایجاد شد");
    } catch (e) {
      console.error("create conv error:", e);
      toast.error("خطا در ایجاد گفتگو");
    } finally {
      setCreating(false);
    }
  };

  const getUserById = (id: string) => allUsers.find((u) => u.id === id);

  const getConvName = (conv: Conversation) => {
    if (conv.isGroup) return conv.groupName ?? "گروه";
    const ids: string[] = Array.isArray(conv.participantIds)
      ? conv.participantIds
      : JSON.parse(conv.participantIds as unknown as string ?? "[]");
    const otherId = ids.find((p) => p !== myId);
    return getUserById(otherId ?? "")?.name ?? "نامشخص";
  };

  const getLastMsg = (conv: Conversation) => {
    const last = (conv.messages ?? [])[0];
    if (!last) return "هنوز پیامی نیست";
    return last.senderId === myId ? `شما: ${last.content}` : last.content;
  };

  const getUnreadCount = (conv: Conversation) =>
    (conv.messages ?? []).filter((m) => m.senderId !== myId && !(m.readBy ?? []).includes(myId)).length;

  const filteredConvs = conversations.filter((c) => {
    if (!search) return true;
    const name = getConvName(c);
    return name.includes(search);
  });

  const activeConv = conversations.find((c) => c.id === activeConvId);

  // Real-time: receive new messages via SSE
  const activeConvIdRef = useRef(activeConvId);
  activeConvIdRef.current = activeConvId;
  useSSE((event) => {
    if (event.type === "message.new") {
      const msg = event.data as TeamMessage;
      if (msg.conversationId === activeConvIdRef.current) {
        setMessages((p) => {
          // skip if already present (optimistic)
          if (p.some((m) => m.id === msg.id)) return p;
          return [...p, msg];
        });
        // mark read immediately since we're viewing this conv
        apiClient.post("/messages", { _action: "mark_read", conversationId: msg.conversationId }).catch(() => {});
      }
      // update last message in sidebar
      setConversations((p) => p.map((c) =>
        c.id === msg.conversationId ? { ...c, updatedAt: new Date().toISOString(), messages: [msg] } : c
      ));
    }
  });

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />پیامرسان داخلی
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">ارتباط مستقیم با تیم</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 rounded-2xl border border-border bg-card overflow-hidden h-[calc(100vh-200px)] min-h-[500px]">
        {/* Conversation list */}
        <div className="border-e border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو..."
                className="w-full pe-9 ps-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                  <div className="w-10 h-10 rounded-full bg-muted animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-2.5 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))
            ) : filteredConvs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                {search ? "نتیجه‌ای یافت نشد" : "هنوز گفتگویی ندارید"}
              </div>
            ) : filteredConvs.map((conv) => {
              const isActive = conv.id === activeConvId;
              const name = getConvName(conv);
              const unread = getUnreadCount(conv);
              return (
                <motion.button key={conv.id} onClick={() => setActiveConvId(conv.id)} whileHover={{ x: -2 }}
                  className={cn("w-full flex items-start gap-3 px-4 py-3 border-b border-border/50 transition-all text-right",
                    isActive ? "bg-primary/10" : "hover:bg-muted/50")}>
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center font-bold text-black text-sm">
                      {conv.isGroup ? <Users className="w-4 h-4" /> : name.slice(0, 1)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">{name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{conv.updatedAt ? timeAgo(conv.updatedAt) : ""}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground truncate">{getLastMsg(conv)}</p>
                      {unread > 0 && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-primary text-black text-[10px] font-bold min-w-[18px] text-center">{unread}</span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="p-3 border-t border-border">
            <button onClick={() => setShowNewConv(true)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
              <Plus className="w-4 h-4" />گفتگوی جدید
            </button>
          </div>
        </div>

        {/* Chat area */}
        <div className="lg:col-span-2 flex flex-col">
          {activeConv ? (
            <>
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center font-bold text-black text-sm">
                    {activeConv.isGroup ? <Users className="w-4 h-4" /> : getConvName(activeConv).slice(0, 1)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{getConvName(activeConv)}</p>
                    <p className="text-xs text-muted-foreground">
                      {activeConv.isGroup ? `${activeConv.participantIds.length} نفر` : "آنلاین"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!activeConv.isGroup && (
                    <>
                      <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Phone className="w-4 h-4" /></button>
                      <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Video className="w-4 h-4" /></button>
                    </>
                  )}
                  <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">هنوز پیامی ارسال نشده</div>
                ) : messages.map((msg, idx) => {
                  const isOwn = msg.senderId === myId;
                  const sender = getUserById(msg.senderId);
                  const showAvatar = !isOwn && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);
                  return (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className={cn("flex items-end gap-2", isOwn ? "flex-row-reverse" : "flex-row")}>
                      {!isOwn && (
                        <div className={cn("w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-[10px] font-bold text-black shrink-0 mb-0.5",
                          !showAvatar && "invisible")}>
                          {sender?.name.slice(0, 1)}
                        </div>
                      )}
                      <div className={cn("max-w-[70%] flex flex-col gap-0.5", isOwn ? "items-end" : "items-start")}>
                        {showAvatar && !isOwn && (
                          <span className="text-xs text-muted-foreground ms-1">{sender?.name.split(" ")[0]}</span>
                        )}
                        <div className={cn("px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                          isOwn ? "bg-primary text-black rounded-ee-sm font-medium" : "bg-muted text-foreground rounded-es-sm")}>
                          {msg.content}
                        </div>
                        <div className={cn("flex items-center gap-1", isOwn ? "flex-row-reverse" : "flex-row")}>
                          <span className="text-[10px] text-muted-foreground">{timeAgo(msg.createdAt)}</span>
                          {isOwn && ((msg.readBy as string[]).length > 1
                            ? <CheckCheck className="w-3 h-3 text-primary" />
                            : <Check className="w-3 h-3 text-muted-foreground" />)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="px-4 py-3 border-t border-border">
                <div className="flex items-end gap-2 p-2 rounded-2xl bg-muted border border-border focus-within:ring-2 focus-within:ring-primary/40 transition-all">
                  <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><Paperclip className="w-4 h-4" /></button>
                  <textarea value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="پیام بنویسید... (Enter ارسال)" rows={1}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed" />
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={handleSend} disabled={!input.trim() || sending}
                    className="p-2 rounded-xl gradient-brand text-black disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>یک گفتگو انتخاب کنید</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: گفتگوی جدید */}
      <AnimatePresence>
        {showNewConv && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowNewConv(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">گفتگوی جدید</h3>
                <button onClick={() => setShowNewConv(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {allUsers.filter((u) => u.id !== myId).map((u) => (
                  <label key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted cursor-pointer transition-colors">
                    <input type="checkbox" checked={selectedUsers.includes(u.id)}
                      onChange={() => setSelectedUsers((p) => p.includes(u.id) ? p.filter((id) => id !== u.id) : [...p, u.id])}
                      className="w-4 h-4 rounded accent-primary" />
                    <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-black shrink-0">{u.name.slice(0, 1)}</div>
                    <span className="text-sm font-medium text-foreground">{u.name}</span>
                  </label>
                ))}
              </div>
              {selectedUsers.length > 1 && (
                <input value={groupName} onChange={(e) => setGroupName(e.target.value)}
                  placeholder="نام گروه (اختیاری)" className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              )}
              <div className="flex gap-3">
                <button onClick={() => setShowNewConv(false)} className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm">انصراف</button>
                <button onClick={handleCreateConversation} disabled={selectedUsers.length === 0 || creating}
                  className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow disabled:opacity-60">
                  {creating ? "در حال ایجاد..." : "شروع گفتگو"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
