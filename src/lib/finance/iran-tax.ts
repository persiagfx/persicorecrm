/**
 * محاسبات مالیاتی ایران — کتابخانهٔ مشترک کلاینت و سرور
 * مرجع نرخ‌ها: سازمان امور مالیاتی کشور — قوانین مالیات بر ارزش افزوده،
 * مالیات بر درآمد حقوق (ماده ۸۵)، مالیات عملکرد اشخاص حقوقی (ماده ۱۰۵)،
 * و گزارش معاملات فصلی (ماده ۱۶۹).
 *
 * ⚠️ همهٔ مبالغ بر حسب «ریال» هستند (واحد رسمی دفاتر). برای نمایش به تومان
 *    از rialToToman استفاده کنید.
 */

// ════════════════════════════════════════════════════════════════════
// ─── تبدیل تاریخ شمسی ↔ میلادی (الگوریتم استاندارد jalaali) ───────────
// ════════════════════════════════════════════════════════════════════

function div(a: number, b: number) {
  return Math.floor(a / b);
}

function jalCal(jy: number) {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
    2192, 2262, 2324, 2394, 2456, 3178,
  ];
  const bl = breaks.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jm = 0;
  let jump = 0;
  for (let i = 1; i < bl; i += 1) {
    jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(jump % 33, 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div((n % 33) + 3, 4);
  if (jump % 33 === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = (((n + 1) % 33) - 1) % 4;
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

function g2d(gy: number, gm: number, gd: number) {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * ((gm + 9) % 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn: number) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div((j % 1461), 4) * 5 + 308;
  const gd = div((i % 153), 5) + 1;
  const gm = ((div(i, 153) % 12) + 1);
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

/** میلادی → شمسی */
export function toJalaali(gy: number, gm: number, gd: number) {
  const jdn = g2d(gy, gm, gd);
  let jy = gy - 621;
  const r = jalCal(jy);
  const gdn = g2d(r.gy, 3, r.march);
  let k = jdn - gdn;
  if (k >= 0) {
    if (k <= 185) {
      const jm = 1 + div(k, 31);
      const jd = (k % 31) + 1;
      return { jy, jm, jd };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (jalCal(jy).leap === 1) k += 1;
  }
  const jm = 7 + div(k, 30);
  const jd = (k % 30) + 1;
  return { jy, jm, jd };
}

/** شمسی → میلادی */
export function toGregorian(jy: number, jm: number, jd: number) {
  const r = jalCal(jy);
  return d2g(g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1);
}

/** Date → {jy,jm,jd} */
export function dateToJalaali(d: Date) {
  return toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/** {jy,jm,jd} → Date (میلادی) */
export function jalaaliToDate(jy: number, jm: number, jd: number): Date {
  const g = toGregorian(jy, jm, jd);
  return new Date(g.gy, g.gm - 1, g.gd);
}

/** سال مالی جاری (شمسی) */
export function currentJalaaliYear(now: Date = new Date()): number {
  return dateToJalaali(now).jy;
}

// ════════════════════════════════════════════════════════════════════
// ─── واحد پول ─────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════

export function rialToToman(toman: number): number {
  return Math.round(toman);
}

export function formatRial(rial: number): string {
  return new Intl.NumberFormat("fa-IR").format(Math.round(rial)) + " ریال";
}

export function formatToman(rial: number): string {
  return new Intl.NumberFormat("fa-IR").format(rialToToman(rial)) + " تومان";
}

// ════════════════════════════════════════════════════════════════════
// ─── مالیات بر ارزش افزوده ──────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════

/** نرخ مالیات بر ارزش افزوده به تفکیک سال شمسی (درصد) */
export const VAT_RATES: Record<number, number> = {
  1402: 9,
  1403: 9,
  1404: 10,
  1405: 12,
};

export const DEFAULT_VAT_RATE = 10;

export function getVatRate(jYear: number): number {
  return VAT_RATES[jYear] ?? DEFAULT_VAT_RATE;
}

export interface VatDeclaration {
  outputVat: number; // مالیات فروش (دریافتی از مشتری)
  inputVat: number; // مالیات خرید (اعتبار مالیاتی)
  payable: number; // مابه‌التفاوت قابل پرداخت
  credit: number; // اعتبار قابل انتقال به دوره بعد (در صورت منفی شدن)
}

/** اظهارنامهٔ ارزش افزوده: مالیات فروش − اعتبار مالیاتی خرید */
export function calcVatDeclaration(outputVat: number, inputVat: number): VatDeclaration {
  const diff = outputVat - inputVat;
  return {
    outputVat,
    inputVat,
    payable: diff > 0 ? diff : 0,
    credit: diff < 0 ? -diff : 0,
  };
}

/** ارزش افزودهٔ یک مبلغ مشمول */
export function calcVatOnAmount(taxableAmount: number, rate = DEFAULT_VAT_RATE): number {
  return Math.round((taxableAmount * rate) / 100);
}

// ════════════════════════════════════════════════════════════════════
// ─── مالیات بر درآمد حقوق (ماده ۸۵) ─────────────────────────────────
// ════════════════════════════════════════════════════════════════════

export interface PayrollBracket {
  /** سقف ماهانهٔ پلکان به ریال (Infinity برای آخرین پلکان) */
  upTo: number;
  rate: number; // درصد
  label: string;
}

/**
 * پلکان مالیات حقوق ماهانهٔ سال ۱۴۰۴ (به ریال).
 * معافیت ماهانه: ۲۴۰٬۰۰۰٬۰۰۰ ریال (۲۴ میلیون تومان).
 */
export const PAYROLL_BRACKETS_1404: PayrollBracket[] = [
  { upTo: 240_000_000, rate: 0, label: "تا ۲۴ میلیون تومان (معاف)" },
  { upTo: 300_000_000, rate: 10, label: "۲۴ تا ۳۰ میلیون تومان" },
  { upTo: 380_000_000, rate: 15, label: "۳۰ تا ۳۸ میلیون تومان" },
  { upTo: 500_000_000, rate: 20, label: "۳۸ تا ۵۰ میلیون تومان" },
  { upTo: 667_000_000, rate: 25, label: "۵۰ تا ۶۶٫۷ میلیون تومان" },
  { upTo: Infinity, rate: 30, label: "بیش از ۶۶٫۷ میلیون تومان" },
];

export const PAYROLL_BRACKETS: Record<number, PayrollBracket[]> = {
  1404: PAYROLL_BRACKETS_1404,
  1405: PAYROLL_BRACKETS_1404, // تا اعلام رسمی ۱۴۰۵ از همان پلکان استفاده می‌شود
};

export function getPayrollBrackets(jYear: number): PayrollBracket[] {
  return PAYROLL_BRACKETS[jYear] ?? PAYROLL_BRACKETS_1404;
}

export interface PayrollTaxResult {
  taxable: number;
  tax: number;
  net: number;
  effectiveRate: number;
  breakdown: { bracket: string; rate: number; portion: number; tax: number }[];
}

/** محاسبهٔ پلکانی مالیات حقوق ماهانه (ورودی و خروجی به ریال) */
export function calcPayrollTax(monthlyGrossRial: number, jYear = 1404): PayrollTaxResult {
  const brackets = getPayrollBrackets(jYear);
  let lower = 0;
  let tax = 0;
  const breakdown: PayrollTaxResult["breakdown"] = [];
  for (const b of brackets) {
    if (monthlyGrossRial <= lower) break;
    const ceiling = Math.min(monthlyGrossRial, b.upTo);
    const portion = ceiling - lower;
    if (portion > 0) {
      const portionTax = Math.round((portion * b.rate) / 100);
      tax += portionTax;
      breakdown.push({ bracket: b.label, rate: b.rate, portion, tax: portionTax });
    }
    lower = b.upTo;
  }
  return {
    taxable: monthlyGrossRial,
    tax,
    net: monthlyGrossRial - tax,
    effectiveRate: monthlyGrossRial > 0 ? (tax / monthlyGrossRial) * 100 : 0,
    breakdown,
  };
}

// ════════════════════════════════════════════════════════════════════
// ─── مالیات عملکرد اشخاص حقوقی (ماده ۱۰۵) ───────────────────────────
// ════════════════════════════════════════════════════════════════════

/** نرخ مقطوع مالیات عملکرد اشخاص حقوقی */
export const CORPORATE_TAX_RATE = 25;

export function calcPerformanceTax(netProfitRial: number, rate = CORPORATE_TAX_RATE): number {
  if (netProfitRial <= 0) return 0;
  return Math.round((netProfitRial * rate) / 100);
}

// ════════════════════════════════════════════════════════════════════
// ─── مالیات تکلیفی / کسر از مبدأ ─────────────────────────────────────
// ════════════════════════════════════════════════════════════════════

export interface WithholdingPreset {
  key: string;
  label: string;
  rate: number;
  note?: string;
}

export const WITHHOLDING_PRESETS: WithholdingPreset[] = [
  { key: "rent", label: "اجارهٔ املاک", rate: 10, note: "ماده ۵۳ — کسر مالیات تکلیفی اجاره" },
  { key: "salary", label: "حقوق و دستمزد", rate: 0, note: "طبق جدول پلکانی ماده ۸۵" },
  { key: "contract", label: "حق‌الزحمه / پیمانکاری", rate: 3, note: "بسته به نوع قرارداد" },
  { key: "royalty", label: "حق امتیاز و مالکیت معنوی", rate: 5 },
  { key: "custom", label: "نرخ دلخواه", rate: 0 },
];

export function calcWithholding(grossRial: number, rate: number): number {
  return Math.round((grossRial * rate) / 100);
}

// ════════════════════════════════════════════════════════════════════
// ─── فصل‌های مالیاتی و تقویم سررسید ─────────────────────────────────
// ════════════════════════════════════════════════════════════════════

export interface TaxQuarter {
  q: 1 | 2 | 3 | 4;
  name: string; // بهار/تابستان/پاییز/زمستان
  startMonth: number; // ماه شمسی شروع
  endMonth: number;
  endDay: number; // آخرین روز فصل (شمسی)
}

export const TAX_QUARTERS: TaxQuarter[] = [
  { q: 1, name: "بهار", startMonth: 1, endMonth: 3, endDay: 31 },
  { q: 2, name: "تابستان", startMonth: 4, endMonth: 6, endDay: 31 },
  { q: 3, name: "پاییز", startMonth: 7, endMonth: 9, endDay: 30 },
  { q: 4, name: "زمستان", startMonth: 10, endMonth: 12, endDay: 29 },
];

/** نام فصل برای یک ماه شمسی */
export function quarterOfMonth(jMonth: number): TaxQuarter {
  return TAX_QUARTERS[Math.floor((jMonth - 1) / 3)];
}

export type TaxDeadlineKind =
  | "vat"
  | "seasonal"
  | "payroll"
  | "performance-legal"
  | "performance-natural";

export interface TaxDeadline {
  kind: TaxDeadlineKind;
  title: string;
  period: string; // برچسب دوره
  jalaaliDue: string; // سررسید شمسی برای نمایش
  dueDate: Date; // سررسید میلادی برای مرتب‌سازی/تأخیر
  description: string;
}

/** افزودن n روز به تاریخ */
function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function fmtJalaaliDate(d: Date): string {
  const j = dateToJalaali(d);
  return `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")}`;
}

/**
 * تولید تقویم سررسیدهای مالیاتی یک سال مالی شمسی:
 *  • اظهارنامهٔ ارزش افزوده: ۱۵ روز پس از پایان هر فصل
 *  • گزارش معاملات فصلی (ماده ۱۶۹): ۴۵ روز پس از پایان هر فصل
 *  • مالیات حقوق: تا پایان ماه بعد (ماهانه)
 *  • اظهارنامهٔ عملکرد اشخاص حقوقی: تا ۳۱ تیر سال بعد
 *  • اظهارنامهٔ عملکرد اشخاص حقیقی: تا ۳۱ خرداد سال بعد
 */
export function getTaxDeadlines(jYear: number): TaxDeadline[] {
  const out: TaxDeadline[] = [];

  for (const q of TAX_QUARTERS) {
    const quarterEnd = jalaaliToDate(jYear, q.endMonth, q.endDay);
    const vatDue = addDays(quarterEnd, 15);
    const seasonalDue = addDays(quarterEnd, 45);
    out.push({
      kind: "vat",
      title: "اظهارنامهٔ مالیات بر ارزش افزوده",
      period: `${q.name} ${jYear}`,
      jalaaliDue: fmtJalaaliDate(vatDue),
      dueDate: vatDue,
      description: "تسلیم اظهارنامه و پرداخت مالیات ارزش افزودهٔ فصل — تا ۱۵ روز پس از پایان فصل",
    });
    out.push({
      kind: "seasonal",
      title: "گزارش معاملات فصلی (ماده ۱۶۹)",
      period: `${q.name} ${jYear}`,
      jalaaliDue: fmtJalaaliDate(seasonalDue),
      dueDate: seasonalDue,
      description: "ارسال فهرست خرید و فروش فصلی — تا یک‌ماه‌ونیم پس از پایان فصل",
    });
  }

  // اظهارنامهٔ عملکرد سال جاری (تسلیم در سال بعد)
  const legalPerf = jalaaliToDate(jYear + 1, 4, 31);
  out.push({
    kind: "performance-legal",
    title: "اظهارنامهٔ عملکرد اشخاص حقوقی",
    period: `سال مالی ${jYear}`,
    jalaaliDue: fmtJalaaliDate(legalPerf),
    dueDate: legalPerf,
    description: "تسلیم اظهارنامهٔ عملکرد و پرداخت مالیات شرکت — تا ۴ ماه پس از پایان سال مالی (۳۱ تیر)",
  });
  const naturalPerf = jalaaliToDate(jYear + 1, 3, 31);
  out.push({
    kind: "performance-natural",
    title: "اظهارنامهٔ عملکرد اشخاص حقیقی",
    period: `سال مالی ${jYear}`,
    jalaaliDue: fmtJalaaliDate(naturalPerf),
    dueDate: naturalPerf,
    description: "تسلیم اظهارنامهٔ عملکرد اشخاص حقیقی — تا ۳۱ خرداد سال بعد",
  });

  return out.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

export const TAX_TYPE_LABELS: Record<string, string> = {
  vat: "مالیات بر ارزش افزوده",
  income: "مالیات بر درآمد",
  performance: "مالیات عملکرد",
  payroll: "مالیات حقوق",
  withholding: "مالیات تکلیفی",
  municipal: "عوارض شهرداری",
  other: "سایر",
};
