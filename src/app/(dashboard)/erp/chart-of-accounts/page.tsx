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
import { toast } from "sonner";

interface Account {
  id: string;
  code: string;
  name: string;
  nameFa: string;
  type: string;
  parentId: string | null;
  parent: { id: string; code: string; name: string } | null;
  isActive: boolean;
  _count: { children: number; debitEntries: number; creditEntries: number };
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  asset: { label: "دارایی", color: "bg-blue-100 text-blue-800" },
  liability: { label: "بدهی", color: "bg-red-100 text-red-800" },
  equity: { label: "حقوق صاحبان سهام", color: "bg-purple-100 text-purple-800" },
  revenue: { label: "درآمد", color: "bg-green-100 text-green-800" },
  expense: { label: "هزینه", color: "bg-orange-100 text-orange-800" },
};

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", nameFa: "", type: "asset", parentId: "", description: "" });

  const load = async () => {
    const params = filterType !== "all" ? `?type=${filterType}` : "";
    const r = await fetch(`/api/erp/chart-of-accounts${params}`);
    const d = await r.json();
    setAccounts(d.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterType]);

  const [seeding, setSeeding] = useState(false);

  const handleCreate = async () => {
    await fetch("/api/erp/chart-of-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, parentId: form.parentId || null }),
    });
    setOpen(false);
    load();
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const r = await fetch("/api/erp/chart-of-accounts/seed", { method: "POST" });
      const d = await r.json();
      if (r.ok) toast.success(`کدینگ استاندارد بارگذاری شد (${d.data?.created ?? 0} حساب جدید)`);
      else toast.error(d.error ?? "خطا در بارگذاری");
      load();
    } finally { setSeeding(false); }
  };

  const grouped = Object.entries(TYPE_LABELS).map(([type, meta]) => ({
    type, ...meta,
    items: accounts.filter(a => a.type === type),
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">دفتر کل حساب‌ها</h1>
          <p className="text-muted-foreground">{accounts.length} حساب تعریف‌شده</p>
        </div>
        <div className="flex gap-3">
          {accounts.length === 0 && !loading && (
            <Button variant="outline" onClick={handleSeed} disabled={seeding}>
              {seeding ? "در حال بارگذاری..." : "بارگذاری کدینگ استاندارد"}
            </Button>
          )}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40"><SelectValue placeholder="همه نوع‌ها" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه</SelectItem>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>حساب جدید</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>تعریف حساب جدید</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>کد حساب</Label>
                    <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="1001" />
                  </div>
                  <div>
                    <Label>نام حساب (انگلیسی)</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Cash" />
                  </div>
                </div>
                <div>
                  <Label>نام حساب (فارسی) *</Label>
                  <Input value={form.nameFa} onChange={e => setForm(f => ({ ...f, nameFa: e.target.value }))} placeholder="صندوق" />
                </div>
                <div>
                  <Label>نوع حساب</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>حساب مادر (ID اختیاری)</Label>
                  <Input value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))} />
                </div>
                <div>
                  <Label>توضیحات</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={!form.code || !form.name || !form.nameFa}>ایجاد حساب</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
      ) : (
        <div className="space-y-4">
          {grouped.map(group => group.items.length > 0 && (
            <Card key={group.type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${group.color}`}>{group.label}</span>
                  <span className="text-muted-foreground">({group.items.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-right py-1 px-2">کد</th>
                      <th className="text-right py-1 px-2">نام</th>
                      <th className="text-right py-1 px-2">نام فارسی</th>
                      <th className="text-right py-1 px-2">حساب مادر</th>
                      <th className="text-right py-1 px-2">تراکنش‌ها</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map(a => (
                      <tr key={a.id} className="border-b hover:bg-muted/50">
                        <td className="py-1.5 px-2 font-mono">{a.code}</td>
                        <td className="py-1.5 px-2 font-medium">{a.name}</td>
                        <td className="py-1.5 px-2 text-muted-foreground">{a.nameFa}</td>
                        <td className="py-1.5 px-2 text-muted-foreground">{a.parent ? `${a.parent.code} ${a.parent.name}` : "—"}</td>
                        <td className="py-1.5 px-2">
                          {a._count.debitEntries + a._count.creditEntries > 0 ? (
                            <Badge variant="secondary">{a._count.debitEntries + a._count.creditEntries}</Badge>
                          ) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
