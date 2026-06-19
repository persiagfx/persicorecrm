"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface ABTest {
  id: string;
  title: string;
  variantA: Record<string, unknown>;
  variantB: Record<string, unknown>;
  metric: string;
  status: string;
  statsA: { views: number; conversions: number };
  statsB: { views: number; conversions: number };
  winner: string | null;
  createdBy: { name: string };
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  running: "bg-blue-100 text-blue-800",
  paused: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
};

export default function ABTestsPage() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", variantADesc: "", variantBDesc: "", metric: "clicks" });
  const [resultsId, setResultsId] = useState<string | null>(null);
  const [resultsForm, setResultsForm] = useState({ viewsA: "", conversionsA: "", viewsB: "", conversionsB: "", winner: "A" });

  const load = async () => {
    const r = await fetch("/api/marketing/ab-tests");
    const d = await r.json();
    setTests(d.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    await fetch("/api/marketing/ab-tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        metric: form.metric,
        variantA: { description: form.variantADesc },
        variantB: { description: form.variantBDesc },
      }),
    });
    setOpen(false);
    load();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/marketing/ab-tests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const handleResults = async () => {
    if (!resultsId) return;
    await fetch(`/api/marketing/ab-tests/${resultsId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "completed",
        statsA: { views: parseInt(resultsForm.viewsA) || 0, conversions: parseInt(resultsForm.conversionsA) || 0 },
        statsB: { views: parseInt(resultsForm.viewsB) || 0, conversions: parseInt(resultsForm.conversionsB) || 0 },
        winner: resultsForm.winner,
      }),
    });
    setResultsId(null);
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">آزمون‌های A/B</h1>
          <p className="text-muted-foreground">{tests.filter(t => t.status === "running").length} آزمون در حال اجرا</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>آزمون جدید</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>آزمون A/B جدید</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>عنوان آزمون</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <Label>متریک</Label>
                <Select value={form.metric} onValueChange={v => setForm(f => ({ ...f, metric: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clicks">کلیک</SelectItem>
                    <SelectItem value="conversions">تبدیل</SelectItem>
                    <SelectItem value="opens">باز کردن</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>نسخه A (کنترل)</Label>
                  <Textarea value={form.variantADesc} onChange={e => setForm(f => ({ ...f, variantADesc: e.target.value }))} rows={2} placeholder="توضیح نسخه پایه" />
                </div>
                <div>
                  <Label>نسخه B (تغییر)</Label>
                  <Textarea value={form.variantBDesc} onChange={e => setForm(f => ({ ...f, variantBDesc: e.target.value }))} rows={2} placeholder="توضیح تغییر" />
                </div>
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={!form.title}>ایجاد آزمون</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
        ) : tests.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-muted-foreground">آزمونی تعریف نشده</div>
        ) : tests.map(t => {
          const sA = t.statsA ?? { views: 0, conversions: 0 };
          const sB = t.statsB ?? { views: 0, conversions: 0 };
          const rateA = sA.views > 0 ? ((sA.conversions / sA.views) * 100).toFixed(1) : "0";
          const rateB = sB.views > 0 ? ((sB.conversions / sB.views) * 100).toFixed(1) : "0";
          return (
            <Card key={t.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{t.title}</CardTitle>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status] ?? "bg-gray-100 text-gray-800"}`}>
                    {t.status === "draft" ? "پیش‌نویس" : t.status === "running" ? "در حال اجرا" : t.status === "completed" ? "تکمیل" : "متوقف"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className={`p-2 rounded ${t.winner === "A" ? "bg-green-50 border border-green-200" : "bg-muted"}`}>
                    <div className="font-medium">A {t.winner === "A" && "🏆"}</div>
                    <div className="text-xs text-muted-foreground">{String(t.variantA?.description ?? "")}</div>
                    {t.status === "completed" && <div className="text-sm font-bold mt-1">{rateA}%</div>}
                  </div>
                  <div className={`p-2 rounded ${t.winner === "B" ? "bg-green-50 border border-green-200" : "bg-muted"}`}>
                    <div className="font-medium">B {t.winner === "B" && "🏆"}</div>
                    <div className="text-xs text-muted-foreground">{String(t.variantB?.description ?? "")}</div>
                    {t.status === "completed" && <div className="text-sm font-bold mt-1">{rateB}%</div>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {t.status === "draft" && (
                    <Button size="sm" onClick={() => handleStatusChange(t.id, "running")}>شروع</Button>
                  )}
                  {t.status === "running" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(t.id, "paused")}>توقف</Button>
                      <Dialog open={resultsId === t.id} onOpenChange={v => setResultsId(v ? t.id : null)}>
                        <DialogTrigger asChild>
                          <Button size="sm">ثبت نتایج</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>نتایج آزمون</DialogTitle></DialogHeader>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>بازدیدهای A</Label>
                                <Input type="number" value={resultsForm.viewsA} onChange={e => setResultsForm(f => ({ ...f, viewsA: e.target.value }))} />
                              </div>
                              <div>
                                <Label>تبدیل‌های A</Label>
                                <Input type="number" value={resultsForm.conversionsA} onChange={e => setResultsForm(f => ({ ...f, conversionsA: e.target.value }))} />
                              </div>
                              <div>
                                <Label>بازدیدهای B</Label>
                                <Input type="number" value={resultsForm.viewsB} onChange={e => setResultsForm(f => ({ ...f, viewsB: e.target.value }))} />
                              </div>
                              <div>
                                <Label>تبدیل‌های B</Label>
                                <Input type="number" value={resultsForm.conversionsB} onChange={e => setResultsForm(f => ({ ...f, conversionsB: e.target.value }))} />
                              </div>
                            </div>
                            <div>
                              <Label>برنده</Label>
                              <Select value={resultsForm.winner} onValueChange={v => setResultsForm(f => ({ ...f, winner: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="A">نسخه A</SelectItem>
                                  <SelectItem value="B">نسخه B</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button className="w-full" onClick={handleResults}>ثبت نتایج</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
