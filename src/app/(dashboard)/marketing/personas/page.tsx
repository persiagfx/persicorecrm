"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Persona {
  id: string;
  name: string;
  age: string | null;
  job: string | null;
  goals: string[];
  painPoints: string[];
  channels: string[];
  description: string | null;
  createdBy: { name: string };
}

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", age: "", job: "",
    goalsText: "", painPointsText: "", channelsText: "", description: "",
  });

  const load = async () => {
    const r = await fetch("/api/marketing/personas");
    const d = await r.json();
    setPersonas(d.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    await fetch("/api/marketing/personas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, age: form.age || null, job: form.job || null,
        description: form.description || null,
        goals: form.goalsText ? form.goalsText.split("\n").filter(Boolean) : [],
        painPoints: form.painPointsText ? form.painPointsText.split("\n").filter(Boolean) : [],
        channels: form.channelsText ? form.channelsText.split("،").map(s => s.trim()).filter(Boolean) : [],
      }),
    });
    setOpen(false);
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">پرسوناهای بازاریابی</h1>
          <p className="text-muted-foreground">{personas.length} پرسونا تعریف‌شده</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>پرسونا جدید</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>تعریف پرسونا</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <div>
                <Label>نام پرسونا</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: مدیر IT شرکت متوسط" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>سن</Label>
                  <Input value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="30-45" />
                </div>
                <div>
                  <Label>شغل</Label>
                  <Input value={form.job} onChange={e => setForm(f => ({ ...f, job: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>اهداف (هر هدف در یک خط)</Label>
                <Textarea value={form.goalsText} onChange={e => setForm(f => ({ ...f, goalsText: e.target.value }))} rows={3} />
              </div>
              <div>
                <Label>نقاط درد (هر مورد در یک خط)</Label>
                <Textarea value={form.painPointsText} onChange={e => setForm(f => ({ ...f, painPointsText: e.target.value }))} rows={3} />
              </div>
              <div>
                <Label>کانال‌های ارتباطی (با ، جدا کنید)</Label>
                <Input value={form.channelsText} onChange={e => setForm(f => ({ ...f, channelsText: e.target.value }))} placeholder="LinkedIn، ایمیل، وبینار" />
              </div>
              <div>
                <Label>توضیحات</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={!form.name}>ایجاد پرسونا</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {personas.map(p => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{p.name}</CardTitle>
                <div className="text-sm text-muted-foreground">
                  {p.job && <div>{p.job}</div>}
                  {p.age && <div>سن: {p.age}</div>}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {p.goals?.length > 0 && (
                  <div>
                    <span className="font-medium text-green-700">اهداف: </span>
                    <span className="text-muted-foreground">{p.goals.slice(0, 2).join(" • ")}</span>
                  </div>
                )}
                {p.painPoints?.length > 0 && (
                  <div>
                    <span className="font-medium text-red-700">نقاط درد: </span>
                    <span className="text-muted-foreground">{p.painPoints.slice(0, 2).join(" • ")}</span>
                  </div>
                )}
                {p.channels?.length > 0 && (
                  <div>
                    <span className="font-medium">کانال‌ها: </span>
                    <span className="text-muted-foreground">{p.channels.join("، ")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {personas.length === 0 && (
            <div className="col-span-3 text-center py-12 text-muted-foreground">پرسونایی تعریف نشده</div>
          )}
        </div>
      )}
    </div>
  );
}
