# PersicoCRM — Developer Guide

> **Version:** 2.1 | **Updated:** 2026-06-19  
> **Stack:** Next.js 15 · TypeScript · MySQL · Prisma ORM  
> **Architecture:** Multi-tenant SaaS — Single Next.js app, multiple subdomains

---

## فهرست مطالب

1. [معرفی کلی](#1-معرفی-کلی)
2. [معماری سیستم](#2-معماری-سیستم)
3. [زیرساخت فنی](#3-زیرساخت-فنی)
4. [سرویس‌ها و زیردامنه‌ها](#4-سرویسها-و-زیردامنهها)
5. [ساختار پوشه‌ها](#5-ساختار-پوشهها)
6. [ماژول‌های داشبورد](#6-ماژولهای-داشبورد)
7. [پورتال مشتری](#7-پورتال-مشتری)
8. [پنل ادمین](#8-پنل-ادمین)
9. [ایجنت‌ساز AI](#9-ایجنتساز-ai)
10. [محتواساز AI](#10-محتواساز-ai)
11. [بلاگ پلتفرم](#11-بلاگ-پلتفرم)
12. [API Reference](#12-api-reference)
13. [احراز هویت و امنیت](#13-احراز-هویت-و-امنیت)
14. [پایگاه داده](#14-پایگاه-داده)
15. [متغیرهای محیطی](#15-متغیرهای-محیطی)
16. [الگوهای کد](#16-الگوهای-کد)
17. [راه‌اندازی توسعه](#17-راهاندازی-توسعه)
18. [استقرار (Production)](#18-استقرار-production)

---

## 1. معرفی کلی

PersicoCRM یک پلتفرم SaaS چند-تنانت است که در یک اپلیکیشن Next.js اجرا می‌شود و از طریق subdomain routing چندین سرویس مجزا ارائه می‌دهد:

- **CRM کامل** با بیش از ۳۵ ماژول برای مدیریت فروش، مالی، منابع انسانی و صنایع تخصصی  
- **ایجنت‌ساز AI** برای ساخت chatbot بدون کد  
- **محتواساز AI** برای تولید محتوای سئو محور  
- **پورتال اختصاصی مشتری** برای هر tenant  
- **بلاگ پلتفرم** عمومی  
- **رزومه‌ساز و پروپوزال‌ساز** با لینک عمومی  
- **پنل Super Admin** برای مدیریت تمام tenantها

---

## 2. معماری سیستم

```
                    ┌─────────────────────────────────────┐
                    │         Next.js 15 App               │
                    │         (output: standalone)         │
                    └─────────────┬───────────────────────┘
                                  │
               ┌──────────────────┼──────────────────────┐
               │                  │                       │
    ┌──────────▼──────┐  ┌────────▼───────┐  ┌──────────▼──────┐
    │  src/middleware  │  │  API Routes    │  │  React Pages     │
    │  - CSRF check    │  │  (Route        │  │  (App Router     │
    │  - Rate limit    │  │   Handlers)    │  │   RSC + Client)  │
    │  - Subdomain     │  │               │  │                  │
    │    rewrite       │  └────────┬───────┘  └──────────────────┘
    └─────────────────┘           │
                                  │
                    ┌─────────────▼───────────────────────┐
                    │         Prisma ORM                   │
                    │         MySQL Database               │
                    │         (Row-Level Security)         │
                    └─────────────────────────────────────┘
```

### نکات کلیدی معماری

- **Multi-tenancy:** هر tenant با `tenantId` در همه جداول ایزوله است (Row-Level Security)
- **Subdomain Routing:** Middleware درخواست‌های subdomain را به مسیرهای مربوطه rewrite می‌کند
- **Authentication:** JWT در httpOnly cookie (`auth_token`) — برای CRM، Portal و Agent جداگانه
- **Real-time:** SSE (Server-Sent Events) از طریق `/api/stream` 
- **Rate Limiting:** ۱۰۰ req/min برای authenticated، ۳۰ req/min برای anonymous (per IP) — **Redis-backed** (multi-instance safe)

---

## 3. زیرساخت فنی

### Frontend
| کتابخانه | نسخه | کاربرد |
|---|---|---|
| Next.js | 15 | Framework (App Router + RSC) |
| TypeScript | latest | Type safety |
| Tailwind CSS | 3.4 | Styling |
| shadcn/ui + Radix UI | latest | UI Components |
| @dnd-kit | 6.3 | Drag & Drop (Kanban) |
| TanStack Query | 5.x | Server state / data fetching |
| TanStack Table | 8.x | Advanced tables |
| TanStack Virtual | 3.x | Virtualized lists |
| Recharts | 2.x | Charts & graphs |
| TipTap | 2.x | Rich text editor |
| Motion (Framer) | 12.x | Animations |
| Zustand | 5.x | Client state management |
| React Hook Form | 7.x | Form management |
| Zod | 3.x | Schema validation |
| dayjs | 1.x | Date/time (Jalali support) |
| cmdk | 1.x | Command Palette |
| sonner | 1.x | Toast notifications |
| vaul | 1.x | Drawer component |
| nuqs | 2.x | URL state (search params) |
| react-grid-layout | 1.5 | Dashboard grid |
| Fuse.js | 7.x | Client-side fuzzy search |

### Backend / Infrastructure
| ابزار | کاربرد |
|---|---|
| Prisma ORM 5.x | Database access + migrations |
| MySQL | Primary database |
| @upstash/redis | Redis client (Edge + Node.js compatible) — rate limiting |
| JWT (jsonwebtoken) | Authentication tokens |
| bcryptjs | Password hashing |
| @sentry/nextjs | Error tracking |
| Web Push (VAPID) | Browser push notifications |
| Playwright | E2E testing |
| pnpm | Package manager |

---

## 4. سرویس‌ها و زیردامنه‌ها

| زیردامنه | Route Group | توضیح |
|---|---|---|
| `persicore.ir` | `landing/` | صفحه لندینگ استاتیک (HTML/CSS/JS جداگانه) |
| `crm.persicore.ir` | `(auth)` + `(dashboard)` | CRM اصلی + احراز هویت |
| `portal.persicore.ir` | `(portal)` | پورتال اختصاصی هر مشتری |
| `admin.persicore.ir` | `(admin)` | پنل Super Admin |
| `agent.persicore.ir` | `(agent)` | ایجنت‌ساز AI |
| `content.persicore.ir` | `(content)` | محتواساز AI |
| `blog.persicore.ir` | `(blog)` | بلاگ عمومی |
| `resume.persicore.ir` | `(resume)` | نمایش عمومی رزومه |
| `proposal.persicore.ir` | `(proposal)` | نمایش عمومی پروپوزال |

### نحوه کار Middleware Rewrite

```typescript
// src/middleware.ts
if (hostname.startsWith("portal.")) {
  url.pathname = "/portal" + url.pathname;
  return NextResponse.rewrite(url);
}
// همین الگو برای admin، resume، proposal، blog، content
```

---

## 5. ساختار پوشه‌ها

```
crm/
├── landing/                    # لندینگ استاتیک (جدا از Next.js)
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── prisma/
│   ├── schema.prisma           # تعریف مدل‌های دیتابیس
│   ├── migrations/             # migration های Prisma
│   └── seed.ts                 # داده‌های اولیه
├── src/
│   ├── app/
│   │   ├── (auth)/             # صفحات ورود/ثبت‌نام CRM
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/[token]/
│   │   ├── (dashboard)/        # داشبورد اصلی CRM
│   │   │   ├── page.tsx        # صفحه اصلی داشبورد
│   │   │   ├── leads/          # مدیریت لید
│   │   │   ├── pipeline/       # پایپ‌لاین فروش
│   │   │   ├── clients/        # مشتریان
│   │   │   ├── projects/       # پروژه‌ها
│   │   │   ├── invoicing/      # فاکتورها
│   │   │   ├── contracts/      # قراردادها
│   │   │   ├── erp/            # ERP مالی
│   │   │   ├── finance/        # مالی
│   │   │   ├── hr/             # منابع انسانی
│   │   │   ├── marketing/      # بازاریابی
│   │   │   ├── legal/          # امور حقوقی
│   │   │   ├── ecommerce/      # فروشگاه آنلاین
│   │   │   ├── restaurant/     # رستوران و کافه
│   │   │   ├── manufacturing/  # تولید و صنعت
│   │   │   ├── education/      # آموزش
│   │   │   ├── trading/        # تجارت و واردات
│   │   │   ├── it/             # IT و نرم‌افزار
│   │   │   ├── service/        # مدیریت خدمات
│   │   │   ├── inventory/      # انبارداری
│   │   │   ├── reports/        # گزارش‌ساز
│   │   │   ├── settings/       # تنظیمات
│   │   │   └── ...
│   │   ├── (portal)/           # پورتال مشتری
│   │   ├── (admin)/            # پنل ادمین
│   │   ├── (agent)/            # ایجنت‌ساز
│   │   ├── (content)/          # محتواساز AI
│   │   ├── (blog)/             # بلاگ
│   │   ├── (resume)/           # رزومه عمومی
│   │   ├── (proposal)/         # پروپوزال عمومی
│   │   ├── (public)/           # صفحات عمومی (pricing, invoice-sign)
│   │   └── api/                # API Route Handlers
│   ├── components/
│   │   ├── layout/             # Sidebar, Topbar, CommandPalette
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── common/             # StatCard, EmptyState, ...
│   │   └── ...
│   ├── lib/
│   │   ├── auth/               # JWT helpers, session
│   │   ├── db.ts               # Prisma client singleton
│   │   ├── ok.ts               # ok() helper برای API responses
│   │   ├── redis.ts            # @upstash/redis singleton (Edge + Node.js)
│   │   ├── rate-limit.ts       # Redis-backed rate limiter (API routes)
│   │   └── utils/              # formatPrice, toJalali, ...
│   ├── types/                  # TypeScript types/interfaces
│   └── middleware.ts           # CSRF + Rate Limiting + Subdomain routing
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 6. ماژول‌های داشبورد

### 6.1 CRM و فروش

| مسیر | توضیح |
|---|---|
| `/leads` | مدیریت لیدها — Kanban + Table view، deduplication |
| `/leads/deduplication` | شناسایی و ادغام لیدهای تکراری |
| `/pipeline` | پایپ‌لاین فروش بصری |
| `/clients` | مدیریت مشتریان — پروفایل ۳۶۰ درجه |
| `/clients/[id]` | جزئیات مشتری + تاریخچه تعاملات |
| `/crm/segments` | سگمنت‌بندی مشتریان |
| `/crm/journey` | Customer Journey Map |
| `/crm/call-logs` | لاگ تماس‌ها |
| `/meetings` | جلسات و قرار ملاقات‌ها |
| `/my-sales` | فروش‌های شخصی هر کاربر |
| `/sales-competition` | رقابت فروش بین اعضای تیم |
| `/commissions` | مدیریت کمیسیون‌ها |
| `/pipeline` | پایپ‌لاین بصری |

### 6.2 مالی و فاکتور

| مسیر | توضیح |
|---|---|
| `/invoicing` | لیست فاکتورها و پیش‌فاکتورها |
| `/invoicing/new` | صدور فاکتور جدید با preview زنده |
| `/finance` | خلاصه مالی |
| `/finance/budget` | بودجه‌بندی |
| `/expenses` | هزینه‌ها |
| `/advance` | پیش‌پرداخت‌ها |
| `/contracts` | قراردادها |
| `/contracts/templates` | قالب‌های قرارداد |

### 6.3 ERP مالی

| مسیر | توضیح |
|---|---|
| `/erp/chart-of-accounts` | نمودار حساب‌ها (دو طرفه) |
| `/erp/journal-vouchers` | سند حسابداری |
| `/erp/ledger` | دفتر کل |
| `/erp/bank-accounts` | حساب‌های بانکی |
| `/erp/bank-reconciliation` | مغایرت‌گیری بانکی |
| `/erp/checks` | مدیریت چک‌ها |
| `/erp/fixed-assets` | دارایی‌های ثابت + استهلاک |
| `/erp/budget` | بودجه vs واقعی |
| `/erp/cash-flow` | جریان نقدی |
| `/erp/tax` | مدیریت مالیات |
| `/erp/cost-centers` | مراکز هزینه |
| `/erp/recurring-invoices` | فاکتورهای دوره‌ای |
| `/erp/aging-report` | گزارش سنی |
| `/erp/financial-kpi` | KPI مالی |
| `/erp/reports` | گزارشات مالی (ترازنامه، سود/زیان، جریان نقدی) |

### 6.4 منابع انسانی (HR)

| مسیر | توضیح |
|---|---|
| `/hr/attendance` | حضور و غیاب |
| `/hr/leave-requests` | درخواست مرخصی |
| `/hr/recruitment` | استخدام + آنبوردینگ |
| `/hr/contracts` | قراردادهای استخدامی |
| `/hr/kpi` | ارزیابی عملکرد KPI |
| `/hr/org-chart` | چارت سازمانی |
| `/hr/benefits` | مزایا |
| `/hr/training` | آموزش‌های کارکنان |
| `/hr/onboarding` | فرایند آنبوردینگ |
| `/hr/shifts` | مدیریت شیفت‌ها |
| `/hr/overtime` | اضافه‌کاری |
| `/hr/employee-dashboard` | داشبورد کارمند |
| `/team` | مدیریت تیم |
| `/payroll` | حقوق و دستمزد |

### 6.5 بازاریابی

| مسیر | توضیح |
|---|---|
| `/marketing/campaigns` | کمپین‌های بازاریابی |
| `/marketing/email` | ایمیل مارکتینگ |
| `/marketing/analytics` | آنالیتیکس بازاریابی |
| `/marketing/budget` | بودجه بازاریابی |
| `/marketing/ab-tests` | A/B Testing |
| `/marketing/personas` | پرسونای مشتریان |
| `/marketing/utm` | UTM Links Tracker |
| `/marketing/content` | تقویم محتوا |
| `/marketing/archive` | آرشیو |

### 6.6 امور حقوقی

| مسیر | توضیح |
|---|---|
| `/legal/cases` | مدیریت پرونده‌ها |
| `/legal/contracts` | قراردادهای حقوقی |
| `/legal/hearings` | جلسات دادگاه |
| `/legal/deadlines` | ددلاین‌های قانونی |
| `/legal/archive` | آرشیو اسناد |
| `/legal/billing` | صورتحساب حقوقی |

### 6.7 فروشگاه آنلاین

| مسیر | توضیح |
|---|---|
| `/ecommerce/dashboard` | داشبورد فروشگاه |
| `/ecommerce/products` | محصولات |
| `/ecommerce/orders` | سفارشات |
| `/ecommerce/categories` | دسته‌بندی‌ها |
| `/ecommerce/reviews` | نظرات مشتریان |
| `/ecommerce/discounts` | تخفیف‌ها و کوپن |
| `/ecommerce/delivery` | مدیریت تحویل |
| `/ecommerce/analytics` | آنالیتیکس فروش |

### 6.8 رستوران و کافه

| مسیر | توضیح |
|---|---|
| `/restaurant/dashboard` | داشبورد رستوران |
| `/restaurant/tables` | مدیریت میزها |
| `/restaurant/orders` | سفارشات |
| `/restaurant/menu` | منو دیجیتال |
| `/restaurant/reservations` | رزرو و نوبت‌دهی |
| `/restaurant/kitchen` | آشپزخانه دیجیتال (KDS) |
| `/restaurant/shifts` | شیفت‌های کارکنان |
| `/restaurant/reports` | گزارش‌های روزانه |

### 6.9 تولید و صنعت

| مسیر | توضیح |
|---|---|
| `/manufacturing/dashboard` | داشبورد تولید |
| `/manufacturing/bom` | Bill of Materials |
| `/manufacturing/orders` | دستورات تولید |
| `/manufacturing/equipment` | تجهیزات + نگهداری |
| `/manufacturing/lines` | خطوط تولید |
| `/manufacturing/quality` | کنترل کیفیت |
| `/manufacturing/waste` | ضایعات + بهره‌وری |
| `/manufacturing/analytics` | آنالیتیکس تولید |

### 6.10 آموزش و مدرسه

| مسیر | توضیح |
|---|---|
| `/education/dashboard` | داشبورد آموزش |
| `/education/students` | مدیریت دانش‌آموزان |
| `/education/courses` | دوره‌ها و درس‌ها |
| `/education/exams` | امتحانات |
| `/education/gradebook` | کارنامه و نمرات |
| `/education/schedule` | برنامه درسی |
| `/education/attendance` | حضور و غیاب کلاس |
| `/education/certificates` | گواهینامه‌های دیجیتال |

### 6.11 تجارت و واردات

| مسیر | توضیح |
|---|---|
| `/trading/dashboard` | داشبورد تجاری |
| `/trading/trade-records` | سوابق معاملات |
| `/trading/shipments` | مدیریت محموله‌ها |
| `/trading/pricing` | سطوح قیمت‌گذاری |

### 6.12 IT و نرم‌افزار

| مسیر | توضیح |
|---|---|
| `/it/sprints` | Sprint management |
| `/it/bugs` | Bug Tracker |
| `/it/roadmap` | Roadmap |
| `/it/assets` | دارایی‌های IT |
| `/it/licenses` | لایسنس‌های نرم‌افزاری |

### 6.13 مدیریت خدمات

| مسیر | توضیح |
|---|---|
| `/service/dashboard` | داشبورد خدمات |
| `/service/requests` | درخواست‌های خدمات |
| `/service/schedule` | زمان‌بندی خدمات |
| `/service/map` | نقشه محل‌های خدمات |
| `/service/sla` | SLA Policies |
| `/service/feedback` | بازخورد مشتریان |

### 6.14 انبارداری

| مسیر | توضیح |
|---|---|
| `/inventory` | داشبورد موجودی |
| `/inventory/movements` | جابجایی کالا |
| `/inventory/locations` | مکان‌های انبار |
| `/inventory/stock-count` | شمارش موجودی |
| `/inventory/valuation` | ارزش‌گذاری موجودی |

### 6.15 سایر ماژول‌ها

| مسیر | توضیح |
|---|---|
| `/projects` | مدیریت پروژه‌ها |
| `/projects/[id]` | جزئیات پروژه + Kanban Tasks |
| `/reports` | لیست گزارشات |
| `/reports/builder` | گزارش‌ساز Drag & Drop |
| `/tickets` | تیکت‌های پشتیبانی |
| `/support` | پشتیبانی |
| `/wiki` | ویکی داخلی تیم |
| `/calendar` | تقویم شمسی |
| `/files` | مدیریت فایل‌ها |
| `/forms` | فرم‌ساز |
| `/forms/builder` | Form Builder |
| `/messages` | پیام‌رسان داخلی (SSE) |
| `/activity` | لاگ فعالیت‌ها |
| `/timer` | تایمر + Time Entries |
| `/training` | محتوای آموزشی |
| `/settings` | تنظیمات کلی |
| `/settings/storage` | مدیریت فضای ذخیره‌سازی |
| `/settings/sessions` | مدیریت نشست‌ها |
| `/settings/webhooks` | Webhooks |
| `/settings/automation` | اتوماسیون (If-This-Then-That) |
| `/settings/subscription` | مدیریت اشتراک |
| `/purchase-orders` | سفارشات خرید |
| `/suppliers` | تامین‌کنندگان |
| `/returns` | مرجوعی‌ها |
| `/design-review` | بررسی طراحی |
| `/onboarding` | آنبوردینگ tenant جدید |
| `/billing/callback` | بازگشت از درگاه پرداخت |

---

## 7. پورتال مشتری

دسترسی از طریق `portal.persicore.ir` — سیستم احراز هویت جداگانه از CRM اصلی.

| مسیر | توضیح |
|---|---|
| `/portal` | داشبورد مشتری |
| `/portal/invoices` | فاکتورهای مشتری |
| `/portal/contracts` | قراردادها |
| `/portal/projects` | پروژه‌های مشتری |
| `/portal/tickets` | تیکت‌های پشتیبانی |
| `/portal/tickets/[id]` | جزئیات تیکت + ریپلای |
| `/portal/files` | فایل‌های مشتری |
| `/portal/designs` | طرح‌های ارسالی |
| `/portal/messages` | پیام‌رسان مشتری ↔ تیم |
| `/portal/nps` | نظرسنجی NPS |
| `/portal/profile` | پروفایل مشتری |
| `/portal/payment/callback` | بازگشت از پرداخت آنلاین |

**API های پورتال:** `/api/portal/*` — با JWT جداگانه از CRM

---

## 8. پنل ادمین

دسترسی از طریق `admin.persicore.ir` — سیستم احراز هویت جداگانه (Super Admin).

| مسیر | توضیح |
|---|---|
| `/admin` | داشبورد کلی |
| `/admin/tenants` | مدیریت تمام tenantها |
| `/admin/users` | مدیریت کاربران |
| `/admin/plans` | پلن‌های اشتراک |
| `/admin/payments` | پرداخت‌های دریافتی |
| `/admin/finance-overview` | نمای مالی کلی |
| `/admin/blog` | مدیریت بلاگ |
| `/admin/categories` | دسته‌بندی بلاگ |
| `/admin/resumes` | رزومه‌سازها |
| `/admin/proposals` | پروپوزال‌ها |
| `/admin/support` | تیکت‌های پشتیبانی |
| `/admin/announcements` | اطلاعیه‌ها |
| `/admin/coupons` | کد تخفیف |
| `/admin/training` | محتوای آموزشی |
| `/admin/usage` | آنالیز مصرف |
| `/admin/agents` | مدیریت ایجنت‌ها |
| `/admin/content` | مدیریت Content AI |
| `/admin/nps` | نظرسنجی NPS کلی |
| `/admin/activity` | لاگ فعالیت سیستم |
| `/admin/settings` | تنظیمات سیستمی |

---

## 9. ایجنت‌ساز AI

دسترسی از طریق `agent.persicore.ir` — سیستم ثبت‌نام و احراز هویت جداگانه.

| مسیر | توضیح |
|---|---|
| `/agent` | صفحه اصلی/لندینگ |
| `/agent/register` | ثبت‌نام (موبایل + OTP) |
| `/agent/login` | ورود |
| `/agent/dashboard` | داشبورد ایجنت‌ها |
| `/agent/new` | ساخت ایجنت جدید |
| `/agent/plans` | پلن‌های قیمت‌گذاری |
| `/agent/agents/[id]` | تنظیمات ایجنت |
| `/agent/agents/[id]/knowledge` | دانش‌پایه (URL crawler + فایل) |
| `/agent/agents/[id]/customize` | شخصی‌سازی ظاهر |
| `/agent/agents/[id]/embed` | کد Embed برای سایت |
| `/agent/agents/[id]/conversations` | تاریخچه مکالمات |
| `/agent/payment/callback` | پرداخت اشتراک |

**API های ایجنت:**
- `/api/agent/auth/*` — احراز هویت
- `/api/agent/agents/*` — CRUD ایجنت‌ها
- `/api/agent/chat/[agentId]` — Chat endpoint (SSE streaming)
- `/api/agent/agents/[id]/knowledge` — مدیریت دانش‌پایه
- `/api/agent/agents/[id]/knowledge/crawl` — Crawl URL برای دانش‌پایه
- `/api/agent/wordpress-plugin` — اطلاعات پلاگین وردپرس
- `/api/agent/upload` — آپلود فایل به دانش‌پایه
- `/api/agent/payment/*` — درگاه پرداخت

---

## 10. محتواساز AI

دسترسی از طریق `content.persicore.ir`.

| مسیر | توضیح |
|---|---|
| `/content` | صفحه اصلی — تولید محتوا |
| `/content/history` | تاریخچه محتواهای تولیدشده |
| `/content/billing` | مدیریت اشتراک |
| `/content/login` | ورود |

**API های Content AI:**
- `/api/content/auth/*` — احراز هویت
- `/api/content/generate` — تولید محتوا (AI)
- `/api/content/subtopics` — پیشنهاد زیرموضوع
- `/api/content/history/*` — تاریخچه
- `/api/content/billing/*` — پرداخت

---

## 11. بلاگ پلتفرم

دسترسی از طریق `blog.persicore.ir`.

| مسیر | توضیح |
|---|---|
| `/blog` | صفحه اصلی بلاگ |
| `/blog/[slug]` | مطلب بلاگ |
| `/blog/search` | جستجو |
| `/blog/category/[slug]` | مطالب یک دسته |

---

## 12. API Reference

### احراز هویت CRM
```
POST /api/auth/send-otp        — ارسال OTP
POST /api/auth/verify-otp      — تأیید OTP
POST /api/auth/login           — ورود
POST /api/auth/register        — ثبت‌نام
POST /api/auth/logout          — خروج
GET  /api/auth/me              — اطلاعات کاربر جاری
POST /api/auth/forgot-password — فراموشی رمز
POST /api/auth/reset-password  — بازنشانی رمز
POST /api/auth/change-password — تغییر رمز
POST /api/auth/2fa/setup       — راه‌اندازی 2FA
POST /api/auth/2fa/verify      — تأیید 2FA
```

### Real-time & Notifications
```
GET  /api/stream               — SSE stream (real-time events)
GET  /api/push/vapid-key       — VAPID public key
POST /api/push/subscribe       — ثبت push subscription
POST /api/portal/stream        — SSE پورتال مشتری
```

### مدیریت فایل
```
POST   /api/upload             — آپلود فایل
GET    /api/files/[...path]    — دریافت فایل
POST   /api/file-items         — ثبت متادیتا فایل
DELETE /api/file-items/[id]    — حذف فایل
GET    /api/file-folders       — پوشه‌ها
```

### Webhooks و Automation
```
GET    /api/webhooks           — لیست webhooks
POST   /api/webhooks           — ایجاد webhook
POST   /api/webhooks/[id]/test — تست webhook
GET    /api/automation         — لیست automationها
POST   /api/automation         — ایجاد rule
```

### گزارش‌ساز
```
GET  /api/reports              — گزارشات ذخیره‌شده
POST /api/reports/builder      — ذخیره گزارش سفارشی
POST /api/reports/builder/run  — اجرای گزارش
```

### امضای دیجیتال (Public)
```
GET  /api/invoices/sign/[token]   — اطلاعات فاکتور برای امضا
POST /api/invoices/sign/[token]   — ثبت امضای فاکتور
GET  /api/contracts/sign/[token]  — اطلاعات قرارداد برای امضا
POST /api/contracts/sign/[token]  — ثبت امضای قرارداد
```

### ERP گزارشات
```
GET /api/erp/reports/balance-sheet    — ترازنامه
GET /api/erp/reports/profit-loss      — سود و زیان
GET /api/erp/reports/cash-flow        — جریان نقدی
GET /api/erp/reports/trial-balance    — تراز آزمایشی
GET /api/erp/reports/general-ledger   — دفتر کل
GET /api/erp/reports/aged-receivables — سنی دریافتنی
GET /api/erp/reports/aged-payables    — سنی پرداختنی
```

---

## 13. احراز هویت و امنیت

### جریان احراز هویت

```
1. کاربر شماره موبایل وارد می‌کند
2. POST /api/auth/send-otp → ارسال SMS
3. POST /api/auth/verify-otp → تأیید OTP
4. POST /api/auth/login → دریافت JWT
5. JWT در httpOnly cookie ذخیره می‌شود (auth_token)
6. هر درخواست API کوکی را بررسی می‌کند
```

### ساختار JWT Payload
```typescript
{
  userId: string;
  tenantId: string;
  role: "owner" | "admin" | "manager" | "user";
  iat: number;
  exp: number;
}
```

### سیستم‌های احراز هویت موجود

| سرویس | Cookie | توضیح |
|---|---|---|
| CRM | `auth_token` | JWT — برای dashboard و API های اصلی |
| Portal | `portal_token` | JWT جداگانه برای مشتریان |
| Admin | `admin_token` | JWT — Super Admin only |
| Agent | `agent_token` | JWT — ایجنت‌ساز |
| Content | `content_token` | JWT — محتواساز AI |

### امنیت Middleware

```typescript
// CSRF Protection
- روش‌های ایمن (GET, HEAD, OPTIONS) معاف
- مسیرهای معاف: /api/auth/, /api/portal/, /api/agent/, /api/content/
- بررسی Origin vs Host

// Rate Limiting — Redis-backed (multi-instance safe)
- Authenticated: 100 req/min (per tenantId + path)
- Anonymous: 30 req/min (per IP + path)
- معاف: /api/auth/, /api/agent/, /api/stream, /api/files
- الگوریتم: Lua script اتمیک (INCR + PEXPIRE) — بدون race condition
- Fail-open: اگر Redis در دسترس نباشد، درخواست رد نمی‌شود
```

### Redis Rate Limiting Architecture

دو لایه rate limiting وجود دارد:

| لایه | فایل | Runtime | مصرف |
|---|---|---|---|
| **Middleware** | `src/middleware.ts` | Edge (Vercel/Worker) | عمومی — همه `/api` |
| **Route handler** | `src/lib/rate-limit.ts` | Node.js | اختصاصی — auth، OTP |

هر دو از `@upstash/redis` استفاده می‌کنند و با یک Redis instance کار می‌کنند.

```typescript
// src/lib/redis.ts — singleton client
import { Redis } from "@upstash/redis";
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// الگوی Lua اتمیک در هر دو لایه:
// KEYS[1] = کلید، ARGV[1] = windowMs
const SCRIPT = `
  local c = redis.call('INCR', KEYS[1])
  if c == 1 then redis.call('PEXPIRE', KEYS[1], tonumber(ARGV[1])) end
  return {c, redis.call('PTTL', KEYS[1])}
`
```

### 2FA (Two-Factor Authentication)
- TOTP-based (Google Authenticator compatible)
- Setup از طریق `/api/auth/2fa/setup`
- Verify از طریق `/api/auth/2fa/verify`

---

## 14. پایگاه داده

### ابزار: Prisma ORM 5.x + MySQL

```bash
# اجرای migrations
npm run db:migrate

# مشاهده دیتابیس
npm run db:studio

# Seed داده‌های اولیه
npm run db:seed
```

### الگوی Multi-tenancy

**هر جدول اصلی** دارای `tenantId` است:

```prisma
model Lead {
  id       String @id @default(cuid())
  tenantId String
  // ...
  tenant   Tenant @relation(fields: [tenantId], references: [id])
}
```

**در هر API Handler** باید tenantId از JWT استخراج شود:

```typescript
const { tenantId } = await verifyAuth(request);
const leads = await prisma.lead.findMany({
  where: { tenantId }  // ← الزامی — بدون این، داده‌های همه tenant‌ها برمی‌گردد
});
```

### Prisma Singleton (برای جلوگیری از connection flood)
```typescript
// src/lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

## 15. متغیرهای محیطی

فایل `.env.local` در root پروژه:

```bash
# Database
DATABASE_URL="mysql://user:pass@localhost:3306/persicore_crm"

# Redis (Rate Limiting — multi-instance safe)
# گزینه ۱: Upstash Cloud — https://console.upstash.com (رایگان تا ۱۰،۰۰۰ req/day)
# گزینه ۲: Self-hosted با serverless-redis-http:
#   docker run -p 8079:8079 -e SRH_TOKEN=mysecret \
#     -e SRH_CONNECTION_STRING="redis://localhost:6379" \
#     hiett/serverless-redis-http:latest
UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token-here"

# JWT
JWT_SECRET="your-secret-key-min-32-chars"
JWT_EXPIRES_IN="7d"

# App URL
NEXT_PUBLIC_APP_URL="https://crm.persicore.ir"

# Sentry
SENTRY_DSN="https://..."
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"
NEXT_PUBLIC_SENTRY_DSN="https://..."

# File Storage (S3 compatible یا local)
STORAGE_TYPE="local"          # یا "s3"
UPLOAD_DIR="./uploads"
# برای S3:
S3_ENDPOINT="..."
S3_BUCKET="..."
S3_ACCESS_KEY="..."
S3_SECRET_KEY="..."

# CDN
NEXT_PUBLIC_CDN_URL="https://cdn.persicore.ir"

# SMS (برای OTP)
SMS_PROVIDER="..."
SMS_API_KEY="..."

# Push Notifications (VAPID)
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_EMAIL="admin@persicore.ir"

# AI (برای Agent Builder و Content AI)
OPENAI_API_KEY="sk-..."
# یا
CLAUDE_API_KEY="..."

# Payment Gateway (Zarrinpal)
ZARINPAL_MERCHANT_ID="..."
ZARINPAL_SANDBOX="true"   # در توسعه

# Admin
ADMIN_JWT_SECRET="..."

# Agent Builder
AGENT_JWT_SECRET="..."

# Content AI
CONTENT_JWT_SECRET="..."
```

---

## 16. الگوهای کد

### الگوی API Response (`ok()` helper)

```typescript
// src/lib/ok.ts
export function ok(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}
```

**استفاده در Route Handler:**
```typescript
export async function GET(request: NextRequest) {
  const { tenantId } = await verifyAuth(request);
  const clients = await prisma.client.findMany({ where: { tenantId } });
  return ok(clients);
}
```

### الگوی Fetch در Client Component

```typescript
// نتیجه: { success: true, data: [...] }
const res = await fetch("/api/clients");
const json = await res.json();
const clients = json.data; // ← r.data.data pattern
```

### Next.js 15 — params به صورت Promise

```typescript
// ✅ صحیح در Next.js 15
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;  // ← باید await شود
  // ...
}
```

### الگوی SSE (Real-time)

```typescript
// Server: src/app/api/stream/route.ts
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      // ارسال رویدادها...
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}

// Client: استفاده از EventSource
const es = new EventSource("/api/stream");
es.onmessage = (e) => console.log(JSON.parse(e.data));
```

### الگوی Multi-tenant در Prisma

```typescript
// ← همیشه tenantId در WHERE
const data = await prisma.invoice.findMany({
  where: { tenantId, status: "draft" },
  include: { client: true },
  orderBy: { createdAt: "desc" },
});
```

---

## 17. راه‌اندازی توسعه

### پیش‌نیازها
- Node.js 18+
- pnpm 9+ (یا npm)
- MySQL 8+
- Redis (یا Upstash Cloud)

### نصب

```bash
cd crm
npm install   # یا: pnpm install
```

### راه‌اندازی Redis

```bash
# گزینه ۱ — Upstash Cloud (سریع‌ترین روش):
# به https://console.upstash.com بروید → Create Database
# URL و Token را در .env.local کپی کنید

# گزینه ۲ — Self-hosted (نیاز به Redis نصب‌شده):
docker run -d -p 8079:8079 \
  -e SRH_MODE=env \
  -e SRH_TOKEN=my-dev-secret \
  -e SRH_CONNECTION_STRING="redis://host.docker.internal:6379" \
  hiett/serverless-redis-http:latest

# در .env.local:
# UPSTASH_REDIS_REST_URL=http://localhost:8079
# UPSTASH_REDIS_REST_TOKEN=my-dev-secret
```

> **نکته:** اگر متغیرهای Redis تنظیم نشوند، middleware به حالت **fail-open** می‌رود (rate limiting غیرفعال).

### راه‌اندازی دیتابیس

```bash
# ایجاد migration
npx prisma migrate dev --name init

# یا اجرای migration‌های موجود
npm run db:migrate

# Seed داده‌های اولیه (اختیاری)
npm run db:seed

# مشاهده دیتابیس در مرورگر
npm run db:studio
```

### اجرا

```bash
npm run dev
```

سپس در مرورگر:
- `http://localhost:3000` → CRM (login)
- `http://localhost:3000/portal` → Portal
- `http://localhost:3000/admin` → Admin
- `http://localhost:3000/agent` → Agent Builder
- `http://localhost:3000/content` → Content AI
- `http://localhost:3000/blog` → Blog
- `http://localhost:3000/pricing` → Pricing

برای subdomain در development از `/etc/hosts` استفاده کنید:
```
127.0.0.1 crm.persicore.local
127.0.0.1 portal.persicore.local
127.0.0.1 admin.persicore.local
```

### تست E2E

```bash
npm run test:e2e
npm run test:e2e:ui   # با UI
```

---

## 18. استقرار (Production)

### Build

```bash
npm run build
# معادل: prisma generate && next build
```

### اجرا (Standalone)

```bash
npm start
# معادل: node .next/standalone/server.js
```

### Docker (پیشنهادی)

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Reverse Proxy (Nginx)

```nginx
server {
    server_name ~^(.+)\.persicore\.ir$;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### نکات مهم Production

1. `JWT_SECRET` باید حداقل ۳۲ کاراکتر و random باشد
2. **Redis را راه‌اندازی کنید** (`UPSTASH_REDIS_REST_URL` و `TOKEN`) — بدون Redis، rate limiting در multi-instance کار نمی‌کند
3. فایل‌های آپلودی باید در Object Storage (S3/MinIO) ذخیره شوند
4. Sentry را راه‌اندازی کنید برای error tracking
5. `ZARINPAL_SANDBOX=false` در production
6. Migration را قبل از deploy اجرا کنید: `npm run db:migrate`

---

## Quick Reference

| دستور | کاربرد |
|---|---|
| `npm run dev` | اجرای development server |
| `npm run build` | Build production |
| `npm start` | اجرای production build |
| `npm run lint` | بررسی lint |
| `npm run db:migrate` | اجرای migrations |
| `npm run db:studio` | Prisma Studio (GUI) |
| `npm run db:seed` | Seed دیتابیس |
| `npm run test:e2e` | اجرای E2E tests |

---

*PersicoCRM — نسخه ۲.۰ | ۱۴۰۵*
