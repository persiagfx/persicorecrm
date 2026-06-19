"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Benefit {
  id: string;
  userId: string;
  user: { id: string; name: string };
  type: string;
  title: string;
  amount: number | null;
  startDate: string;
  endDate: string | null;
  notes: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  insurance: "بیمه", bonus: "پاداش", loan: "وام",
  transport: "ایاب و ذهاب", meal: "غذا", other: "سایر",
};

export default function BenefitsPage() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ userId: "", type: "insurance", title: "", amount: "", startDate: "", endDate: "", notes: "" });

  const load = async () => {
    const r = await fetch("/api/hr/benefits");
    const d = await r.json();
    setBenefits(d.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    await fetch("/api/hr/benefits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: form.amount ? parseFloat(form.amount) : null }),
    });
    setOpen(false);
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">مزایای کارمندان</h1>
          <p className="text-muted-foreground">{benefits.length} مزیت ثبت‌شده</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>مزیت جدید</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>ثبت مزیت جدید</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>شناسه کارمند</Label>
                <Input value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>نوع</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>عنوان</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>مبلغ</Label>
                <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>از تاریخ</Label>
                  <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <Label>تا تاریخ</Label>
                  <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>یادداشت</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={!form.userId || !form.title || !form.startDate}>ثبت</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
          ) : benefits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">مزیتی ثبت نشده</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2 px-3">کارمند</th>
                    <th className="text-right py-2 px-3">نوع</th>
                    <th className="text-right py-2 px-3">عنوان</th>
                    <th className="text-right py-2 px-3">مبلغ</th>
                    <th className="text-right py-2 px-3">از تاریخ</th>
                    <th className="text-right py-2 px-3">تا تاریخ</th>
                  </tr>
                </thead>
                <tbody>
                  {benefits.map(b => (
                    <tr key={b.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3 font-medium">{b.user?.name ?? "—"}</td>
                      <td className="py-2 px-3">{TYPE_LABELS[b.type] ?? b.type}</td>
                      <td className="py-2 px-3">{b.title}</td>
                      <td className="py-2 px-3">{b.amount ? b.amount.toLocaleString("fa-IR") : "—"}</td>
                      <td className="py-2 px-3">{b.startDate?.slice(0, 10)}</td>
                      <td className="py-2 px-3">{b.endDate?.slice(0, 10) ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
