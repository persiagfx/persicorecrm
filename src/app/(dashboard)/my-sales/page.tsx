"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Target, Bell, CheckCircle2, Circle, Plus, Zap, Users, X } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { formatPrice, toJalali } from "@/lib/utils";
import { LEAD_STATUSES } from "@/lib/constants";
import { RoleGuard } from "@/components/common/RoleGuard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  estimatedValue: number;
  status: string;
}

interface Reminder {
  id: string;
  title: string;
  notes?: string;
  dueDate: string;
  isCompleted: boolean;
  leadId?: string;
}

export default function MySalesPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReminder, setNewReminder] = useState({ title: "", dueDate: "", notes: "", leadId: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      apiClient.get(`/leads?assigneeId=${user.id}`),
      apiClient.get("/reminders?completed=false"),
      apiClient.get("/clients"),
    ]).then(([leadsRes, remRes, clientsRes]) => {
      setLeads(leadsRes.data?.data ?? []);
      setReminders(remRes.data?.data ?? []);
      setClientCount(clientsRes.data?.meta?.total ?? clientsRes.data?.data?.length ?? 0);
    }).catch(() => toast.error("خطا در دریافت داده‌ها"))
      .finally(() => setLoading(false));
  }, [user]);

  const activeLeads = leads.filter((l) => !["won", "lost"].includes(l.status));
  const wonLeads = leads.filter((l) => l.status === "won");
  const overdueReminders = reminders.filter((r) => !r.isCompleted && new Date(r.dueDate) < new Date());
  const pendingReminders = reminders.filter((r) => !r.isCompleted);

  const toggleReminder = async (id: string, current: boolean) => {
    try {
      await apiClient.put(`/reminders/${id}`, { isCompleted: !current });
      setReminders((prev) => prev.map((r) => r.id === id ? { ...r, isCompleted: !current } : r));
    } catch {
      toast.error("خطا در به‌روزرسانی یادآور");
    }
  };

  const addReminder = async () => {
    if (!newReminder.title || !newReminder.dueDate) { toast.error("عنوان و تاریخ الزامی است"); return; }
    setSaving(true);
    try {
      const res = await apiClient.post("/reminders", { ...newReminder, leadId: newReminder.leadId || undefined });
      setReminders((prev) => [res.data?.data ?? res.data, ...prev]);
      setNewReminder({ title: "", dueDate: "", notes: "", leadId: "" });
      setShowAddForm(false);
      toast.success("یادآور اضافه شد");
    } catch {
      toast.error("خطا در ثبت یادآور");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGuard roles={["admin", "sales_manager", "sales_rep"]} fallback={
      <div className="p-12 text-center text-muted-foreground">دسترسی مجاز نیست.</div>
    }>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />داشبورد من
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">لیدها و مشتریان مستقیم شما</p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-card border border-border animate-pulse" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "لیدهای فعال من", value: activeLeads.length, icon: Zap, color: "text-blue-400 bg-blue-500/10" },
                { label: "قراردادهای بسته شده", value: wonLeads.length, icon: Target, color: "text-emerald-400 bg-emerald-500/10" },
                { label: "کل مشتریان", value: clientCount, icon: Users, color: "text-purple-400 bg-purple-500/10" },
                { label: "یادآورهای معوق", value: overdueReminders.length, icon: Bell, color: "text-red-400 bg-red-500/10" },
              ].map((c) => (
                <div key={c.label} className="p-5 rounded-2xl bg-card border border-border">
                  <div className={`w-9 h-9 rounded-xl ${c.color} flex items-center justify-center mb-3`}>
                    <c.icon className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{c.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* لیدهای من */}
              <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />لیدهای من ({activeLeads.length})
                </h3>
                {activeLeads.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6">لید فعالی ندارید</p>
                ) : (
                  <div className="space-y-2">
                    {activeLeads.slice(0, 6).map((lead) => {
                      const statusCfg = LEAD_STATUSES[lead.status as keyof typeof LEAD_STATUSES];
                      return (
                        <div key={lead.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                          <div>
                            <p className="text-sm font-medium text-foreground">{lead.companyName}</p>
                            <p className="text-xs text-muted-foreground">{lead.contactName}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{Math.round(lead.estimatedValue / 1_000_000)} م</span>
                            {statusCfg && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium bg-${statusCfg.color}-500/10 text-${statusCfg.color}-400`}>
                                {statusCfg.label}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* یادآورها */}
              <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />یادآورهای follow-up ({pendingReminders.length})
                  </h3>
                  <button onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl gradient-brand text-black text-xs font-semibold">
                    <Plus className="w-3.5 h-3.5" />جدید
                  </button>
                </div>

                {showAddForm && (
                  <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">یادآور جدید</p>
                      <button onClick={() => setShowAddForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
                    </div>
                    <input value={newReminder.title} onChange={(e) => setNewReminder((p) => ({ ...p, title: e.target.value }))}
                      placeholder="عنوان یادآور..." className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    <input type="date" value={newReminder.dueDate} onChange={(e) => setNewReminder((p) => ({ ...p, dueDate: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    <select value={newReminder.leadId} onChange={(e) => setNewReminder((p) => ({ ...p, leadId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none">
                      <option value="">بدون لید مرتبط</option>
                      {activeLeads.map((l) => <option key={l.id} value={l.id}>{l.companyName}</option>)}
                    </select>
                    <textarea value={newReminder.notes} onChange={(e) => setNewReminder((p) => ({ ...p, notes: e.target.value }))}
                      placeholder="یادداشت (اختیاری)..." rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none resize-none" />
                    <button onClick={addReminder} disabled={saving}
                      className="w-full py-2 rounded-xl gradient-brand text-black text-sm font-semibold disabled:opacity-60">
                      {saving ? "در حال ذخیره..." : "ذخیره یادآور"}
                    </button>
                  </div>
                )}

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {reminders.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-6">یادآوری ندارید</p>
                  ) : reminders
                    .sort((a, b) => (a.isCompleted ? 1 : -1) - (b.isCompleted ? 1 : -1))
                    .map((r) => {
                      const isOverdue = !r.isCompleted && new Date(r.dueDate) < new Date();
                      return (
                        <div key={r.id} className={cn("flex items-start gap-3 p-3 rounded-xl transition-colors",
                          r.isCompleted ? "bg-muted/30 opacity-60" : isOverdue ? "bg-red-500/5 border border-red-500/20" : "bg-muted/50")}>
                          <button onClick={() => toggleReminder(r.id, r.isCompleted)} className="mt-0.5 shrink-0">
                            {r.isCompleted
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              : <Circle className={cn("w-4 h-4", isOverdue ? "text-red-400" : "text-muted-foreground")} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-medium", r.isCompleted ? "line-through text-muted-foreground" : "text-foreground")}>
                              {r.title}
                            </p>
                            <span className={cn("text-[10px]", isOverdue ? "text-red-400 font-medium" : "text-muted-foreground")}>
                              {isOverdue ? "⚠ معوق — " : ""}{toJalali(r.dueDate)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </RoleGuard>
  );
}
