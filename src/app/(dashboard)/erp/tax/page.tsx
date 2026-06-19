"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CalendarClock, FileSpreadsheet, Receipt, Landmark, AlertTriangle,
  CheckCircle2, Wallet, Percent, TrendingUp,
} from "lucide-react";
import {
  TAX_QUARTERS, currentJalaaliYear, getVatRate, calcVatOnAmount, calcWithholding,
  calcPerformanceTax, calcPayrollTax, WITHHOLDING_PRESETS, CORPORATE_TAX_RATE,
  formatToman, rialToToman, TAX_TYPE_LABELS,
} from "@/lib/finance/iran-tax";

interface Party { id: string; ref: string; party: string; base: number; vat?: number; total?: number; date: string; status?: string; }
interface Deadline { kind: string; title: string; period: string; jalaaliDue: string; dueDate: string; description: string; overdue: boolean; daysLeft: number; }
interface TaxRecord { id: string; type: string; period: string; taxableAmt: number; taxRate: number; taxAmount: number; totalSales: number; dueDate: string | null; paidAt: string | null; status: string; notes: string | null; }
interface Summary {
  year: number; quarter: number; quarterName: string;
  vat: { outputVat: number; inputVat: number; payable: number; credit: number; totalSalesBase: number; totalPurchases: number; salesCount: number; purchasesCount: number };
  sales: Party[]; purchases: Party[]; deadlines: Deadline[]; records: TaxRecord[];
  summary: { totalTax: number; totalPaid: number; totalUnpaid: number; nextDeadline: Deadline | null; overdueCount: number };
}

const KIND_COLOR: Record<string, string> = {
  vat: "bg-blue-100 text-blue-700", seasonal: "bg-purple-100 text-purple-700",
  payroll: "bg-amber-100 text-amber-700", "performance-legal": "bg-emerald-100 text-emerald-700",
  "performance-natural": "bg-teal-100 text-teal-700",
};

const fa = (n: number) => n.toLocaleString("fa-IR");

