# راهنمای ادامهٔ کار — بازسازی ماژول مالی/مالیاتی (Persicore CRM)

> این فایل برای انتقال کار به یک نشست/اکانت دیگر Claude است. هر چیزی که برای ادامهٔ
> کار بدون دانش قبلی لازم است این‌جا آمده. خواندن کامل قبل از شروع الزامی است.

---

## ۰. خلاصهٔ پروژه و قراردادهای حیاتی

- **استک:** Next.js 15 (App Router) · TypeScript · Prisma · **MySQL** · React 19 · TailwindCSS · shadcn/ui · recharts · sonner (toast). RTL/فارسی.
- **دایرکتوری کاری:** `C:\Users\FarzinRayane\Desktop\Project\persicorecrm\crm`
- **واحد پول (مهم):** در دیتابیس و همهٔ مدل‌ها مبالغ **ریال** (Int) هستند. در UI همه‌چیز **تومان** نمایش/ورودی داده می‌شود. تبدیل: `ریال = تومان × ۱۰`. از توابع `rialToToman` / `formatToman` / `formatRial` در `src/lib/finance/iran-tax.ts` استفاده کن. **هرگز** مبلغ خام را بدون تبدیل نمایش نده.
- **schema را تغییر نده مگر ضروری:** پروژه با `prisma db push` سینک شده (فقط ۲ migration برای ~۱۰۰ مدل در `prisma/migrations`). افزودن مدل = ریسک. تا جای ممکن فیچرها را روی داده‌ی موجود **محاسبه** کن. اگر مدل جدید لازم شد (مثل سند چندسطری)، با کاربر هماهنگ کن و از `npx prisma db push` استفاده کن نه migrate.
- **احراز هویت API:** هر route handler با `requireAuth(req)` شروع می‌شود و `tenantFilter(payload)` در where قرار می‌گیرد. الگوها در `src/lib/auth.ts`: `ok` / `created` / `badRequest` / `unauthorized` / `serverError`. پاسخ موفق: `{ data, meta }`.
- **الگوی API route:** نمونهٔ کامل در `src/app/api/erp/reports/trial-balance/route.ts`.
- **الگوی صفحه:** `"use client"` + raw `fetch("/api/...")` + کامپوننت‌های `@/components/ui/*`. نمونهٔ مرجع: `src/app/(dashboard)/erp/ledger/page.tsx`.
- **تاریخ شمسی:** نمایش با `new Date(x).toLocaleDateString("fa-IR")`. تبدیل شمسی↔میلادی برای محاسبات در `iran-tax.ts` (`toJalaali`, `toGregorian`, `jalaaliToDate`, `dateToJalaali`, `currentJalaaliYear`).

### اعتبارسنجی بعد از هر تغییر (الزامی)
```bash
npx tsc --noEmit            # باید 0 خطا باشد
npx next lint --file <path> # فقط warning مجاز است، نه error (بیلد روی error می‌شکند)
# تست رندر: npx next dev -p 3199 سپس curl صفحه (۲۰۰) و API (۴۰۱ بدون auth)
```

---

## ۱. مدل‌های دیتابیس مرتبط (در `prisma/schema.prisma`)

| مدل | فیلدهای کلیدی |
|-----|----------------|
| `ChartOfAccount` | code(@unique), name, nameFa, type(asset/liability/equity/revenue/expense), parentId, isActive |
| `LedgerEntry` | date, description, **debitAccountId + creditAccountId + amount(Int ریال)** — تک‌سطری جفتی، **نه** چندسطری. reference, entityType, entityId, createdById |
| `Invoice` | invoiceNumber, clientId, items(Json), subtotal, taxRate, taxAmount, total, status(draft/sent/paid/overdue/partial), issuedAt, dueDate, paidAt |
| `Installment` | invoiceId, amount, dueDate, paidAt, paidAmount |
| `Expense` | title, amount, category, date, paidById, approvalStatus(pending/approved), approvedAt |
| `PayrollRecord` | userId, period, baseSalary, bonus, deductions, netPay, status, paidAt |
| `BankAccount` | name, bankName, accountNumber, iban, currency, balance |
| `BankTransaction` | accountId, type(credit/debit), amount, date, balance |
| `BankCheck` | type(issued/received), payee, amount, checkNumber, dueDate, status(pending/cleared/bounced/cancelled) |
| `FixedAsset` | name, category, purchaseDate, purchasePrice, currentValue, depreciationRate(Float), status |
| `TaxRecord` | period, type, totalSales, taxableAmt, taxRate, taxAmount, exemptions, status(draft/filed/paid), dueDate, paidAt |
| `Commission` / `SalaryAdvance` | پورسانت و مساعده |

