"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface EmployeeContract {
  id: string;
  userId: string;
  user: { id: string; name: string };
  position: string;
  department: string | null;
  type: string;
  startDate: string;
  endDate: string | null;
  salary: number;
  status: string;
  fileUrl: string | null;
  notes: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  permanent: "دائمی", temporary: "موقت", part_time: "پاره‌وقت",
  internship: "کارآموزی", freelance: "آزاد",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  expired: "bg-gray-100 text-gray-800",
  terminated: "bg-red-100 text-red-800",
  draft: "bg-yellow-100 text-yellow-800",
};

export default function EmployeeContractsPage() {
  const [contracts, setContracts] = useState<EmployeeContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    userId: "", position: "", department: "", type: "permanent", startDate: "", endDate: "",
    salary: "", notes: "", fileUrl: "",
  });

  const load = async () => {
    const r = await fetch("/api/hr/contracts");
    const d = await r.json();
    setContracts(d.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    await fetch("/api/hr/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, salary: form.salary ? parseFloat(form.salary) : null }),
    });
    setOpen(false);
    load();
  };

  const expiringCount = contracts.filter(c => {
    if (!c.endDate) return false;
    const diff = (new Date(c.endDate).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 30;
  }).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">قراردادهای کارمندان</h1>
          {expiringCount > 0 && (
            <p className="text-yellow-600 text-sm">{expiringCount} قرارداد طی ۳۰ روز آینده منقضی می‌شود</p>
          )}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>قرارداد جدید</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>قرارداد جدید</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>شناسه کارمند *</Label>
                <Input value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>پست/سمت *</Label>
                  <Input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} placeholder="مدیر فروش" />
                </div>
                <div>
                  <Label>دپارتمان</Label>
                  <Input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>نوع قرارداد</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>حقوق</Label>
                  <Input type="number" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>تاریخ شروع</Label>
                  <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <Label>تاریخ پایان</Label>
                  <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>لینک فایل</Label>
                <Input value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} />
              </div>
              <div>
                <Label>یادداشت</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={!form.userId || !form.position || !form.startDate}>ثبت قرارداد</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">قراردادی ثبت نشده است</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2 px-3">کارمند</th>
                    <th className="text-right py-2 px-3">نوع</th>
                    <th className="text-right py-2 px-3">شروع</th>
                    <th className="text-right py-2 px-3">پایان</th>
                    <th className="text-right py-2 px-3">حقوق</th>
                    <th className="text-right py-2 px-3">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map(c => {
                    const isExpiringSoon = c.endDate && (new Date(c.endDate).getTime() - Date.now()) / 86400000 <= 30;
                    return (
                      <tr key={c.id} className={`border-b hover:bg-muted/50 ${isExpiringSoon ? "bg-yellow-50" : ""}`}>
                        <td className="py-2 px-3 font-medium">{c.user?.name ?? "—"}</td>
                        <td className="py-2 px-3">{TYPE_LABELS[c.type] ?? c.type}</td>
                        <td className="py-2 px-3">{c.startDate?.slice(0, 10)}</td>
                        <td className="py-2 px-3">{c.endDate?.slice(0, 10) ?? "نامحدود"}</td>
                        <td className="py-2 px-3">{c.salary ? c.salary.toLocaleString("fa-IR") : "—"}</td>
                        <td className="py-2 px-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-800"}`}>
                            {c.status === "active" ? "فعال" : c.status === "expired" ? "منقضی" : c.status === "terminated" ? "فسخ" : "پیش‌نویس"}
                          </span>
                        </td>
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
