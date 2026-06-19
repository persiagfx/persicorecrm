"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ClipboardList, Plus, X, List, Columns, Pencil, Calendar, User, Archive, ExternalLink } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import type { ContentPiece } from "@/types";
import { RoleGuard } from "@/components/common/RoleGuard";
import { useAuth } from "@/lib/auth/context";

const STATUS_COLS = [
  { id: "idea",      label: "ایده",              color: "bg-gray-500/10 text-gray-500 border-gray-400/30",      cardBg: "bg-gray-500/5 border-r-2 border-r-gray-400",     dropBg: "bg-gray-500/10 border-gray-400/50" },
  { id: "writing",   label: "در حال نوشتن",     color: "bg-blue-500/10 text-blue-500 border-blue-400/30",      cardBg: "bg-blue-500/5 border-r-2 border-r-blue-400",     dropBg: "bg-blue-500/10 border-blue-400/50" },
  { id: "review",    label: "بررسی",             color: "bg-yellow-500/10 text-yellow-600 border-yellow-400/30", cardBg: "bg-yellow-500/5 border-r-2 border-r-yellow-400", dropBg: "bg-yellow-500/10 border-yellow-400/50" },
  { id: "scheduled", label: "زمان‌بندی‌شده",    color: "bg-purple-500/10 text-purple-500 border-purple-400/30", cardBg: "bg-purple-500/5 border-r-2 border-r-purple-400", dropBg: "bg-purple-500/10 border-purple-400/50" },
  { id: "published", label: "منتشرشده",         color: "bg-green-500/10 text-green-500 border-green-400/30",   cardBg: "bg-green-500/5 border-r-2 border-r-green-400",   dropBg: "bg-green-500/10 border-green-400/50" },
] as const;

type StatusId = typeof STATUS_COLS[number]["id"];
const STATUS_MAP = Object.fromEntries(STATUS_COLS.map(c => [c.id, c])) as Record<StatusId, typeof STATUS_COLS[number]>;

const TYPE_LABELS: Record<string, string> = {
  blog: "بلاگ", social: "شبکه اجتماعی", email: "ایمیل",
  video: "ویدیو", infographic: "اینفوگرافیک", other: "سایر",
};
const CHANNEL_LABELS: Record<string, string> = {
  google: "گوگل", instagram: "اینستاگرام", linkedin: "لینکدین",
  email: "ایمیل", sms: "پیامک", content: "وب", other: "سایر",
};

