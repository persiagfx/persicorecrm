"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CalendarDays, Plus, X, Check, MapPin, Video, Users, Clock, List,
  Calendar, ChevronRight, ChevronLeft, CheckSquare, Square, ExternalLink,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import type { Meeting, MeetingType, MeetingStatus } from "@/types";
import { useAuth } from "@/lib/auth/context";

const TYPE_LABELS: Record<MeetingType, string> = {
  internal: "داخلی", client: "با مشتری", board: "هیئت مدیره",
  sales: "فروش", review: "بازبینی", other: "سایر",
};
const TYPE_COLORS: Record<MeetingType, string> = {
  internal: "bg-blue-500/10 text-blue-600",
  client: "bg-green-500/10 text-green-600",
  board: "bg-purple-500/10 text-purple-600",
  sales: "bg-orange-500/10 text-orange-600",
  review: "bg-cyan-500/10 text-cyan-600",
  other: "bg-gray-500/10 text-gray-600",
};
const STATUS_CFG: Record<MeetingStatus, { label: string; dot: string }> = {
  scheduled: { label: "برنامه‌ریزی‌شده", dot: "bg-yellow-400" },
  ongoing: { label: "در حال برگزاری", dot: "bg-green-400 animate-pulse" },
  completed: { label: "برگزار شد", dot: "bg-blue-400" },
  cancelled: { label: "لغو شد", dot: "bg-red-400" },
};

const EMPTY_FORM = {
  title: "", type: "internal" as MeetingType, startAt: "", endAt: "",
  location: "", meetingUrl: "", attendeeIds: [] as string[], agenda: "", isPrivate: false,
};

