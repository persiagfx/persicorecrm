"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Hearing {
  id: string;
  date: string;
  court: string;
  judge: string | null;
  notes: string | null;
  outcome: string | null;
  nextDate: string | null;
  case: { id: string; title: string; caseNumber: string };
}

export default function HearingsPage() {
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [outcomeId, setOutcomeId] = useState<string | null>(null);
  const [form, setForm] = useState({ caseId: "", date: "", court: "", judge: "", notes: "" });
  const [outcomeForm, setOutcomeForm] = useState({ outcome: "", nextDate: "" });

  const load = async () => {
    const r = await fetch("/api/legal/hearings?upcoming=true");
    const d = await r.json();
    setHearings(d.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    await fetch("/api/legal/hearings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setOpen(false);
    load();
  };

  const handleOutcome = async () => {
    if (!outcomeId) return;
    await fetch(`/api/legal/hearings/${outcomeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(outcomeForm),
    });
    setOutcomeId(null);
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">جلسات دادگاه</h1>
          <p className="text-muted-foreground">{hearings.length} جلسه آینده</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>جلسه جدید</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>ثبت جلسه دادگاه</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>شناسه پرونده</Label>
                <Input value={form.caseId} onChange={e => setForm(f => ({ ...f, caseId: e.target.value }))} />
              </div>
              <div>
                <Label>تاریخ و ساعت</Label>
                <Input type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>شعبه/دادگاه</Label>
                  <Input value={form.court} onChange={e => setForm(f => ({ ...f, court: e.target.value }))} />
                </div>
                <div>
                  <Label>قاضی</Label>
                  <Input value={form.judge} onChange={e => setForm(f => ({ ...f, judge: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>یادداشت جلسه</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={!form.caseId || !form.date}>ثبت</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
          ) : hearings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">جلسه‌ای برنامه‌ریزی نشده</div>
          ) : (
            <div className="space-y-3">
              {hearings.map(h => (
                <div key={h.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{h.case?.title}</div>
                      {h.case?.caseNumber && <div className="text-xs text-muted-foreground">پرونده: {h.case.caseNumber}</div>}
                      <div className="text-sm mt-1 flex gap-4">
                        <span>📅 {new Date(h.date).toLocaleDateString("fa-IR")} {new Date(h.date).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
                        {h.court && <span>🏛 {h.court}</span>}
                        {h.judge && <span>⚖️ {h.judge}</span>}
                      </div>
                      {h.notes && <div className="text-sm text-muted-foreground mt-1">{h.notes}</div>}
                      {h.outcome && <div className="text-sm mt-2 p-2 bg-muted rounded">نتیجه: {h.outcome}</div>}
                    </div>
                    {!h.outcome && (
                      <Dialog open={outcomeId === h.id} onOpenChange={v => setOutcomeId(v ? h.id : null)}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">ثبت نتیجه</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>نتیجه جلسه</DialogTitle></DialogHeader>
                          <div className="space-y-3">
                            <div>
                              <Label>نتیجه جلسه</Label>
                              <Textarea value={outcomeForm.outcome} onChange={e => setOutcomeForm(f => ({ ...f, outcome: e.target.value }))} rows={3} />
                            </div>
                            <div>
                              <Label>تاریخ جلسه بعد</Label>
                              <Input type="datetime-local" value={outcomeForm.nextDate} onChange={e => setOutcomeForm(f => ({ ...f, nextDate: e.target.value }))} />
                            </div>
                            <Button className="w-full" onClick={handleOutcome}>ثبت</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
