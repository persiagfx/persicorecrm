"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight, Phone, Mail, Globe, MapPin, Plus, AlertTriangle, Star, Clock,
  UserCircle2, CheckCircle2, XCircle, Users, Headphones, MessageSquare, X,
  Send,
} from "lucide-react";
import Link from "next/link";
import type { ClientStatus, InvoiceStatus } from "@/types";
import { ClientStatusBadge, InvoiceStatusBadge } from "@/components/common/StatusBadge";
import { formatPrice, toJalali, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

const tabs = ["اطلاعات", "پروژه‌ها", "فاکتورها", "تایم‌لاین", "یادداشت‌ها", "پرتال"] as const;
type Tab = typeof tabs[number];

interface PortalUser {
  id: string;
  name: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface PortalTicketReply {
  id: string;
  authorName: string;
  authorType: string;
  content: string;
  createdAt: string;
}

interface PortalTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  replies: Array<{ id: string }>;
}

interface PortalTicketDetail extends PortalTicket {
  replies: PortalTicketReply[];
}

interface PortalMessage {
  id: string;
  authorName: string;
  authorType: string;
  content: string;
  createdAt: string;
}

interface PortalData {
  portalUsers: PortalUser[];
  tickets: PortalTicket[];
  messages: PortalMessage[];
}

// ─── Ticket Reply Drawer ──────────────────────────────────────────────────
function TicketReplyDrawer({
  ticket,
  onClose,
}: {
  ticket: PortalTicketDetail;
  onClose: () => void;
}) {
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [replies, setReplies] = useState<PortalTicketReply[]>(ticket.replies);

  const handleSend = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await apiClient.post(`/portal/tickets/${ticket.id}/team-reply`, { content: replyText.trim() });
      setReplies((prev) => [...prev, res.data.data]);
      setReplyText("");
      toast.success("پاسخ ارسال شد");
    } catch {
      toast.error("خطا در ارسال پاسخ");
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-bold text-foreground text-sm">{ticket.title}</h2>
            <span className={cn("text-xs mt-0.5",
              ticket.status === "open" ? "text-blue-400" :
              ticket.status === "closed" ? "text-emerald-400" : "text-amber-400"
            )}>
              {ticket.status === "open" ? "باز" : ticket.status === "closed" ? "بسته" : "در بررسی"}
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {replies.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">هنوز پاسخی ثبت نشده</p>
          ) : replies.map((r) => (
            <div key={r.id} className={cn("flex gap-2", r.authorType === "team" ? "flex-row-reverse" : "flex-row")}>
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                r.authorType === "team" ? "bg-primary/20 text-primary" : "bg-blue-500/20 text-blue-400"
              )}>
                {r.authorName.charAt(0)}
              </div>
              <div className={cn("max-w-[80%] rounded-xl px-3 py-2",
                r.authorType === "team" ? "bg-primary/10 border border-primary/20" : "bg-muted border border-border"
              )}>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {r.authorName} · {timeAgo(r.createdAt)}
                </p>
                <p className="text-sm text-foreground">{r.content}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-border shrink-0 flex gap-2">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="پاسخ تیم..."
            className="flex-1 px-3 py-2 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={handleSend}
            disabled={!replyText.trim() || sending}
            className="px-3 py-2 rounded-xl gradient-brand text-black text-sm font-semibold gold-glow disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── New Portal User Modal ────────────────────────────────────────────────
function NewPortalUserModal({
  clientId,
  onClose,
  onCreated,
}: {
  clientId: string;
  onClose: () => void;
  onCreated: (user: PortalUser) => void;
}) {
  const [form, setForm] = useState({ name: "", phone: "", role: "viewer" });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    setIsSaving(true);
    try {
      const res = await apiClient.post(`/clients/${clientId}/portal-users`, form);
      onCreated(res.data.data);
      toast.success("کاربر پرتال ایجاد شد");
      onClose();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "خطا در ایجاد کاربر";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <UserCircle2 className="w-4 h-4 text-primary" />کاربر پرتال جدید
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">نام *</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="نام کامل"
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">شماره موبایل *</label>
            <input type="tel" dir="ltr" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="09123456789"
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-center tracking-widest" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">نقش</label>
            <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="viewer">بیننده</option>
              <option value="admin">مدیر</option>
            </select>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm hover:bg-muted/80 transition-colors">انصراف</button>
          <button onClick={handleSubmit} disabled={!form.name.trim() || !form.phone.trim() || isSaving}
            className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow disabled:opacity-40 disabled:cursor-not-allowed">
            {isSaving ? "در حال ایجاد..." : "ایجاد کاربر"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface ClientDetail {
  id: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string | null;
  address?: string | null;
  website?: string | null;
  status: ClientStatus;
  tags: string[];
  totalRevenue: number;
  projectCount: number;
  lastInteractionAt?: string | null;
  anniversaryDate?: string | null;
  notes?: string | null;
  createdAt: string;
  projects: Array<{
    id: string;
    name: string;
    progress: number;
    colorHash: string;
    deadline: string;
    status: string;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    total: number;
    status: InvoiceStatus;
    issuedAt: string;
    dueDate: string;
  }>;
}

interface ActivityLog {
  id: string;
  description: string;
  createdAt: string;
  actor?: { name: string };
}

// ─── Notes Tab ──────────────────────────────────────────────────────────────
function NotesTab({ clientId, initialNotes }: { clientId: string; initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(initialNotes);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/clients/${clientId}`, { notes: draft });
      setNotes(draft);
      setEditing(false);
      toast.success("یادداشت ذخیره شد");
    } catch { toast.error("خطا در ذخیره"); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-sm">یادداشت‌های مشتری</h3>
        {!editing ? (
          <button onClick={() => { setDraft(notes); setEditing(true); }}
            className="text-xs text-primary hover:underline">
            {notes ? "ویرایش" : "افزودن یادداشت"}
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:text-foreground">انصراف</button>
            <button onClick={handleSave} disabled={saving}
              className="text-xs px-3 py-1 rounded-lg gradient-brand text-black font-semibold disabled:opacity-60">
              {saving ? "ذخیره..." : "ذخیره"}
            </button>
          </div>
        )}
      </div>
      {editing ? (
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={8}
          placeholder="یادداشت‌های مهم درباره این مشتری، تاریخچه تماس‌ها، نکات قراردادی..."
          className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
      ) : notes ? (
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{notes}</p>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm mb-3">هنوز یادداشتی ثبت نشده</p>
          <button onClick={() => { setDraft(""); setEditing(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-foreground text-sm mx-auto hover:bg-muted/80 transition-colors">
            <Plus className="w-3.5 h-3.5" />افزودن یادداشت
          </button>
        </div>
      )}
    </div>
  );
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("اطلاعات");
  const [clientData, setClientData] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [activeTicket, setActiveTicket] = useState<PortalTicketDetail | null>(null);

  useEffect(() => {
    setLoading(true);
    apiClient.get(`/clients/${id}`)
      .then((res) => setClientData(res.data.data))
      .catch(() => toast.error("خطا در بارگذاری اطلاعات مشتری"))
      .finally(() => setLoading(false));

    apiClient.get(`/activities?entityType=client&entityId=${id}`)
      .then((res) => setActivities(res.data.data ?? []))
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    if (activeTab === "پرتال" && !portalData && !isLoadingPortal) {
      setIsLoadingPortal(true);
      apiClient.get(`/clients/${id}/portal-users`)
        .then((res) => setPortalData(res.data.data))
        .catch(() => toast.error("خطا در بارگذاری اطلاعات پرتال"))
        .finally(() => setIsLoadingPortal(false));
    }
  }, [activeTab, id, portalData, isLoadingPortal]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const client = clientData;
  if (!client) return <div className="p-8 text-muted-foreground">مشتری یافت نشد</div>;

  const projects = client.projects ?? [];
  const invoices = client.invoices ?? [];

  const daysSinceInteraction = client.lastInteractionAt
    ? Math.floor((Date.now() - new Date(client.lastInteractionAt).getTime()) / 86400000)
    : null;

  const hasOverdueInvoice = invoices.some((i) => i.status === "overdue");
  const needsFollowUp = daysSinceInteraction !== null && daysSinceInteraction > 30;

  const handleOpenTicket = async (ticketId: string) => {
    try {
      const res = await apiClient.get(`/portal/tickets/${ticketId}/detail`);
      setActiveTicket(res.data.data);
    } catch {
      toast.error("خطا در بارگذاری تیکت");
    }
  };

  const handleToggleUser = async (userId: string) => {
    try {
      const res = await apiClient.patch(`/clients/${id}/portal-users`, { userId });
      const updated = res.data.data as PortalUser;
      setPortalData((prev) => prev ? {
        ...prev,
        portalUsers: prev.portalUsers.map((u) => u.id === userId ? updated : u),
      } : prev);
      toast.success(updated.isActive ? "کاربر فعال شد" : "کاربر غیرفعال شد");
    } catch {
      toast.error("خطا");
    }
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/clients" className="hover:text-foreground transition-colors">مشتریان</Link>
        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
        <span className="text-foreground font-medium">{client.companyName}</span>
      </motion.div>

      {/* Smart Alerts */}
      <AnimatePresence>
        {(hasOverdueInvoice || needsFollowUp) && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
            {hasOverdueInvoice && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                این مشتری فاکتور معوق دارد
              </div>
            )}
            {needsFollowUp && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                <Clock className="w-4 h-4 shrink-0" />
                آخرین تعامل {daysSinceInteraction} روز پیش بود — نیاز به پیگیری
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-card border border-border">
        <div className="h-24 bg-gradient-to-r from-violet-900/50 via-purple-900/30 to-amber-900/20" />
        <div className="px-6 pb-6">
          <div className="-mt-8 mb-4 flex items-end justify-between">
            <div className="w-16 h-16 rounded-2xl gradient-brand border-4 border-card flex items-center justify-center text-2xl font-extrabold text-black shadow-lg">
              {client.companyName.slice(0, 1)}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <ClientStatusBadge status={client.status} />
              {client.status === "vip" && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  <Star className="w-3 h-3 fill-current" />VIP
                </span>
              )}
            </div>
          </div>

          <h1 className="text-xl font-bold text-foreground">{client.companyName}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{client.contactName}</p>

          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-border">
            <div className="text-center">
              <p className="text-lg font-bold text-primary tabular-nums">{formatPrice(client.totalRevenue, true)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">کل درآمد</p>
            </div>
            <div className="text-center border-x border-border">
              <p className="text-lg font-bold text-foreground">{client.projectCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">پروژه</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{invoices.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">فاکتور</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted p-1 rounded-xl w-fit flex-wrap">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

          {activeTab === "اطلاعات" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
                <h3 className="font-semibold text-foreground">اطلاعات تماس</h3>
                {[
                  { icon: Phone, label: "تلفن", value: client.contactPhone },
                  { icon: Mail, label: "ایمیل", value: client.contactEmail ?? "—" },
                  { icon: Globe, label: "وبسایت", value: client.website ?? "—" },
                  { icon: MapPin, label: "آدرس", value: client.address ?? "—" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm text-foreground">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
                <h3 className="font-semibold text-foreground">اطلاعات کسب‌وکار</h3>
                {[
                  { label: "تاریخ ثبت", value: toJalali(client.createdAt) },
                  { label: "آخرین تعامل", value: client.lastInteractionAt ? toJalali(client.lastInteractionAt) : "—" },
                  { label: "سالگرد همکاری", value: client.anniversaryDate ? toJalali(client.anniversaryDate) : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium text-foreground">{value}</span>
                  </div>
                ))}
                {client.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">تگ‌ها</p>
                    <div className="flex flex-wrap gap-1">
                      {client.tags.map((t) => (
                        <span key={t} className="px-2 py-1 rounded-lg text-xs bg-muted text-foreground">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "پروژه‌ها" && (
            <div className="space-y-3">
              {projects.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">هیچ پروژه‌ای یافت نشد</div>
              ) : projects.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`}>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all">
                    <div className={cn("w-1 h-12 rounded-full bg-gradient-to-b", p.colorHash)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{p.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={cn("h-full bg-gradient-to-r", p.colorHash)} style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{p.progress}٪</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{toJalali(p.deadline)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {activeTab === "فاکتورها" && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["شماره", "مبلغ", "وضعیت", "تاریخ", "سررسید"].map((h) => (
                      <th key={h} className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 font-medium text-primary tabular-nums">{formatPrice(inv.total, true)}</td>
                      <td className="px-4 py-3"><InvoiceStatusBadge status={inv.status} /></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{toJalali(inv.issuedAt)}</td>
                      <td className={`px-4 py-3 text-xs ${inv.status === "overdue" ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                        {toJalali(inv.dueDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "تایم‌لاین" && (
            <div className="space-y-3 max-w-2xl">
              {activities.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">هیچ فعالیتی ثبت نشده</div>
              ) : activities.map((log, i) => (
                <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5" />
                    {i < activities.length - 1 && <div className="w-0.5 h-8 bg-border mt-1" />}
                  </div>
                  <div className="flex-1 pb-3">
                    <p className="text-sm text-foreground">{log.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo(log.createdAt)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === "یادداشت‌ها" && (
            <NotesTab clientId={id} initialNotes={client.notes ?? ""} />
          )}

          {activeTab === "پرتال" && (
            <div className="space-y-5">
              {isLoadingPortal ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : !portalData ? (
                <div className="py-12 text-center text-muted-foreground">خطا در بارگذاری</div>
              ) : (
                <>
                  {/* Portal users */}
                  <div className="p-5 rounded-2xl bg-card border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />کاربران پرتال ({portalData.portalUsers.length})
                      </h3>
                      <button onClick={() => setShowNewUserModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl gradient-brand text-black text-xs font-semibold gold-glow">
                        <Plus className="w-3.5 h-3.5" />کاربر جدید
                      </button>
                    </div>

                    {portalData.portalUsers.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground text-sm">
                        هنوز کاربر پرتالی ایجاد نشده
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {portalData.portalUsers.map((u) => (
                          <div key={u.id}
                            className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                              {u.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{u.name}</p>
                              <p className="text-xs text-muted-foreground">{u.phone ?? "—"} · {u.role === "admin" ? "مدیر" : "بیننده"}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {u.lastLoginAt && (
                                <span className="text-xs text-muted-foreground hidden md:block">
                                  آخرین ورود: {toJalali(u.lastLoginAt)}
                                </span>
                              )}
                              <span className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                                u.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"
                              )}>
                                {u.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                {u.isActive ? "فعال" : "غیرفعال"}
                              </span>
                              <button onClick={() => handleToggleUser(u.id)}
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs">
                                {u.isActive ? "غیرفعال" : "فعال‌سازی"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent tickets */}
                  <div className="p-5 rounded-2xl bg-card border border-border">
                    <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                      <Headphones className="w-4 h-4 text-violet-400" />تیکت‌های پشتیبانی ({portalData.tickets.length})
                    </h3>
                    {portalData.tickets.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">تیکتی وجود ندارد</p>
                    ) : (
                      <div className="space-y-2">
                        {portalData.tickets.map((t) => (
                          <div key={t.id}
                            onClick={() => handleOpenTicket(t.id)}
                            className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition-all cursor-pointer">
                            <div className={cn("w-2 h-2 rounded-full shrink-0",
                              t.priority === "high" ? "bg-red-400" : t.priority === "low" ? "bg-emerald-400" : "bg-amber-400"
                            )} />
                            <p className="text-sm text-foreground flex-1 truncate">{t.title}</p>
                            <span className="text-xs text-muted-foreground shrink-0">{t.replies.length} پاسخ</span>
                            <span className={cn("text-xs px-2 py-0.5 rounded-full shrink-0",
                              t.status === "open" ? "bg-blue-500/10 text-blue-400" :
                              t.status === "closed" ? "bg-emerald-500/10 text-emerald-400" :
                              "bg-amber-500/10 text-amber-400"
                            )}>
                              {t.status === "open" ? "باز" : t.status === "closed" ? "بسته" : "در بررسی"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent messages */}
                  <div className="p-5 rounded-2xl bg-card border border-border">
                    <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                      <MessageSquare className="w-4 h-4 text-teal-400" />پیام‌های اخیر ({portalData.messages.length})
                    </h3>
                    {portalData.messages.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">پیامی وجود ندارد</p>
                    ) : (
                      <div className="space-y-2">
                        {portalData.messages.slice(0, 5).map((m) => (
                          <div key={m.id} className="flex items-start gap-3 p-3 rounded-xl border border-border">
                            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                              m.authorType === "client" ? "bg-blue-500/20 text-blue-400" : "bg-teal-500/20 text-teal-400"
                            )}>
                              {m.authorName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground">{m.authorName}
                                <span className="font-normal text-muted-foreground"> · {toJalali(m.createdAt)}</span>
                              </p>
                              <p className="text-sm text-muted-foreground truncate">{m.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Portal User Modal */}
      <AnimatePresence>
        {showNewUserModal && (
          <NewPortalUserModal
            clientId={id}
            onClose={() => setShowNewUserModal(false)}
            onCreated={(u) => {
              setPortalData((prev) => prev ? { ...prev, portalUsers: [u, ...prev.portalUsers] } : prev);
            }}
          />
        )}
      </AnimatePresence>

      {/* Ticket Reply Drawer */}
      <AnimatePresence>
        {activeTicket && (
          <TicketReplyDrawer
            ticket={activeTicket}
            onClose={() => setActiveTicket(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