export default function MeetingsPage() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [crmUsers, setCrmUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    apiClient.get("/meetings").then((res) => {
      const raw = res.data.data ?? [];
      setMeetings(raw.map((m: any) => ({
        ...m,
        attendeeIds: (m.attendees ?? []).map((a: any) => a.user?.id ?? a.userId).filter(Boolean),
      })));
    }).catch(console.error);
    apiClient.get("/users").then((res) => setCrmUsers(res.data.data ?? [])).catch(console.error);
  }, []);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [showForm, setShowForm] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [minutesEdit, setMinutesEdit] = useState<string | null>(null);
  const [minutesText, setMinutesText] = useState("");

  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  const visibleMeetings = useMemo(() => {
    return meetings.filter(m => {
      if (m.isPrivate && !m.attendeeIds.includes(user?.id ?? "") && user?.role !== "admin") return false;
      return true;
    }).sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }, [meetings, user]);

  const detailMeeting = meetings.find(m => m.id === detailId);

  const calDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    return { firstDay: (firstDay + 1) % 7, daysInMonth };
  }, [calYear, calMonth]);

  const getMeetingsOnDay = (day: number) => {
    return visibleMeetings.filter(m => {
      const d = new Date(m.startAt);
      return d.getFullYear() === calYear && d.getMonth() === calMonth && d.getDate() === day;
    });
  };

  const handleSubmit = async () => {
    if (!form.title || !form.startAt || !form.endAt) return;
    try {
      const res = await apiClient.post("/meetings", {
        title: form.title, type: form.type,
        startAt: form.startAt, endAt: form.endAt,
        location: form.location || undefined,
        meetingUrl: form.meetingUrl || undefined,
        attendeeIds: form.attendeeIds,
        agenda: form.agenda || undefined,
        isPrivate: form.isPrivate,
      });
      const saved = res.data.data;
      setMeetings(prev => [{
        ...saved,
        attendeeIds: (saved.attendees ?? []).map((a: any) => a.user?.id ?? a.userId).filter(Boolean),
      }, ...prev]);
    } catch {
      const m: Meeting = {
        id: `m${Date.now()}`,
        title: form.title, type: form.type, status: "scheduled",
        startAt: form.startAt, endAt: form.endAt,
        location: form.location || undefined,
        meetingUrl: form.meetingUrl || undefined,
        attendeeIds: form.attendeeIds,
        agenda: form.agenda || undefined,
        isPrivate: form.isPrivate,
        createdById: user?.id ?? "",
        actionItems: [],
        createdAt: new Date().toISOString(),
      };
      setMeetings(prev => [m, ...prev]);
    }
    setShowForm(false);
    setForm(EMPTY_FORM);
  };

  const toggleAttendee = (uid: string) => {
    setForm(p => ({
      ...p,
      attendeeIds: p.attendeeIds.includes(uid) ? p.attendeeIds.filter(id => id !== uid) : [...p.attendeeIds, uid],
    }));
  };

  const toggleActionItem = (meetingId: string, aiId: string) => {
    setMeetings(prev => prev.map(m => m.id !== meetingId ? m : {
      ...m, actionItems: m.actionItems.map(ai => ai.id === aiId ? { ...ai, isCompleted: !ai.isCompleted } : ai),
    }));
  };

  const saveMinutes = (meetingId: string) => {
    setMeetings(prev => prev.map(m => m.id !== meetingId ? m : { ...m, minutes: minutesText }));
    setMinutesEdit(null);
  };

  const getUserName = (uid: string) => crmUsers.find(u => u.id === uid)?.name ?? uid;

  const MONTH_NAMES = ["ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن", "جولای", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر"];
  const DAY_NAMES = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">جلسات و رویدادها</h1>
            <p className="text-sm text-muted-foreground">{visibleMeetings.filter(m => m.status === "scheduled").length} جلسه آینده</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setView("list")} className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              <List className="w-3.5 h-3.5" />لیست
            </button>
            <button onClick={() => setView("calendar")} className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${view === "calendar" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              <Calendar className="w-3.5 h-3.5" />تقویم
            </button>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus className="w-4 h-4" />جلسه جدید
          </button>
        </div>
      </motion.div>

      {/* List View */}
      {view === "list" && (
        <div className="space-y-3">
          {visibleMeetings.map((m, i) => {
            const start = new Date(m.startAt);
            const end = new Date(m.endAt);
            const { dot, label } = STATUS_CFG[m.status];
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="card p-4 cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => { setDetailId(m.id); }}>
                <div className="flex items-start gap-4">
                  <div className="text-center min-w-[48px] bg-muted rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">{start.getDate()}</p>
                    <p className="text-xs font-bold">{MONTH_NAMES[start.getMonth()].slice(0, 3)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{m.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${TYPE_COLORS[m.type]}`}>{TYPE_LABELS[m.type]}</span>
                      {m.isPrivate && <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-600">خصوصی</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {start.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })} - {end.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {m.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{m.location}</span>}
                      {m.meetingUrl && <span className="flex items-center gap-1"><Video className="w-3 h-3" />آنلاین</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex -space-x-2 space-x-reverse rtl">
                      {m.attendeeIds.slice(0, 3).map(uid => (
                        <div key={uid} title={getUserName(uid)}
                          className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold border border-card">
                          {getUserName(uid)[0]}
                        </div>
                      ))}
                      {m.attendeeIds.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs border border-card">
                          +{m.attendeeIds.length - 3}
                        </div>
                      )}
                    </div>
                    <div className={`w-2 h-2 rounded-full ${dot}`} title={label} />
                  </div>
                </div>
              </motion.div>
            );
          })}
          {visibleMeetings.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>جلسه‌ای ثبت نشده</p>
            </div>
          )}
        </div>
      )}

      {/* Calendar View */}
      {view === "calendar" && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
              className="p-1.5 rounded-lg hover:bg-muted"><ChevronRight className="w-4 h-4" /></button>
            <h3 className="font-semibold">{MONTH_NAMES[calMonth]} {calYear}</h3>
            <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
              className="p-1.5 rounded-lg hover:bg-muted"><ChevronLeft className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-xs text-muted-foreground py-1 font-medium">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: calDays.firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: calDays.daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayMeetings = getMeetingsOnDay(day);
              const isToday = new Date().getDate() === day && new Date().getMonth() === calMonth && new Date().getFullYear() === calYear;
              return (
                <div key={day} className={`min-h-[64px] rounded-lg p-1 border ${isToday ? "border-primary/40 bg-primary/5" : "border-transparent hover:border-border"}`}>
                  <p className={`text-xs font-medium mb-1 ${isToday ? "text-primary" : "text-muted-foreground"}`}>{day}</p>
                  {dayMeetings.slice(0, 2).map(m => (
                    <div key={m.id} onClick={() => setDetailId(m.id)}
                      className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer mb-0.5 ${TYPE_COLORS[m.type]}`}>
                      {m.title}
                    </div>
                  ))}
                  {dayMeetings.length > 2 && <p className="text-xs text-muted-foreground">+{dayMeetings.length - 2}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Meeting Detail Panel */}
      <AnimatePresence>
        {detailMeeting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
              className="card w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${TYPE_COLORS[detailMeeting.type]}`}>{TYPE_LABELS[detailMeeting.type]}</span>
                    <div className={`w-2 h-2 rounded-full ${STATUS_CFG[detailMeeting.status].dot}`} />
                    <span className="text-xs text-muted-foreground">{STATUS_CFG[detailMeeting.status].label}</span>
                  </div>
                  <h2 className="text-lg font-bold">{detailMeeting.title}</h2>
                </div>
                <button onClick={() => setDetailId(null)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
              </div>

              {/* Time & Location */}
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {new Date(detailMeeting.startAt).toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" })} —
                  {new Date(detailMeeting.endAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                {detailMeeting.location && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="w-4 h-4" />{detailMeeting.location}
                  </span>
                )}
                {detailMeeting.meetingUrl && (
                  <a href={detailMeeting.meetingUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-primary hover:underline">
                    <Video className="w-4 h-4" />لینک جلسه
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Attendees */}
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Users className="w-4 h-4" /> شرکت‌کنندگان</h3>
                <div className="flex flex-wrap gap-2">
                  {detailMeeting.attendeeIds.map(uid => (
                    <div key={uid} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted text-xs">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                        {getUserName(uid)[0]}
                      </div>
                      {getUserName(uid)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Agenda */}
              {detailMeeting.agenda && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">دستور جلسه</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-3">{detailMeeting.agenda}</p>
                </div>
              )}

              {/* Minutes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">صورت‌جلسه</h3>
                  {minutesEdit !== detailMeeting.id && (
                    <button onClick={() => { setMinutesEdit(detailMeeting.id); setMinutesText(detailMeeting.minutes ?? ""); }}
                      className="text-xs text-primary hover:underline">ویرایش</button>
                  )}
                </div>
                {minutesEdit === detailMeeting.id ? (
                  <div className="space-y-2">
                    <textarea value={minutesText} onChange={(e) => setMinutesText(e.target.value)}
                      className="input-field w-full resize-none" rows={4} placeholder="خلاصه مذاکرات و تصمیمات..." />
                    <div className="flex gap-2">
                      <button onClick={() => saveMinutes(detailMeeting.id)} className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs">ذخیره</button>
                      <button onClick={() => setMinutesEdit(null)} className="px-3 py-1.5 rounded border border-border text-xs">انصراف</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-3 min-h-[60px]">
                    {detailMeeting.minutes || <span className="italic opacity-60">صورت‌جلسه‌ای ثبت نشده</span>}
                  </p>
                )}
              </div>

              {/* Action Items */}
              {detailMeeting.actionItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">اقدامات پیگیری</h3>
                  <div className="space-y-2">
                    {detailMeeting.actionItems.map(ai => (
                      <div key={ai.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
                        <button onClick={() => toggleActionItem(detailMeeting.id, ai.id)}>
                          {ai.isCompleted
                            ? <CheckSquare className="w-4 h-4 text-primary" />
                            : <Square className="w-4 h-4 text-muted-foreground" />}
                        </button>
                        <span className={`flex-1 text-sm ${ai.isCompleted ? "line-through text-muted-foreground" : ""}`}>{ai.title}</span>
                        <span className="text-xs text-muted-foreground">{getUserName(ai.assigneeId)}</span>
                        {ai.dueDate && <span className="text-xs text-muted-foreground">{new Date(ai.dueDate).toLocaleDateString("fa-IR")}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Meeting Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="card w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg">جلسه جدید</h2>
                <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">عنوان جلسه *</label>
                  <input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                    className="input-field w-full" placeholder="عنوان جلسه..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">نوع</label>
                    <select value={form.type} onChange={(e) => setForm(p => ({ ...p, type: e.target.value as MeetingType }))}
                      className="input-field w-full">
                      {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <label className="text-sm font-medium">خصوصی</label>
                    <button type="button" onClick={() => setForm(p => ({ ...p, isPrivate: !p.isPrivate }))}
                      className={`relative w-10 h-5 rounded-full transition-colors ${form.isPrivate ? "bg-primary" : "bg-muted"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.isPrivate ? "right-0.5" : "left-0.5"}`} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">شروع *</label>
                    <input type="datetime-local" value={form.startAt} onChange={(e) => setForm(p => ({ ...p, startAt: e.target.value }))}
                      className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">پایان *</label>
                    <input type="datetime-local" value={form.endAt} onChange={(e) => setForm(p => ({ ...p, endAt: e.target.value }))}
                      className="input-field w-full" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">مکان</label>
                  <input value={form.location} onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))}
                    className="input-field w-full" placeholder="مثال: اتاق جلسه A" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">لینک آنلاین</label>
                  <input value={form.meetingUrl} onChange={(e) => setForm(p => ({ ...p, meetingUrl: e.target.value }))}
                    className="input-field w-full" placeholder="https://meet.google.com/..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">شرکت‌کنندگان</label>
                  <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-border bg-muted/30">
                    {crmUsers.map(u => (
                      <button key={u.id} type="button" onClick={() => toggleAttendee(u.id)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors ${form.attendeeIds.includes(u.id) ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted border border-border"}`}>
                        {form.attendeeIds.includes(u.id) && <Check className="w-3 h-3" />}
                        {u.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">دستور جلسه</label>
                  <textarea value={form.agenda} onChange={(e) => setForm(p => ({ ...p, agenda: e.target.value }))}
                    className="input-field w-full resize-none" rows={3} placeholder="موضوعاتی که باید بررسی شوند..." />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={handleSubmit}
                  className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
                  ایجاد جلسه
                </button>
                <button onClick={() => setShowForm(false)}
                  className="flex-1 py-2 rounded-lg border border-border text-sm hover:bg-muted">
                  انصراف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
