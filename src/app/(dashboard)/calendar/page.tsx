"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, Video, MapPin, Bell } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const DAYS_FA = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  return { firstDay: (firstDay + 1) % 7, totalDays };
}

interface Meeting { id: string; title: string; startAt: string; endAt: string; type: string; location?: string; meetingUrl?: string; }
interface Reminder { id: string; title: string; dueDate: string; isCompleted: boolean; }

type CalendarEvent = { id: string; title: string; date: Date; kind: "meeting" | "reminder"; color: string; detail?: string };

export default function CalendarPage() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get("/meetings"),
      apiClient.get("/reminders?completed=false"),
    ]).then(([mRes, rRes]) => {
      setMeetings(mRes.data ?? []);
      setReminders(rRes.data ?? []);
    }).catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const events: CalendarEvent[] = useMemo(() => [
    ...meetings.map((m) => ({
      id: m.id, title: m.title, date: new Date(m.startAt), kind: "meeting" as const,
      color: "bg-blue-500", detail: m.location || m.meetingUrl,
    })),
    ...reminders.map((r) => ({
      id: r.id, title: r.title, date: new Date(r.dueDate), kind: "reminder" as const,
      color: "bg-amber-500",
    })),
  ], [meetings, reminders]);

  const prevMonth = () => setCurrentDate((d) => d.month === 0 ? { year: d.year - 1, month: 11 } : { ...d, month: d.month - 1 });
  const nextMonth = () => setCurrentDate((d) => d.month === 11 ? { year: d.year + 1, month: 0 } : { ...d, month: d.month + 1 });

  const { firstDay, totalDays } = getMonthDays(currentDate.year, currentDate.month);

  const getEventsForDay = (day: number) =>
    events.filter((e) =>
      e.date.getFullYear() === currentDate.year &&
      e.date.getMonth() === currentDate.month &&
      e.date.getDate() === day
    );

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  const jalaliMonth = new Intl.DateTimeFormat("fa-IR", { month: "long", year: "numeric", calendar: "persian" })
    .format(new Date(currentDate.year, currentDate.month, 1));

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-primary" />تقویم مشترک
        </h1>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />جلسات</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />یادآورها</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <h2 className="font-bold text-foreground text-lg">{jalaliMonth}</h2>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {DAYS_FA.map((d) => <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const isToday = day === today.getDate() && currentDate.month === today.getMonth() && currentDate.year === today.getFullYear();
              const isSelected = day === selectedDay;
              const dayEvents = getEventsForDay(day);
              const kinds = [...new Set(dayEvents.map((e) => e.kind))];

              return (
                <motion.button key={day} whileHover={{ scale: 1.05 }} onClick={() => setSelectedDay(day)}
                  className={cn(
                    "relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all",
                    isSelected ? "bg-primary text-black font-bold" :
                    isToday   ? "bg-primary/20 text-primary font-semibold" :
                                "hover:bg-muted text-foreground"
                  )}>
                  <span>{day}</span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {kinds.map((k) => (
                        <span key={k} className={cn("w-1.5 h-1.5 rounded-full",
                          isSelected ? "bg-black/60" : k === "meeting" ? "bg-blue-400" : "bg-amber-400"
                        )} />
                      ))}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Day Events */}
        <div className="p-5 rounded-2xl bg-card border border-border">
          <h3 className="font-semibold text-foreground mb-4">
            {selectedDay
              ? `${selectedDay} ${new Intl.DateTimeFormat("fa-IR", { month: "long" }).format(new Date(currentDate.year, currentDate.month, selectedDay))}`
              : "انتخاب روز"}
          </h3>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : selectedDayEvents.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">هیچ رویدادی نیست</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                  <div className={cn("w-1 min-h-[40px] rounded-full shrink-0", ev.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{ev.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {ev.kind === "meeting" && (
                        ev.detail?.startsWith("http")
                          ? <Video className="w-3 h-3 text-blue-400" />
                          : <MapPin className="w-3 h-3 text-muted-foreground" />
                      )}
                      {ev.kind === "reminder" && <Bell className="w-3 h-3 text-amber-400" />}
                      <span className="text-xs text-muted-foreground truncate">
                        {ev.kind === "meeting" ? "جلسه" : "یادآور"}{ev.detail ? ` · ${ev.detail}` : ""}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {ev.date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
