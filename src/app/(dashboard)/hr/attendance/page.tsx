"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AttendanceRecord {
  id: string;
  userId: string;
  user: { id: string; name: string };
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  workHours: number | null;
  notes: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  present: { label: "حاضر", color: "bg-green-100 text-green-800" },
  absent: { label: "غایب", color: "bg-red-100 text-red-800" },
  late: { label: "تأخیر", color: "bg-yellow-100 text-yellow-800" },
  half_day: { label: "نیم‌روز", color: "bg-blue-100 text-blue-800" },
  remote: { label: "دورکاری", color: "bg-purple-100 text-purple-800" },
};

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], status: "present", checkIn: "09:00", checkOut: "18:00", notes: "" });

  const load = async () => {
    setLoading(true);
    const r = await fetch(`/api/hr/attendance?date=${filterDate}`);
    const d = await r.json();
    setRecords(d.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterDate]);

  const handleCheckIn = async () => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    await fetch("/api/hr/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: new Date().toISOString().split("T")[0], checkIn: time, status: "present" }),
    });
    load();
  };

  const handleCheckOut = async (id: string) => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    await fetch("/api/hr/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, checkOut: time }),
    });
    load();
  };

  const presentCount = records.filter(r => r.status === "present" || r.status === "late" || r.status === "remote").length;
  const absentCount = records.filter(r => r.status === "absent").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">حضور و غیاب</h1>
          <p className="text-muted-foreground">مدیریت ورود و خروج کارمندان</p>
        </div>
        <Button onClick={handleCheckIn}>ثبت ورود</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600">{presentCount}</div>
            <div className="text-sm text-muted-foreground">حاضر امروز</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-red-600">{absentCount}</div>
            <div className="text-sm text-muted-foreground">غایب امروز</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{records.length}</div>
            <div className="text-sm text-muted-foreground">کل ثبت‌شده</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>لیست حضور</CardTitle>
          <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-48" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">رکوردی برای این تاریخ ثبت نشده</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2 px-3">نام</th>
                    <th className="text-right py-2 px-3">وضعیت</th>
                    <th className="text-right py-2 px-3">ورود</th>
                    <th className="text-right py-2 px-3">خروج</th>
                    <th className="text-right py-2 px-3">ساعت کار</th>
                    <th className="text-right py-2 px-3">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => {
                    const s = STATUS_LABELS[r.status] ?? { label: r.status, color: "bg-gray-100 text-gray-800" };
                    return (
                      <tr key={r.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium">{r.user?.name ?? "—"}</td>
                        <td className="py-2 px-3">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                        </td>
                        <td className="py-2 px-3">{r.checkIn ?? "—"}</td>
                        <td className="py-2 px-3">{r.checkOut ?? "—"}</td>
                        <td className="py-2 px-3">{r.workHours ? `${r.workHours}h` : "—"}</td>
                        <td className="py-2 px-3">
                          {!r.checkOut && r.status === "present" && (
                            <Button size="sm" variant="outline" onClick={() => handleCheckOut(r.id)}>ثبت خروج</Button>
                          )}
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
