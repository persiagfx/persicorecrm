"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  iban: string | null;
  currency: string;
  balance: number;
  isActive: boolean;
  _count: { transactions: number; checks: number };
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string | null;
  reference: string | null;
  category: string | null;
}

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<{ transactions: Transaction[]; totalInflow?: number; totalOutflow?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [openAccount, setOpenAccount] = useState(false);
  const [openTx, setOpenTx] = useState(false);
  const [form, setForm] = useState({ name: "", bankName: "", accountNumber: "", iban: "", currency: "IRR" });
  const [txForm, setTxForm] = useState({ type: "credit", amount: "", date: new Date().toISOString().split("T")[0], description: "", reference: "", category: "" });

  const loadAccounts = async () => {
    const r = await fetch("/api/erp/bank-accounts");
    const d = await r.json();
    setAccounts(d.data ?? []);
    setLoading(false);
  };

  const loadTransactions = async (id: string) => {
    const r = await fetch(`/api/erp/bank-accounts/${id}/transactions`);
    const d = await r.json();
    setTransactions(d.data ?? null);
  };

  useEffect(() => { loadAccounts(); }, []);
  useEffect(() => { if (selectedAccount) loadTransactions(selectedAccount); }, [selectedAccount]);

  const handleCreateAccount = async () => {
    await fetch("/api/erp/bank-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setOpenAccount(false);
    loadAccounts();
  };

  const handleCreateTx = async () => {
    if (!selectedAccount) return;
    await fetch(`/api/erp/bank-accounts/${selectedAccount}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...txForm, amount: parseFloat(txForm.amount) }),
    });
    setOpenTx(false);
    loadAccounts();
    loadTransactions(selectedAccount);
  };

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">حساب‌های بانکی</h1>
          <p className="text-muted-foreground">موجودی کل: {totalBalance.toLocaleString("fa-IR")} ریال</p>
        </div>
        <Dialog open={openAccount} onOpenChange={setOpenAccount}>
          <DialogTrigger asChild><Button>حساب جدید</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>افزودن حساب بانکی</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>نام حساب *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="حساب جاری مرکزی" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>نام بانک *</Label>
                  <Input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} />
                </div>
                <div>
                  <Label>شماره حساب *</Label>
                  <Input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>شبا</Label>
                <Input value={form.iban} onChange={e => setForm(f => ({ ...f, iban: e.target.value }))} placeholder="IR..." />
              </div>
              <Button className="w-full" onClick={handleCreateAccount} disabled={!form.name || !form.bankName || !form.accountNumber}>ثبت حساب</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {accounts.map(acc => (
          <Card
            key={acc.id}
            className={`cursor-pointer hover:shadow-md transition-shadow ${selectedAccount === acc.id ? "ring-2 ring-primary" : ""}`}
            onClick={() => setSelectedAccount(acc.id)}
          >
            <CardContent className="pt-4">
              <div className="font-semibold">{acc.name}</div>
              <div className="text-sm text-muted-foreground">{acc.bankName}</div>
              <div className="text-xs text-muted-foreground font-mono mt-1">{acc.accountNumber}</div>
              <div className="text-2xl font-bold mt-3">{acc.balance.toLocaleString("fa-IR")}</div>
              <div className="text-xs text-muted-foreground">{acc.currency} • {acc._count.transactions} تراکنش</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedAccount && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>تراکنش‌ها</CardTitle>
            <div className="flex gap-2">
              {transactions && (
                <div className="text-sm text-muted-foreground">
                  ورودی: {transactions.totalInflow?.toLocaleString("fa-IR")} | خروجی: {transactions.totalOutflow?.toLocaleString("fa-IR")}
                </div>
              )}
              <Dialog open={openTx} onOpenChange={setOpenTx}>
                <DialogTrigger asChild><Button size="sm">تراکنش جدید</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>ثبت تراکنش</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>نوع</Label>
                        <Select value={txForm.type} onValueChange={v => setTxForm(f => ({ ...f, type: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="credit">واریز</SelectItem>
                            <SelectItem value="debit">برداشت</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>مبلغ</Label>
                        <Input type="number" value={txForm.amount} onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <Label>تاریخ</Label>
                      <Input type="date" value={txForm.date} onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))} />
                    </div>
                    <div>
                      <Label>شرح</Label>
                      <Input value={txForm.description} onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div>
                      <Label>شماره مرجع</Label>
                      <Input value={txForm.reference} onChange={e => setTxForm(f => ({ ...f, reference: e.target.value }))} />
                    </div>
                    <Button className="w-full" onClick={handleCreateTx} disabled={!txForm.amount}>ثبت</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {!transactions ? (
              <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
            ) : transactions.transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">تراکنشی ثبت نشده</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-2 px-3">تاریخ</th>
                      <th className="text-right py-2 px-3">نوع</th>
                      <th className="text-right py-2 px-3">شرح</th>
                      <th className="text-right py-2 px-3">مرجع</th>
                      <th className="text-left py-2 px-3">مبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.transactions.map(t => (
                      <tr key={t.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">{t.date.slice(0, 10)}</td>
                        <td className="py-2 px-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${t.type === "credit" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {t.type === "credit" ? "واریز" : "برداشت"}
                          </span>
                        </td>
                        <td className="py-2 px-3">{t.description ?? "—"}</td>
                        <td className="py-2 px-3 text-muted-foreground">{t.reference ?? "—"}</td>
                        <td className={`py-2 px-3 text-right font-mono ${t.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                          {t.type === "credit" ? "+" : "-"}{t.amount.toLocaleString("fa-IR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
