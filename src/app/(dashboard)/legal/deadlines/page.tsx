"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface Deadline {
  id: string;
  title: string;
  dueDate: string;
  notes: string | null;
  isCompleted: boolean;
  caseId: string | null;
}

export default function LegalDeadlinesPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOverdue, setShowOverdue] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ caseId: "", title: "", dueDate: "", notes: "" });

  const load = async () => {
    const params = showOverdue ? "?overdue=true" : "?upcoming=30";
    const r = await fetch(`/api/legal/deadlines${params}`);
    const d = await r.json();
    setDeadlines(d.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [showOverdue]);

  const handleCreate = async () => {
    await fetch("/api/legal/deadlines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setOpen(false);
    load();
  };

  const handleToggle = async (id: string, isCompleted: boolean) => {
    await fetch(`/api/legal/deadlines/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: !isCompleted }),
    });
    load();
  };

  const overdue = deadlines.filter(d => !d.isCompleted && new Date(d.dueDate) < new Date());
  const upcoming = deadlines.filter(d => !d.isCompleted && new Date(d.dueDate) >= new Date());

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">مهلت‌های قانونی</h1>
          {overdue.length > 0 && <p className="text-red-600 text-sm">{overdue.length} مهلت گذشته!</p>}
        </div>
        <div className="flex gap-3">
          <Button variant={showOverdue ? "default" : "outline"} onClick={() => setShowOverdue(!showOverdue)}>
            {showOverdue ? "نمایش آینده" : "مهلت‌های گذشته"}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>مهلت جدید</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>ثبت مهلت قانونی</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>شناسه پرونده</Label>
                  <Input value={form.caseId} onChange={e => setForm(f => ({ ...f, caseId: e.target.value }))} />
                </div>
                <div>
                  <Label>عنوان مهلت</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <Label>موعد</Label>
                  <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
                <div>
                  <Label>یادداشت</Label>
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={!form.title || !form.dueDate}>ثبت</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
          ) : deadlines.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">مهلت قانونی وجود ندارد</div>
          ) : (
            <div className="space-y-2">
              {deadlines.map(d => {
                const isPast = !d.isCompleted && new Date(d.dueDate) < new Date();
                const daysLeft = Math.ceil((new Date(d.dueDate).getTime() - Date.now()) / 86400000);
                return (
                  <div key={d.id} className={`border rounded-lg p-3 flex items-start gap-3 ${isPast ? "border-red-300 bg-red-50" : daysLeft <= 7 ? "border-yellow-300 bg-yellow-50" : ""}`}>
                    <Checkbox checked={d.isCompleted} onCheckedChange={() => handleToggle(d.id, d.isCompleted)} className="mt-1" />
                    <div className="flex-1">
                      <div className={`font-medium ${d.isCompleted ? "line-through text-muted-foreground" : ""}`}>{d.title}</div>
                      {d.caseId && <div className="text-xs text-muted-foreground mt-0.5">پرونده: {d.caseId}</div>}
                      {d.notes && <div className="text-sm mt-1">{d.notes}</div>}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">{d.dueDate.slice(0, 10)}</div>
                      {!d.isCompleted && (
                        <div className={`text-xs ${isPast ? "text-red-600" : daysLeft <= 7 ? "text-yellow-700" : "text-muted-foreground"}`}>
                          {isPast ? `${Math.abs(daysLeft)} روز گذشته` : `${daysLeft} روز مانده`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