⚠️ `LedgerEntry` فقط **یک بدهکار و یک بستانکار** دارد. سند مرکب با چند بدهکار/بستانکار باید به چند `LedgerEntry` جفتی **تجزیه** شود (هر جفت با `reference` و `entityId` مشترک گروه می‌شود).

---

## ۲. کارهای انجام‌شده (فاز ۱ و ۲ و ۳ — کامل و تست‌شده)

### فایل‌های جدید
- `src/lib/finance/iran-tax.ts` — نرخ‌ها، پلکان حقوق، ماشین‌حساب‌ها، تبدیل تاریخ، تقویم مالیاتی. **هستهٔ مشترک کل ماژول.**
  - VAT: ۱۴۰۴=۱۰٪، ۱۴۰۵=۱۲٪ · حقوق ۱۴۰۴: معافیت ۲۴م تومان/ماه، پلکان ۱۰/۱۵/۲۰/۲۵/۳۰٪ · عملکرد ۲۵٪ مقطوع (ماده ۱۰۵).
- `src/lib/finance/default-coa.ts` — کدینگ استاندارد حسابداری ایران (~۴۰ سرفصل).
- `src/app/api/erp/tax/summary/route.ts` — داشبورد مالیاتی: ارزش افزوده از فاکتورها، معاملات فصلی، تقویم.
- `src/app/api/erp/reports/trial-balance/route.ts` — تراز آزمایشی چهارستونی.
- `src/app/api/erp/reports/general-ledger/route.ts` — دفتر کل/معین با ماندهٔ تجمعی.
- `src/app/api/erp/reports/aged-receivables/route.ts` — گزارش سنی بدهکاران.
- `src/app/api/erp/chart-of-accounts/seed/route.ts` — بارگذاری idempotent کدینگ استاندارد.

### فایل‌های بازنویسی/ویرایش‌شده
- `src/app/(dashboard)/erp/tax/page.tsx` — مرکز مالیاتی با ۷ تب (داشبورد، ارزش افزوده، حقوق، معاملات فصلی، تقویم، ماشین‌حساب‌ها، پرونده‌ها).
- `src/app/(dashboard)/erp/ledger/page.tsx` — انتخابگر حساب (به‌جای تایپ ID)، تومان، شمسی، جستجو، جمع گردش.
- `src/app/(dashboard)/erp/reports/page.tsx` — ۳ تب جدید (تراز آزمایشی، دفتر کل/معین، سنی بدهکاران).
- `src/app/(dashboard)/erp/chart-of-accounts/page.tsx` — دکمهٔ «بارگذاری کدینگ استاندارد».

---

## ۳. فازهای باقی‌مانده (به ترتیب اولویت)

### ✅ فاز ۴ — صدور خودکار سند حسابداری — **انجام شد**
پیاده‌سازی‌شده در: `src/lib/finance/posting.ts` (نگاشت حساب‌ها + buildInvoice/Expense/PayrollPostings)،
`src/app/api/erp/ledger/post/route.ts` (GET پیش‌نمایش + POST idempotent با حذف‌وبازسازی)، و پنل «صدور خودکار اسناد» در `erp/ledger/page.tsx`.
دستهٔ هزینه‌ها واقعی: `rent/internet/tools/ads/salary/other` → کدهای 5102/5107/5108/5201/5101/5109.
اگر بعداً لازم شد: دکمهٔ صدور تک‌سندی در ردیف فاکتور/هزینه، و سند معکوس (reversing) هنگام حذف فاکتور.

<details><summary>طراحی اصلی فاز ۴ (مرجع)</summary>
هدف: از فاکتور/هزینه/حقوق به‌طور خودکار `LedgerEntry` تولید شود تا دفاتر و گزارش‌ها داده داشته باشند.

**نقشهٔ حساب‌ها (بر اساس کد کدینگ استاندارد):**
- **فاکتور صادرشده (تعهدی):** بدهکار `1101` حساب‌های دریافتنی = total → دو سند جفتی:
  - جفت ۱: بد `1101` / بس `4001` (درآمد) = subtotal
  - جفت ۲: بد `1101` / بس `2101` (ارزش افزودهٔ فروش) = taxAmount
- **دریافت وجه فاکتور:** بد `1002` (بانک) / بس `1101` = total
- **هزینهٔ تأییدشده:** بد حساب هزینه بر اساس category (نگاشت زیر) / بس `1002` (بانک) = amount
- **حقوق پرداختی:** بد `5101` (هزینهٔ حقوق) = ناخالص → جفت‌ها: بس `2201` (خالص)، بس `2102` (مالیات حقوق)، بس `2104` (بیمه)

**نگاشت category هزینه → کد حساب** (در `posting.ts` تعریف شود؛ category‌های فعلی را از داده‌ی موجود استخراج کن):
`rent→5102, utilities→5103, supplies/office→5104, marketing/advertising→5201, bank→5301, salary→5101, other→5302` (پیش‌فرض `5302`).

