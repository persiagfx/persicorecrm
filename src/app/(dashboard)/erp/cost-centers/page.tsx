"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Building2, Plus, Search, ChevronRight, ChevronDown, Pencil, Trash2, X, ToggleLeft, ToggleRight } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CostCenter {
  id: string;
  code: string;
  name: string;
  description?: string;
  parentId?: string | null;
  isActive: boolean;
  children?: CostCenter[];
  _count?: { budgets: number };
}

const EMPTY_FORM = { code: "", name: "", description: "", parentId: "", isActive: true };

function CostCenterRow({
  center, depth = 0, onEdit, onDelete,
}: {
  center: CostCenter; depth?: number; onEdit: (c: CostCenter) => void; onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = center.children && center.children.length > 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/[0.02] group"
        style={{ paddingRight: `${16 + depth * 24}px` }}
      >
        <button onClick={() => setOpen(!open)} className={cn("w-5 h-5 flex items-center justify-center text-gray-500", !hasChildren && "invisible")}>
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="w-20 text-xs font-mono text-indigo-400">{center.code}</div>
        <div className="flex-1">
          <div className="text-sm font-medium">{center.name}</div>
          {center.description && <div className="text-xs text-gray-500 mt-0.5">{center.description}</div>}
        </div>
        <div className="text-xs text-gray-500">{center._count?.budgets ?? 0} بودجه</div>
        <div className={cn("text-xs px-2 py-0.5 rounded-full", center.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-500/10 text-gray-400")}>
          {center.isActive ? "فعال" : "غیرفعال"}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(center)} className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(center.id)} className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
      {open && hasChildren && center.children!.map(child => (
        <CostCenterRow key={child.id} center={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </>
  );
}

export default function CostCentersPage() {
  const [centers, setCenters] = useState<CostCenter[]>([]);
  const [flatList, setFlatList] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CostCenter | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    try {
      const [tree, flat] = await Promise.all([
        apiClient.get("/erp/cost-centers"),
        apiClient.get("/erp/cost-centers?flat=true"),
      ]);
      setCenters(tree.data.data ?? []);
      setFlatList(flat.data.data ?? []);
    } catch { toast.error("خطا در بارگذاری"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (c: CostCenter) => {
    setEditing(c);
    setForm({ code: c.code, name: c.name, description: c.description ?? "", parentId: c.parentId ?? "", isActive: c.isActive });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.code.trim() || !form.name.trim()) { toast.error("کد و نام الزامی است"); return; }
    try {
      const data = { ...form, parentId: form.parentId || null };
      if (editing) await apiClient.put(`/erp/cost-centers/${editing.id}`, data);
      else await apiClient.post("/erp/cost-centers", data);
      toast.success(editing ? "بروزرسانی شد" : "مرکز هزینه ایجاد شد");
      setShowModal(false);
      load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? "خطا در ذخیره");
    }
  };

  const del = async (id: string) => {
    if (!confirm("حذف شود؟")) return;
    try { await apiClient.delete(`/erp/cost-centers/${id}`); toast.success("حذف شد"); load(); } catch { toast.error("خطا"); }
  };

  const filtered = search
    ? flatList.filter(c => c.name.includes(search) || c.code.includes(search))
    : centers;

  const totalActive = flatList.filter(c => c.isActive).length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" /> مراکز هزینه
        </h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 text-sm font-medium">
          <Plus className="w-4 h-4" /> مرکز هزینه جدید
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="کل مراکز" value={flatList.length} icon={Building2} color="indigo" />
        <StatCard title="فعال" value={totalActive} icon={ToggleRight} color="green" />
        <StatCard title="غیرفعال" value={flatList.length - totalActive} icon={ToggleLeft} color="gray" />
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <div className="relative max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="جستجو بر اساس کد یا نام..."
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pr-9 pl-3 text-sm outline-none focus:border-primary/50"
            />
          </div>
        </div>

        <div className="text-xs text-gray-500 flex gap-3 px-4 py-2 border-b border-white/5 bg-white/[0.02]">
          <span className="w-5" />
          <span className="w-20">کد</span>
          <span className="flex-1">نام</span>
          <span className="w-16">بودجه‌ها</span>
          <span className="w-16">وضعیت</span>
          <span className="w-16" />
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">در حال بارگذاری...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>مرکز هزینه‌ای یافت نشد</p>
          </div>
        ) : search ? (
          flatList.filter(c => c.name.includes(search) || c.code.includes(search)).map(c => (
            <CostCenterRow key={c.id} center={c} onEdit={openEdit} onDelete={del} />
          ))
        ) : (
          centers.map(c => <CostCenterRow key={c.id} center={c} onEdit={openEdit} onDelete={del} />)
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{editing ? "ویرایش مرکز هزینه" : "مرکز هزینه جدید"}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded hover:bg-white/10 text-gray-400"><X className="w-4 h-4" /></button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">کد *</label>
                  <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                    placeholder="مثال: CC-001" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">نام *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="نام مرکز هزینه" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">مرکز هزینه والد (اختیاری)</label>
                <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50">
                  <option value="">— بدون والد (ریشه) —</option>
                  {flatList.filter(c => c.id !== editing?.id).map(c => (
                    <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">توضیحات</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="توضیحات اختیاری..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 resize-none" />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                <span className="text-sm">فعال</span>
              </label>

              <div className="flex gap-2 pt-2">
                <button onClick={save} className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-medium hover:opacity-90">ذخیره</button>
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-white/10 rounded-lg text-sm hover:bg-white/5">انصراف</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
