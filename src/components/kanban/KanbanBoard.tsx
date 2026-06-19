"use client";

import { useState, useCallback } from "react";
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, DragOverlay, closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "motion/react";
import { Plus, MoreHorizontal, GripVertical } from "lucide-react";
import type { Lead, LeadColumn } from "@/types";
import { cn, formatPrice } from "@/lib/utils";
import { LeadStatusBadge } from "@/components/common/StatusBadge";

// ─── Lead Card ────────────────────────────────────────────────────────
function LeadCard({ lead, isDragging = false, onClick }: { lead: Lead; isDragging?: boolean; onClick?: () => void }) {
  const assignee = (lead as Lead & { assignee?: { id: string; name: string } }).assignee;
  return (
    <motion.div
      layout
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border bg-card cursor-pointer select-none",
        "hover:border-primary/30 hover:shadow-card-hover transition-all duration-150",
        isDragging ? "border-primary shadow-gold-glow rotate-1 scale-105 opacity-90" : "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-foreground truncate">{lead.companyName}</h4>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{lead.contactName}</p>
        </div>
        {assignee && (
          <div className="w-6 h-6 rounded-full gradient-brand flex items-center justify-center text-[10px] font-bold text-black shrink-0">
            {assignee.name.slice(0, 1)}
          </div>
        )}
      </div>

      {/* Tags */}
      {lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {lead.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 rounded-md text-[10px] bg-muted text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-primary tabular-nums">
          {formatPrice(lead.estimatedValue, true)}
        </span>
        <div className="flex items-center gap-1">
          <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full"
              style={{ width: `${lead.conversionProbability}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{lead.conversionProbability}٪</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Sortable Lead Card ────────────────────────────────────────────────
function SortableLeadCard({ lead, onClick }: { lead: Lead; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="relative group">
        <button
          {...listeners}
          className="absolute top-2 left-2 p-1 rounded opacity-0 group-hover:opacity-60 hover:opacity-100 text-muted-foreground cursor-grab active:cursor-grabbing transition-opacity z-10"
        >
          <GripVertical className="w-3 h-3" />
        </button>
        <LeadCard lead={lead} isDragging={isDragging} onClick={onClick} />
      </div>
    </div>
  );
}

// ─── Droppable Column ──────────────────────────────────────────────────
function DroppableColumn({ columnId, children, className }: { columnId: string; children: React.ReactNode; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 space-y-2 min-h-[200px] p-2 rounded-xl bg-muted/30 border border-border/50 border-dashed transition-colors",
        isOver && "border-primary/60 bg-primary/5",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Column ───────────────────────────────────────────────────────────
function KanbanColumn({
  column, leads, onAddLead, onLeadClick,
}: {
  column: LeadColumn;
  leads: Lead[];
  onAddLead?: (columnId: string) => void;
  onLeadClick?: (lead: Lead) => void;
}) {
  const totalValue = leads.reduce((s, l) => s + l.estimatedValue, 0);
  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-2.5 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: column.color }} />
          <span className="text-sm font-semibold text-foreground">{column.title}</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-muted text-muted-foreground">
            {leads.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">{formatPrice(totalValue, true)}</span>
          <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Drop Zone */}
      <DroppableColumn columnId={column.id}>
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {leads.map((lead) => (
              <SortableLeadCard key={lead.id} lead={lead} onClick={() => onLeadClick?.(lead)} />
            ))}
          </AnimatePresence>
        </SortableContext>

        {/* Add Card */}
        <button
          onClick={() => onAddLead?.(column.id)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          افزودن Lead
        </button>
      </DroppableColumn>
    </div>
  );
}

// ─── Main Board ────────────────────────────────────────────────────────
interface KanbanBoardProps {
  columns: LeadColumn[];
  leads: Lead[];
  onLeadsChange?: (leads: Lead[]) => void;
  onLeadClick?: (lead: Lead) => void;
  onColumnChange?: (leadId: string, newColumnId: string) => void; // ← جدید
}

export function KanbanBoard({ columns, leads: initialLeads, onLeadsChange, onLeadClick, onColumnChange }: KanbanBoardProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeLead = leads.find((l) => l.id === activeId);

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragOver = useCallback((e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    setLeads((prev) => {
      const activeLead = prev.find((l) => l.id === activeId);
      if (!activeLead) return prev;

      // Dragging over a column directly
      const overColumn = columns.find((c) => c.id === overId);
      if (overColumn) {
        if (activeLead.columnId === overColumn.id) return prev;
        return prev.map((l) => l.id === activeId ? { ...l, columnId: overColumn.id } : l);
      }

      // Dragging over another card — move to that card's column
      const overLead = prev.find((l) => l.id === overId);
      if (overLead && activeLead.columnId !== overLead.columnId) {
        return prev.map((l) => l.id === activeId ? { ...l, columnId: overLead.columnId } : l);
      }

      return prev;
    });
  }, [columns]);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    setLeads((prev) => {
      const activeLead = prev.find((l) => l.id === activeId);
      if (!activeLead) return prev;

      const overIsColumn = columns.some((c) => c.id === overId);
      if (overIsColumn) {
        // ذخیره تغییر ستون در API
        const targetCol = columns.find((c) => c.id === overId);
        if (targetCol && activeLead.columnId !== overId) {
          onColumnChange?.(activeId, overId);
        }
        return prev;
      }

      // Reorder within same column
      const activeIdx = prev.findIndex((l) => l.id === activeId);
      const overIdx = prev.findIndex((l) => l.id === overId);
      if (activeIdx !== -1 && overIdx !== -1) {
        const overLead = prev[overIdx];
        // اگر ستون عوض شده، callback بزن
        if (activeLead.columnId !== overLead.columnId) {
          onColumnChange?.(activeId, overLead.columnId);
        }
        const updated = arrayMove(prev, activeIdx, overIdx);
        onLeadsChange?.(updated);
        return updated;
      }
      return prev;
    });
  }, [columns, onLeadsChange, onColumnChange]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4" dir="rtl">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            leads={leads.filter((l) => l.columnId === col.id)}
            onLeadClick={onLeadClick}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 200 }}>
        {activeLead && <LeadCard lead={activeLead} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
