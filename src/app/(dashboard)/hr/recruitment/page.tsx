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

interface Job {
  id: string;
  title: string;
  department: string | null;
  type: string;
  location: string | null;
  status: string;
  deadline: string | null;
  _count: { applications: number };
  createdBy: { name: string };
}

interface Application {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: string;
  appliedAt: string;
  notes: string | null;
}

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "تمام‌وقت", part_time: "پاره‌وقت",
  contract: "قراردادی", internship: "کارآموزی",
};

const APP_STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  reviewing: "bg-yellow-100 text-yellow-800",
  interview: "bg-purple-100 text-purple-800",
  offer: "bg-green-100 text-green-800",
  hired: "bg-green-200 text-green-900",
  rejected: "bg-red-100 text-red-800",
};

const APP_STATUS_LABELS: Record<string, string> = {
  new: "جدید", reviewing: "بررسی", interview: "مصاحبه",
  offer: "پیشنهاد", hired: "استخدام", rejected: "رد شده",
};

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", department: "", type: "full_time", location: "",
    description: "", requirements: "", salaryFrom: "", salaryTo: "", deadline: "",
  });

  const loadJobs = async () => {
    const r = await fetch("/api/hr/jobs");
    const d = await r.json();
    setJobs(d.data ?? []);
    setLoading(false);
  };

  const loadApplications = async (jobId: string) => {
    const r = await fetch(`/api/hr/jobs/${jobId}/applications`);
    const d = await r.json();
    setApplications(d.data ?? []);
  };

  useEffect(() => { loadJobs(); }, []);

  useEffect(() => {
    if (selectedJob) loadApplications(selectedJob);
  }, [selectedJob]);

  const handleCreate = async () => {
    await fetch("/api/hr/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        salaryFrom: form.salaryFrom ? parseFloat(form.salaryFrom) : null,
        salaryTo: form.salaryTo ? parseFloat(form.salaryTo) : null,
      }),
    });
    setOpen(false);
    loadJobs();
  };

  const handleAppStatus = async (jobId: string, appId: string, status: string) => {
    await fetch(`/api/hr/jobs/${jobId}/applications`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: appId, status }),
    });
    loadApplications(jobId);
  };

  const openCount = jobs.filter(j => j.status === "open").length;
  const totalApps = jobs.reduce((s, j) => s + j._count.applications, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">استخدام و جذب نیرو</h1>
          <p className="text-muted-foreground">{openCount} موقعیت باز • {totalApps} متقاضی</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>آگهی جدید</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>آگهی شغلی جدید</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <div>
                <Label>عنوان شغلی</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>نوع همکاری</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(JOB_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>دپارتمان</Label>
                  <Input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>محل کار</Label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>حقوق از</Label>
                  <Input type="number" value={form.salaryFrom} onChange={e => setForm(f => ({ ...f, salaryFrom: e.target.value }))} />
                </div>
                <div>
                  <Label>حقوق تا</Label>
                  <Input type="number" value={form.salaryTo} onChange={e => setForm(f => ({ ...f, salaryTo: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>موعد درخواست</Label>
                <Input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
              <div>
                <Label>شرح وظایف</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
              </div>
              <div>
                <Label>شرایط احراز</Label>
                <Textarea value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} rows={3} />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={!form.title}>انتشار آگهی</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <h2 className="font-semibold">موقعیت‌های شغلی</h2>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
          ) : jobs.map(job => (
            <Card
              key={job.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${selectedJob === job.id ? "ring-2 ring-primary" : ""}`}
              onClick={() => setSelectedJob(job.id)}
            >
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm">{job.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {job.department && `${job.department} • `}
                      {JOB_TYPE_LABELS[job.type] ?? job.type}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={job.status === "open" ? "default" : "secondary"}>
                      {job.status === "open" ? "باز" : "بسته"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{job._count.applications} متقاضی</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selectedJob ? (
            <Card>
              <CardHeader>
                <CardTitle>متقاضیان</CardTitle>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">متقاضی‌ای برای این موقعیت وجود ندارد</div>
                ) : (
                  <div className="space-y-3">
                    {applications.map(app => (
                      <div key={app.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{app.fullName}</div>
                            <div className="text-xs text-muted-foreground">{app.email}</div>
                            {app.phone && <div className="text-xs text-muted-foreground">{app.phone}</div>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${APP_STATUS_COLORS[app.status] ?? "bg-gray-100 text-gray-800"}`}>
                              {APP_STATUS_LABELS[app.status] ?? app.status}
                            </span>
                            <Select value={app.status} onValueChange={v => handleAppStatus(selectedJob, app.id, v)}>
                              <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.entries(APP_STATUS_LABELS).map(([k, v]) => (
                                  <SelectItem key={k} value={k}>{v}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-24 text-muted-foreground">
                یک موقعیت شغلی را از لیست انتخاب کنید
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
