import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format price in Toman with Persian comma-separated thousands */
export function formatPrice(amount: number, short = false): string {
  if (short) {
    if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} میلیارد`;
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} میلیون`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)} هزار`;
  }
  return new Intl.NumberFormat("fa-IR").format(amount) + " تومان";
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("fa-IR").format(n);
}

/** Convert Gregorian to Jalali (Shamsi) date string using built-in Intl API */
export function toJalali(date: string | Date, style: "short" | "long" = "short"): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fa-IR", {
    year: "numeric",
    month: style === "long" ? "long" : "2-digit",
    day: "2-digit",
    calendar: "persian",
  });
}

/** Convert Gregorian to Jalali with full Persian month name */
export function toJalaliLong(date: string | Date): string {
  return toJalali(date, "long");
}

/** Time ago in Persian */
export function timeAgo(date: string | Date): string {
  const now = Date.now();
  const past = typeof date === "string" ? new Date(date).getTime() : date.getTime();
  const diffMs = now - past;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMinutes < 1) return "همین الان";
  if (diffMinutes < 60) return `${diffMinutes} دقیقه پیش`;
  if (diffHours < 24) return `${diffHours} ساعت پیش`;
  if (diffDays < 30) return `${diffDays} روز پیش`;
  if (diffMonths < 12) return `${diffMonths} ماه پیش`;
  return `${diffYears} سال پیش`;
}

/** Format duration from seconds */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Generate a deterministic color from a string (for project covers) */
export function stringToColor(str: string): string {
  const colors = [
    "from-violet-600 to-purple-700",
    "from-blue-600 to-cyan-600",
    "from-emerald-600 to-teal-600",
    "from-orange-500 to-rose-500",
    "from-amber-500 to-yellow-400",
    "from-pink-600 to-rose-600",
    "from-indigo-600 to-blue-700",
    "from-teal-600 to-emerald-500",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/** Generate initials from full name */
export function getInitials(name: string, max = 2): string {
  return name
    .split(" ")
    .slice(0, max)
    .map((w) => w[0])
    .join("");
}

/** Convert Persian/Arabic numerals to English */
export function persianToEnglish(str: string): string {
  const persianNums = "۰۱۲۳۴۵۶۷۸۹";
  const arabicNums = "٠١٢٣٤٥٦٧٨٩";
  return str
    .replace(/[۰-۹]/g, (d) => String(persianNums.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(arabicNums.indexOf(d)));
}

/** Truncate text */
export function truncate(str: string, length = 50): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

/** Debounce function */
export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Clamp number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Generate unique ID */
export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
