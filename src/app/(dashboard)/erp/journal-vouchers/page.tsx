"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatToman, rialToToman } from "@/lib/finance/iran-tax";
import { toast } from "sonner";

interface Account { id: string; code: string; nameFa: string; type: string; }
interface JournalLine {
  accountId: string;
  debit: number;
  credit: number;
  note: string;
}
interface SavedLine extends JournalLine {
  account: { code: string; nameFa: string };
}
interface Voucher {
  id: string;
  number: number;
  date: string;
  description: string;
  status: string;
  createdBy: { name: string };
  lines: SavedLine[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "پیش‌نویس", color: "bg-yellow-100 text-yellow-800" },
  posted: { label: "ثبت نهایی", color: "bg-green-100 text-green-800" },
  cancelled: { label: "ابطال", color: "bg-gray-100 text-gray-800" },
};

const EMPTY_LINE: JournalLine = { accountId: "", debit: 0, credit: 0, note: "" };

export default function JournalVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [detailVoucher, setDetailVoucher] = useState<Voucher | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], description: "" });
  const [lines, setLines] = useState<JournalLine[]>([{ ...EMPTY_LINE }, { ...EMPTY_LINE }]);
  const [saving, setSaving] = useState(false);

  // بستن سال مالی
  const [closeYear, setCloseYear] = useState(new Date().getFullYear());
  const [closePreview, setClosePreview] = useState<{ totalRevenue: number; totalExpenses: number; revenues: { code: string; name: string; balance: number }[]; expenses: { code: string; name: string; balance: number }[] } | null>(null);
  const [closing, setClosing] = useState(false);

  const loadVouchers = useCallback(async () => {
    setLoading(true);
    const params = filterStatus !== "all" ? `?status=${filterStatus}` : "";
    const r = await fetch(`/api/erp/journal-vouchers${params}`);
    const d = await r.json();
    setVouchers(d.data ?? []);
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => {
    loadVouchers();
    fetch("/api/erp/chart-of-accounts").then(r => r.json()).then(d => setAccounts(d.data ?? []));
  }, [loadVouchers]);

  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const isBalanced = totalDebit > 0 && totalDebit === totalCredit;

  const addLine = () => setLines(ls => [...ls, { ...EMPTY_LINE }]);
  const removeLine = (i: number) => setLines(ls => ls.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: keyof JournalLine, value: string | number) =>
    setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [field]: value } : l));

  const handleCreate = async () => {
    if (!isBalanced) return;
    setSaving(true);
    const r = await fetch("/api/erp/journal-vouchers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        lines: lines
          .filter(l => l.accountId)
          .map(l => ({ ...l, debit: (l.debit || 0) * 10, credit: (l.credit || 0) * 10 })),
      }),
    });
    setSaving(false);
    if (r.ok) {
      toast.success("سند ایجاد شد");
      setOpen(false);
      setLines([{ ...EMPTY_LINE }, { ...EMPTY_LINE }]);
      setForm({ date: new Date().toISOString().split("T")[0], description: "" });
      loadVouchers();
    } else {
      const d = await r.json();
      toast.error(d.error ?? "خطا در ایجاد سند");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const r = await fetch(`/api/erp/journal-vouchers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (r.ok) {
      toast.success(status === "posted" ? "سند ثبت نهایی شد" : "سند ابطال شد");
      loadVouchers();
      setDetailVoucher(null);
    } else {
      const d = await r.json();
      toast.error(d.error ?? "خطا");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف شود؟")) return;
    await fetch(`/api/erp/journal-vouchers/${id}`, { method: "DELETE" });
    loadVouchers();
    setDetailVoucher(null);
  };

  const loadClosePreview = async () => {
    const r = await fetch(`/api/erp/fiscal-year/close?year=${closeYear}`);
    const d = await r.json();
    setClosePreview(d.data);
  };

  const handleClose = async () => {
    if (!confirm(`سال مالی ${closeYear} بسته شود؟ این عملیات قابل بازگشت نیست.`)) return;
    setClosing(true);
    const r = await fetch("/api/erp/fiscal-year/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: closeYear }),
    });
    const d = await r.json();
    setClosing(false);
    if (r.ok) {
      toast.success(`${d.data.closingEntriesCount} سند بستن ثبت شد — سود خالص: ${formatToman(d.data.netIncome)}`);
      setClosePreview(null);
    } else {
      toast.error(d.error ?? "خطا");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">اسناد حسابداری</h1>
          <p className="text-muted-foreground">{vouchers.length} سند</p>
        </div>
        <div className="flex gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setOpen(true)}>سند جدید</Button>
        </div>
      </div>

      <Tabs defaultValue="vouchers">
        <TabsList>
          <TabsTrigger value="vouchers">لیست اسناد</TabsTrigger>
          <TabsTrigger value="close">بستن سال مالی</TabsTrigger>
        </TabsList>

        <TabsContent value="vouchers">
          <Card>
            <CardContent className="pt-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
              ) : vouchers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">سندی ثبت نشده</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-2 px-3">شماره</th>
                        <th className="text-right py-2 px-3">تاریخ</th>
                        <th className="text-right py-2 px-3">شرح</th>
                        <th className="text-left py-2 px-3">مبلغ</th>
                        <th className="text-right py-2 px-3">ردیف</th>
                        <th className="text-right py-2 px-3">ثبت‌کننده</th>
                        <th className="text-right py-2 px-3">وضعیت</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {vouchers.map(v => {
                        const totalDebitV = v.lines.reduce((s, l) => s + l.debit, 0);
                        const cfg = STATUS_CONFIG[v.status] ?? { label: v.status, color: "bg-gray-100 text-gray-800" };
                        return (
                          <tr key={v.id} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-3 font-mono font-bold">#{v.number}</td>
                            <td className="py-2 px-3">{new Date(v.date).toLocaleDateString("fa-IR")}</td>
                            <td className="py-2 px-3 max-w-48 truncate">{v.description}</td>
                            <td className="py-2 px-3 text-right font-mono">{formatToman(totalDebitV)}</td>
                            <td className="py-2 px-3">{v.lines.length} ردیف</td>
                            <td className="py-2 px-3 text-muted-foreground">{v.createdBy.name}</td>
                            <td className="py-2 px-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                            </td>
                            <td className="py-2 px-3">
                              <Button size="sm" variant="ghost" className="h-6 text-xs"
                                onClick={() => setDetailVoucher(v)}>
                                جزئیات
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="close">
          <Card>
            <CardHeader><CardTitle>بستن سال مالی (Closing Entries)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                این عملیات مانده حساب‌های درآمد و هزینه را صفر کرده و به حساب سود انباشته (۳۰۰۲) منتقل می‌کند.
                ابتدا پیش‌نمایش را بررسی کنید.
              </p>
              <div className="flex gap-3 items-end">
                <div>
                  <Label>سال میلادی</Label>
                  <Input type="number" value={closeYear} onChange={e => setCloseYear(Number(e.target.value))} className="w-28" />
                </div>
                <Button variant="outline" onClick={loadClosePreview}>پیش‌نمایش</Button>
                {closePreview && (
                  <Button variant="destructive" onClick={handleClose} disabled={closing}>
                    {closing ? "در حال بستن..." : `بستن سال ${closeYear}`}
                  </Button>
                )}
              </div>

              {closePreview && (
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-green-700">{formatToman(closePreview.totalRevenue)}</div>
                      <div className="text-xs text-muted-foreground">درآمد سال</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-red-700">{formatToman(closePreview.totalExpenses)}</div>
                      <div className="text-xs text-muted-foreground">هزینه سال</div>
                    </div>
                    <div className={`rounded-lg p-3 text-center ${closePreview.totalRevenue - closePreview.totalExpenses >= 0 ? "bg-blue-50" : "bg-orange-50"}`}>
                      <div className={`text-lg font-bold ${closePreview.totalRevenue - closePreview.totalExpenses >= 0 ? "text-blue-700" : "text-orange-700"}`}>
                        {formatToman(closePreview.totalRevenue - closePreview.totalExpenses)}
                      </div>
                      <div className="text-xs text-muted-foreground">سود خالص انتقالی</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-green-700 mb-2">حساب‌های درآمد</h4>
                      {closePreview.revenues.map(r => (
                        <div key={r.code} className="flex justify-between text-xs py-1 border-b">
                          <span className="font-mono text-muted-foreground">{r.code}</span>
                          <span>{r.name}</span>
                          <span className="font-mono">{rialToToman(r.balance).toLocaleString("fa-IR")}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-red-700 mb-2">حساب‌های هزینه</h4>
                      {closePreview.expenses.map(e => (
                        <div key={e.code} className="flex justify-between text-xs py-1 border-b">
                          <span className="font-mono text-muted-foreground">{e.code}</span>
                          <span>{e.name}</span>
                          <span className="font-mono">{rialToToman(e.balance).toLocaleString("fa-IR")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* دیالوگ سند جدید */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>سند حسابداری جدید</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>تاریخ</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <Label>شرح سند</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="شرح کلی سند..." />
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-right py-2 px-3 w-64">حساب</th>
                    <th className="text-left py-2 px-3 w-32">بدهکار (تومان)</th>
                    <th className="text-left py-2 px-3 w-32">بستانکار (تومان)</th>
                    <th className="text-right py-2 px-3">شرح ردیف</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-1.5 px-2">
                        <Select value={line.accountId} onValueChange={v => updateLine(i, "accountId", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="انتخاب حساب" /></SelectTrigger>
                          <SelectContent>
                            {accounts.map(a => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.code} — {a.nameFa}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-1.5 px-2">
                        <Input
                          type="number" className="h-8 text-xs text-right"
                          value={line.debit || ""}
                          onChange={e => {
                            updateLine(i, "debit", Number(e.target.value));
                            if (Number(e.target.value) > 0) updateLine(i, "credit", 0);
                          }}
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <Input
                          type="number" className="h-8 text-xs text-right"
                          value={line.credit || ""}
                          onChange={e => {
                            updateLine(i, "credit", Number(e.target.value));
                            if (Number(e.target.value) > 0) updateLine(i, "debit", 0);
                          }}
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <Input className="h-8 text-xs" value={line.note} onChange={e => updateLine(i, "note", e.target.value)} placeholder="توضیح..." />
                      </td>
                      <td className="py-1.5 px-2">
                        {lines.length > 2 && (
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500" onClick={() => removeLine(i)}>×</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 bg-muted/30">
                  <tr>
                    <td className="py-2 px-3 font-semibold text-sm">جمع</td>
                    <td className={`py-2 px-3 text-right font-mono font-bold ${totalDebit > 0 && totalDebit !== totalCredit ? "text-red-600" : ""}`}>
                      {totalDebit.toLocaleString("fa-IR")}
                    </td>
                    <td className={`py-2 px-3 text-right font-mono font-bold ${totalCredit > 0 && totalDebit !== totalCredit ? "text-red-600" : ""}`}>
                      {totalCredit.toLocaleString("fa-IR")}
                    </td>
                    <td colSpan={2}>
                      {totalDebit > 0 && totalDebit !== totalCredit && (
                        <span className="text-xs text-red-600">سند متوازن نیست (اختلاف: {Math.abs(totalDebit - totalCredit).toLocaleString("fa-IR")})</span>
                      )}
                      {isBalanced && <span className="text-xs text-green-600">سند متوازن ✓</span>}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={addLine}>+ افزودن ردیف</Button>
              <Button onClick={handleCreate} disabled={!isBalanced || !form.description || saving}>
                {saving ? "در حال ذخیره..." : "ذخیره سند"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* دیالوگ جزئیات سند */}
      {detailVoucher && (
        <Dialog open={!!detailVoucher} onOpenChange={() => setDetailVoucher(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>سند #{detailVoucher.number} — {detailVoucher.description}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>تاریخ: {new Date(detailVoucher.date).toLocaleDateString("fa-IR")}</span>
                <span>ثبت‌کننده: {detailVoucher.createdBy.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_CONFIG[detailVoucher.status]?.color ?? ""}`}>
                  {STATUS_CONFIG[detailVoucher.status]?.label ?? detailVoucher.status}
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2 px-2">کد</th>
                    <th className="text-right py-2 px-2">حساب</th>
                    <th className="text-left py-2 px-2">بدهکار</th>
                    <th className="text-left py-2 px-2">بستانکار</th>
                    <th className="text-right py-2 px-2">شرح</th>
                  </tr>
                </thead>
                <tbody>
                  {detailVoucher.lines.map((l, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-1.5 px-2 font-mono text-xs">{l.account.code}</td>
                      <td className="py-1.5 px-2">{l.account.nameFa}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-blue-700">{l.debit ? formatToman(l.debit) : "—"}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-green-700">{l.credit ? formatToman(l.credit) : "—"}</td>
                      <td className="py-1.5 px-2 text-xs text-muted-foreground">{l.note ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 font-bold">
                  <tr>
                    <td colSpan={2} className="py-2 px-2">جمع</td>
                    <td className="py-2 px-2 text-right font-mono">{formatToman(detailVoucher.lines.reduce((s, l) => s + l.debit, 0))}</td>
                    <td className="py-2 px-2 text-right font-mono">{formatToman(detailVoucher.lines.reduce((s, l) => s + l.credit, 0))}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
              {detailVoucher.status === "draft" && (
                <div className="flex gap-3 justify-end">
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(detailVoucher.id)}>حذف</Button>
                  <Button variant="outline" size="sm" onClick={() => handleStatusChange(detailVoucher.id, "cancelled")}>ابطال</Button>
                  <Button size="sm" onClick={() => handleStatusChange(detailVoucher.id, "posted")}>ثبت نهایی</Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
