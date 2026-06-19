"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface CallLog {
  id: string;
  entityType: string;
  entityId: string;
  direction: string;
  outcome: string;
  duration: number | null;
  notes: string | null;
  calledAt: string;
  user: { id: string; name: string };
}

const DIRECTION_LABELS: Record<string, string> = { inbound: "ورودی", outbound: "خروجی" };
const OUTCOME_CONFIG: Record<string, { label: string; color: string }> = {
  answered: { label: "پاسخ داده شد", color: "bg-green-100 text-green-800" },
  no_answer: { label: "بی‌پاسخ", color: "bg-red-100 text-red-800" },
  busy: { label: "اشغال", color: "bg-orange-100 text-orange-800" },
  voicemail: { label: "پیام صوتی", color: "bg-yellow-100 text-yellow-800" },
  meeting_set: { label: "جلسه تنظیم شد", color: "bg-blue-100 text-blue-800" },
};

export default function CallLogsPage() {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    entityType: "client", entityId: "", direction: "outbound", outcome: "answered",
    notes: "", duration: "", calledAt: new Date().toISOString().slice(0, 16),
  });

  const load = async () => {
    const r = await fetch("/api/call-logs");
    const d = await r.json();
    setLogs(d.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    await fetch("/api/call-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, duration: form.duration ? parseInt(form.duration) : null }),
    });
    setOpen(false);
    load();
  };

  const totalDuration = logs.reduce((s, l) => s + (l.duration ?? 0), 0);
  const answeredCount = logs.filter(l => l.outcome === "answered").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">گزارش تماس‌ها</h1>
          <p className="text-muted-foreground">{logs.length} تماس • {Math.floor(totalDuration / 60)} دقیقه</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>ثبت تماس</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>ثبت گزارش تماس</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>نوع موجودیت</Label>
                  <Select value={form.entityType} onValueChange={v => setForm(f => ({ ...f, entityType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">مشتری</SelectItem>
                      <SelectItem value="lead">لید</SelectItem>
                      <SelectItem value="contact">مخاطب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>شناسه</Label>
                  <Input value={form.entityId} onChange={e => setForm(f => ({ ...f, entityId: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>جهت تماس</Label>
                  <Select value={form.direction} onValueChange={v => setForm(f => ({ ...f, direction: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outbound">خروجی</SelectItem>
                      <SelectItem value="inbound">ورودی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>نتیجه</Label>
                  <Select value={form.outcome} onValueChange={v => setForm(f => ({ ...f, outcome: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(OUTCOME_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>مدت (ثانیه)</Label>
                <Input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
              </div>
              <div>
                <Label>یادداشت</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
              </div>
              <div>
                <Label>زمان تماس</Label>
                <Input type="datetime-local" value={form.calledAt} onChange={e => setForm(f => ({ ...f, calledAt: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={!form.entityId}>ثبت تماس</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{logs.length}</div><div className="text-sm text-muted-foreground">کل تماس‌ها</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{answeredCount}</div><div className="text-sm text-muted-foreground">پاسخ داده شده</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{Math.floor(totalDuration / 60)} دقیقه</div><div className="text-sm text-muted-foreground">مجموع مکالمات</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">تماسی ثبت نشده</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2 px-3">زمان</th>
                    <th className="text-right py-2 px-3">جهت</th>
                    <th className="text-right py-2 px-3">نتیجه</th>
                    <th className="text-right py-2 px-3">مدت</th>
                    <th className="text-right py-2 px-3">یادداشت</th>
                    <th className="text-right py-2 px-3">کارشناس</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => {
                    const s = OUTCOME_CONFIG[l.outcome] ?? { label: l.outcome, color: "bg-gray-100 text-gray-800" };
                    return (
                      <tr key={l.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">{new Date(l.calledAt).toLocaleString("fa-IR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                        <td className="py-2 px-3">{DIRECTION_LABELS[l.direction] ?? l.direction}</td>
                        <td className="py-2 px-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                        </td>
                        <td className="py-2 px-3">{l.duration ? `${Math.floor(l.duration / 60)}:${String(l.duration % 60).padStart(2, "0")}` : "—"}</td>
                        <td className="py-2 px-3 text-sm text-muted-foreground">{l.notes ?? "—"}</td>
                        <td className="py-2 px-3">{l.user?.name ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