export default function TaxPage() {
  const thisYear = currentJalaaliYear();
  const [year, setYear] = useState(thisYear);
  const [quarter, setQuarter] = useState(1);
  const [inputVat, setInputVat] = useState("");
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ year: String(year), quarter: String(quarter) });
    if (inputVat) params.set("inputVat", String(Number(inputVat) * 10)); // ورودی تومان → ریال
    const r = await fetch(`/api/erp/tax/summary?${params}`);
    const d = await r.json();
    setData(d.data ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [year, quarter]);

  const vatRate = getVatRate(year);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Landmark className="w-6 h-6 text-primary" />مرکز مالیاتی</h1>
          <p className="text-muted-foreground text-sm">اظهارنامهٔ ارزش افزوده، مالیات حقوق، معاملات فصلی و تقویم مالیاتی — مطابق قوانین سازمان امور مالیاتی</p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <Label className="text-xs">سال مالی</Label>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[thisYear + 1, thisYear, thisYear - 1, thisYear - 2].map((y) => <SelectItem key={y} value={String(y)}>{fa(y)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">فصل</Label>
            <Select value={String(quarter)} onValueChange={(v) => setQuarter(Number(v))}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TAX_QUARTERS.map((q) => <SelectItem key={q.q} value={String(q.q)}>{q.name} ({fa(q.q)})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="dashboard">داشبورد</TabsTrigger>
          <TabsTrigger value="vat">اظهارنامهٔ ارزش افزوده</TabsTrigger>
          <TabsTrigger value="payroll">مالیات حقوق</TabsTrigger>
          <TabsTrigger value="seasonal">معاملات فصلی (۱۶۹)</TabsTrigger>
          <TabsTrigger value="calendar">تقویم مالیاتی</TabsTrigger>
          <TabsTrigger value="calculators">ماشین‌حساب‌ها</TabsTrigger>
          <TabsTrigger value="records">پرونده‌ها</TabsTrigger>
        </TabsList>

        {/* ─────────── داشبورد ─────────── */}
        <TabsContent value="dashboard" className="space-y-4">
          {loading || !data ? <Loading /> : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={Receipt} label={`ارزش افزودهٔ ${data.quarterName} (نرخ ${fa(vatRate)}٪)`} value={formatToman(data.vat.outputVat)} sub="مالیات فروش" tone="blue" />
                <KpiCard icon={Wallet} label="قابل پرداخت ارزش افزوده" value={formatToman(data.vat.payable)} sub={data.vat.credit > 0 ? `اعتبار قابل انتقال: ${formatToman(data.vat.credit)}` : "پس از کسر اعتبار خرید"} tone="amber" />
                <KpiCard icon={CalendarClock} label="سررسید بعدی" value={data.summary.nextDeadline?.jalaaliDue ?? "—"} sub={data.summary.nextDeadline?.title ?? "بدون سررسید"} tone="emerald" />
                <KpiCard icon={AlertTriangle} label="سررسیدهای گذشته" value={fa(data.summary.overdueCount)} sub="نیازمند پیگیری" tone={data.summary.overdueCount > 0 ? "red" : "emerald"} />
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Percent className="w-4 h-4" />خلاصهٔ اظهارنامهٔ ارزش افزوده — {data.quarterName} {fa(year)}</CardTitle></CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <Row label={`مالیات فروش (${fa(data.vat.salesCount)} فاکتور)`} value={formatToman(data.vat.outputVat)} />
                    <Row label="اعتبار مالیاتی خرید" value={`(${formatToman(data.vat.inputVat)})`} muted />
                    <div className="border-t pt-2 mt-1">
                      <Row label={data.vat.payable > 0 ? "مالیات قابل پرداخت" : "اعتبار قابل انتقال"} value={formatToman(data.vat.payable > 0 ? data.vat.payable : data.vat.credit)} strong tone={data.vat.payable > 0 ? "red" : "emerald"} />
                    </div>
                    <p className="text-xs text-muted-foreground pt-2">برای ثبت اعتبار خرید، در تب «اظهارنامهٔ ارزش افزوده» مقدار را وارد کنید.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><CalendarClock className="w-4 h-4" />سررسیدهای پیشِ‌رو</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {data.deadlines.slice(0, 5).map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-sm border-b last:border-0 pb-1.5">
                        <div>
                          <div className="font-medium">{d.title}</div>
                          <div className="text-xs text-muted-foreground">{d.period}</div>
                        </div>
                        <div className="text-left">
                          <div className="font-mono">{d.jalaaliDue}</div>
                          <div className={`text-xs ${d.overdue ? "text-red-600" : d.daysLeft <= 15 ? "text-amber-600" : "text-muted-foreground"}`}>
                            {d.overdue ? `${fa(Math.abs(d.daysLeft))} روز گذشته` : `${fa(d.daysLeft)} روز مانده`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* ─────────── ارزش افزوده ─────────── */}
        <TabsContent value="vat" className="space-y-4">
          {loading || !data ? <Loading /> : (
            <>
              <Card>
                <CardHeader><CardTitle className="text-base">اظهارنامهٔ مالیات بر ارزش افزوده — {data.quarterName} {fa(year)}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-end gap-3 flex-wrap">
                    <div>
                      <Label className="text-xs">اعتبار مالیاتی خرید (تومان)</Label>
                      <Input type="number" value={inputVat} onChange={(e) => setInputVat(e.target.value)} placeholder="۰" className="w-48" />
                    </div>
                    <Button onClick={load} variant="outline">محاسبهٔ مجدد</Button>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <StatBox label="مالیات فروش (Output)" value={formatToman(data.vat.outputVat)} sub={`${fa(data.vat.salesCount)} فاکتور — پایهٔ ${formatToman(data.vat.totalSalesBase)}`} tone="blue" />
                    <StatBox label="اعتبار خرید (Input)" value={formatToman(data.vat.inputVat)} sub={`خریدهای فصل: ${formatToman(data.vat.totalPurchases)}`} tone="purple" />
                    <StatBox label={data.vat.payable > 0 ? "قابل پرداخت" : "اعتبار انتقالی"} value={formatToman(data.vat.payable > 0 ? data.vat.payable : data.vat.credit)} sub={`نرخ ${fa(vatRate)}٪`} tone={data.vat.payable > 0 ? "red" : "emerald"} />
                  </div>
                </CardContent>
              </Card>

              <PartyTable title={`فروش‌های فصل (${fa(data.sales.length)})`} rows={data.sales} showVat onExport={() => exportCsv("sales", data.sales)} />
            </>
          )}
        </TabsContent>

        {/* ─────────── مالیات حقوق ─────────── */}
        <TabsContent value="payroll"><PayrollCalculator year={year} /></TabsContent>

        {/* ─────────── معاملات فصلی ─────────── */}
        <TabsContent value="seasonal" className="space-y-4">
          {loading || !data ? <Loading /> : (
            <>
              <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                گزارش معاملات فصلی موضوع مادهٔ ۱۶۹ ق.م.م — فهرست خرید و فروش {data.quarterName} {fa(year)} برای بارگذاری در سامانهٔ معاملات فصلی.
              </div>
              <PartyTable title={`فروش (${fa(data.sales.length)}) — پایهٔ ${formatToman(data.vat.totalSalesBase)}`} rows={data.sales} showVat onExport={() => exportCsv("sales", data.sales)} />
              <PartyTable title={`خرید/هزینه (${fa(data.purchases.length)}) — مجموع ${formatToman(data.vat.totalPurchases)}`} rows={data.purchases} onExport={() => exportCsv("purchases", data.purchases)} />
            </>
          )}
        </TabsContent>

        {/* ─────────── تقویم ─────────── */}
        <TabsContent value="calendar" className="space-y-3">
          {loading || !data ? <Loading /> : data.deadlines.map((d, i) => (
            <Card key={i}>
              <CardContent className="py-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs h-fit ${KIND_COLOR[d.kind] ?? "bg-muted"}`}>{d.period}</span>
                  <div>
                    <div className="font-medium">{d.title}</div>
                    <div className="text-xs text-muted-foreground max-w-xl">{d.description}</div>
                  </div>
                </div>
                <div className="text-left">
                  <div className="font-mono text-sm">{d.jalaaliDue}</div>
                  {d.overdue
                    ? <Badge variant="destructive" className="text-xs">{fa(Math.abs(d.daysLeft))} روز گذشته</Badge>
                    : <Badge variant="secondary" className="text-xs">{fa(d.daysLeft)} روز مانده</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ─────────── ماشین‌حساب‌ها ─────────── */}
        <TabsContent value="calculators" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <VatCalc year={year} />
            <WithholdingCalc />
            <PerformanceCalc />
          </div>
        </TabsContent>

        {/* ─────────── پرونده‌ها ─────────── */}
        <TabsContent value="records"><TaxRecords records={data?.records ?? []} onChange={load} /></TabsContent>
      </Tabs>
    </div>
  );
}

// ════════════════════════ اجزای کمکی ════════════════════════
function Loading() { return <div className="text-center py-12 text-muted-foreground">در حال محاسبه...</div>; }

function Row({ label, value, muted, strong, tone }: { label: string; value: string; muted?: boolean; strong?: boolean; tone?: string }) {
  const c = tone === "red" ? "text-red-600" : tone === "emerald" ? "text-emerald-600" : "";
  return (
    <div className="flex justify-between items-center py-1">
      <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
      <span className={`font-mono ${strong ? "font-bold text-base" : ""} ${c}`}>{value}</span>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, tone }: { icon: React.ElementType; label: string; value: string; sub: string; tone: string }) {
  const tones: Record<string, string> = { blue: "text-blue-600", amber: "text-amber-600", emerald: "text-emerald-600", red: "text-red-600", purple: "text-purple-600" };
  return (
    <Card><CardContent className="pt-5">
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Icon className={`w-4 h-4 ${tones[tone]}`} />{label}</div>
      <div className={`text-xl font-bold ${tones[tone]}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </CardContent></Card>
  );
}

function StatBox({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: string }) {
  const tones: Record<string, string> = { blue: "border-blue-200 bg-blue-50/50", purple: "border-purple-200 bg-purple-50/50", red: "border-red-200 bg-red-50/50", emerald: "border-emerald-200 bg-emerald-50/50" };
  return (
    <div className={`rounded-lg border p-3 ${tones[tone]}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}

function PartyTable({ title, rows, showVat, onExport }: { title: string; rows: Party[]; showVat?: boolean; onExport?: () => void }) {
  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <CardTitle className="text-sm">{title}</CardTitle>
        {onExport && rows.length > 0 && <Button size="sm" variant="outline" onClick={onExport}>خروجی CSV</Button>}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? <div className="text-center py-6 text-sm text-muted-foreground">موردی ثبت نشده</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-muted-foreground text-xs">
                <th className="text-right py-1.5 px-2">شرح/شماره</th>
                <th className="text-right py-1.5 px-2">طرف</th>
                <th className="text-left py-1.5 px-2">مبلغ پایه</th>
                {showVat && <th className="text-left py-1.5 px-2">ارزش افزوده</th>}
                <th className="text-right py-1.5 px-2">تاریخ</th>
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-muted/40">
                    <td className="py-1.5 px-2 font-mono text-xs">{r.ref}</td>
                    <td className="py-1.5 px-2">{TAX_TYPE_LABELS[r.party] ?? r.party}</td>
                    <td className="py-1.5 px-2 text-left font-mono">{fa(rialToToman(r.base))}</td>
                    {showVat && <td className="py-1.5 px-2 text-left font-mono text-blue-600">{fa(rialToToman(r.vat ?? 0))}</td>}
                    <td className="py-1.5 px-2 text-xs">{new Date(r.date).toLocaleDateString("fa-IR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function exportCsv(name: string, rows: Party[]) {
  const header = "شرح,طرف,مبلغ پایه (تومان),ارزش افزوده (تومان),تاریخ\n";
  const body = rows.map((r) => `"${r.ref}","${r.party}",${rialToToman(r.base)},${rialToToman(r.vat ?? 0)},"${new Date(r.date).toLocaleDateString("fa-IR")}"`).join("\n");
  const blob = new Blob(["﻿" + header + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${name}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast.success("فایل CSV دانلود شد");
}

// ─── ماشین‌حساب مالیات حقوق ───
function PayrollCalculator({ year }: { year: number }) {
  const [gross, setGross] = useState("");
  const result = useMemo(() => calcPayrollTax((Number(gross) || 0) * 10, year), [gross, year]);
  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wallet className="w-4 h-4" />محاسبهٔ پلکانی مالیات حقوق ({fa(year)})</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 max-w-sm">
            <Label>حقوق و مزایای مشمول ماهانه (تومان)</Label>
            <Input type="number" value={gross} onChange={(e) => setGross(e.target.value)} placeholder="مثلاً ۴۵۰۰۰۰۰۰" />
          </div>
        </div>
        {Number(gross) > 0 && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <StatBox label="مالیات ماهانه" value={formatToman(result.tax)} sub={`نرخ مؤثر ${result.effectiveRate.toFixed(1)}٪`} tone="red" />
              <StatBox label="خالص پرداختی" value={formatToman(result.net)} sub="پس از کسر مالیات" tone="emerald" />
              <StatBox label="مالیات سالانه" value={formatToman(result.tax * 12)} sub="تخمینی" tone="blue" />
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b text-muted-foreground text-xs">
                <th className="text-right py-1.5 px-2">پلکان</th><th className="text-left py-1.5 px-2">مبلغ مشمول</th>
                <th className="text-center py-1.5 px-2">نرخ</th><th className="text-left py-1.5 px-2">مالیات</th>
              </tr></thead>
              <tbody>
                {result.breakdown.map((b, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-1.5 px-2 text-xs">{b.bracket}</td>
                    <td className="py-1.5 px-2 text-left font-mono">{formatToman(b.portion)}</td>
                    <td className="py-1.5 px-2 text-center">{fa(b.rate)}٪</td>
                    <td className="py-1.5 px-2 text-left font-mono">{formatToman(b.tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground">معافیت ماهانهٔ سال {fa(year)}: ۲۴ میلیون تومان. مبالغ تا سقف معافیت مشمول مالیات نیستند.</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── ماشین‌حساب ارزش افزوده ───
function VatCalc({ year }: { year: number }) {
  const [amount, setAmount] = useState("");
  const rate = getVatRate(year);
  const vat = calcVatOnAmount((Number(amount) || 0) * 10, rate);
  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Receipt className="w-4 h-4" />ماشین‌حساب ارزش افزوده</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div><Label>مبلغ کالا/خدمت (تومان)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <Row label={`ارزش افزوده (${fa(rate)}٪)`} value={formatToman(vat)} strong tone="blue" />
        <Row label="مبلغ کل با مالیات" value={formatToman((Number(amount) || 0) * 10 + vat)} strong />
      </CardContent>
    </Card>
  );
}

// ─── ماشین‌حساب مالیات تکلیفی ───
function WithholdingCalc() {
  const [amount, setAmount] = useState("");
  const [preset, setPreset] = useState("rent");
  const [custom, setCustom] = useState("");
  const p = WITHHOLDING_PRESETS.find((x) => x.key === preset)!;
  const rate = preset === "custom" ? Number(custom) || 0 : p.rate;
  const tax = calcWithholding((Number(amount) || 0) * 10, rate);
  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Percent className="w-4 h-4" />ماشین‌حساب مالیات تکلیفی</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div><Label>مبلغ ناخالص (تومان)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div>
          <Label>نوع</Label>
          <Select value={preset} onValueChange={setPreset}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{WITHHOLDING_PRESETS.map((x) => <SelectItem key={x.key} value={x.key}>{x.label} {x.rate > 0 ? `(${fa(x.rate)}٪)` : ""}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {preset === "custom" && <div><Label>نرخ (٪)</Label><Input type="number" value={custom} onChange={(e) => setCustom(e.target.value)} /></div>}
        {p.note && <p className="text-xs text-muted-foreground">{p.note}</p>}
        <Row label="مالیات کسرشده" value={formatToman(tax)} strong tone="red" />
        <Row label="پرداختی خالص" value={formatToman((Number(amount) || 0) * 10 - tax)} strong tone="emerald" />
      </CardContent>
    </Card>
  );
}

// ─── ماشین‌حساب مالیات عملکرد ───
function PerformanceCalc() {
  const [profit, setProfit] = useState("");
  const tax = calcPerformanceTax((Number(profit) || 0) * 10);
  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" />مالیات عملکرد اشخاص حقوقی</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div><Label>سود مشمول مالیات (تومان)</Label><Input type="number" value={profit} onChange={(e) => setProfit(e.target.value)} /></div>
        <Row label={`مالیات عملکرد (${fa(CORPORATE_TAX_RATE)}٪ مقطوع — ماده ۱۰۵)`} value={formatToman(tax)} strong tone="red" />
        <Row label="سود خالص پس از مالیات" value={formatToman((Number(profit) || 0) * 10 - tax)} strong tone="emerald" />
      </CardContent>
    </Card>
  );
}

// ─── پرونده‌های مالیاتی (ثبت دستی + پرداخت) ───
function TaxRecords({ records, onChange }: { records: TaxRecord[]; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "vat", period: "", taxableAmount: "", taxRate: "10", taxAmount: "", dueDate: "", notes: "" });
  const [payId, setPayId] = useState<string | null>(null);

  const create = async () => {
    await fetch("/api/erp/tax-records", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.type, period: form.period,
        taxableAmount: Number(form.taxableAmount) * 10,
        taxRate: Number(form.taxRate),
        taxAmount: form.taxAmount ? Number(form.taxAmount) * 10 : undefined,
        dueDate: form.dueDate || undefined, notes: form.notes,
      }),
    });
    setOpen(false); toast.success("پروندهٔ مالیاتی ثبت شد"); onChange();
  };
  const pay = async (id: string) => {
    await fetch(`/api/erp/tax-records/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid", paidAt: new Date().toISOString().split("T")[0] }),
    });
    setPayId(null); toast.success("پرداخت ثبت شد"); onChange();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>ثبت پروندهٔ مالیاتی</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>ثبت پروندهٔ مالیاتی</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>نوع</Label>
                  <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(TAX_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>دوره</Label><Input value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))} placeholder="بهار ۱۴۰۴" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>مبلغ مشمول (تومان)</Label><Input type="number" value={form.taxableAmount} onChange={(e) => setForm((f) => ({ ...f, taxableAmount: e.target.value }))} /></div>
                <div><Label>نرخ (٪)</Label><Input type="number" value={form.taxRate} onChange={(e) => setForm((f) => ({ ...f, taxRate: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>مبلغ مالیات (اختیاری، تومان)</Label><Input type="number" value={form.taxAmount} onChange={(e) => setForm((f) => ({ ...f, taxAmount: e.target.value }))} placeholder="خودکار محاسبه می‌شود" /></div>
                <div><Label>سررسید</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} /></div>
              </div>
              <div><Label>یادداشت</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></div>
              <Button className="w-full" onClick={create} disabled={!form.period || !form.taxableAmount}>ثبت</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {records.length === 0 ? <div className="text-center py-12 text-muted-foreground">پرونده‌ای ثبت نشده است</div> : (
        <div className="space-y-2">
          {records.map((r) => (
            <Card key={r.id}><CardContent className="py-3 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-medium">{TAX_TYPE_LABELS[r.type] ?? r.type} — {r.period}</div>
                <div className="text-sm text-muted-foreground">مشمول: {formatToman(r.taxableAmt)} · نرخ {fa(r.taxRate)}٪ · مالیات: <strong>{formatToman(r.taxAmount)}</strong></div>
                {r.dueDate && <div className="text-xs text-muted-foreground">سررسید: {new Date(r.dueDate).toLocaleDateString("fa-IR")}</div>}
              </div>
              <div className="flex items-center gap-2">
                {r.status === "paid"
                  ? <Badge className="bg-emerald-100 text-emerald-700 gap-1"><CheckCircle2 className="w-3 h-3" />پرداخت‌شده</Badge>
                  : <>
                      <Badge variant="secondary">در انتظار</Badge>
                      <Button size="sm" variant="outline" onClick={() => setPayId(payId === r.id ? null : r.id)}>پرداخت</Button>
                    </>}
              </div>
              {payId === r.id && (
                <div className="w-full flex justify-end"><Button size="sm" onClick={() => pay(r.id)}>تأیید پرداخت امروز</Button></div>
              )}
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
