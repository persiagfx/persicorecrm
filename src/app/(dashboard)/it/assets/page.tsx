"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Monitor, Plus, X, Pencil, Trash2, Search, Cpu, Wifi, HardDrive, Package } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { StatCard } from "@/components/common/StatCard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { toJalali, formatPrice } from "@/lib/utils";

interface ITAsset {
  id: string; name: string; type: string; serialNumber?: string; assetTag?: string;
  brand?: string; model?: string; status: string; assignedToId?: string;
  location?: string; purchaseDate?: string; purchasePrice?: number;
  warrantyEnd?: string; notes?: string;
}

const TYPE_CFG: Record<string, { label: string; icon: typeof Monitor; color: string }> = {
  hardware:   { label: "سخت‌افزار", icon: Monitor, color: "text-blue-400 bg-blue-500/10" },
  software:   { label: "نرم‌افزار", icon: Cpu, color: "text-violet-400 bg-violet-500/10" },
  network:    { label: "شبکه", icon: Wifi, color: "text-emerald-400 bg-emerald-500/10" },
  peripheral: { label: "جانبی", icon: HardDrive, color: "text-amber-400 bg-amber-500/10" },
  other:      { label: "سایر", icon: Package, color: "text-gray-400 bg-gray-500/10" },
};

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  active:      { label: "آماده", color: "text-emerald-400 bg-emerald-500/10" },
  in_use:      { label: "در استفاده", color: "text-blue-400 bg-blue-500/10" },
  maintenance: { label: "تعمیر", color: "text-amber-400 bg-amber-500/10" },
  retired:     { label: "اسقاط", color: "text-gray-400 bg-gray-500/10" },
  lost:        { label: "مفقود", color: "text-red-400 bg-red-500/10" },
};

const EMPTY_FORM = { name: "", type: "hardware", serialNumber: "", assetTag: "", brand: "", model: "", status: "active", location: "", purchaseDate: "", purchasePrice: "", warrantyEnd: "", notes: "" };

