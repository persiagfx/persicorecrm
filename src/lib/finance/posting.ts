/**
 * صدور خودکار سند حسابداری — تولید مشخصات سند (PostingSpec) از اسناد منبع
 * (فاکتور، هزینه، حقوق). هر spec یک جفت بدهکار/بستانکار است که با مدل
 * تک‌سطری LedgerEntry سازگار است؛ سند مرکب به چند جفت تجزیه می‌شود.
 *
 * همهٔ مبالغ بر حسب ریال (مطابق دیتابیس).
 */

export interface PostingSpec {
  debitCode: string;
  creditCode: string;
  amount: number;
  description: string;
  date: Date;
}

// ─── کدهای حساب پراستفاده (مطابق کدینگ استاندارد default-coa.ts) ───
export const ACC = {
  cash: "1001",
  bank: "1002",
  receivable: "1101", // حساب‌های دریافتنی (بدهکاران)
  inputVat: "1104",
  payable: "2001", // حساب‌های پرداختنی (بستانکاران)
  outputVat: "2101", // مالیات ارزش افزودهٔ فروش پرداختنی
  payrollTaxPayable: "2102",
  wagesPayable: "2201",
  serviceRevenue: "4001",
  salariesExpense: "5101",
} as const;

/** نگاشت دستهٔ هزینه به کد حساب هزینه (EXPENSE_CATEGORIES) */
export const EXPENSE_CATEGORY_ACCOUNT: Record<string, string> = {
  rent: "5102", // اجاره
  internet: "5107", // اینترنت و ارتباطات
  tools: "5108", // ابزار و سرویس‌ها
  ads: "5201", // تبلیغات و بازاریابی
  salary: "5101", // حقوق و دستمزد
  other: "5109", // سایر هزینه‌های عمومی
};

export function expenseAccountForCategory(category: string): string {
  return EXPENSE_CATEGORY_ACCOUNT[category] ?? ACC.salariesExpense;
}

// ════════════════════════ فاکتور ════════════════════════
interface InvoiceLike {
  invoiceNumber: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: string;
  issuedAt: Date;
  paidAt: Date | null;
  clientName?: string;
}

/**
 * سند فاکتور:
 *  • شناسایی درآمد (تعهدی): بد ۱۱۰۱ / بس ۴۰۰۱ = مبلغ خالص، و بد ۱۱۰۱ / بس ۲۱۰۱ = ارزش افزوده
 *  • در صورت پرداخت: بد ۱۰۰۲ (بانک) / بس ۱۱۰۱ = کل
 */
export function buildInvoicePostings(inv: InvoiceLike): PostingSpec[] {
  const specs: PostingSpec[] = [];
  const ref = inv.clientName ? `${inv.invoiceNumber} — ${inv.clientName}` : inv.invoiceNumber;

  if (inv.subtotal > 0) {
    specs.push({
      debitCode: ACC.receivable, creditCode: ACC.serviceRevenue,
      amount: inv.subtotal, date: inv.issuedAt,
      description: `شناسایی درآمد فاکتور ${ref}`,
    });
  }
  if (inv.taxAmount > 0) {
    specs.push({
      debitCode: ACC.receivable, creditCode: ACC.outputVat,
      amount: inv.taxAmount, date: inv.issuedAt,
      description: `مالیات ارزش افزودهٔ فاکتور ${ref}`,
    });
  }
  if (inv.status === "paid" && inv.paidAt && inv.total > 0) {
    specs.push({
      debitCode: ACC.bank, creditCode: ACC.receivable,
      amount: inv.total, date: inv.paidAt,
      description: `دریافت وجه فاکتور ${ref}`,
    });
  }
  return specs;
}

// ════════════════════════ هزینه ════════════════════════
interface ExpenseLike {
  title: string;
  amount: number;
  category: string;
  date: Date;
}

/** سند هزینه: بد <حساب هزینه بر اساس دسته> / بس ۱۰۰۲ (بانک) = مبلغ */
export function buildExpensePostings(exp: ExpenseLike): PostingSpec[] {
  if (exp.amount <= 0) return [];
  return [{
    debitCode: expenseAccountForCategory(exp.category),
    creditCode: ACC.bank,
    amount: exp.amount,
    date: exp.date,
    description: `هزینه: ${exp.title}`,
  }];
}

// ════════════════════════ حقوق ════════════════════════
interface PayrollLike {
  period: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netPay: number;
  paidAt: Date | null;
  employeeName?: string;
}

/**
 * سند حقوق پرداختی (ناخالص = پایه + پاداش = خالص + کسورات):
 *  • بد ۵۱۰۱ / بس ۱۰۰۲ (بانک) = خالص پرداختی
 *  • بد ۵۱۰۱ / بس ۲۱۰۲ (مالیات/کسورات) = کسورات
 */
export function buildPayrollPostings(rec: PayrollLike): PostingSpec[] {
  const date = rec.paidAt ?? new Date();
  const who = rec.employeeName ? `${rec.employeeName} — ${rec.period}` : rec.period;
  const specs: PostingSpec[] = [];
  if (rec.netPay > 0) {
    specs.push({
      debitCode: ACC.salariesExpense, creditCode: ACC.bank,
      amount: rec.netPay, date, description: `حقوق پرداختی ${who}`,
    });
  }
  if (rec.deductions > 0) {
    specs.push({
      debitCode: ACC.salariesExpense, creditCode: ACC.payrollTaxPayable,
      amount: rec.deductions, date, description: `کسورات حقوق ${who}`,
    });
  }
  return specs;
}
