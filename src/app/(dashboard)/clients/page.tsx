"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Search, Building2, X, Download, Upload, Trash2 } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import type { ClientStatus } from "@/types";
import { ClientStatusBadge } from "@/components/common/StatusBadge";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

const segments: { key: ClientStatus | "all"; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "vip", label: "VIP" },
  { key: "active", label: "فعال" },
  { key: "at_risk", label: "در ریسک" },
  { key: "inactive", label: "خاموش" },
];

interface Client {
  id: string;
  companyName: string;
  contactName: string;
  status: ClientStatus;
  totalRevenue: number;
  projectCount: number;
  tags: string[];
}

// ─── New Client Modal ────────────────────────────────────────────────
function NewClientModal({ onClose, onAdd }: { onClose: () => void; onAdd: (c: Client) => void }) {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [status, setStatus] = useState<ClientStatus>("active");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!companyName.trim() || !contactName.trim() || !contactPhone.trim()) return;
    setLoading(true);
    try {
      const res = await apiClient.post("/clients", {
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim() || undefined,
        status,
      });
      onAdd(res.data.data);
      toast.success("مشتری جدید اضافه شد");
      onClose();
    } catch {
      toast.error("خطا در ایجاد مشتری");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            مشتری جدید
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">نام شرکت *</label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="مثال: شرکت آلفا"
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">نام مخاطب *</label>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="مثال: آقای احمدی"
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">تلفن *</label>
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="مثال: 09123456789"
              dir="ltr"
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">ایمیل</label>
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="example@company.ir"
              dir="ltr"
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">وضعیت</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ClientStatus)}
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="active">فعال</option>
              <option value="vip">VIP</option>
              <option value="at_risk">در ریسک</option>
              <option value="inactive">خاموش</option>
            </select>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm hover:bg-muted/80 transition-colors">
            انصراف
          </button>
          <button
            onClick={handleSubmit}
            disabled={!companyName.trim() || !contactName.trim() || !contactPhone.trim() || loading}
            className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "در حال ذخیره..." : "ایجاد مشتری"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<ClientStatus | "all">("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelect = (id: string) => setSelected((p) => p.includes(id) ? p.filter((i) => i !== id) : [...p, id]);
  const selectAll = () => setSelected(filteredClients.map((c) => c.id));
  const clearSelect = () => setSelected([]);

  const handleBulkDelete = async () => {
    if (!confirm(`آیا از حذف ${selected.length} مشتری مطمئن هستید؟\nتوجه: مشتریانی با پروژه یا فاکتور حذف نمی‌شوند.`)) return;
    let deleted = 0;
    for (const id of selected) {
      try { await apiClient.delete(`/clients/${id}`); deleted++; } catch { /* skip */ }
    }
    toast.success(`${deleted} مشتری حذف شد`);
    setSelected([]);
    fetchClients();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "clients");
      const res = await apiClient.post("/import", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const { created, errors } = res.data;
      toast.success(`${created} مشتری وارد شد${errors.length > 0 ? ` (${errors.length} خطا)` : ""}`);
      fetchClients();
    } catch { toast.error("خطا در وارد کردن فایل"); }
    finally { setImporting(false); e.target.value = ""; }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem("crm-token") ?? "";
      const res = await fetch("/api/export?type=clients", { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "clients-export.xlsx"; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("خطا در خروجی گرفتن"); }
    finally { setExporting(false); }
  };

  const fetchClients = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ perPage: "100" });
    if (search) params.set("search", search);
    if (segment !== "all") params.set("status", segment);
    apiClient.get(`/clients?${params}`)
      .then((res) => {
        setClients(res.data.data ?? []);
        setTotal(res.data.meta?.total ?? res.data.data?.length ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, segment]);

  useEffect(() => {
    const t = setTimeout(fetchClients, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchClients, search]);

  const filteredClients = segment === "all" ? clients : clients.filter((c) => c.status === segment);
  const countByStatus = (s: ClientStatus) => clients.filter((c) => c.status === s).length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            مشتریان
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{total} مشتری ثبت‌شده</p>
        </div>
        <div className="flex items-center gap-2">
          <label className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card text-muted-foreground text-sm hover:text-foreground hover:bg-muted transition-colors cursor-pointer", importing && "opacity-50 cursor-wait")}>
            <Upload className="w-4 h-4" />{importing ? "وارد کردن..." : "ایمپورت Excel"}
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card text-muted-foreground text-sm hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />{exporting ? "..." : "خروجی Excel"}
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow"
          >
            <Plus className="w-4 h-4" />مشتری جدید
          </motion.button>
        </div>
      </motion.div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/10 border border-primary/20">
          <span className="text-sm font-medium text-primary">{selected.length} مشتری انتخاب شده</span>
          <div className="flex-1" />
          <button onClick={selectAll} className="text-xs text-muted-foreground hover:text-foreground transition-colors">انتخاب همه</button>
          <button onClick={clearSelect} className="text-xs text-muted-foreground hover:text-foreground transition-colors">لغو انتخاب</button>
          <button onClick={handleBulkDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm transition-colors">
            <Trash2 className="w-3.5 h-3.5" />حذف انتخاب‌شده
          </button>
        </motion.div>
      )}

      {/* Segments */}
      <div className="flex items-center gap-2 flex-wrap">
        {segments.map((s) => (
          <button
            key={s.key}
            onClick={() => setSegment(s.key)}
            className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-all", segment === s.key
              ? "bg-primary/10 text-primary border border-primary/30"
              : "bg-card text-muted-foreground border border-border hover:text-foreground"
            )}
          >
            {s.label}
            <span className="ms-1.5 text-xs opacity-60">
              {s.key === "all" ? total : countByStatus(s.key as ClientStatus)}
            </span>
          </button>
        ))}
        <div className="relative ms-auto">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو..."
            className="pe-10 ps-4 py-2 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-56"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {clients.map((client, i) => (
              <motion.div key={client.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.04 }}>
                <Link href={`/clients/${client.id}`}>
                  <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}
                    className="p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-card-hover cursor-pointer transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center text-lg font-bold text-black">
                        {client.companyName.slice(0, 1)}
                      </div>
                      <ClientStatusBadge status={client.status} />
                    </div>
                    <h3 className="font-semibold text-foreground truncate mb-0.5">{client.companyName}</h3>
                    <p className="text-xs text-muted-foreground mb-4">{client.contactName}</p>
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border">
                      <div>
                        <p className="text-[10px] text-muted-foreground">درآمد کل</p>
                        <p className="text-xs font-semibold text-primary tabular-nums">{formatPrice(client.totalRevenue, true)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">پروژه‌ها</p>
                        <p className="text-xs font-semibold text-foreground">{client.projectCount}</p>
                      </div>
                    </div>
                    {client.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {client.tags.slice(0, 2).map((t) => (
                          <span key={t} className="px-1.5 py-0.5 rounded-md text-[10px] bg-muted text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
          {clients.length === 0 && (
            <div className="col-span-full py-16 text-center text-muted-foreground">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>مشتری‌ای یافت نشد</p>
            </div>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {showNewModal && (
          <NewClientModal
            onClose={() => setShowNewModal(false)}
            onAdd={(c) => { setClients((prev) => [c, ...prev]); setTotal((t) => t + 1); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