export default function ITAssetsPage() {
  const [assets, setAssets] = useState<ITAsset[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inUse: 0, maintenance: 0, retired: 0, totalValue: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ITAsset | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get("/it/assets");
      setAssets(res.data.data.assets ?? []);
      setStats(res.data.data.stats ?? {});
    } catch { toast.error("خطا در بارگذاری"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const open = (a?: ITAsset) => {
    setEditing(a ?? null);
    setForm(a ? {
      name: a.name, type: a.type, serialNumber: a.serialNumber ?? "", assetTag: a.assetTag ?? "",
      brand: a.brand ?? "", model: a.model ?? "", status: a.status, location: a.location ?? "",
      purchaseDate: a.purchaseDate?.slice(0, 10) ?? "", purchasePrice: String(a.purchasePrice ?? ""),
      warrantyEnd: a.warrantyEnd?.slice(0, 10) ?? "", notes: a.notes ?? "",
    } : { ...EMPTY_FORM });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("نام الزامی است"); return; }
    try {
      const payload = { ...form, purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : null };
      if (editing) await apiClient.put(`/it/assets/${editing.id}`, payload);
      else await apiClient.post("/it/assets", payload);
      toast.success("ذخیره شد");
      setShowModal(false);
      load();
    } catch { toast.error("خطا"); }
  };

  const del = async (id: string) => {
    if (!confirm("حذف این دارایی؟")) return;
    try { await apiClient.delete(`/it/assets/${id}`); toast.success("حذف شد"); load(); }
    catch { toast.error("خطا"); }
  };

  const filtered = assets.filter(a =>
    (!search || a.name.toLowerCase().includes(search.toLowerCase()) || a.brand?.includes(search) || a.serialNumber?.includes(search)) &&
    (!filterType || a.type === filterType) &&
    (!filterStatus || a.status === filterStatus)
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Monitor className="w-6 h-6 text-primary" />رجیستری دارایی‌های IT
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">مدیریت سخت‌افزار، نرم‌افزار و تجهیزات شبکه</p>
        </div>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">
          <Plus className="w-4 h-4" />دارایی جدید
        </button>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="کل دارایی‌ها" value={stats.total} icon={Monitor} color="blue" />
        <StatCard title="آماده به‌کار" value={stats.active} icon={Monitor} color="green" />
        <StatCard title="در استفاده" value={stats.inUse} icon={Cpu} color="violet" />
        <StatCard title="ارزش کل" value={formatPrice(stats.totalValue)} icon={Package} color="amber" />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="w-full pe-10 ps-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground">
          <option value="">همه انواع</option>
          {Object.entries(TYPE_CFG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground">
          <option value="">همه وضعیت‌ها</option>
          {Object.entries(STATUS_CFG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-32 rounded-2xl bg-card animate-pulse border border-border" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground rounded-2xl bg-card border border-border">
          <Monitor className="w-10 h-10 mx-auto mb-3 opacity-30" />دارایی‌ای یافت نشد
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(asset => {
            const tCfg = TYPE_CFG[asset.type] ?? TYPE_CFG.other;
            const sCfg = STATUS_CFG[asset.status] ?? STATUS_CFG.active;
            const Icon = tCfg.icon;
            const isExpiring = asset.warrantyEnd && new Date(asset.warrantyEnd) < new Date(Date.now() + 90 * 86400000);
            return (
              <motion.div key={asset.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("p-2 rounded-xl", tCfg.color.split(" ")[1])}>
                    <Icon className={cn("w-5 h-5", tCfg.color.split(" ")[0])} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => open(asset)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button onClick={() => del(asset.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground text-sm">{asset.name}</h3>
                {(asset.brand || asset.model) && <p className="text-xs text-muted-foreground mt-0.5">{[asset.brand, asset.model].filter(Boolean).join(" — ")}</p>}
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", sCfg.color)}>{sCfg.label}</span>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs", tCfg.color)}>{tCfg.label}</span>
                  {isExpiring && <span className="px-2 py-0.5 rounded-full text-xs text-amber-400 bg-amber-500/10">گارانتی رو به انقضا</span>}
                </div>
                <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {asset.serialNumber && <span className="font-mono truncate" title={asset.serialNumber}>SN: {asset.serialNumber}</span>}
                  {asset.location && <span className="truncate">📍 {asset.location}</span>}
                  {asset.purchasePrice && <span>{formatPrice(asset.purchasePrice)}</span>}
                  {asset.warrantyEnd && <span>گارانتی تا: {toJalali(asset.warrantyEnd)}</span>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="glass rounded-2xl p-6 w-full max-w-lg border border-border max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">{editing ? "ویرایش دارایی" : "دارایی جدید"}</h2>
                <button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <input placeholder="نام دارایی *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground">
                    {Object.entries(TYPE_CFG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                  </select>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground">
                    {Object.entries(STATUS_CFG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="برند" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input placeholder="مدل" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="شماره سریال" value={form.serialNumber} onChange={e => setForm(f => ({ ...f, serialNumber: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input placeholder="تگ دارایی" value={form.assetTag} onChange={e => setForm(f => ({ ...f, assetTag: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <input placeholder="مکان / اتاق" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-muted-foreground mb-1">تاریخ خرید</label>
                    <input type="date" value={form.purchaseDate} onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1">پایان گارانتی</label>
                    <input type="date" value={form.warrantyEnd} onChange={e => setForm(f => ({ ...f, warrantyEnd: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
                </div>
                <input type="number" placeholder="قیمت خرید (ریال)" value={form.purchasePrice} onChange={e => setForm(f => ({ ...f, purchasePrice: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <textarea placeholder="یادداشت" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground">انصراف</button>
                <button onClick={save} className="flex-[2] py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ذخیره</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
