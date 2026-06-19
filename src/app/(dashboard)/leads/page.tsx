"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Search, Filter, Upload, Zap, Download } from "lucide-react";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { LeadDetailDrawer } from "@/components/leads/LeadDetailDrawer";
import { CreateLeadModal } from "@/components/leads/CreateLeadModal";
import { WinLossModal } from "@/components/leads/WinLossModal";
import { apiClient } from "@/lib/api/client";
import type { Lead, LeadColumn } from "@/types";
import { formatPrice, cn } from "@/lib/utils";
import { LeadStatusBadge } from "@/components/common/StatusBadge";
import { timeAgo } from "@/lib/utils";
import { toast } from "sonner";

const LEAD_COLUMNS: LeadColumn[] = [
  { id: "col-new", title: "جدید", order: 0, color: "#3b82f6" },
  { id: "col-contacted", title: "تماس گرفته شد", order: 1, color: "#6366f1" },
  { id: "col-meeting", title: "جلسه", order: 2, color: "#8b5cf6" },
  { id: "col-proposal", title: "پروپوزال ارسال شد", order: 3, color: "#a855f7" },
  { id: "col-negotiation", title: "مذاکره", order: 4, color: "#f59e0b" },
  { id: "col-won", title: "قرارداد بسته شد", order: 5, color: "#10b981" },
];

interface ApiLead extends Omit<Lead, "assigneeId"> {
  assignee?: { id: string; name: string; avatar?: string; color?: string };
  assigneeId?: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<ApiLead[]>([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [winLossTarget, setWinLossTarget] = useState<{ leadId: string; outcome: "won" | "lost" } | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "leads");
      const res = await apiClient.post("/import", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const { created, errors } = res.data;
      toast.success(`${created} لید وارد شد${errors.length > 0 ? ` (${errors.length} خطا)` : ""}`);
      // reload leads
      setLoading(true);
      apiClient.get("/leads").then((r) => setLeads(r.data.data ?? [])).finally(() => setLoading(false));
    } catch { toast.error("خطا در وارد کردن فایل"); }
    finally { setImporting(false); e.target.value = ""; }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem("crm-token") ?? "";
      const res = await fetch("/api/export?type=leads", { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "leads-export.xlsx"; a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
    finally { setExporting(false); }
  };

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    apiClient.get(`/leads?${params}`)
      .then((res) => setLeads(res.data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  const filtered = useMemo(() => leads, [leads]);

  const totalValue = leads.reduce((s, l) => s + (l.estimatedValue ?? 0), 0);
  const wonLeads = leads.filter((l) => l.status === "won").length;
  const convRate = leads.length > 0 ? Math.round((wonLeads / leads.length) * 100) : 0;

  const leadsForKanban = filtered.map((l) => ({
    ...l,
    assigneeId: l.assignee?.id ?? l.assigneeId ?? "",
  })) as Lead[];

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            مدیریت سرنخ‌ها
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {leads.length} سرنخ در {LEAD_COLUMNS.length} مرحله
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow"
        >
          <Plus className="w-4 h-4" />
          Lead جدید
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          { label: "کل Leadها", value: leads.length.toString(), icon: "📋" },
          { label: "ارزش کل", value: formatPrice(totalValue, true), icon: "💰" },
          { label: "نرخ تبدیل", value: `${convRate}٪`, icon: "🎯" },
          { label: "در مذاکره", value: leads.filter((l) => l.status === "negotiation").length.toString(), icon: "🤝" },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl bg-card border border-border flex items-center gap-3">
            <span className="text-2xl">{stat.icon}</span>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="font-semibold text-foreground tabular-nums">{stat.value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در Leadها..."
            className="w-full pe-10 ps-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-card border border-border text-sm text-muted-foreground hover:text-foreground hover:border-border-strong transition-colors">
          <Filter className="w-4 h-4" />
          فیلتر
        </button>
        <label className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl bg-card border border-border text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer", importing && "opacity-50 cursor-wait")}>
          <Upload className="w-4 h-4" />{importing ? "وارد کردن..." : "ایمپورت Excel"}
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} disabled={importing} />
        </label>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-card border border-border text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />{exporting ? "..." : "خروجی Excel"}
        </button>
        <div className="flex items-center bg-muted rounded-xl p-1 gap-1 ms-auto">
          {["kanban", "table"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v as typeof view)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "kanban" ? "کانبان" : "جدول"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">در حال بارگذاری...</div>
      ) : (
        <AnimatePresence mode="wait">
          {view === "kanban" ? (
            <motion.div key="kanban" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <KanbanBoard
                columns={LEAD_COLUMNS}
                leads={leadsForKanban}
                onLeadClick={(lead) => setActiveLead(lead)}
                onColumnChange={async (leadId, newColumnId) => {
                  if (newColumnId === "col-won") {
                    setWinLossTarget({ leadId, outcome: "won" });
                    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, columnId: newColumnId, status: "won" as Lead["status"] } : l));
                    return;
                  }
                  try {
                    await apiClient.put(`/leads/${leadId}`, { columnId: newColumnId, status: newColumnId });
                    setLeads((prev) => prev.map((l) =>
                      l.id === leadId ? { ...l, columnId: newColumnId, status: newColumnId as Lead["status"] } : l
                    ));
                  } catch {
                    // silent
                  }
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["شرکت", "مسئول تماس", "مبلغ تخمینی", "احتمال", "وضعیت", "تخصیص به", "آخرین بروز"].map((h) => (
                      <th key={h} className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => setActiveLead({ ...lead, assigneeId: lead.assignee?.id ?? lead.assigneeId ?? "" } as Lead)}
                      className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{lead.companyName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{lead.contactName}</td>
                      <td className="px-4 py-3 text-primary tabular-nums">{formatPrice(lead.estimatedValue, true)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${lead.conversionProbability}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{lead.conversionProbability}٪</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><LeadStatusBadge status={lead.status} /></td>
                      <td className="px-4 py-3">
                        {lead.assignee && (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full gradient-brand flex items-center justify-center text-[10px] font-bold text-black">
                              {lead.assignee.name.slice(0, 1)}
                            </div>
                            <span className="text-xs text-muted-foreground">{lead.assignee.name.split(" ")[0]}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{timeAgo(lead.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <LeadDetailDrawer
        lead={activeLead}
        onClose={() => setActiveLead(null)}
        onUpdate={(updated) => setActiveLead(updated)}
      />

      <CreateLeadModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(newLead) => {
          setLeads((prev) => [newLead as ApiLead, ...prev]);
          setShowCreateModal(false);
          setActiveLead(newLead as Lead);
        }}
      />

      {winLossTarget && (
        <WinLossModal
          leadId={winLossTarget.leadId}
          outcome={winLossTarget.outcome}
          onClose={() => setWinLossTarget(null)}
          onSaved={() => {
            setLeads((prev) => prev.map((l) =>
              l.id === winLossTarget.leadId ? { ...l, status: winLossTarget.outcome as Lead["status"] } : l
            ));
            setWinLossTarget(null);
          }}
        />
      )}
    </div>
  );
}
