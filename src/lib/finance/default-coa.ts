/**
 * کدینگ استاندارد حسابداری ایران — ساختار سرفصل‌های کل و معین.
 * گروه‌ها با کد دو رقمی و حساب‌های معین با کد چهار رقمی.
 * type یکی از: asset | liability | equity | revenue | expense
 */
export interface CoaSeedAccount {
  code: string;
  name: string;
  nameFa: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  parentCode?: string;
  description?: string;
}

export const DEFAULT_CHART_OF_ACCOUNTS: CoaSeedAccount[] = [
  // ─── دارایی‌ها ───
  { code: "10", name: "Cash & Bank", nameFa: "موجودی نقد و بانک", type: "asset" },
  { code: "1001", name: "Cash", nameFa: "صندوق", type: "asset", parentCode: "10" },
  { code: "1002", name: "Banks", nameFa: "بانک‌ها", type: "asset", parentCode: "10" },
  { code: "1003", name: "Petty Cash", nameFa: "تنخواه‌گردان", type: "asset", parentCode: "10" },

  { code: "11", name: "Receivables", nameFa: "حساب‌ها و اسناد دریافتنی", type: "asset" },
  { code: "1101", name: "Accounts Receivable", nameFa: "حساب‌های دریافتنی تجاری (بدهکاران)", type: "asset", parentCode: "11" },
  { code: "1102", name: "Notes Receivable", nameFa: "اسناد دریافتنی (چک‌های دریافتنی)", type: "asset", parentCode: "11" },
  { code: "1103", name: "Prepayments", nameFa: "پیش‌پرداخت‌ها", type: "asset", parentCode: "11" },
  { code: "1104", name: "Input VAT", nameFa: "مالیات بر ارزش افزودهٔ خرید (اعتبار مالیاتی)", type: "asset", parentCode: "11" },

  { code: "15", name: "Fixed Assets", nameFa: "دارایی‌های ثابت مشهود", type: "asset" },
  { code: "1501", name: "Property, Plant & Equipment", nameFa: "اموال، ماشین‌آلات و تجهیزات", type: "asset", parentCode: "15" },
  { code: "1502", name: "Accumulated Depreciation", nameFa: "استهلاک انباشته", type: "asset", parentCode: "15", description: "حساب کاهنده دارایی" },

  // ─── بدهی‌ها ───
  { code: "20", name: "Payables", nameFa: "حساب‌ها و اسناد پرداختنی", type: "liability" },
  { code: "2001", name: "Accounts Payable", nameFa: "حساب‌های پرداختنی تجاری (بستانکاران)", type: "liability", parentCode: "20" },
  { code: "2002", name: "Notes Payable", nameFa: "اسناد پرداختنی (چک‌های پرداختنی)", type: "liability", parentCode: "20" },

  { code: "21", name: "Tax & Insurance Payable", nameFa: "بدهی‌های مالیاتی و بیمه", type: "liability" },
  { code: "2101", name: "Output VAT Payable", nameFa: "مالیات بر ارزش افزودهٔ فروش پرداختنی", type: "liability", parentCode: "21" },
  { code: "2102", name: "Payroll Tax Payable", nameFa: "مالیات حقوق پرداختنی", type: "liability", parentCode: "21" },
  { code: "2103", name: "Income Tax Payable", nameFa: "مالیات عملکرد پرداختنی", type: "liability", parentCode: "21" },
  { code: "2104", name: "Social Security Payable", nameFa: "بیمهٔ تأمین اجتماعی پرداختنی", type: "liability", parentCode: "21" },

  { code: "22", name: "Salaries Payable", nameFa: "حقوق و دستمزد پرداختنی", type: "liability" },
  { code: "2201", name: "Wages Payable", nameFa: "حقوق و دستمزد پرداختنی", type: "liability", parentCode: "22" },

  // ─── حقوق صاحبان سهام ───
  { code: "30", name: "Equity", nameFa: "حقوق صاحبان سهام", type: "equity" },
  { code: "3001", name: "Capital", nameFa: "سرمایه", type: "equity", parentCode: "30" },
  { code: "3002", name: "Retained Earnings", nameFa: "سود (زیان) انباشته", type: "equity", parentCode: "30" },
  { code: "3003", name: "Drawings", nameFa: "برداشت", type: "equity", parentCode: "30" },

  // ─── درآمدها ───
  { code: "40", name: "Operating Revenue", nameFa: "درآمد عملیاتی", type: "revenue" },
  { code: "4001", name: "Service Revenue", nameFa: "درآمد فروش خدمات", type: "revenue", parentCode: "40" },
  { code: "4002", name: "Product Revenue", nameFa: "درآمد فروش کالا", type: "revenue", parentCode: "40" },
  { code: "41", name: "Other Income", nameFa: "سایر درآمدها", type: "revenue" },
  { code: "4101", name: "Misc Income", nameFa: "سایر درآمدها", type: "revenue", parentCode: "41" },

  // ─── هزینه‌ها ───
  { code: "50", name: "Cost of Services", nameFa: "بهای تمام‌شدهٔ خدمات", type: "expense" },
  { code: "5001", name: "Cost of Goods/Services Sold", nameFa: "بهای تمام‌شدهٔ کالا و خدمات فروش‌رفته", type: "expense", parentCode: "50" },

  { code: "51", name: "General & Admin", nameFa: "هزینه‌های عمومی و اداری", type: "expense" },
  { code: "5101", name: "Salaries Expense", nameFa: "هزینهٔ حقوق و دستمزد", type: "expense", parentCode: "51" },
  { code: "5102", name: "Rent Expense", nameFa: "هزینهٔ اجاره", type: "expense", parentCode: "51" },
  { code: "5103", name: "Utilities", nameFa: "هزینهٔ آب، برق، گاز و تلفن", type: "expense", parentCode: "51" },
  { code: "5104", name: "Office Supplies", nameFa: "هزینهٔ ملزومات اداری", type: "expense", parentCode: "51" },
  { code: "5105", name: "Depreciation Expense", nameFa: "هزینهٔ استهلاک", type: "expense", parentCode: "51" },
  { code: "5106", name: "Insurance Expense", nameFa: "هزینهٔ بیمه", type: "expense", parentCode: "51" },
  { code: "5107", name: "Internet & Telecom", nameFa: "هزینهٔ اینترنت و ارتباطات", type: "expense", parentCode: "51" },
  { code: "5108", name: "Tools & Subscriptions", nameFa: "هزینهٔ ابزار و سرویس‌ها", type: "expense", parentCode: "51" },
  { code: "5109", name: "Miscellaneous Expense", nameFa: "سایر هزینه‌های عمومی", type: "expense", parentCode: "51" },

  { code: "52", name: "Selling & Marketing", nameFa: "هزینه‌های فروش و بازاریابی", type: "expense" },
  { code: "5201", name: "Marketing & Advertising", nameFa: "هزینهٔ تبلیغات و بازاریابی", type: "expense", parentCode: "52" },

  { code: "53", name: "Financial Expenses", nameFa: "هزینه‌های مالی", type: "expense" },
  { code: "5301", name: "Bank Charges", nameFa: "هزینهٔ کارمزد و خدمات بانکی", type: "expense", parentCode: "53" },
  { code: "5302", name: "Tax Expense", nameFa: "هزینهٔ مالیات", type: "expense", parentCode: "53" },
];
