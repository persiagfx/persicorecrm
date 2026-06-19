"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatToman, rialToToman } from "@/lib/finance/iran-tax";
import {
  exportBalanceSheetPDF, exportProfitLossPDF,
  exportTrialBalancePDF, exportAgedReceivablesPDF,
} from "@/lib/finance/pdf-export";

const fa = (n: number) => n.toLocaleString("fa-IR");

interface TrialBalanceRow { id: string; code: string; name: string; type: string; debitTurnover: number; creditTurnover: number; debitBalance: number; creditBalance: number; }
interface TrialBalanceData { rows: TrialBalanceRow[]; totals: { debitTurnover: number; creditTurnover: number; debitBalance: number; creditBalance: number }; balanced: boolean; }
interface GLRow { id: string; date: string; description: string; reference: string | null; counterAccount: string; debit: number; credit: number; balance: number; }
interface GLData { account: { code: string; name: string }; opening: number; rows: GLRow[]; totalDebit: number; totalCredit: number; closing: number; }
interface AgedData {
  rows: { id: string; invoiceNumber?: string; title?: string; client?: string; outstanding?: number; amount?: number; dueDate?: string; date?: string; daysOverdue?: number; daysElapsed?: number; bucket: string; status?: string }[];
  byClient?: { client: string; total: number; current: number; d1_30: number; d31_60: number; d61_90: number; d90plus: number }[];
  byCategory?: { category: string; total: number; current: number; d1_30: number; d31_60: number; d61_90: number; d90plus: number }[];
  buckets: { current: number; d1_30: number; d31_60: number; d61_90: number; d90plus: number };
  totalOutstanding?: number; totalPayable?: number; count: number;
}
interface AccountOption { id: string; code: string; nameFa: string; name: string; }

interface BalanceSheetData {
  asOf: string;
  assets: { code: string; name: string; balance: number }[];
  liabilities: { code: string; name: string; balance: number }[];
  equity: { code: string; name: string; balance: number }[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  balanced: boolean;
}

interface PLData {
  from: string;
  to: string;
  revenues: { code: string; name: string; amount: number }[];
  expenses: { code: string; name: string; amount: number }[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

interface CashFlowData {
  from: string;
  to: string;
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  byMonth: { month: string; inflow: number; outflow: number; net: number }[];
}

export default function ERPReportsPage() {
  const [tab, setTab] = useState("pl");
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]);
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [asOf, setAsOf] = useState(new Date().toISOString().split("T")[0]);
  const [bs, setBS] = useState<BalanceSheetData | null>(null);
  const [pl, setPL] = useState<PLData | null>(null);
  const [cf, setCF] = useState<CashFlowData | null>(null);
  const [tb, setTB] = useState<TrialBalanceData | null>(null);
  const [gl, setGL] = useState<GLData | null>(null);
  const [ar, setAR] = useState<AgedData | null>(null);
  const [ap, setAP] = useState<AgedData | null>(null);
  const [ratios, setRatios] = useState<{ currentRatio: number; quickRatio: number; debtRatio: number; netProfitMargin: number; revenueYtd: number; expensesYtd: number; netIncome: number } | null>(null);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [glAccountId, setGlAccountId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/erp/chart-of-accounts").then((r) => r.json()).then((d) => setAccounts(d.data ?? []));
  }, []);

