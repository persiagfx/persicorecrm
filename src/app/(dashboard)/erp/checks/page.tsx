"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatToman } from "@/lib/finance/iran-tax";

interface Check {
  id: string;
  checkNumber: string;
  account: { id: string; name: string; bankName: string; accountNumber: string } | null;
  type: string;
  amount: number;
  dueDate: string;
  payee: string;
  status: string;
}

interface BankAccount {
  id: string;
  name: string;
  bankName: string;
}

type DueBucket = "overdue" | "week" | "month" | "future" | "all";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "در جریان", color: "bg-yellow-100 text-yellow-800" },
  cleared: { label: "وصول شده", color: "bg-green-100 text-green-800" },
  bounced: { label: "برگشتی", color: "bg-red-100 text-red-800" },
  cancelled: { label: "ابطال شده", color: "bg-gray-100 text-gray-800" },
};

function getDueBucket(dueDate: string, status: string): DueBucket {
  if (status !== "pending") return "all";
  const diff = (new Date(dueDate).getTime() - Date.now()) / 86400000;
  if (diff < 0) return "overdue";
  if (diff <= 7) return "week";
  if (diff <= 30) return "month";
  return "future";
}

export default function ChecksPage() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ checkNumber: "", bankAccountId: "", type: "issued", amount: "", dueDate: "", payee: "", description: "" });

  const load = async () => {
    const params = new URLSearchParams();
    if (filterStatus !== "all") params.set("status", filterStatus);
    const r = await fetch(`/api/erp/checks${params.size ? "?" + params : ""}`);
    const d = await r.json();
    setChecks(d.data ?? []);
    setLoading(false);
  };

  const loadBankAccounts = async () => {
    const r = await fetch("/api/erp/bank-accounts");
    const d = await r.json();
    setBankAccounts(d.data?.accounts ?? d.data ?? []);
  };

  useEffect(() => { load(); loadBankAccounts(); }, [filterStatus]);

  const handleCreate = async () => {
    await fetch("/api/erp/checks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) * 10 }),
    });
    setOpen(false);
    setForm({ checkNumber: "", bankAccountId: "", type: "issued", amount: "", dueDate: "", payee: "", description: "" });
    load();
  };

  const handleStatus = async (id: string, status: string) => {
    await fetch(`/api/erp/checks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, clearedDate: status === "cleared" ? new Date() : undefined }),
    });
    load();
  };

  const filtered = checks.filter(c => filterType === "all" || c.type === filterType);

  const overdue = filtered.filter(c => getDueBucket(c.dueDate, c.status) === "overdue");
  const thisWeek = filtered.filter(c => getDueBucket(c.dueDate, c.status) === "week");
  const thisMonth = filtered.filter(c => getDueBucket(c.dueDate, c.status) === "month");

  const totalPending = filtered.filter(c => c.status === "pending").reduce((s, c) => s + c.amount, 0);
  const totalCleared = filtered.filter(c => c.status === "cleared").reduce((s, c) => s + c.amount, 0);
  const totalBounced = filtered.filter(c => c.status === "bounced").reduce((s, c) => s + c.amount, 0);

  const CheckTable = ({ items }: { items: Check[] }) => (
    items.length === 0 ? (
      <div className="text-center py-8 text-muted-foreground text-sm">موردی یافت نشد</div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-right py-2 px-3">شماره</th>
              <th className="text-right py-2 px-3">بانک</th>
              <th className="text-right py-2 px-3">نوع</th>
              <th className="text-right py-2 px-3">ذی‌نفع</th>
              <th className="text-right py-2 px-3">سررسید</th>
              <th className="text-left py-2 px-3">مبلغ</th>
              <th className="text-right py-2 px-3">وضعیت</th>
              <th className="text-right py-2 px-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {items.map(c => {
              const cfg = STATUS_CONFIG[c.status] ?? { label: c.status, color: "bg-gray-100 text-gray-800" };
              const bucket = getDueBucket(c.dueDate, c.status);
              const rowClass = bucket === "overdue" ? "bg-red-50" : bucket === "week" ? "bg-yellow-50" : "";
              return (
                <tr key={c.id} className={`border-b hover:bg-muted/50 ${rowClass}`}>
                  <td className="py-2 px-3 font-mono">{c.checkNumber}</td>
                  <td className="py-2 px-3">{c.account?.name ?? c.account?.bankName ?? "—"}</td>
                  <td className="py-2 px-3">{c.type === "issued" ? "صادره" : "دریافتی"}</td>
                  <td className="py-2 px-3">{c.payee ?? "—"}</td>
                  <td className="py-2 px-3">
                    <span>{new Date(c.dueDate).toLocaleDateString("fa-IR")}</span>
                    {bucket === "overdue" && <span className="mr-1 text-xs text-red-600">(سررسید گذشته)</span>}
                  </td>
                  <td className="py-2 px-3 text-right font-mono">{formatToman(c.amount)}</td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                  </td>
                  <td className="py-2 px-3">
                    {c.status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-6 text-xs text-green-600 border-green-300"
                          onClick={() => handleStatus(c.id, "cleared")}>وصول</Button>
                        <Button size="sm" variant="outline" className="h-6 text-xs text-red-600 border-red-300"
                          onClick={() => handleStatus(c.id, "bounced")}>برگشتی</Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">مدیریت چک</h1>
          {(overdue.length > 0 || thisWeek.length > 0) && (
            <div className="flex gap-3 mt-1">
              {overdue.length > 0 && <p className="text-red-600 text-sm">{overdue.length} چک سررسید گذشته</p>}
              {thisWeek.length > 0 && <p className="text-yellow-600 text-sm">{thisWeek.length} چک طی ۷ روز آینده سررسید دارد</p>}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه</SelectItem>
              <SelectItem value="issued">صادره</SelectItem>
              <SelectItem value="received">دریافتی</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه وضعیت‌ها</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>چک جدید</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>ثبت چک</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>شماره چک</Label>
                    <Input value={form.checkNumber} onChange={e => setForm(f => ({ ...f, checkNumber: e.target.value }))} />
                  </div>
                  <div>
                    <Label>نوع</Label>
                    <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="issued">صادره</SelectItem>
                        <SelectItem value="received">دریافتی</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>حساب بانکی</Label>
                  <Select value={form.bankAccountId} onValueChange={v => setForm(f => ({ ...f, bankAccountId: v }))}>
                    <SelectTrigger><SelectValue placeholder="انتخاب حساب" /></SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.name} — {b.bankName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>مبلغ (تومان)</Label>
                    <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                  </div>
                  <div>
                    <Label>تاریخ سررسید</Label>
                    <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>نام ذی‌نفع</Label>
                  <Input value={form.payee} onChange={e => setForm(f => ({ ...f, payee: e.target.value }))} />
                </div>
                <Button className="w-full" onClick={handleCreate}
                  disabled={!form.checkNumber || !form.amount || !form.dueDate}>
                  ثبت چک
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6">
          <div className="text-2xl font-bold text-yellow-600">{totalPending.toLocaleString("fa-IR")}</div>
          <div className="text-sm text-muted-foreground">در جریان (ریال)</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="text-2xl font-bold text-green-600">{totalCleared.toLocaleString("fa-IR")}</div>
          <div className="text-sm text-muted-foreground">وصول شده (ریال)</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="text-2xl font-bold text-red-600">{totalBounced.toLocaleString("fa-IR")}</div>
          <div className="text-sm text-muted-foreground">برگشتی (ریال)</div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">بر اساس سررسید</TabsTrigger>
          <TabsTrigger value="all">همه چک‌ها ({filtered.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          {overdue.length > 0 && (
            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-600">سررسید گذشته ({overdue.length})</CardTitle>
              </CardHeader>
              <CardContent><CheckTable items={overdue} /></CardContent>
            </Card>
          )}
          {thisWeek.length > 0 && (
            <Card className="border-yellow-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-yellow-600">این هفته ({thisWeek.length})</CardTitle>
              </CardHeader>
              <CardContent><CheckTable items={thisWeek} /></CardContent>
            </Card>
          )}
          {thisMonth.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">این ماه ({thisMonth.length})</CardTitle>
              </CardHeader>
              <CardContent><CheckTable items={thisMonth} /></CardContent>
            </Card>
          )}
          {overdue.length === 0 && thisWeek.length === 0 && thisMonth.length === 0 && (
            <Card><CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">چک در جریانی با سررسید نزدیک وجود ندارد</div>
            </CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardContent className="pt-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
              ) : <CheckTable items={filtered} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
