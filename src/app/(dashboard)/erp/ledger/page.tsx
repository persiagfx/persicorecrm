"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { BookOpen, Plus, Search, Zap } from "lucide-react";
import { formatToman, rialToToman } from "@/lib/finance/iran-tax";

interface Account { id: string; code: string; name: string; nameFa: string; type: string; }
interface PostStatus {
  invoices: { total: number; unposted: number };
  expenses: { total: number; unposted: number };
  payrolls: { total: number; unposted: number };
}
interface LedgerEntry {
  id: string; amount: number; date: string; description: string | null; reference: string | null;
  debitAccount: { id: string; code: string; name: string };
  creditAccount: { id: string; code: string; name: string };
  createdBy: { id: string; name: string };
}

const fa = (n: number) => n.toLocaleString("fa-IR");
const today = () => new Date().toISOString().split("T")[0];

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [postStatus, setPostStatus] = useState<PostStatus | null>(null);
  const [posting, setPosting] = useState(false);
  const [form, setForm] = useState({
    debitAccountId: "", creditAccountId: "", amountToman: "",
    date: today(), description: "", reference: "",
  });

  const loadPostStatus = async () => {
    const r = await fetch("/api/erp/ledger/post");
    const d = await r.json();
    setPostStatus(d.data ?? null);
  };

  const postAll = async () => {
    setPosting(true);
    try {
      const r = await fetch("/api/erp/ledger/post", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "all" }) });
      const d = await r.json();
      if (r.ok) {
        toast.success(`${(d.data?.postedDocs ?? 0).toLocaleString("fa-IR")} سند صادر شد (${(d.data?.createdEntries ?? 0).toLocaleString("fa-IR")} ثبت)`);
        load(); loadPostStatus();
      } else toast.error(d.error ?? "خطا در صدور سند");
    } finally { setPosting(false); }
  };

  const loadAccounts = async () => {
    const r = await fetch("/api/erp/chart-of-accounts");
    const d = await r.json();
    setAccounts(d.data ?? []);
  };

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const r = await fetch(`/api/erp/ledger?${params}`);
    const d = await r.json();
    setEntries(d.data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadAccounts(); loadPostStatus(); }, []);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [from, to]);

  const accountLabel = (a: Account) => `${a.code} — ${a.nameFa || a.name}`;
  const amountRial = (Number(form.amountToman) || 0) * 10;
  const sameAccount = form.debitAccountId && form.debitAccountId === form.creditAccountId;
  const valid = form.debitAccountId && form.creditAccountId && !sameAccount && amountRial > 0;

  const handleCreate = async () => {
    if (!valid) return;
    const r = await fetch("/api/erp/ledger", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        debitAccountId: form.debitAccountId, creditAccountId: form.creditAccountId,
        amount: amountRial, date: form.date, description: form.description, reference: form.reference,
      }),
    });
    if (r.ok) {
      setOpen(false);
      setForm({ debitAccountId: "", creditAccountId: "", amountToman: "", date: today(), description: "", reference: "" });
      toast.success("سند ثبت شد");
      load();
    } else {
      const d = await r.json();
      toast.error(d.error ?? "خطا در ثبت سند");
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.trim().toLowerCase();
    return entries.filter((e) =>
      (e.description ?? "").toLowerCase().includes(q) ||
      (e.reference ?? "").toLowerCase().includes(q) ||
      e.debitAccount.name.toLowerCase().includes(q) ||
      e.creditAccount.name.toLowerCase().includes(q) ||
      e.debitAccount.code.includes(q) || e.creditAccount.code.includes(q),
    );
  }, [entries, search]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="w-6 h-6 text-primary" />دفتر روزنامه</h1>
          <p className="text-muted-foreground text-sm">{fa(filtered.length)} سند · جمع گردش: {formatToman(total)}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1"><Plus className="w-4 h-4" />سند جدید</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>ثبت سند حسابداری</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>حساب بدهکار</Label>
                <Select value={form.debitAccountId} onValueChange={(v) => setForm((f) => ({ ...f, debitAccountId: v }))}>
                  <SelectTrigger><SelectValue placeholder="انتخاب حساب بدهکار" /></SelectTrigger>
                  <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{accountLabel(a)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>حساب بستانکار</Label>
                <Select value={form.creditAccountId} onValueChange={(v) => setForm((f) => ({ ...f, creditAccountId: v }))}>
                  <SelectTrigger><SelectValue placeholder="انتخاب حساب بستانکار" /></SelectTrigger>
                  <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{accountLabel(a)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {sameAccount && <p className="text-xs text-red-600">حساب بدهکار و بستانکار نمی‌توانند یکسان باشند.</p>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>مبلغ (تومان)</Label>
                  <Input type="number" value={form.amountToman} onChange={(e) => setForm((f) => ({ ...f, amountToman: e.target.value }))} />
                  {amountRial > 0 && <p className="text-xs text-muted-foreground mt-0.5">{fa(amountRial)} ریال</p>}
                </div>
                <div><Label>تاریخ</Label><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></div>
              </div>
              <div><Label>شماره مرجع / عطف</Label><Input value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} placeholder="مثلاً INV-1024" /></div>
              <div><Label>شرح سند</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
              <Button className="w-full" onClick={handleCreate} disabled={!valid}>ثبت سند</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {postStatus && (postStatus.invoices.unposted + postStatus.expenses.unposted + postStatus.payrolls.unposted > 0) && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-primary shrink-0" />
              <div className="text-sm">
                <div className="font-medium">صدور خودکار سند از اسناد منبع</div>
                <div className="text-muted-foreground text-xs mt-0.5">
                  {fa(postStatus.invoices.unposted)} فاکتور · {fa(postStatus.expenses.unposted)} هزینه · {fa(postStatus.payrolls.unposted)} فیش حقوق آمادهٔ صدور
                </div>
              </div>
            </div>
            <Button onClick={postAll} disabled={posting} className="gap-1">
              <Zap className="w-4 h-4" />{posting ? "در حال صدور..." : "صدور خودکار اسناد"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex gap-3 items-end flex-wrap">
            <div><Label className="text-xs">از تاریخ</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" /></div>
            <div><Label className="text-xs">تا تاریخ</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" /></div>
            <div className="flex-1 min-w-48">
              <Label className="text-xs">جستجو</Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute right-2 top-2.5 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="شرح، مرجع یا نام/کد حساب" className="pr-8" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
            : filtered.length === 0 ? <div className="text-center py-12 text-muted-foreground">سندی یافت نشد</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs">
                    <th className="text-right py-2 px-3">تاریخ</th>
                    <th className="text-right py-2 px-3">شرح</th>
                    <th className="text-right py-2 px-3">حساب بدهکار</th>
                    <th className="text-right py-2 px-3">حساب بستانکار</th>
                    <th className="text-left py-2 px-3">مبلغ (تومان)</th>
                    <th className="text-right py-2 px-3">مرجع</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3 text-xs whitespace-nowrap">{new Date(e.date).toLocaleDateString("fa-IR")}</td>
                      <td className="py-2 px-3">{e.description ?? "—"}</td>
                      <td className="py-2 px-3 text-blue-700"><span className="font-mono text-xs">{e.debitAccount.code}</span> {e.debitAccount.name}</td>
                      <td className="py-2 px-3 text-green-700"><span className="font-mono text-xs">{e.creditAccount.code}</span> {e.creditAccount.name}</td>
                      <td className="py-2 px-3 text-left font-mono">{fa(rialToToman(e.amount))}</td>
                      <td className="py-2 px-3 text-muted-foreground text-xs">{e.reference ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold bg-muted/40">
                    <td className="py-2 px-3" colSpan={4}>جمع گردش</td>
                    <td className="py-2 px-3 text-left font-mono">{fa(rialToToman(total))}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
