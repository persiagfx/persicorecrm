import type { UserRole, LeadStatus, TaskPriority, TaskStatus, ExpenseCategory, TicketPriority, TicketStatus } from "@/types";

export const USER_ROLES: Record<UserRole, { label: string; color: string }> = {
  admin: { label: "مدیر کل", color: "gold" },
  sales_manager: { label: "مدیر فروش", color: "purple" },
  sales_rep: { label: "کارشناس فروش", color: "blue" },
  project_manager: { label: "مدیر پروژه", color: "teal" },
  designer: { label: "طراح", color: "rose" },
  developer: { label: "دولوپر", color: "emerald" },
  accountant: { label: "حسابدار", color: "amber" },
  marketing: { label: "مارکتینگ", color: "sky" },
  hr: { label: "منابع انسانی", color: "green" },
  legal: { label: "حقوقی", color: "orange" },
};

export const LEAD_STATUSES: Record<LeadStatus, { label: string; color: string; description: string }> = {
  new: { label: "جدید", color: "blue", description: "سرنخ جدید وارد شده" },
  contacted: { label: "تماس گرفته شد", color: "indigo", description: "اولین تماس برقرار شد" },
  meeting: { label: "جلسه", color: "violet", description: "جلسه حضوری برگزار شد" },
  proposal: { label: "پیشنهاد ارسال شد", color: "purple", description: "پروپوزال ارسال شد" },
  negotiation: { label: "مذاکره", color: "amber", description: "در حال مذاکره قیمت" },
  won: { label: "قرارداد بسته شد", color: "green", description: "فروش موفق" },
  lost: { label: "از دست رفت", color: "red", description: "فروش ناموفق" },
};

export const TASK_PRIORITIES: Record<TaskPriority, { label: string; color: string; icon: string }> = {
  low: { label: "کم", color: "slate", icon: "⬇️" },
  medium: { label: "متوسط", color: "blue", icon: "➡️" },
  high: { label: "زیاد", color: "orange", icon: "⬆️" },
  urgent: { label: "فوری", color: "red", icon: "🔴" },
};

export const TASK_STATUSES: Record<TaskStatus, { label: string; color: string }> = {
  backlog: { label: "بک‌لاگ", color: "slate" },
  todo: { label: "در انتظار", color: "blue" },
  in_progress: { label: "در حال انجام", color: "amber" },
  review: { label: "بررسی", color: "purple" },
  done: { label: "تکمیل شده", color: "green" },
};

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, { label: string; icon: string; color: string }> = {
  rent: { label: "اجاره", icon: "🏢", color: "blue" },
  internet: { label: "اینترنت", icon: "🌐", color: "sky" },
  tools: { label: "ابزار و سرویس", icon: "🔧", color: "purple" },
  ads: { label: "تبلیغات", icon: "📢", color: "orange" },
  salary: { label: "حقوق ثابت", icon: "💰", color: "green" },
  other: { label: "سایر", icon: "📦", color: "slate" },
};

export const TICKET_PRIORITIES: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: "کم", color: "slate" },
  medium: { label: "متوسط", color: "blue" },
  high: { label: "زیاد", color: "orange" },
  urgent: { label: "فوری", color: "red" },
};

export const TICKET_STATUSES: Record<TicketStatus, { label: string; color: string }> = {
  open: { label: "باز", color: "blue" },
  in_progress: { label: "در حال بررسی", color: "amber" },
  resolved: { label: "حل شد", color: "green" },
  closed: { label: "بسته شد", color: "slate" },
};

export const WIKI_CATEGORIES = [
  { id: "onboarding", label: "آموزش ورود", icon: "🚀" },
  { id: "coding", label: "استانداردهای کدنویسی", icon: "💻" },
  { id: "design", label: "سیستم طراحی", icon: "🎨" },
  { id: "workflow", label: "فرآیند پروژه", icon: "⚙️" },
  { id: "faq", label: "سؤالات متداول", icon: "❓" },
];

export const WIKI_TEMPLATES = [
  { id: "sop", label: "رویه استاندارد (SOP)", icon: "📋", content: `<h2>هدف</h2><p>توضیح دهید این رویه برای چه منظوری است.</p><h2>دامنه کاربرد</h2><p>این رویه برای چه کسانی و در چه شرایطی اعمال می‌شود.</p><h2>مراحل اجرا</h2><ol><li>مرحله اول</li><li>مرحله دوم</li><li>مرحله سوم</li></ol>` },
  { id: "meeting", label: "یادداشت جلسه", icon: "📝", content: `<h2>اطلاعات جلسه</h2><p><strong>تاریخ:</strong> <br/><strong>شرکت‌کنندگان:</strong> </p><h2>موارد مطرح‌شده</h2><ul><li>مورد اول</li></ul><h2>اقدامات بعدی</h2><ul><li>[ ] کار اول</li></ul>` },
  { id: "techspec", label: "مشخصات فنی", icon: "⚙️", content: `<h2>خلاصه</h2><p>توضیح مختصر.</p><h2>راه‌حل پیشنهادی</h2><p>توضیح راه‌حل.</p><h2>ریسک‌ها</h2><ul><li>ریسک اول</li></ul>` },
  { id: "bugreport", label: "گزارش باگ", icon: "🐛", content: `<h2>توضیح باگ</h2><p>توصیف واضح از مشکل.</p><h2>مراحل بازتولید</h2><ol><li>به صفحه X بروید</li><li>خطای Z مشاهده می‌شود</li></ol>` },
];

export const PERSIAN_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد",
  "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر",
  "دی", "بهمن", "اسفند",
];

export const DATA_VIZ_COLORS = [
  "hsl(43 74% 56%)",   // gold
  "hsl(263 70% 60%)",  // purple
  "hsl(174 72% 46%)",  // teal
  "hsl(14 90% 60%)",   // coral
  "hsl(152 60% 52%)",  // mint
  "hsl(199 89% 48%)",  // sky
  "hsl(340 75% 60%)",  // rose
  "hsl(270 60% 70%)",  // lavender
];
