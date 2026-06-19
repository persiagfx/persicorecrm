"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Award, Plus, Search, Download, CheckCircle2, X, Pencil, Trash2, QrCode } from "lucide-react";
import { toJalali } from "@/lib/utils";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Certificate { id: string; certificateNumber: string; studentId?: string; studentName: string; courseId?: string; courseName: string; issueDate: string; expiryDate?: string; grade?: string; score?: number; isRevoked: boolean; verificationCode?: string; }

export default function CertificatesPage() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [students, setStudents] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Certificate | undefined>();
  const [form, setForm] = useState({ certificateNumber: "", studentId: "", courseName: "", grade: "", score: 0, issueDate: new Date().toISOString().slice(0, 10), expiryDate: "", isRevoked: false });

  const load = useCallback(async () => {
    try { const [cr, sr, csr] = await Promise.all([apiClient.get("/education/certificates"), apiClient.get("/education/students"), apiClient.get("/education/courses")]); setCerts(cr.data.data ?? []); setStudents(sr.data.data ?? []); setCourses(csr.data.data ?? []); } catch { toast.error("خطا"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      const studentName = students.find(s => s.id === form.studentId) ? `${students.find(s => s.id === form.studentId)!.firstName} ${students.find(s => s.id === form.studentId)!.lastName}` : "";
      const payload = { ...form, studentName };
      if (editing) await apiClient.put(`/education/certificates/${editing.id}`, payload); else await apiClient.post("/education/certificates", payload);
      toast.success("ذخیره شد"); setShowModal(false); setEditing(undefined); load();
    } catch { toast.error("خطا"); }
  };
  const del = async (id: string) => { if (!confirm("حذف؟")) return; try { await apiClient.delete(`/education/certificates/${id}`); toast.success("حذف شد"); load(); } catch { /**/ } };

  const downloadPDF = async (c: Certificate) => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      doc.setFillColor(10, 10, 20);
      doc.rect(0, 0, 297, 210, "F");
      doc.setDrawColor(200, 160, 60);
      doc.setLineWidth(2);
      doc.rect(8, 8, 281, 194, "S");
      doc.setDrawColor(200, 160, 60);
      doc.setLineWidth(0.5);
      doc.rect(11, 11, 275, 188, "S");
      doc.setTextColor(200, 160, 60);
      doc.setFontSize(28);
      doc.text("CERTIFICATE OF COMPLETION", 148.5, 50, { align: "center" });
      doc.setFontSize(13);
      doc.setTextColor(200, 200, 200);
      doc.text("This certifies that", 148.5, 68, { align: "center" });
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text(c.studentName, 148.5, 84, { align: "center" });
      doc.setFontSize(12);
      doc.setTextColor(200, 200, 200);
      doc.text("has successfully completed the course", 148.5, 96, { align: "center" });
      doc.setFontSize(16);
      doc.setTextColor(200, 160, 60);
      doc.text(c.courseName, 148.5, 110, { align: "center" });
      if (c.grade || c.score) {
        doc.setFontSize(11);
        doc.setTextColor(180, 180, 180);
        doc.text(`Score: ${c.score ?? "—"}  |  Grade: ${c.grade ?? "—"}`, 148.5, 124, { align: "center" });
      }
      doc.setFontSize(10);
      doc.setTextColor(140, 140, 140);
      doc.text(`Certificate No: ${c.certificateNumber}`, 40, 168);
      doc.text(`Issue Date: ${new Date(c.issueDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 40, 176);
      if (c.verificationCode) doc.text(`Verification Code: ${c.verificationCode}`, 180, 168);
      doc.setDrawColor(200, 160, 60);
      doc.setLineWidth(0.3);
      doc.line(40, 155, 130, 155);
      doc.text("Authorized Signature", 85, 162, { align: "center" });
      doc.save(`certificate-${c.certificateNumber}.pdf`);
      toast.success("PDF ذخیره شد");
    } catch { toast.error("خطا در ساخت PDF"); }
  };
  const open = (c?: Certificate) => { setEditing(c); setForm(c ? { certificateNumber: c.certificateNumber, studentId: c.studentId ?? "", courseName: c.courseName, grade: c.grade ?? "", score: c.score ?? 0, issueDate: c.issueDate, expiryDate: c.expiryDate ?? "", isRevoked: c.isRevoked } : { certificateNumber: `CERT-${Date.now().toString().slice(-6)}`, studentId: "", courseName: "", grade: "", score: 0, issueDate: new Date().toISOString().slice(0, 10), expiryDate: "", isRevoked: false }); setShowModal(true); };

  const filtered = certs.filter(c => !search || c.studentName.includes(search) || c.courseName.includes(search) || c.certificateNumber.includes(search));

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Award className="w-6 h-6 text-primary" />گواهینامه‌ها</h1></div>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold"><Plus className="w-4 h-4" /> گواهینامه جدید</button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="کل گواهینامه‌ها" value={certs.length} icon={Award} color="blue" />
        <StatCard title="معتبر" value={certs.filter(c => !c.isRevoked).length} icon={CheckCircle2} color="green" />
        <StatCard title="باطل شده" value={certs.filter(c => c.isRevoked).length} icon={Award} color="red" />
      </div>
      <div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="w-full pe-10 ps-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
      <div className="grid grid-cols-2 gap-4">
        {loading ? <div className="col-span-2 p-12 text-center text-muted-foreground">در حال بارگذاری...</div> : filtered.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-muted-foreground glass rounded-2xl border border-border"><Award className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>گواهینامه‌ای یافت نشد</p></div>
        ) : filtered.map(c => (
          <div key={c.id} className={cn("glass rounded-2xl border p-5 relative overflow-hidden", c.isRevoked ? "border-red-500/30 opacity-70" : "border-border")}>
            {!c.isRevoked && <div className="absolute top-0 right-0 w-16 h-16 rounded-br-full bg-gradient-to-br from-primary/20 to-transparent" />}
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-base">{c.studentName}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{c.courseName}</p>
              </div>
              <div className="flex gap-1 relative z-10">
                <button onClick={() => downloadPDF(c)} className="p-1.5 rounded-lg hover:bg-muted" title="دانلود PDF"><Download className="w-3.5 h-3.5 text-muted-foreground" /></button>
                <button onClick={() => open(c)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                <button onClick={() => del(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">{c.certificateNumber}</span>
                  {c.isRevoked && <span className="text-red-400 font-medium">باطل</span>}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>صدور: {toJalali(c.issueDate)}</span>
                  {c.expiryDate && <span>انقضا: {toJalali(c.expiryDate)}</span>}
                </div>
              </div>
              <div className="text-center">
                {c.score !== undefined && c.score > 0 && <p className="text-2xl font-bold text-primary">{c.score}</p>}
                {c.grade && <p className="text-xs text-muted-foreground">{c.grade}</p>}
              </div>
            </div>
            {c.verificationCode && (
              <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                <QrCode className="w-3.5 h-3.5" />
                <span className="font-mono">{c.verificationCode}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-lg border border-border max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">{editing ? "ویرایش گواهینامه" : "گواهینامه جدید"}</h2><button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <input placeholder="شماره گواهینامه" value={form.certificateNumber} onChange={e => setForm(f => ({ ...f, certificateNumber: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <select value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                  <option value="">انتخاب دانشجو *</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                </select>
                <select value={form.courseName} onChange={e => setForm(f => ({ ...f, courseName: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                  <option value="">انتخاب دوره *</option>
                  {courses.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="نمره" value={form.score || ""} onChange={e => setForm(f => ({ ...f, score: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input placeholder="درجه (مثال: عالی)" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-muted-foreground mb-1">تاریخ صدور</label><input type="date" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1">تاریخ انقضا</label><input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" checked={form.isRevoked} onChange={e => setForm(f => ({ ...f, isRevoked: e.target.checked }))} /><span className="text-red-400">گواهینامه باطل است</span></label>
              </div>
              <div className="flex gap-3 mt-5"><button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">انصراف</button><button onClick={save} className="flex-[2] py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ذخیره</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
