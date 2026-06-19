"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Wallet, Check, Clock, Plus, X, Search, FileText } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { formatPrice } from "@/lib/utils";
import { USER_ROLES } from "@/lib/constants";
import { RoleGuard } from "@/components/common/RoleGuard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { UserRole } from "@/types";

interface PayrollRecord {
  id: string; userId: string; period: string;
  baseSalary: number; bonus: number; deductions: number; netPay: number;
  status: string; paidAt: string | null; notes: string | null;
  user: { id: string; name: string; avatar: string | null; role: string };
}
interface TeamUser { id: string; name: string; role: string; }

export default function PayrollPage() {
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, { baseSalary: number; bonus: number; deductions: number }>>({});
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState({ userId: "", baseSalary: "", bonus: "0", deductions: "0", notes: "" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const periods = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, "0");
    return { value: `${y}-${m}`, label: `${y}/${m}` };
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, usersRes] = await Promise.all([
        apiClient.get(`/payroll?period=${period}`),
        apiClient.get("/users"),
      ]);
      setRecords(recRes.data.data ?? []);
      setUsers(usersRes.data.data ?? []);
    } catch { toast.error("خطا در بارگذاری"); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const periodRecords = records.filter((r) => r.period === period && (!search || r.user?.name?.toLowerCase().includes(search.toLowerCase())));
  const totalNet = periodRecords.reduce((s, r) => s + r.netPay, 0);
  const paidCount = periodRecords.filter((r) => r.status === "paid").length;

  const handleApprove = async (id: string) => {
    try {
      await apiClient.put(`/payroll/${id}`, { status: "approved" });
      setRecords((p) => p.map((r) => r.id === id ? { ...r, status: "approved" } : r));
      toast.success("تایید شد");
    } catch { toast.error("خطا"); }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await apiClient.put(`/payroll/${id}`, { status: "paid" });
      setRecords((p) => p.map((r) => r.id === id ? { ...r, status: "paid", paidAt: new Date().toISOString() } : r));
      toast.success("پرداخت ثبت شد");
    } catch { toast.error("خطا"); }
  };

  const handleApproveAll = async () => {
    const drafts = periodRecords.filter((r) => r.status === "draft");
    for (const r of drafts) await handleApprove(r.id);
    toast.success(`${drafts.length} ردیف تایید شد`);
  };

  const handleSaveEdit = async (id: string) => {
    const ev = editValues[id]; if (!ev) return;
    setSaving(true);
    try {
      const netPay = ev.baseSalary + ev.bonus - ev.deductions;
      await apiClient.put(`/payroll/${id}`, { ...ev, netPay });
      setRecords((p) => p.map((r) => r.id === id ? { ...r, ...ev, netPay } : r));
      setEditingId(null); toast.success("ذخیره شد");
    } catch { toast.error("خطا در ذخیره"); }
    finally { setSaving(false); }
  };

  const handleDownloadPayslip = async (rec: PayrollRecord) => {
    try {
      const res = await apiClient.get(`/payroll/${rec.id}/payslip`);
      const slip = res.data.data;
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      doc.setFont("helvetica");
      doc.setFontSize(18);
      doc.text("Payslip", 105, 20, { align: "center" });
      doc.setFontSize(11);
      doc.text(`Employee: ${slip.employee.name}`, 20, 35);
      doc.text(`Period: ${slip.period}`, 20, 42);
      doc.text(`Status: ${slip.status}`, 20, 49);
      doc.line(20, 54, 190, 54);
      doc.setFontSize(12);
      doc.text("Earnings", 20, 62);
      doc.setFontSize(10);
      const e = slip.earnings;
      doc.text(`Base Salary: ${e.baseSalary.toLocaleString()}`, 25, 70);
      doc.text(`Bonus: ${e.bonus.toLocaleString()}`, 25, 77);
      doc.text(`Overtime Pay: ${e.overtimePay.toLocaleString()}`, 25, 84);
      doc.text(`Housing Allowance: ${e.housingAllowance.toLocaleString()}`, 25, 91);
      doc.text(`Travel Allowance: ${e.travelAllowance.toLocaleString()}`, 25, 98);
      doc.setFontSize(11);
      doc.text(`Gross Pay: ${e.grossPay.toLocaleString()}`, 25, 107);
      doc.line(20, 112, 190, 112);
      doc.setFontSize(12);
      doc.text("Deductions", 20, 120);
      doc.setFontSize(10);
      const d = slip.deductions;
      doc.text(`Tax: ${d.taxAmount.toLocaleString()}`, 25, 128);
      doc.text(`Insurance: ${d.insuranceDeduction.toLocaleString()}`, 25, 135);
      doc.text(`Loan: ${d.loanDeduction.toLocaleString()}`, 25, 142);
      doc.text(`Other: ${d.general.toLocaleString()}`, 25, 149);
      doc.setFontSize(11);
      doc.text(`Total Deductions: ${d.totalDeductions.toLocaleString()}`, 25, 158);
      doc.line(20, 163, 190, 163);
      doc.setFontSize(14);
      doc.text(`Net Pay: ${slip.netPay.toLocaleString()}`, 105, 175, { align: "center" });
      doc.save(`payslip-${rec.user?.name}-${rec.period}.pdf`);
    } catch { toast.error("خطا در تولید فیش"); }
  };

  const handleCreate = async () => {
    if (!newForm.userId) { toast.error("کارمند را انتخاب کنید"); return; }
    setSaving(true);
    try {
      const baseSalary = Number(newForm.baseSalary);
      const bonus = Number(newForm.bonus);
      const deductions = Number(newForm.deductions);
      const res = await apiClient.post("/payroll", { userId: newForm.userId, period, baseSalary, bonus, deductions, netPay: baseSalary + bonus - deductions });
      setRecords((p) => [...p, res.data.data]);
      setShowNewModal(false);
      setNewForm({ userId: "", baseSalary: "", bonus: "0", deductions: "0", notes: "" });
      toast.success("ردیف اضافه شد");
    } catch { toast.error("خطا"); }
    finally { setSaving(false); }
  };

  return (
    <RoleGuard roles={["admin", "accountant"]} fallback={<div className="p-12 text-center text-muted-foreground">دسترسی مجاز نیست.</div>}>
      <div className="space-y-6 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Wallet className="w-6 h-6 text-primary" />مدیریت حقوق و دستمزد</h1>
            <p className="text-muted-foreground text-sm mt-0.5">پردازش حقوق ماهانه پرسنل</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجوی کارمند..."
                className="pe-10 ps-4 py-2 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-44" />
            </div>
            <select value={period} onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none">
              {periods.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-black text-sm font-semibold gold-glow">
              <Plus className="w-4 h-4" />ردیف جدید
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "جمع خالص", value: `${(totalNet / 1_000_000).toFixed(1)} م`, icon: Wallet, color: "text-amber-400 bg-amber-500/10" },
            { label: "پرداخت شده", value: `${paidCount} نفر`, icon: Check, color: "text-emerald-400 bg-emerald-500/10" },
            { label: "در انتظار", value: `${periodRecords.length - paidCount} نفر`, icon: Clock, color: "text-blue-400 bg-blue-500/10" },
          ].map((c) => (
            <div key={c.label} className="p-5 rounded-2xl bg-card border border-border">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", c.color)}><c.icon className="w-4 h-4" /></div>
              <p className="text-xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {periodRecords.some((r) => r.status === "draft") && (
          <div className="flex justify-end">
            <button onClick={handleApproveAll} className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold gold-glow">
              <Check className="w-4 h-4" />تایید همه پیش‌نویس‌ها
            </button>
          </div>
        )}

        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">دوره: {period}</h3>
            <span className="text-xs text-muted-foreground">{periodRecords.length} نفر</span>
          </div>
          {loading ? (
            <div className="p-8 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}</div>
          ) : periodRecords.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm"><Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />ردیفی وجود ندارد</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>{["پرسنل", "نقش", "پایه", "پاداش", "کسورات", "خالص", "وضعیت", ""].map((h) => (
                    <th key={h} className="text-right px-4 py-3 text-muted-foreground font-medium">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {periodRecords.map((rec) => {
                    const isEdit = editingId === rec.id;
                    const ev = editValues[rec.id] ?? { baseSalary: rec.baseSalary, bonus: rec.bonus, deductions: rec.deductions };
                    return (
                      <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-black shrink-0">{rec.user?.name?.slice(0, 1)}</div>
                            <span className="font-medium text-foreground">{rec.user?.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{USER_ROLES[rec.user?.role as UserRole]?.label ?? rec.user?.role}</td>
                        {(["baseSalary", "bonus", "deductions"] as const).map((field) => (
                          <td key={field} className="px-4 py-3">
                            {isEdit && rec.status === "draft" ? (
                              <input type="number" value={ev[field]} onChange={(e) => setEditValues((p) => ({ ...p, [rec.id]: { ...ev, [field]: Number(e.target.value) } }))}
                                className="w-28 px-2 py-1 rounded-lg bg-background border border-border text-sm" />
                            ) : (
                              <span className={field === "bonus" ? "text-emerald-400" : field === "deductions" ? "text-red-400" : "text-foreground"}>
                                {((isEdit ? ev[field] : rec[field]) / 1_000_000).toFixed(1)} م
                              </span>
                            )}
                          </td>
                        ))}
                        <td className="px-4 py-3 font-bold text-foreground">{isEdit ? ((ev.baseSalary + ev.bonus - ev.deductions) / 1_000_000).toFixed(1) : (rec.netPay / 1_000_000).toFixed(1)} م</td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium",
                            rec.status === "paid" ? "bg-emerald-500/10 text-emerald-400" : rec.status === "approved" ? "bg-blue-500/10 text-blue-400" : "bg-muted text-muted-foreground")}>
                            {{ draft: "پیش‌نویس", approved: "تایید شده", paid: "✓ پرداخت" }[rec.status] ?? rec.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {rec.status === "draft" && !isEdit && (
                              <>
                                <button onClick={() => { setEditingId(rec.id); setEditValues((p) => ({ ...p, [rec.id]: { baseSalary: rec.baseSalary, bonus: rec.bonus, deductions: rec.deductions } })); }}
                                  className="text-xs px-2 py-1 rounded-lg border border-border text-muted-foreground hover:text-foreground">ویرایش</button>
                                <button onClick={() => handleApprove(rec.id)} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs hover:bg-primary/20">تایید</button>
                              </>
                            )}
                            {isEdit && (
                              <>
                                <button onClick={() => handleSaveEdit(rec.id)} disabled={saving} className="text-xs px-2 py-1 rounded-lg gradient-brand text-black font-semibold">ذخیره</button>
                                <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 rounded-lg border border-border text-muted-foreground">بستن</button>
                              </>
                            )}
                            {rec.status === "approved" && (
                              <button onClick={() => handleMarkPaid(rec.id)} className="px-3 py-1.5 rounded-lg gradient-brand text-black text-xs font-semibold gold-glow">ثبت پرداخت</button>
                            )}
                            {rec.status === "paid" && (
                              <button onClick={() => handleDownloadPayslip(rec)} className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border text-muted-foreground hover:text-foreground text-xs"><FileText className="w-3 h-3" />فیش PDF</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t border-border bg-muted/30">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-foreground">جمع کل</td>
                    <td className="px-4 py-3 font-bold text-primary">{(totalNet / 1_000_000).toFixed(1)} م</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowNewModal(false)}>
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="font-bold text-foreground">ردیف حقوق جدید</h3><button onClick={() => setShowNewModal(false)}><X className="w-4 h-4 text-muted-foreground" /></button></div>
            <select value={newForm.userId} onChange={(e) => setNewForm((p) => ({ ...p, userId: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm">
              <option value="">انتخاب کارمند *</option>
              {users.filter((u) => !periodRecords.find((r) => r.userId === u.id)).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            {[{ key: "baseSalary", label: "حقوق پایه (تومان)" }, { key: "bonus", label: "پاداش (تومان)" }, { key: "deductions", label: "کسورات (تومان)" }].map(({ key, label }) => (
              <div key={key}><label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                <input type="number" value={newForm[key as keyof typeof newForm]} onChange={(e) => setNewForm((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm" /></div>
            ))}
            <div className="flex gap-3">
              <button onClick={() => setShowNewModal(false)} className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm">انصراف</button>
              <button onClick={handleCreate} disabled={saving} className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow disabled:opacity-60">{saving ? "ثبت..." : "ثبت"}</button>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
