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

interface Campaign {
  id: string;
  title: string;
  subject: string;
  preheader: string | null;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  stats: { sent: number; opened: number; clicked: number; bounced: number; unsubscribed: number };
  createdAt: string;
  createdBy: { name: string };
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  scheduled: "bg-blue-100 text-blue-800",
  sending: "bg-yellow-100 text-yellow-800",
  sent: "bg-green-100 text-green-800",
  paused: "bg-orange-100 text-orange-800",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "پیش‌نویس", scheduled: "زمان‌بندی‌شده",
  sending: "در حال ارسال", sent: "ارسال شده", paused: "متوقف",
};

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", subject: "", preheader: "", content: "", scheduledAt: "",
  });

  const load = async () => {
    const r = await fetch("/api/marketing/email-campaigns");
    const d = await r.json();
    setCampaigns(d.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    await fetch("/api/marketing/email-campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, scheduledAt: form.scheduledAt || null }),
    });
    setOpen(false);
    load();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/marketing/email-campaigns/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const totalSent = campaigns.filter(c => c.status === "sent").reduce((s, c) => s + (c.stats?.sent ?? 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">کمپین‌های ایمیل</h1>
          <p className="text-muted-foreground">{campaigns.length} کمپین • {totalSent} ایمیل ارسال‌شده</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>کمپین جدید</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>کمپین ایمیل جدید</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <div>
                <Label>عنوان کمپین</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <Label>موضوع ایمیل</Label>
                <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div>
                <Label>پیش‌نمایش (preheader)</Label>
                <Input value={form.preheader} onChange={e => setForm(f => ({ ...f, preheader: e.target.value }))} />
              </div>
              <div>
                <Label>محتوای ایمیل</Label>
                <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} />
              </div>
              <div>
                <Label>زمان ارسال</Label>
                <Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={!form.title || !form.subject}>ذخیره پیش‌نویس</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">کمپینی ایجاد نشده</div>
          ) : (
            <div className="space-y-3">
              {campaigns.map(c => {
                const stats = c.stats ?? { sent: 0, opened: 0, clicked: 0 };
                const openRate = stats.sent > 0 ? ((stats.opened / stats.sent) * 100).toFixed(1) : "0";
                const clickRate = stats.sent > 0 ? ((stats.clicked / stats.sent) * 100).toFixed(1) : "0";
                return (
                  <div key={c.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{c.title}</div>
                        <div className="text-sm text-muted-foreground">موضوع: {c.subject}</div>
                        {c.status === "sent" && (
                          <div className="flex gap-4 text-sm mt-2">
                            <span>📨 {stats.sent} ارسال</span>
                            <span>👁 {openRate}% باز شده</span>
                            <span>🖱 {clickRate}% کلیک</span>
                          </div>
                        )}
                        {c.scheduledAt && c.status === "scheduled" && (
                          <div className="text-xs text-blue-600 mt-1">زمان‌بندی: {new Date(c.scheduledAt).toLocaleString("fa-IR")}</div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-800"}`}>
                          {STATUS_LABELS[c.status] ?? c.status}
                        </span>
                        {c.status === "draft" && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleStatusChange(c.id, "scheduled")}>زمان‌بندی</Button>
                            <Button size="sm" onClick={() => handleStatusChange(c.id, "sent")}>ارسال</Button>
                          </div>
                        )}
                      </div>
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
