"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ChevronLeft, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Jalali helpers (using Intl — no external dep needed) ────────────────────
function toJalali(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});

  // Convert Persian digits to ASCII
  const toAscii = (s: string) =>
    s.replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776));

  return {
    year: parseInt(toAscii(parts.year)),
    month: parseInt(toAscii(parts.month)),
    day: parseInt(toAscii(parts.day)),
  };
}

function fromJalali(year: number, month: number, day: number): Date {
  // Use Intl to find Gregorian equivalent
  // Strategy: binary search starting from approximate Gregorian date
  // Jalali year ≈ Gregorian year - 621 (approximate)
  const approxGregorian = new Date(year - 621, month - 1, day + 10);
  let d = approxGregorian;

  for (let i = -30; i <= 30; i++) {
    const test = new Date(approxGregorian);
    test.setDate(test.getDate() + i);
    const j = toJalali(test);
    if (j.year === year && j.month === month && j.day === day) {
      d = test;
      break;
    }
  }
  return d;
}

function daysInJalaliMonth(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  // Month 12: 29 in normal years, 30 in leap years
  const nextYear = fromJalali(year + 1, 1, 1);
  const thisYear = fromJalali(year, 1, 1);
  const yearDays = Math.round((nextYear.getTime() - thisYear.getTime()) / 86400000);
  return yearDays === 366 ? 30 : 29;
}

function firstDayOfJalaliMonth(year: number, month: number): number {
  // Returns 0=Sat 1=Sun ... 6=Fri (Persian week starts Saturday)
  const date = fromJalali(year, month, 1);
  // JS: 0=Sun, 6=Sat → shift so Saturday=0
  return (date.getDay() + 1) % 7;
}

const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد",
  "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر",
  "دی", "بهمن", "اسفند",
];

const WEEK_DAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

function toPersianNum(n: number): string {
  return String(n).replace(/\d/g, (d) =>
    String.fromCharCode(d.charCodeAt(0) + 1728)
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface JalaliDatePickerProps {
  value?: string; // ISO date string: "2025-05-10"
  onChange: (iso: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
}

export function JalaliDatePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
  className,
  disabled,
  minDate,
  maxDate,
}: JalaliDatePickerProps) {
  const today = new Date();
  const todayJ = toJalali(today);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(todayJ.year);
  const [viewMonth, setViewMonth] = useState(todayJ.month);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse selected value
  const selectedJ = value ? toJalali(new Date(value)) : null;

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Navigate months
  function prevMonth() {
    if (viewMonth === 1) { setViewMonth(12); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 12) { setViewMonth(1); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  function selectDay(day: number) {
    const gregorian = fromJalali(viewYear, viewMonth, day);
    const iso = gregorian.toISOString().split("T")[0];
    onChange(iso);
    setOpen(false);
  }

  function isDisabled(day: number): boolean {
    const d = fromJalali(viewYear, viewMonth, day);
    const iso = d.toISOString().split("T")[0];
    if (minDate && iso < minDate) return true;
    if (maxDate && iso > maxDate) return true;
    return false;
  }

  // Build calendar grid
  const firstDay = firstDayOfJalaliMonth(viewYear, viewMonth);
  const daysCount = daysInJalaliMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysCount }, (_, i) => i + 1),
  ];

  const displayValue = selectedJ
    ? `${toPersianNum(selectedJ.day)} ${JALALI_MONTHS[selectedJ.month - 1]} ${toPersianNum(selectedJ.year)}`
    : null;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 w-full px-3 py-2 rounded-xl border border-border bg-input",
          "text-sm text-start transition-colors",
          "hover:border-primary/50 focus:outline-none focus:border-primary",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className={displayValue ? "text-foreground" : "text-muted-foreground"}>
          {displayValue ?? placeholder}
        </span>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 top-full mt-2 end-0",
              "w-72 p-3 rounded-2xl",
              "bg-card border border-border shadow-xl"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-foreground">
                {JALALI_MONTHS[viewMonth - 1]} {toPersianNum(viewYear)}
              </span>
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Week day headers */}
            <div className="grid grid-cols-7 mb-1">
              {WEEK_DAYS.map((d) => (
                <div key={d} className="text-center text-xs text-muted-foreground py-1 font-medium">
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;

                const isToday =
                  viewYear === todayJ.year &&
                  viewMonth === todayJ.month &&
                  day === todayJ.day;
                const isSelected =
                  selectedJ &&
                  viewYear === selectedJ.year &&
                  viewMonth === selectedJ.month &&
                  day === selectedJ.day;
                const disabled = isDisabled(day);

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={disabled}
                    onClick={() => selectDay(day)}
                    className={cn(
                      "h-8 w-full rounded-lg text-xs font-medium transition-all",
                      "hover:bg-primary hover:text-primary-foreground",
                      isSelected && "bg-primary text-primary-foreground",
                      isToday && !isSelected && "border border-primary text-primary",
                      disabled && "opacity-30 cursor-not-allowed hover:bg-transparent"
                    )}
                  >
                    {toPersianNum(day)}
                  </button>
                );
              })}
            </div>

            {/* Today button */}
            <div className="mt-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setViewYear(todayJ.year);
                  setViewMonth(todayJ.month);
                  selectDay(todayJ.day);
                }}
                className="w-full text-xs text-primary hover:underline"
              >
                امروز
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
