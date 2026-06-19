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

interface Course {
  id: string;
  title: string;
  description: string | null;
  instructor: string | null;
  duration: string | null;
  category: string;
  fileUrl: string | null;
  isActive: boolean;
  _count: { enrollments: number };
}

const CATEGORY_LABELS: Record<string, string> = {
  technical: "فنی", soft_skills: "مهارت‌های نرم", compliance: "انطباق",
  leadership: "رهبری", product: "محصول",
};

export default function TrainingPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", instructor: "", duration: "", category: "technical", fileUrl: "" });

  const load = async () => {
    const r = await fetch("/api/hr/training");
    const d = await r.json();
    setCourses(d.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    await fetch("/api/hr/training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setOpen(false);
    load();
  };

  const handleEnroll = async (courseId: string) => {
    await fetch(`/api/hr/training/${courseId}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">آموزش و توسعه</h1>
          <p className="text-muted-foreground">{courses.length} دوره آموزشی</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>دوره جدید</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>ایجاد دوره آموزشی</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>عنوان دوره</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>دسته‌بندی</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>مدت (مثال: ۸ ساعت)</Label>
                  <Input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>مدرس</Label>
                <Input value={form.instructor} onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))} />
              </div>
              <div>
                <Label>توضیحات</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
              </div>
              <div>
                <Label>لینک فایل</Label>
                <Input value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={!form.title}>ایجاد دوره</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{c.title}</CardTitle>
                  <Badge variant="secondary">{CATEGORY_LABELS[c.category] ?? c.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {c.instructor && <p className="text-sm text-muted-foreground">مدرس: {c.instructor}</p>}
                {c.duration && <p className="text-sm text-muted-foreground">مدت: {c.duration}</p>}
                {c.description && <p className="text-sm line-clamp-2">{c.description}</p>}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">{c._count.enrollments} ثبت‌نام</span>
                  <Button size="sm" onClick={() => handleEnroll(c.id)}>ثبت‌نام</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {courses.length === 0 && (
            <div className="col-span-3 text-center py-12 text-muted-foreground">دوره آموزشی‌ای ایجاد نشده است</div>
          )}
        </div>
      )}
    </div>
  );
}