**پیاده‌سازی پیشنهادی:**
1. `src/lib/finance/posting.ts`:
   - `getAccountIdByCode(tenantId, code)` با کش.
   - `buildInvoicePostings(invoice)`, `buildExpensePostings(expense)`, `buildPayrollPostings(record)` → آرایه‌ای از `{debitCode, creditCode, amount, description, date}`.
2. `src/app/api/erp/ledger/post/route.ts` (POST): ورودی `{entityType, entityId}` یا حالت دسته‌ای `{mode:"all"}`. **idempotent**: قبل از ایجاد، `LedgerEntry` با همان `entityType+entityId` را چک/حذف-بازسازی کن تا سند تکراری نشود. اگر حسابِ کد موردنیاز نبود، خطای راهنما بده («ابتدا کدینگ استاندارد را بارگذاری کنید»).
3. UI: در `erp/ledger` یک پنل «صدور خودکار اسناد» که اسناد ثبت‌نشده را می‌شمارد و با یک دکمه پست می‌کند؛ و دکمهٔ «صدور سند» در ردیف فاکتور/هزینه (اختیاری).
</details>

### 🟠 فاز ۵ — استهلاک دارایی ثابت + سررسید چک
- `src/app/api/erp/fixed-assets/depreciation/route.ts`: محاسبهٔ استهلاک سالانه/ماهانه بر اساس `depreciationRate` (روش خط مستقیم یا نزولی). جدول استهلاک هر دارایی + ارزش دفتری.
- در `erp/fixed-assets/page.tsx`: نمایش جدول استهلاک + دکمهٔ صدور سند استهلاک (بد `5105` / بس `1502`).
- در `erp/checks/page.tsx`: گروه‌بندی چک‌ها بر اساس سررسید (سررسیدشده/این هفته/این ماه/آینده) + هشدار و فیلتر وضعیت.

### 🟠 فاز ۶ — گزارش‌های تکمیلی
- `aged-payables/route.ts`: سنی بستانکاران (از Expense تأییدشدهٔ پرداخت‌نشده / Installment پرداختنی). مشابه aged-receivables.
- نسبت‌های مالی: نقدینگی (جاری، آنی)، سودآوری (حاشیهٔ سود)، نسبت بدهی — از ترازنامه/سودوزیان موجود. تب جدید در reports یا در `finance/page.tsx`.
- خروجی Excel گزارش‌ها با کتابخانهٔ `xlsx` (از قبل نصب است).

### 🟡 فاز ۷ — سند حسابداری چندسطری (نیازمند schema)
- مدل جدید `JournalVoucher` (header: number, date, description, status) + `JournalLine` (voucherId, accountId, debit, credit). با `prisma db push`.
- فرم سند مرکب با چند ردیف که باید **متوازن** باشد (Σ بدهکار = Σ بستانکار) قبل از ثبت.
- مهاجرت: `LedgerEntry`‌های موجود را می‌توان به‌صورت voucher دوسطری نمایش داد یا نگه داشت.

### 🟡 فاز ۸ — صیقل نهایی
- یکدست‌سازی واحد تومان در `finance/page.tsx` و `finance/budget` (الان از `formatPrice` تومان استفاده می‌کند — چک شود).
- بستن سال مالی (closing entries: انتقال درآمد/هزینه به سود انباشته `3002`).
- خروجی PDF صورت‌های مالی (کتابخانهٔ `jspdf` نصب است).

---

## ۴. نکات و تله‌ها
- کد حساب `@unique` **سراسری** است (نه per-tenant). در استقرار تک‌مستأجری مشکلی نیست؛ در چندمستأجری مراقب تداخل کد باش.
- `Expense` فیلد مالیات ندارد؛ اعتبار مالیاتی خرید (Input VAT) در اظهارنامهٔ ارزش افزوده به‌صورت دستی توسط حسابدار وارد می‌شود (پارامتر `inputVat` در `/api/erp/tax/summary`).
- `PayrollRecord` فیلد مالیات/بیمهٔ تفکیکی ندارد؛ فعلاً `deductions` کل کسورات است. برای سند حقوق دقیق ممکن است نیاز به تفکیک باشد.
- categoryهای واقعی `Expense` را قبل از ساخت نگاشت از دیتابیس استخراج کن (مقادیر ممکن است با فرض‌های بالا فرق کند).
- صفحات داشبورد زیر route group `(dashboard)` هستند و `middleware.ts` احراز هویت را کنترل می‌کند؛ ۴۰۴/redirect بدون لاگین طبیعی است.

## ۵. حافظهٔ پروژه
خلاصهٔ همین موارد در `.claude/.../memory/finance-module.md` ذخیره شده.
