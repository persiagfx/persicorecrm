"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Headphones, Plus, Search, Clock, CheckCircle2, AlertTriangle, X, Pencil, Trash2, MessageSquare, ChevronDown } from "lucide-react";
import { toJalali } from "@/lib/utils";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ServiceRequest { id: string; ticketNumber: string; customerName: string; customerPhone?: string; serviceType: string; title: string; description: string; priority: "low"|"medium"|"high"|"critical"; status: "open"|"in_progress"|"pending_customer"|"resolved"|"closed"; assignedToName?: string; createdAt: string; resolvedAt?: string; slaDeadline?: string; notes?: string; }

const STATUS_CFG = { open: { label: "باز", color: "text-blue-400 bg-blue-500/10" }, in_progress: { label: "در جریان", color: "text-amber-400 bg-amber-500/10" }, pending_customer: { label: "انتظار مشتری", color: "text-violet-400 bg-violet-500/10" }, resolved: { label: "حل شد", color: "text-emerald-400 bg-emerald-500/10" }, closed: { label: "بسته", color: "text-gray-400 bg-gray-500/10" } };
const PRI_CFG = { low: { label: "کم", color: "text-gray-400" }, medium: { label: "متوسط", color: "text-blue-400" }, high: { label: "زیاد", color: "text-amber-400" }, critical: { label: "بحرانی", color: "text-red-400" } };
const SERVICE_TYPES = ["تعمیر", "نصب", "مشاوره", "پشتیبانی فنی", "گارانتی", "آموزش", "سایر"];

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<ServiceRequest | undefined>();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ServiceRequest | undefined>();
  const [form, setForm] = useState({ ticketNumber: "", customerName: "", customerPhone: "", serviceType: SERVICE_TYPES[0], title: "", description: "", priority: "medium" as ServiceRequest["priority"], status: "open" as ServiceRequest["status"], assignedToName: "", slaDeadline: "", notes: "" });

  const load = useCallback(async () => { try { const r = await apiClient.get("/service/requests"); setRequests(r.data.data ?? []); } catch { toast.error("خطا"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      if (editing) await apiClient.put(`/service/requests/${editing.id}`, form); else await apiClient.post("/service/requests", form);
      toast.success("ذخیره شد"); setShowModal(false); setEditing(undefined); load();
    } catch { toast.error("خطا"); }
  };
  const del = async (id: string) => { if (!confirm("حذف؟")) return; try { await apiClient.delete(`/service/requests/${id}`); toast.success("حذف شد"); if (selected?.id === id) setSelected(undefined); load(); } catch { /**/ } };
  const open = (r?: ServiceRequest) => { setEditing(r); setForm(r ? { ticketNumber: r.ticketNumber, customerName: r.customerName, customerPhone: r.customerPhone ?? "", serviceType: r.serviceType, title: r.title, description: r.description, priority: r.priority, status: r.status, assignedToName: r.assignedToName ?? "", slaDeadline: r.slaDeadline ?? "", notes: r.notes ?? "" } : { ticketNumber: `TK-${Date.now().toString().slice(-6)}`, customerName: "", customerPhone: "", serviceType: SERVICE_TYPES[0], title: "", description: "", priority: "medium", status: "open", assignedToName: "", slaDeadline: "", notes: "" }); setShowModal(true); };

  const filtered = requests.filter(r => { if (statusFilter !== "all" && r.status !== statusFilter) return false; if (search && !r.ticketNumber.includes(search) && !r.customerName.includes(search) && !r.title.includes(search)) return false; return true; });

  const isOverdue = (r: ServiceRequest) => r.slaDeadline && new Date(r.slaDeadline) < new Date() && r.status !== "resolved" && r.status !== "closed";

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Headphones className="w-6 h-6 text-primary" />درخواست‌های خدمات</h1></div>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold"><Plus className="w-4 h-4" /> درخواست جدید</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="باز" value={requests.filter(r => r.status === "open").length} icon={Headphones} color="blue" />
        <StatCard title="در جریان" value={requests.filter(r => r.status === "in_progress").length} icon={Clock} color="amber" />
        <StatCard title="حل شده" value={requests.filter(r => r.status === "resolved").length} icon={CheckCircle2} color="green" />
        <StatCard title="تاخیر SLA" value={requests.filter(isOverdue).length} icon={AlertTriangle} color="red" />
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="w-full pe-10 ps-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
          <option value="all">همه وضعیت‌ها</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div className="flex gap-5">
        <div className="flex-1 glass rounded-2xl border border-border overflow-hidden">
          {loading ? <div className="p-12 text-center text-muted-foreground">در حال بارگذاری...</div> : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground"><Headphones className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>درخواستی یافت نشد</p></div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(r => (
                <div key={r.id} onClick={() => setSelected(r)} className={cn("p-4 cursor-pointer hover:bg-muted/30 transition-colors", selected?.id === r.id && "bg-muted/50")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{r.ticketNumber}</span>
                        {isOverdue(r) && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                      </div>
                      <p className="font-medium text-sm mt-0.5 truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.customerName} · {r.serviceType}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_CFG[r.status].color)}>{STATUS_CFG[r.status].label}</span>
                      <span className={cn("text-xs font-medium", PRI_CFG[r.priority].color)}>{PRI_CFG[r.priority].label}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{toJalali(r.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        {selected && (
          <div className="w-80 shrink-0 glass rounded-2xl border border-border p-5 space-y-4 max-h-[600px] overflow-y-auto">
            <div className="flex items-start justify-between">
              <p className="font-semibold">{selected.title}</p>
              <button onClick={() => setSelected(undefined)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">تیکت</span><span className="font-mono">{selected.ticketNumber}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">مشتری</span><span>{selected.customerName}</span></div>
              {selected.customerPhone && <div className="flex justify-between"><span className="text-muted-foreground">تلفن</span><span dir="ltr">{selected.customerPhone}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">نوع خدمت</span><span>{selected.serviceType}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">وضعیت</span><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_CFG[selected.status].color)}>{STATUS_CFG[selected.status].label}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">اولویت</span><span className={cn("text-xs font-medium", PRI_CFG[selected.priority].color)}>{PRI_CFG[selected.priority].label}</span></div>
              {selected.assignedToName && <div className="flex justify-between"><span className="text-muted-foreground">مسئول</span><span>{selected.assignedToName}</span></div>}
              {selected.slaDeadline && <div className="flex justify-between"><span className="text-muted-foreground">مهلت SLA</span><span className={cn(isOverdue(selected) ? "text-red-400" : "")}>{toJalali(selected.slaDeadline)}</span></div>}
            </div>
            <div><p className="text-xs text-muted-foreground mb-1">توضیحات</p><p className="text-sm">{selected.description}</p></div>
            {selected.notes && <div><p className="text-xs text-muted-foreground mb-1">یادداشت</p><p className="text-sm">{selected.notes}</p></div>}
            <div className="flex gap-2 pt-2 border-t border-border">
              <button onClick={() => open(selected)} className="flex-1 py-2 rounded-xl border border-border text-sm flex items-center justify-center gap-1"><Pencil className="w-3.5 h-3.5" />ویرایش</button>
              <button onClick={() => del(selected.id)} className="py-2 px-3 rounded-xl hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-lg border border-border max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">{editing ? "ویرایش درخواست" : "درخواست جدید"}</h2><button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="شماره تیکت" value={form.ticketNumber} onChange={e => setForm(f => ({ ...f, ticketNumber: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <select value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <input placeholder="عنوان درخواست *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="نام مشتری *" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input placeholder="شماره تماس" value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} dir="ltr" className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <textarea placeholder="توضیح مشکل *" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as ServiceRequest["priority"] }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {Object.entries(PRI_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ServiceRequest["status"] }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="مسئول رسیدگی" value={form.assignedToName} onChange={e => setForm(f => ({ ...f, assignedToName: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <div><label className="block text-xs text-muted-foreground mb-1">مهلت SLA</label><input type="datetime-local" value={form.slaDeadline} onChange={e => setForm(f => ({ ...f, slaDeadline: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
                </div>
                <textarea placeholder="یادداشت داخلی" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex gap-3 mt-5"><button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">انصراف</button><button onClick={save} className="flex-[2] py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ذخیره</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
