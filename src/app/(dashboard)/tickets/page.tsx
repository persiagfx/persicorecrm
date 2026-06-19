"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, TicketCheck, X, AlertTriangle, Clock, CheckCircle2, Archive } from "lucide-react";
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, DragOverlay, closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PriorityBadge } from "@/components/common/StatusBadge";
import { apiClient } from "@/lib/api/client";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Ticket, TicketStatus } from "@/types";


const COLUMNS: { id: TicketStatus; title: string; color: string; icon: typeof TicketCheck }[] = [
  { id: "open", title: "باز", color: "#3b82f6", icon: AlertTriangle },
  { id: "in_progress", title: "در حال بررسی", color: "#f59e0b", icon: Clock },
  { id: "resolved", title: "حل شد", color: "#10b981", icon: CheckCircle2 },
  { id: "closed", title: "بسته شد", color: "#64748b", icon: Archive },
];

const priorityBorderColor: Record<string, string> = {
  low: "border-slate-500/30",
  medium: "border-blue-500/30",
  high: "border-orange-500/30",
  urgent: "border-red-500/50 shadow-red-500/10 shadow-sm",
};

// ─── Ticket Card ──────────────────────────────────────────────────────
function TicketCard({ ticket, isDragging = false, onClick, users }: { ticket: Ticket; isDragging?: boolean; onClick?: () => void; users?: { id: string; name: string }[] }) {
  const assignee = users?.find((u) => u.id === ticket.assigneeId);
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-xl bg-card border cursor-pointer transition-all hover:border-primary/30",
        priorityBorderColor[ticket.priority],
        isDragging && "rotate-1 scale-105 shadow-xl border-primary opacity-90"
      )}
    >
      <p className="text-sm font-medium text-foreground mb-2 leading-snug">{ticket.title}</p>
      <div className="flex items-center justify-between">
        <PriorityBadge priority={ticket.priority} />
        <div className="flex items-center gap-1.5">
          {assignee && (
            <div title={assignee.name} className="w-5 h-5 rounded-full gradient-brand flex items-center justify-center text-[9px] font-bold text-black">
              {assignee.name.slice(0, 1)}
            </div>
          )}
          <span className="text-[10px] text-muted-foreground">{timeAgo(ticket.createdAt)}</span>
        </div>
      </div>
      {ticket.tags.length > 0 && (
        <div className="flex gap-1 mt-2">
          {ticket.tags.map((t) => (
            <span key={t} className="px-1.5 py-0.5 rounded-md text-[10px] bg-muted text-muted-foreground">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sortable Ticket Card ──────────────────────────────────────────────
function SortableTicketCard({ ticket, onClick, users }: { ticket: Ticket; onClick?: () => void; users?: { id: string; name: string }[] }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ticket.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TicketCard ticket={ticket} isDragging={isDragging} onClick={onClick} users={users} />
    </div>
  );
}

// ─── Droppable Column ──────────────────────────────────────────────────
function DroppableZone({ columnId, children }: { columnId: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "space-y-2 p-2 rounded-xl bg-muted/30 border border-dashed border-border/50 min-h-[120px] transition-colors",
        isOver && "border-primary/60 bg-primary/5"
      )}
    >
      {children}
    </div>
  );
}

// ─── New Ticket Modal ─────────────────────────────────────────────────
function NewTicketModal({ onClose, onAdd, users }: { onClose: () => void; onAdd: (t: Ticket) => void; users: { id: string; name: string }[] }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState<Ticket["priority"]>("medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await apiClient.post("/tickets", {
        title: title.trim(),
        description: desc.trim() || undefined,
        priority,
        assigneeId: assigneeId || undefined,
      });
      onAdd(res.data.data);
      onClose();
    } catch {
      const newTicket: Ticket = {
        id: `tk${Date.now()}`,
        title: title.trim(),
        description: desc.trim() || undefined,
        status: "open",
        priority,
        reporterId: "",
        assigneeId: assigneeId || undefined,
        tags: [],
        comments: [],
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onAdd(newTicket);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-bold text-foreground">تیکت جدید</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">عنوان *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="مشکل یا درخواست را توضیح دهید..."
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">توضیحات</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
              placeholder="جزئیات بیشتر..."
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">اولویت</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="low">کم</option>
                <option value="medium">متوسط</option>
                <option value="high">زیاد</option>
                <option value="urgent">اورژانسی</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">مسئول</label>
              <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="">واگذار نشده</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm hover:bg-muted/80 transition-colors">انصراف</button>
            <button onClick={handleSubmit} disabled={!title.trim()}
              className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow disabled:opacity-40 disabled:cursor-not-allowed">
              ثبت تیکت
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────
export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    apiClient.get("/tickets").then((res) => setTickets(res.data.data ?? [])).catch(console.error);
    apiClient.get("/users").then((res) => setUsers(res.data.data ?? [])).catch(console.error);
  }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const draggingTicket = tickets.find((t) => t.id === activeId);

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragOver = useCallback((e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    setTickets((prev) => {
      const activeTicket = prev.find((t) => t.id === activeId);
      if (!activeTicket) return prev;

      // Over a column
      const overCol = COLUMNS.find((c) => c.id === overId);
      if (overCol) {
        if (activeTicket.status === overCol.id) return prev;
        return prev.map((t) => t.id === activeId ? { ...t, status: overCol.id } : t);
      }

      // Over another card
      const overTicket = prev.find((t) => t.id === overId);
      if (overTicket && activeTicket.status !== overTicket.status) {
        return prev.map((t) => t.id === activeId ? { ...t, status: overTicket.status } : t);
      }

      return prev;
    });
  }, []);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    setTickets((prev) => {
      const overIsColumn = COLUMNS.some((c) => c.id === overId);
      if (overIsColumn) return prev;
      const ai = prev.findIndex((t) => t.id === activeId);
      const oi = prev.findIndex((t) => t.id === overId);
      if (ai !== -1 && oi !== -1) return arrayMove(prev, ai, oi);
      return prev;
    });
  }, []);

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TicketCheck className="w-6 h-6 text-primary" />تیکت‌های داخلی
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{tickets.length} تیکت</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow">
          <Plus className="w-4 h-4" />تیکت جدید
        </motion.button>
      </motion.div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3">
        {COLUMNS.map((col) => {
          const count = tickets.filter((t) => t.status === col.id).length;
          const Icon = col.icon;
          return (
            <div key={col.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <Icon className="w-4 h-4 shrink-0" style={{ color: col.color }} />
              <div>
                <p className="text-xs text-muted-foreground">{col.title}</p>
                <p className="font-bold text-foreground text-lg tabular-nums">{count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Kanban */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colTickets = tickets.filter((t) => t.status === col.id);
            const Icon = col.icon;
            return (
              <div key={col.id} className="w-72 shrink-0 flex flex-col">
                <div className="flex items-center gap-2 px-3 py-2.5 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                  <span className="text-sm font-semibold text-foreground">{col.title}</span>
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-muted text-muted-foreground">{colTickets.length}</span>
                </div>
                <DroppableZone columnId={col.id}>
                  <SortableContext items={colTickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    {colTickets.map((ticket) => (
                      <SortableTicketCard
                        key={ticket.id}
                        ticket={ticket}
                        onClick={() => setActiveTicket(ticket)}
                        users={users}
                      />
                    ))}
                  </SortableContext>
                  <button
                    onClick={() => setShowNewModal(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Plus className="w-3 h-3" />افزودن
                  </button>
                </DroppableZone>
              </div>
            );
          })}
        </div>

        <DragOverlay dropAnimation={{ duration: 200 }}>
          {draggingTicket && <TicketCard ticket={draggingTicket} isDragging users={users} />}
        </DragOverlay>
      </DndContext>

      {/* Ticket Detail Drawer */}
      <AnimatePresence>
        {activeTicket && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActiveTicket(null)} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed top-0 left-0 h-full w-full max-w-md z-50 bg-card border-e border-border shadow-modal overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-lg font-bold text-foreground leading-snug pe-4">{activeTicket.title}</h2>
                  <button onClick={() => setActiveTicket(null)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground shrink-0"><X className="w-4 h-4" /></button>
                </div>
                {activeTicket.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 p-3 rounded-xl bg-muted/50">{activeTicket.description}</p>
                )}
                <div className="flex gap-2 mb-5">
                  <PriorityBadge priority={activeTicket.priority} />
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[11px] font-medium",
                    activeTicket.status === "open" ? "bg-blue-500/10 text-blue-400" :
                    activeTicket.status === "in_progress" ? "bg-amber-500/10 text-amber-400" :
                    activeTicket.status === "resolved" ? "bg-emerald-500/10 text-emerald-400" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {COLUMNS.find((c) => c.id === activeTicket.status)?.title}
                  </span>
                </div>
                <div className="space-y-2 text-sm mb-6">
                  {[
                    { label: "گزارش‌دهنده", value: users.find((u) => u.id === activeTicket.reporterId)?.name ?? "—" },
                    { label: "مسئول", value: activeTicket.assigneeId ? users.find((u) => u.id === activeTicket.assigneeId)?.name ?? "—" : "واگذار نشده" },
                    { label: "ایجاد شده", value: timeAgo(activeTicket.createdAt) },
                    ...(activeTicket.resolvedAt ? [{ label: "حل شده", value: timeAgo(activeTicket.resolvedAt) }] : []),
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Change status */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">تغییر وضعیت</label>
                  <div className="grid grid-cols-2 gap-2">
                    {COLUMNS.map((col) => (
                      <button key={col.id}
                        onClick={() => {
                          setTickets((prev) => prev.map((t) => t.id === activeTicket.id ? { ...t, status: col.id } : t));
                          setActiveTicket((prev) => prev ? { ...prev, status: col.id } : null);
                        }}
                        className={cn(
                          "py-2 rounded-xl text-xs font-medium transition-all border",
                          activeTicket.status === col.id
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-border bg-muted text-muted-foreground hover:text-foreground"
                        )}>
                        {col.title}
                      </button>
                    ))}
                  </div>
                </div>

                {activeTicket.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {activeTicket.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-md text-xs bg-muted text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New Ticket Modal */}
      <AnimatePresence>
        {showNewModal && (
          <NewTicketModal
            onClose={() => setShowNewModal(false)}
            onAdd={(t) => setTickets((prev) => [t, ...prev])}
            users={users}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