  const loadReport = async (type: string) => {
    setLoading(true);
    try {
      if (type === "balance-sheet") {
        const r = await fetch(`/api/erp/reports/balance-sheet?asOf=${asOf}`);
        const d = await r.json();
        setBS(d.data);
      } else if (type === "pl") {
        const r = await fetch(`/api/erp/reports/profit-loss?from=${from}&to=${to}`);
        const d = await r.json();
        setPL(d.data);
      } else if (type === "cf") {
        const r = await fetch(`/api/erp/reports/cash-flow?from=${from}&to=${to}`);
        const d = await r.json();
        setCF(d.data);
      } else if (type === "tb") {
        const r = await fetch(`/api/erp/reports/trial-balance?from=${from}&to=${to}`);
        const d = await r.json();
        setTB(d.data);
      } else if (type === "gl") {
        if (!glAccountId) { setGL(null); return; }
        const r = await fetch(`/api/erp/reports/general-ledger?accountId=${glAccountId}&from=${from}&to=${to}`);
        const d = await r.json();
        setGL(d.data);
      } else if (type === "ar") {
        const r = await fetch(`/api/erp/reports/aged-receivables`);
        const d = await r.json();
        setAR(d.data);
      } else if (type === "ap") {
        const r = await fetch(`/api/erp/reports/aged-payables`);
        const d = await r.json();
        setAP(d.data);
      } else if (type === "ratios") {
        const [bsR, plR] = await Promise.all([
          fetch(`/api/erp/reports/balance-sheet?asOf=${asOf}`).then(r => r.json()),
          fetch(`/api/erp/reports/profit-loss?from=${from}&to=${to}`).then(r => r.json()),
        ]);
        const b = bsR.data as BalanceSheetData | null;
        const p = plR.data as PLData | null;
        if (b && p) {
          const currentAssets = b.assets.filter(a => a.code.startsWith("1")).reduce((s, a) => s + a.balance, 0);
          const currentLiabilities = b.liabilities.filter(l => l.code.startsWith("2")).reduce((s, l) => s + l.balance, 0);
          const cash = b.assets.filter(a => a.code.startsWith("10")).reduce((s, a) => s + a.balance, 0);
          setRatios({
            currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
            quickRatio: currentLiabilities > 0 ? cash / currentLiabilities : 0,
            debtRatio: b.totalAssets > 0 ? b.totalLiabilities / b.totalAssets : 0,
            netProfitMargin: p.totalRevenue > 0 ? p.netIncome / p.totalRevenue : 0,
            revenueYtd: p.totalRevenue,
            expensesYtd: p.totalExpenses,
            netIncome: p.netIncome,
          });
        }
      }
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const key = tab === "bs" ? "balance-sheet" : tab;
    loadReport(key); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">گزارش‌های مالی</h1>
        <p className="text-muted-foreground">سود و زیان، ترازنامه، جریان نقدی</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="pl">سود و زیان</TabsTrigger>
          <TabsTrigger value="bs">ترازنامه</TabsTrigger>
          <TabsTrigger value="cf">جریان نقدی</TabsTrigger>
          <TabsTrigger value="tb">تراز آزمایشی</TabsTrigger>
          <TabsTrigger value="gl">دفتر کل / معین</TabsTrigger>
          <TabsTrigger value="ar">سنی بدهکاران</TabsTrigger>
          <TabsTrigger value="ap">سنی بستانکاران</TabsTrigger>
          <TabsTrigger value="ratios">نسبت‌های مالی</TabsTrigger>
        </TabsList>

        <TabsContent value="pl" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex gap-4 items-end flex-wrap">
                <div>
                  <Label>از تاریخ</Label>
                  <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-40" />
                </div>
                <div>
                  <Label>تا تاریخ</Label>
                  <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-40" />
                </div>
                <Button onClick={() => loadReport("pl")}>تولید گزارش</Button>
                {pl && <Button variant="outline" size="sm" onClick={() => exportProfitLossPDF(pl)}>دانلود PDF</Button>}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <div className="text-center py-8 text-muted-foreground">در حال محاسبه...</div> :
                pl ? (
                  <div className="space-y-6">
                    <div className={`p-4 rounded-lg text-center ${pl.netIncome >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                      <div className={`text-3xl font-bold ${pl.netIncome >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {pl.netIncome.toLocaleString("fa-IR")}
                      </div>
                      <div className="text-sm text-muted-foreground">{pl.netIncome >= 0 ? "سود خالص" : "زیان خالص"}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-green-700 mb-2">درآمدها ({pl.totalRevenue.toLocaleString("fa-IR")})</h3>
                        {pl.revenues.map(r => (
                          <div key={r.code} className="flex justify-between text-sm py-1 border-b">
                            <span>{r.name}</span>
                            <span className="font-mono">{r.amount.toLocaleString("fa-IR")}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <h3 className="font-semibold text-red-700 mb-2">هزینه‌ها ({pl.totalExpenses.toLocaleString("fa-IR")})</h3>
                        {pl.expenses.map(e => (
                          <div key={e.code} className="flex justify-between text-sm py-1 border-b">
                            <span>{e.name}</span>
                            <span className="font-mono">{e.amount.toLocaleString("fa-IR")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : <div className="text-center py-8 text-muted-foreground">گزارش را تولید کنید</div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex gap-4 items-end">
                <div>
                  <Label>تا تاریخ</Label>
                  <Input type="date" value={asOf} onChange={e => setAsOf(e.target.value)} className="w-40" />
                </div>
                <Button onClick={() => loadReport("balance-sheet")}>تولید گزارش</Button>
                {bs && <Button variant="outline" size="sm" onClick={() => exportBalanceSheetPDF(bs)}>دانلود PDF</Button>}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <div className="text-center py-8 text-muted-foreground">در حال محاسبه...</div> :
                bs ? (
                  <div className="space-y-4">
                    {!bs.balanced && (
                      <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
                        ترازنامه متوازن نیست! اختلاف = {Math.abs(bs.totalAssets - (bs.totalLiabilities + bs.totalEquity)).toLocaleString("fa-IR")}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-blue-700 mb-2">دارایی‌ها ({bs.totalAssets.toLocaleString("fa-IR")})</h3>
                        {bs.assets.map(a => (
                          <div key={a.code} className="flex justify-between text-sm py-1 border-b">
                            <span><span className="font-mono text-xs text-muted-foreground">{a.code}</span> {a.name}</span>
                            <span className="font-mono">{a.balance.toLocaleString("fa-IR")}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-red-700 mb-2">بدهی‌ها ({bs.totalLiabilities.toLocaleString("fa-IR")})</h3>
                          {bs.liabilities.map(l => (
                            <div key={l.code} className="flex justify-between text-sm py-1 border-b">
                              <span>{l.name}</span>
                              <span className="font-mono">{l.balance.toLocaleString("fa-IR")}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <h3 className="font-semibold text-purple-700 mb-2">حقوق صاحبان ({bs.totalEquity.toLocaleString("fa-IR")})</h3>
                          {bs.equity.map(e => (
                            <div key={e.code} className="flex justify-between text-sm py-1 border-b">
                              <span>{e.name}</span>
                              <span className="font-mono">{e.balance.toLocaleString("fa-IR")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : <div className="text-center py-8 text-muted-foreground">گزارش را تولید کنید</div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cf" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex gap-4 items-end flex-wrap">
                <div>
                  <Label>از تاریخ</Label>
                  <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-40" />
                </div>
                <div>
                  <Label>تا تاریخ</Label>
                  <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-40" />
                </div>
                <Button onClick={() => loadReport("cf")}>تولید گزارش</Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <div className="text-center py-8 text-muted-foreground">در حال محاسبه...</div> :
                cf ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-green-50 rounded-lg text-center">
                        <div className="text-xl font-bold text-green-700">{cf.totalInflow.toLocaleString("fa-IR")}</div>
                        <div className="text-xs text-muted-foreground">جریان ورودی</div>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg text-center">
                        <div className="text-xl font-bold text-red-700">{cf.totalOutflow.toLocaleString("fa-IR")}</div>
                        <div className="text-xs text-muted-foreground">جریان خروجی</div>
                      </div>
                      <div className={`p-3 rounded-lg text-center ${cf.netCashFlow >= 0 ? "bg-blue-50" : "bg-orange-50"}`}>
                        <div className={`text-xl font-bold ${cf.netCashFlow >= 0 ? "text-blue-700" : "text-orange-700"}`}>
                          {cf.netCashFlow.toLocaleString("fa-IR")}
                        </div>
                        <div className="text-xs text-muted-foreground">خالص جریان</div>
                      </div>
                    </div>
                    {cf.byMonth.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">گزارش ماهانه</h3>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-right py-1 px-2">ماه</th>
                              <th className="text-left py-1 px-2">ورودی</th>
                              <th className="text-left py-1 px-2">خروجی</th>
                              <th className="text-left py-1 px-2">خالص</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cf.byMonth.map(m => (
                              <tr key={m.month} className="border-b hover:bg-muted/50">
                                <td className="py-1.5 px-2">{m.month}</td>
                                <td className="py-1.5 px-2 text-right font-mono text-green-700">{m.inflow.toLocaleString("fa-IR")}</td>
                                <td className="py-1.5 px-2 text-right font-mono text-red-700">{m.outflow.toLocaleString("fa-IR")}</td>
                                <td className={`py-1.5 px-2 text-right font-mono ${m.net >= 0 ? "text-blue-700" : "text-orange-700"}`}>
                                  {m.net.toLocaleString("fa-IR")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : <div className="text-center py-8 text-muted-foreground">گزارش را تولید کنید</div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─────────── تراز آزمایشی ─────────── */}
        <TabsContent value="tb" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex gap-4 items-end flex-wrap">
                <div><Label>از تاریخ</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" /></div>
                <div><Label>تا تاریخ</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" /></div>
                <Button onClick={() => loadReport("tb")}>تولید تراز</Button>
                {tb && <Button variant="outline" size="sm" onClick={() => exportTrialBalancePDF({ ...tb, from, to })}>دانلود PDF</Button>}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <div className="text-center py-8 text-muted-foreground">در حال محاسبه...</div> : tb ? (
                <div className="space-y-3">
                  {!tb.balanced && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">⚠️ تراز متوازن نیست — مجموع بدهکار و بستانکار برابر نیست.</div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-xs">
                          <th className="text-right py-2 px-2">کد</th>
                          <th className="text-right py-2 px-2">نام حساب</th>
                          <th className="text-left py-2 px-2">گردش بدهکار</th>
                          <th className="text-left py-2 px-2">گردش بستانکار</th>
                          <th className="text-left py-2 px-2">ماندهٔ بدهکار</th>
                          <th className="text-left py-2 px-2">ماندهٔ بستانکار</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tb.rows.map((r) => (
                          <tr key={r.id} className="border-b hover:bg-muted/40">
                            <td className="py-1.5 px-2 font-mono text-xs">{r.code}</td>
                            <td className="py-1.5 px-2">{r.name}</td>
                            <td className="py-1.5 px-2 text-left font-mono">{r.debitTurnover ? fa(rialToToman(r.debitTurnover)) : "—"}</td>
                            <td className="py-1.5 px-2 text-left font-mono">{r.creditTurnover ? fa(rialToToman(r.creditTurnover)) : "—"}</td>
                            <td className="py-1.5 px-2 text-left font-mono text-blue-700">{r.debitBalance ? fa(rialToToman(r.debitBalance)) : "—"}</td>
                            <td className="py-1.5 px-2 text-left font-mono text-green-700">{r.creditBalance ? fa(rialToToman(r.creditBalance)) : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 font-bold bg-muted/40">
                          <td className="py-2 px-2" colSpan={2}>جمع کل (تومان)</td>
                          <td className="py-2 px-2 text-left font-mono">{fa(rialToToman(tb.totals.debitTurnover))}</td>
                          <td className="py-2 px-2 text-left font-mono">{fa(rialToToman(tb.totals.creditTurnover))}</td>
                          <td className="py-2 px-2 text-left font-mono text-blue-700">{fa(rialToToman(tb.totals.debitBalance))}</td>
                          <td className="py-2 px-2 text-left font-mono text-green-700">{fa(rialToToman(tb.totals.creditBalance))}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : <div className="text-center py-8 text-muted-foreground">تراز را تولید کنید</div>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─────────── دفتر کل / معین ─────────── */}
        <TabsContent value="gl" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex gap-4 items-end flex-wrap">
                <div className="min-w-56">
                  <Label>حساب</Label>
                  <Select value={glAccountId} onValueChange={setGlAccountId}>
                    <SelectTrigger><SelectValue placeholder="انتخاب حساب" /></SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.code} — {a.nameFa || a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>از تاریخ</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" /></div>
                <div><Label>تا تاریخ</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" /></div>
                <Button onClick={() => loadReport("gl")} disabled={!glAccountId}>نمایش دفتر</Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <div className="text-center py-8 text-muted-foreground">در حال محاسبه...</div> : gl ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="font-semibold">{gl.account.code} — {gl.account.name}</h3>
                    <div className="text-sm text-muted-foreground">ماندهٔ اول دوره: <span className="font-mono">{fa(rialToToman(gl.opening))}</span> · ماندهٔ پایان: <span className="font-mono font-bold text-foreground">{fa(rialToToman(gl.closing))}</span> تومان</div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-xs">
                          <th className="text-right py-2 px-2">تاریخ</th>
                          <th className="text-right py-2 px-2">شرح</th>
                          <th className="text-right py-2 px-2">حساب مقابل</th>
                          <th className="text-left py-2 px-2">بدهکار</th>
                          <th className="text-left py-2 px-2">بستانکار</th>
                          <th className="text-left py-2 px-2">مانده</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b bg-muted/30 text-xs"><td className="py-1.5 px-2" colSpan={5}>ماندهٔ ابتدای دوره</td><td className="py-1.5 px-2 text-left font-mono">{fa(rialToToman(gl.opening))}</td></tr>
                        {gl.rows.map((r) => (
                          <tr key={r.id} className="border-b hover:bg-muted/40">
                            <td className="py-1.5 px-2 text-xs">{new Date(r.date).toLocaleDateString("fa-IR")}</td>
                            <td className="py-1.5 px-2">{r.description}{r.reference ? <span className="text-xs text-muted-foreground"> ({r.reference})</span> : null}</td>
                            <td className="py-1.5 px-2 text-xs text-muted-foreground">{r.counterAccount}</td>
                            <td className="py-1.5 px-2 text-left font-mono text-blue-700">{r.debit ? fa(rialToToman(r.debit)) : "—"}</td>
                            <td className="py-1.5 px-2 text-left font-mono text-green-700">{r.credit ? fa(rialToToman(r.credit)) : "—"}</td>
                            <td className="py-1.5 px-2 text-left font-mono">{fa(rialToToman(r.balance))}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 font-bold bg-muted/40">
                          <td className="py-2 px-2" colSpan={3}>جمع گردش (تومان)</td>
                          <td className="py-2 px-2 text-left font-mono text-blue-700">{fa(rialToToman(gl.totalDebit))}</td>
                          <td className="py-2 px-2 text-left font-mono text-green-700">{fa(rialToToman(gl.totalCredit))}</td>
                          <td className="py-2 px-2 text-left font-mono">{fa(rialToToman(gl.closing))}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : <div className="text-center py-8 text-muted-foreground">یک حساب انتخاب کنید</div>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─────────── گزارش سنی بدهکاران ─────────── */}
        <TabsContent value="ar" className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">گزارش سنی بدهکاران</CardTitle>
              <div className="flex gap-2">
                {ar && <Button size="sm" variant="outline" onClick={() => exportAgedReceivablesPDF({ buckets: ar.buckets, totalOutstanding: ar.totalOutstanding ?? 0, byClient: ar.byClient ?? [] })}>PDF</Button>}
                <Button size="sm" variant="outline" onClick={() => loadReport("ar")}>به‌روزرسانی</Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <div className="text-center py-8 text-muted-foreground">در حال محاسبه...</div> : ar ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                    {([
                      ["جاری", ar.buckets.current, "text-green-700 bg-green-50"],
                      ["۱-۳۰ روز", ar.buckets.d1_30, "text-yellow-700 bg-yellow-50"],
                      ["۳۱-۶۰ روز", ar.buckets.d31_60, "text-orange-700 bg-orange-50"],
                      ["۶۱-۹۰ روز", ar.buckets.d61_90, "text-red-700 bg-red-50"],
                      ["+۹۰ روز", ar.buckets.d90plus, "text-red-800 bg-red-100"],
                    ] as const).map(([label, val, cls]) => (
                      <div key={label} className={`rounded-lg p-3 ${cls}`}>
                        <div className="text-sm font-bold font-mono">{fa(rialToToman(val))}</div>
                        <div className="text-xs">{label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">مجموع مطالبات وصول‌نشده: <span className="font-bold text-foreground">{formatToman(ar.totalOutstanding ?? 0)}</span> ({fa(ar.count)} فاکتور)</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-xs">
                          <th className="text-right py-2 px-2">مشتری</th>
                          <th className="text-left py-2 px-2">جاری</th>
                          <th className="text-left py-2 px-2">۱-۳۰</th>
                          <th className="text-left py-2 px-2">۳۱-۶۰</th>
                          <th className="text-left py-2 px-2">۶۱-۹۰</th>
                          <th className="text-left py-2 px-2">+۹۰</th>
                          <th className="text-left py-2 px-2">جمع</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(ar.byClient ?? []).map((c) => (
                          <tr key={c.client} className="border-b hover:bg-muted/40">
                            <td className="py-1.5 px-2 font-medium">{c.client}</td>
                            <td className="py-1.5 px-2 text-left font-mono">{c.current ? fa(rialToToman(c.current)) : "—"}</td>
                            <td className="py-1.5 px-2 text-left font-mono">{c.d1_30 ? fa(rialToToman(c.d1_30)) : "—"}</td>
                            <td className="py-1.5 px-2 text-left font-mono">{c.d31_60 ? fa(rialToToman(c.d31_60)) : "—"}</td>
                            <td className="py-1.5 px-2 text-left font-mono">{c.d61_90 ? fa(rialToToman(c.d61_90)) : "—"}</td>
                            <td className="py-1.5 px-2 text-left font-mono text-red-700">{c.d90plus ? fa(rialToToman(c.d90plus)) : "—"}</td>
                            <td className="py-1.5 px-2 text-left font-mono font-bold">{fa(rialToToman(c.total))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : <div className="text-center py-8 text-muted-foreground">گزارش را تولید کنید</div>}
            </CardContent>
          </Card>
        </TabsContent>
        {/* ─────────── گزارش سنی بستانکاران ─────────── */}
        <TabsContent value="ap" className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">گزارش سنی بستانکاران</CardTitle>
              <Button size="sm" variant="outline" onClick={() => loadReport("ap")}>به‌روزرسانی</Button>
            </CardHeader>
            <CardContent>
              {loading ? <div className="text-center py-8 text-muted-foreground">در حال محاسبه...</div> : ap ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                    {([
                      ["جاری", ap.buckets.current, "text-green-700 bg-green-50"],
                      ["۱-۳۰ روز", ap.buckets.d1_30, "text-yellow-700 bg-yellow-50"],
                      ["۳۱-۶۰ روز", ap.buckets.d31_60, "text-orange-700 bg-orange-50"],
                      ["۶۱-۹۰ روز", ap.buckets.d61_90, "text-red-700 bg-red-50"],
                      ["+۹۰ روز", ap.buckets.d90plus, "text-red-800 bg-red-100"],
                    ] as const).map(([label, val, cls]) => (
                      <div key={label} className={`rounded-lg p-3 ${cls}`}>
                        <div className="text-sm font-bold font-mono">{fa(rialToToman(val))}</div>
                        <div className="text-xs">{label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    مجموع بدهی‌های تأییدشده: <span className="font-bold text-foreground">{formatToman(ap.totalPayable ?? 0)}</span> ({fa(ap.count)} هزینه)
                  </div>
                  {ap.byCategory && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground text-xs">
                            <th className="text-right py-2 px-2">دسته‌بندی</th>
                            <th className="text-left py-2 px-2">جاری</th>
                            <th className="text-left py-2 px-2">۱-۳۰</th>
                            <th className="text-left py-2 px-2">۳۱-۶۰</th>
                            <th className="text-left py-2 px-2">۶۱-۹۰</th>
                            <th className="text-left py-2 px-2">+۹۰</th>
                            <th className="text-left py-2 px-2">جمع</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ap.byCategory.map((c) => (
                            <tr key={c.category} className="border-b hover:bg-muted/40">
                              <td className="py-1.5 px-2 font-medium">{c.category}</td>
                              <td className="py-1.5 px-2 text-left font-mono">{c.current ? fa(rialToToman(c.current)) : "—"}</td>
                              <td className="py-1.5 px-2 text-left font-mono">{c.d1_30 ? fa(rialToToman(c.d1_30)) : "—"}</td>
                              <td className="py-1.5 px-2 text-left font-mono">{c.d31_60 ? fa(rialToToman(c.d31_60)) : "—"}</td>
                              <td className="py-1.5 px-2 text-left font-mono">{c.d61_90 ? fa(rialToToman(c.d61_90)) : "—"}</td>
                              <td className="py-1.5 px-2 text-left font-mono text-red-700">{c.d90plus ? fa(rialToToman(c.d90plus)) : "—"}</td>
                              <td className="py-1.5 px-2 text-left font-mono font-bold">{fa(rialToToman(c.total))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : <div className="text-center py-8 text-muted-foreground">گزارش را تولید کنید</div>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─────────── نسبت‌های مالی ─────────── */}
        <TabsContent value="ratios" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex gap-4 items-end flex-wrap">
                <div><Label>از تاریخ</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-40" /></div>
                <div><Label>تا تاریخ (ترازنامه)</Label><Input type="date" value={asOf} onChange={e => setAsOf(e.target.value)} className="w-40" /></div>
                <Button onClick={() => loadReport("ratios")}>محاسبه نسبت‌ها</Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <div className="text-center py-8 text-muted-foreground">در حال محاسبه...</div> : ratios ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-700">{ratios.currentRatio.toFixed(2)}</div>
                      <div className="text-sm font-medium">نسبت جاری</div>
                      <div className="text-xs text-muted-foreground mt-1">دارایی جاری ÷ بدهی جاری (مطلوب: بالای ۱)</div>
                      <div className={`text-xs mt-1 font-medium ${ratios.currentRatio >= 1 ? "text-green-600" : "text-red-600"}`}>
                        {ratios.currentRatio >= 2 ? "عالی" : ratios.currentRatio >= 1 ? "مطلوب" : "هشدار"}
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-700">{ratios.quickRatio.toFixed(2)}</div>
                      <div className="text-sm font-medium">نسبت آنی</div>
                      <div className="text-xs text-muted-foreground mt-1">موجودی نقد ÷ بدهی جاری (مطلوب: بالای ۰.۵)</div>
                      <div className={`text-xs mt-1 font-medium ${ratios.quickRatio >= 0.5 ? "text-green-600" : "text-red-600"}`}>
                        {ratios.quickRatio >= 1 ? "عالی" : ratios.quickRatio >= 0.5 ? "مطلوب" : "هشدار"}
                      </div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-orange-700">{(ratios.debtRatio * 100).toFixed(1)}%</div>
                      <div className="text-sm font-medium">نسبت بدهی</div>
                      <div className="text-xs text-muted-foreground mt-1">بدهی کل ÷ دارایی کل (مطلوب: زیر ۵۰٪)</div>
                      <div className={`text-xs mt-1 font-medium ${ratios.debtRatio <= 0.5 ? "text-green-600" : "text-red-600"}`}>
                        {ratios.debtRatio <= 0.3 ? "عالی" : ratios.debtRatio <= 0.5 ? "مطلوب" : "هشدار"}
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-700">{(ratios.netProfitMargin * 100).toFixed(1)}%</div>
                      <div className="text-sm font-medium">حاشیهٔ سود خالص</div>
                      <div className="text-xs text-muted-foreground mt-1">سود خالص ÷ درآمد کل</div>
                      <div className={`text-xs mt-1 font-medium ${ratios.netProfitMargin > 0 ? "text-green-600" : "text-red-600"}`}>
                        {ratios.netProfitMargin > 0.2 ? "عالی" : ratios.netProfitMargin > 0 ? "مثبت" : "زیان‌ده"}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="text-xl font-bold">{formatToman(ratios.revenueYtd)}</div>
                      <div className="text-sm text-muted-foreground">درآمد دوره</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="text-xl font-bold">{formatToman(ratios.expensesYtd)}</div>
                      <div className="text-sm text-muted-foreground">هزینه‌های دوره</div>
                    </div>
                    <div className={`rounded-lg p-4 ${ratios.netIncome >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                      <div className={`text-xl font-bold ${ratios.netIncome >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {formatToman(ratios.netIncome)}
                      </div>
                      <div className="text-sm text-muted-foreground">{ratios.netIncome >= 0 ? "سود خالص دوره" : "زیان خالص دوره"}</div>
                    </div>
                  </div>
                </div>
              ) : <div className="text-center py-8 text-muted-foreground">بازه زمانی را انتخاب و محاسبه کنید</div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
