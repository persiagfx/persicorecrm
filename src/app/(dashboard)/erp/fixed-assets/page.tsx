"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatToman } from "@/lib/finance/iran-tax";

interface FixedAsset {
  id: string;
  name: string;
  category: string;
  purchasePrice: number;
  purchaseDate: string;
  currentValue: number;
  depreciationRate: number;
  location: string | null;
  serialNumber: string | null;
  status: string;
}

interface AssetDepreciation {
  id: string;
  name: string;
  category: string;
  purchasePrice: number;
  currentBookValue: number;
  depreciationRate: number;
  usefulLifeYears: number;
  monthlyAmount: number;
  yearToDateAmount: number;
  yearlySchedule: { year: number; annual: number; accumulated: number; bookValue: number }[];
  status: string;
}

interface DepSummary {
  totalMonthly: number;
  totalYtd: number;
  totalBookValue: number;
  assetCount: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  equipment: "تجهیزات", vehicle: "وسیله نقلیه",
  furniture: "مبلمان", building: "ساختمان", computer: "رایانه", other: "سایر",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  disposed: "bg-gray-100 text-gray-800",
  maintenance: "bg-yellow-100 text-yellow-800",
};

export default function FixedAssetsPage() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [summary, setSummary] = useState({ totalValue: 0, totalBookValue: 0 });
  const [depAssets, setDepAssets] = useState<AssetDepreciation[]>([]);
  const [depSummary, setDepSummary] = useState<DepSummary>({ totalMonthly: 0, totalYtd: 0, totalBookValue: 0, assetCount: 0 });
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [depLoading, setDepLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", category: "equipment", purchasePrice: "", purchaseDate: "",
    depreciationRate: "20", location: "", serialNumber: "",
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const load = async () => {
    const r = await fetch("/api/erp/fixed-assets");
    const d = await r.json();
    setAssets(d.data?.assets ?? []);
    setSummary({ totalValue: d.data?.totalValue ?? 0, totalBookValue: d.data?.totalBookValue ?? 0 });
    setLoading(false);
  };

  const loadDepreciation = async () => {
    setDepLoading(true);
    const r = await fetch("/api/erp/fixed-assets/depreciation");
    const d = await r.json();
    setDepAssets(d.data?.assets ?? []);
    setDepSummary(d.data?.summary ?? { totalMonthly: 0, totalYtd: 0, totalBookValue: 0, assetCount: 0 });
    setDepLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    await fetch("/api/erp/fixed-assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        purchasePrice: parseInt(form.purchasePrice) * 10,
        depreciationRate: parseFloat(form.depreciationRate),
      }),
    });
    setOpen(false);
    load();
  };

  const handlePostDepreciation = async () => {
    setPosting(true);
    setPostResult(null);
    const r = await fetch("/api/erp/fixed-assets/depreciation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: currentYear, month: currentMonth }),
    });
    const d = await r.json();
    if (r.ok) {
      setPostResult(`${d.data?.createdEntries ?? 0} سند استهلاک برای ${d.data?.year}/${String(d.data?.month).padStart(2, "0")} صادر شد.`);
    } else {
      setPostResult(d.error ?? "خطا در صدور سند");
    }
    setPosting(false);
  };

  const depreciation = summary.totalValue - (summary.totalBookValue ?? 0);
  const depRate = summary.totalValue > 0 ? ((depreciation / summary.totalValue) * 100).toFixed(1) : "0";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">دارایی‌های ثابت</h1>
          <p className="text-muted-foreground">{assets.length} دارایی</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>دارایی جدید</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>ثبت دارایی ثابت</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>نام دارایی</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <Label>دسته‌بندی</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>قیمت خرید (تومان)</Label>
                  <Input type="number" value={form.purchasePrice} onChange={e => setForm(f => ({ ...f, purchasePrice: e.target.value }))} />
                </div>
                <div>
                  <Label>تاریخ خرید</Label>
                  <Input type="date" value={form.purchaseDate} onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>نرخ استهلاک سالانه (%)</Label>
                <Input type="number" value={form.depreciationRate} onChange={e => setForm(f => ({ ...f, depreciationRate: e.target.value }))} />
              </div>
              <div>
                <Label>محل استقرار</Label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div>
                <Label>شماره سریال</Label>
                <Input value={form.serialNumber} onChange={e => setForm(f => ({ ...f, serialNumber: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={!form.name || !form.purchasePrice || !form.purchaseDate}>ثبت</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{formatToman(summary.totalValue)}</div><div className="text-sm text-muted-foreground">بهای تمام‌شده کل</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{formatToman(summary.totalBookValue)}</div><div className="text-sm text-muted-foreground">ارزش دفتری کل</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{depRate}%</div><div className="text-sm text-muted-foreground">نرخ استهلاک</div></CardContent></Card>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">لیست دارایی‌ها</TabsTrigger>
          <TabsTrigger value="depreciation" onClick={() => { if (!depAssets.length) loadDepreciation(); }}>
            جدول استهلاک
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardContent className="pt-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
              ) : assets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">دارایی‌ای ثبت نشده</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-2 px-3">نام</th>
                        <th className="text-right py-2 px-3">دسته</th>
                        <th className="text-right py-2 px-3">تاریخ خرید</th>
                        <th className="text-left py-2 px-3">بهای تمام‌شده</th>
                        <th className="text-left py-2 px-3">ارزش دفتری</th>
                        <th className="text-right py-2 px-3">محل</th>
                        <th className="text-right py-2 px-3">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.map(a => (
                        <tr key={a.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-3 font-medium">{a.name}</td>
                          <td className="py-2 px-3">{CATEGORY_LABELS[a.category] ?? a.category}</td>
                          <td className="py-2 px-3">{a.purchaseDate.slice(0, 10)}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatToman(a.purchasePrice)}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatToman(a.currentValue)}</td>
                          <td className="py-2 px-3">{a.location ?? "—"}</td>
                          <td className="py-2 px-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-800"}`}>
                              {a.status === "active" ? "فعال" : a.status === "disposed" ? "اسقاط" : "تعمیر"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="depreciation">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>جدول استهلاک دارایی‌ها</CardTitle>
                <div className="flex items-center gap-3">
                  {postResult && (
                    <span className="text-sm text-muted-foreground">{postResult}</span>
                  )}
                  <Button onClick={handlePostDepreciation} disabled={posting || depAssets.length === 0} variant="outline">
                    {posting ? "در حال صدور..." : `صدور سند استهلاک ${currentYear}/${String(currentMonth).padStart(2, "0")}`}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {depLoading ? (
                <div className="text-center py-8 text-muted-foreground">در حال محاسبه...</div>
              ) : depAssets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">دارایی فعالی یافت نشد</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-lg font-bold">{formatToman(depSummary.totalMonthly)}</div>
                      <div className="text-xs text-muted-foreground">استهلاک ماهانه</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-lg font-bold">{formatToman(depSummary.totalYtd)}</div>
                      <div className="text-xs text-muted-foreground">استهلاک از ابتدای سال</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-lg font-bold">{formatToman(depSummary.totalBookValue)}</div>
                      <div className="text-xs text-muted-foreground">ارزش دفتری فعلی</div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right py-2 px-3">دارایی</th>
                          <th className="text-right py-2 px-3">بهای تمام‌شده</th>
                          <th className="text-right py-2 px-3">نرخ سالانه</th>
                          <th className="text-left py-2 px-3">استهلاک ماهانه</th>
                          <th className="text-left py-2 px-3">استهلاک سالانه</th>
                          <th className="text-left py-2 px-3">ارزش دفتری فعلی</th>
                          <th className="text-right py-2 px-3">عمر مفید</th>
                          <th className="text-right py-2 px-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {depAssets.map(a => (
                          <>
                            <tr key={a.id} className="border-b hover:bg-muted/50">
                              <td className="py-2 px-3 font-medium">{a.name}</td>
                              <td className="py-2 px-3 font-mono">{formatToman(a.purchasePrice)}</td>
                              <td className="py-2 px-3">{a.depreciationRate}%</td>
                              <td className="py-2 px-3 text-right font-mono">{formatToman(a.monthlyAmount)}</td>
                              <td className="py-2 px-3 text-right font-mono">{formatToman(a.monthlyAmount * 12)}</td>
                              <td className="py-2 px-3 text-right font-mono">{formatToman(a.currentBookValue)}</td>
                              <td className="py-2 px-3">{a.usefulLifeYears} سال</td>
                              <td className="py-2 px-3">
                                <Button size="sm" variant="ghost" className="h-6 text-xs"
                                  onClick={() => setExpandedAsset(expandedAsset === a.id ? null : a.id)}>
                                  {expandedAsset === a.id ? "بستن" : "جزئیات"}
                                </Button>
                              </td>
                            </tr>
                            {expandedAsset === a.id && (
                              <tr key={`${a.id}-detail`}>
                                <td colSpan={8} className="bg-muted/30 px-6 py-3">
                                  <div className="text-xs font-medium mb-2">جدول استهلاک سالانه</div>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="border-b">
                                          <th className="text-right py-1 px-2">سال</th>
                                          <th className="text-left py-1 px-2">استهلاک سال</th>
                                          <th className="text-left py-1 px-2">استهلاک انباشته</th>
                                          <th className="text-left py-1 px-2">ارزش دفتری</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {a.yearlySchedule.map(row => (
                                          <tr key={row.year} className="border-b">
                                            <td className="py-1 px-2">{row.year}</td>
                                            <td className="py-1 px-2 font-mono">{formatToman(row.annual)}</td>
                                            <td className="py-1 px-2 font-mono">{formatToman(row.accumulated)}</td>
                                            <td className="py-1 px-2 font-mono">{formatToman(row.bookValue)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