export default function ContentCalendarPage() {
  const { user } = useAuth();
  const [pieces, setPieces] = useState<ContentPiece[]>([]);
  const [campaigns, setCampaigns] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    apiClient.get("/content-pieces?perPage=200")
      .then(res => setPieces(res.data?.data ?? []))
      .catch(() => toast.error("خطا در دریافت محتواها"));
    apiClient.get("/campaigns?perPage=100")
      .then(res => setCampaigns(res.data?.data ?? []))
      .catch((err) => console.error(err));
  }, []);
  const [view, setView] = useState<"kanban" | "list">("kanban");

  // Card drag state
  const dragCardId = useRef<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<StatusId | null>(null);

  // Card detail modal
  const [viewingPiece, setViewingPiece] = useState<ContentPiece | null>(null);
  const [editBody, setEditBody] = useState("");
  const [bodyChanged, setBodyChanged] = useState(false);

  // Create/edit metadata form
  const [showForm, setShowForm] = useState(false);
  const [editingPiece, setEditingPiece] = useState<ContentPiece | null>(null);
  const [form, setForm] = useState({
    title: "", type: "blog" as ContentPiece["type"], channel: "content" as ContentPiece["channel"],
    status: "idea" as ContentPiece["status"], assigneeId: user?.id ?? "u1",
    scheduledAt: "", campaignId: "", notes: "",
  });

  // ── Card drag handlers ────────────────────────────────────────────
  const handleCardDragStart = (id: string) => { dragCardId.current = id; };
  const handleCardDragEnd = () => { dragCardId.current = null; setDragOverCol(null); };

  const handleColDragOver = (e: React.DragEvent, colId: StatusId) => {
    e.preventDefault();
    setDragOverCol(colId);
  };
  const handleColDragLeave = () => setDragOverCol(null);

  const handleColDrop = async (colId: StatusId) => {
    if (!dragCardId.current) return;
    const id = dragCardId.current;
    setPieces(prev => prev.map(p => p.id === id ? { ...p, status: colId } : p));
    dragCardId.current = null;
    setDragOverCol(null);
    try { await apiClient.patch(`/content-pieces/${id}`, { status: colId }); } catch { /* optimistic */ }
  };

  // ── Card detail modal ─────────────────────────────────────────────
  const openCard = (p: ContentPiece) => {
    setViewingPiece(p);
    setEditBody(p.body ?? "");
    setBodyChanged(false);
  };

  const saveBody = async () => {
    if (!viewingPiece) return;
    try {
      await apiClient.patch(`/content-pieces/${viewingPiece.id}`, { body: editBody });
      setPieces(prev => prev.map(p => p.id === viewingPiece.id ? { ...p, body: editBody } : p));
      setViewingPiece(prev => prev ? { ...prev, body: editBody } : prev);
      setBodyChanged(false);
      toast.success("ذخیره شد");
    } catch { toast.error("خطا در ذخیره"); }
  };

  const sendToArchive = async (p: ContentPiece) => {
    try {
      await apiClient.patch(`/content-pieces/${p.id}`, { status: "archived", archivedAt: new Date().toISOString() });
    } catch { /* optimistic */ }
    setPieces(prev => prev.map(x => x.id === p.id
      ? { ...x, status: "archived" as ContentPiece["status"], archivedAt: new Date().toISOString() }
      : x));
    setViewingPiece(null);
  };

  // ── Metadata form ─────────────────────────────────────────────────
  const openEdit = (p: ContentPiece, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPiece(p);
    setForm({
      title: p.title, type: p.type, channel: p.channel,
      status: p.status as ContentPiece["status"], assigneeId: p.assigneeId,
      scheduledAt: p.scheduledAt ?? "", campaignId: p.campaignId ?? "", notes: p.notes ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.title) return;
    try {
      if (editingPiece) {
        const res = await apiClient.patch(`/content-pieces/${editingPiece.id}`, {
          ...form, scheduledAt: form.scheduledAt || undefined,
          campaignId: form.campaignId || undefined, notes: form.notes || undefined,
        });
        const updated = res.data?.data ?? res.data;
        setPieces(prev => prev.map(p => p.id === editingPiece.id ? { ...p, ...updated } : p));
      } else {
        const res = await apiClient.post("/content-pieces", {
          ...form, scheduledAt: form.scheduledAt || undefined,
          campaignId: form.campaignId || undefined, notes: form.notes || undefined,
        });
        setPieces(prev => [res.data?.data ?? res.data, ...prev]);
      }
      toast.success("ذخیره شد");
    } catch { toast.error("خطا در ذخیره"); }
    setShowForm(false);
    setEditingPiece(null);
    setForm({ title: "", type: "blog", channel: "content", status: "idea", assigneeId: user?.id ?? "", scheduledAt: "", campaignId: "", notes: "" });
  };

  const getUserName = (uid: string) => uid;
  const getCampaignName = (cid: string) => campaigns.find(c => c.id === cid)?.title ?? cid;
  const visiblePieces = pieces.filter(p => p.status !== "archived");

  return (
    <RoleGuard roles={["admin", "marketing"]}>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">تقویم محتوا</h1>
              <p className="text-sm text-muted-foreground">{visiblePieces.length} محتوا در جریان</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button onClick={() => setView("kanban")} className={`px-3 py-1.5 text-sm transition-colors ${view === "kanban" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                <Columns className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setView("list")} className={`px-3 py-1.5 text-sm transition-colors ${view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
            <button onClick={() => { setEditingPiece(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
              <Plus className="w-4 h-4" />محتوای جدید
            </button>
          </div>
        </motion.div>

        {/* Kanban View */}
        {view === "kanban" && (
          <div className="flex gap-4 overflow-x-auto pb-4" dir="ltr">
            {STATUS_COLS.map(col => {
              const colPieces = visiblePieces.filter(p => p.status === col.id);
              const isOver = dragOverCol === col.id;
              return (
                <div key={col.id} className="flex-shrink-0 w-60" dir="rtl">
                  {/* Column header — static, not draggable */}
                  <div className={`flex items-center justify-between px-3 py-2 rounded-lg border mb-3 ${col.color}`}>
                    <span className="text-xs font-semibold">{col.label}</span>
                    <span className="text-xs opacity-70">{colPieces.length}</span>
                  </div>

                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => handleColDragOver(e, col.id)}
                    onDragLeave={handleColDragLeave}
                    onDrop={() => handleColDrop(col.id)}
                    className={`space-y-2 min-h-20 rounded-xl transition-all p-1 border-2 border-dashed ${isOver ? `border-current ${col.dropBg}` : "border-transparent"}`}
                  >
                    {colPieces.map((p, i) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        draggable
                        onDragStart={() => handleCardDragStart(p.id)}
                        onDragEnd={handleCardDragEnd}
                        onClick={() => openCard(p)}
                        className={`rounded-xl border p-3 transition-all hover:shadow-md cursor-grab active:cursor-grabbing active:opacity-60 group ${col.cardBg} border-border`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-2">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[10px] bg-background/60 border border-border px-1.5 py-0.5 rounded-md font-medium">{TYPE_LABELS[p.type]}</span>
                            <span className="text-[10px] bg-background/60 border border-border px-1.5 py-0.5 rounded-md">{CHANNEL_LABELS[p.channel]}</span>
                          </div>
                          <button
                            onClick={(e) => openEdit(p, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-background/60 transition-all shrink-0"
                          >
                            <Pencil className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                        <p className="text-sm font-semibold leading-tight mb-2">{p.title}</p>
                        {p.body && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2 opacity-70">{p.body.replace(/^#+\s*/gm, "")}</p>
                        )}
                        {!p.body && p.notes && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{p.notes}</p>
                        )}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                            <User className="w-3 h-3 shrink-0" />
                            <span className="truncate">{getUserName(p.assigneeId)}</span>
                          </div>
                          {p.scheduledAt && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                              <Calendar className="w-3 h-3" />
                              <span dir="ltr">{new Date(p.scheduledAt).toLocaleDateString("fa-IR")}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {colPieces.length === 0 && !isOver && (
                      <div className="h-20 rounded-lg flex items-center justify-center text-xs text-muted-foreground/50">
                        کارتی نیست
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {view === "list" && (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["عنوان", "نوع", "کانال", "وضعیت", "مسئول", "تاریخ انتشار"].map(h => (
                    <th key={h} className="text-right text-xs font-medium text-muted-foreground px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visiblePieces.map((p, i) => {
                  const col = STATUS_COLS.find(s => s.id === p.status);
                  return (
                    <tr key={p.id} onClick={() => openCard(p)}
                      className={`border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                      <td className="px-4 py-3 text-sm font-medium">{p.title}</td>
                      <td className="px-4 py-3"><span className="text-xs bg-muted px-2 py-0.5 rounded">{TYPE_LABELS[p.type]}</span></td>
                      <td className="px-4 py-3"><span className="text-xs bg-muted px-2 py-0.5 rounded">{CHANNEL_LABELS[p.channel]}</span></td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded border ${col?.color}`}>{col?.label}</span></td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{getUserName(p.assigneeId)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {p.scheduledAt ? new Date(p.scheduledAt).toLocaleDateString("fa-IR") : p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("fa-IR") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Card Detail Modal */}
        <AnimatePresence>
          {viewingPiece && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setViewingPiece(null)}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }} transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-border shrink-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_MAP[viewingPiece.status as StatusId]?.color ?? "bg-muted"}`}>
                        {STATUS_MAP[viewingPiece.status as StatusId]?.label ?? viewingPiece.status}
                      </span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{TYPE_LABELS[viewingPiece.type]}</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{CHANNEL_LABELS[viewingPiece.channel]}</span>
                    </div>
                    <h2 className="font-bold text-lg leading-tight">{viewingPiece.title}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {getUserName(viewingPiece.assigneeId)}
                      {viewingPiece.campaignId && ` · ${getCampaignName(viewingPiece.campaignId)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={(e) => { openEdit(viewingPiece, e); setViewingPiece(null); }}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="ویرایش اطلاعات">
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {viewingPiece.url && (
                      <a href={viewingPiece.url} target="_blank" rel="noreferrer"
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors" onClick={(e) => e.stopPropagation()}>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </a>
                    )}
                    <button onClick={() => setViewingPiece(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Body editor */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                  {viewingPiece.notes && (
                    <div className="text-sm text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                      <span className="font-medium text-foreground">یادداشت: </span>{viewingPiece.notes}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-2">متن محتوا</label>
                    <textarea value={editBody} onChange={(e) => { setEditBody(e.target.value); setBodyChanged(true); }}
                      className="input-field w-full resize-none text-sm leading-relaxed font-mono" rows={16}
                      placeholder="متن کامل محتوا را اینجا بنویسید..." dir="rtl" />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border shrink-0">
                  {viewingPiece.status === "published" ? (
                    <button onClick={() => sendToArchive(viewingPiece)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground">
                      <Archive className="w-4 h-4" />ارسال به آرشیو
                    </button>
                  ) : <div />}
                  <div className="flex items-center gap-2">
                    {bodyChanged && <span className="text-xs text-amber-500">تغییرات ذخیره نشده</span>}
                    <button onClick={saveBody} disabled={!bodyChanged}
                      className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      ذخیره
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create/Edit Metadata Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => { setShowForm(false); setEditingPiece(null); }}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }} transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg">{editingPiece ? "ویرایش محتوا" : "محتوای جدید"}</h2>
                  <button onClick={() => { setShowForm(false); setEditingPiece(null); }} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">عنوان *</label>
                    <input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} className="input-field w-full" placeholder="عنوان محتوا را وارد کنید" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">نوع</label>
                    <select value={form.type} onChange={(e) => setForm(p => ({ ...p, type: e.target.value as ContentPiece["type"] }))} className="input-field w-full">
                      {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">کانال</label>
                    <select value={form.channel} onChange={(e) => setForm(p => ({ ...p, channel: e.target.value as ContentPiece["channel"] }))} className="input-field w-full">
                      {Object.entries(CHANNEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">وضعیت</label>
                    <select value={form.status} onChange={(e) => setForm(p => ({ ...p, status: e.target.value as ContentPiece["status"] }))} className="input-field w-full">
                      {STATUS_COLS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">تاریخ انتشار</label>
                    <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm(p => ({ ...p, scheduledAt: e.target.value }))} className="input-field w-full" dir="ltr" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">یادداشت</label>
                    <textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} className="input-field w-full resize-none" rows={2} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleSubmit} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">ذخیره</button>
                  <button onClick={() => { setShowForm(false); setEditingPiece(null); }} className="flex-1 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">انصراف</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </RoleGuard>
  );
}
