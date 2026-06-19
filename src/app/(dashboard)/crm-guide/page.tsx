"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, Zap, Building2, TrendingUp, Trophy, UserSquare2,
  BadgeDollarSign, Briefcase, Clock, FolderOpen, FileText, Receipt,
  DollarSign, Wallet, UsersRound, WalletCards, ClipboardList,
  Megaphone, Archive, PieChart, BarChart2, Scale, CalendarDays,
  MessageSquare, Calendar, TicketCheck, BookOpen, ShoppingBag,
  Palette, BarChart3, Activity, Settings, HelpCircle, CheckCircle2,
  Circle, ChevronDown, ChevronUp, ArrowLeft, Shield, Pen, Code,
  Calculator, UserCheck, Lightbulb, Target, Rocket, Star,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import type { UserRole } from "@/types";

/* ─── types ──────────────────────────────────────────────── */
interface GuideModule {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;       // text color
  bg: string;          // bg color
  steps: string[];
  tip?: string;
}

/* ─── role labels ─────────────────────────────────────────── */
const ROLE_LABELS: Record<UserRole, string> = {
  admin: "مدیر سیستم", sales_manager: "مدیر فروش", sales_rep: "کارشناس فروش",
  project_manager: "مدیر پروژه", designer: "طراح", developer: "توسعه‌دهنده",
  accountant: "حسابدار", hr: "منابع انسانی", marketing: "مارکتینگ", legal: "حقوقی",
};

/* ─── module data per role ────────────────────────────────── */
const MODULES: Record<UserRole, GuideModule[]> = {
  admin: [
    {
      id: "admin-dashboard", title: "داشبورد مدیریتی", href: "/",
      description: "نمای کلی از وضعیت مالی، پروژه‌ها، لیدها و تیم",
      icon: LayoutDashboard, color: "text-indigo-500", bg: "bg-indigo-500/10",
      steps: [
        "داشبورد را هر صبح باز کن — KPI های درآمد، پروژه فعال و لیدهای جدید را ببین",
        "نمودار درآمد ماهانه را بررسی کن و با ماه قبل مقایسه کن",
        "لیست آخرین فعالیت‌های تیم را در پایین صفحه بررسی کن",
        "اعلان‌های pending (مساعده، هزینه) را سریع پردازش کن",
      ],
      tip: "داشبورد را در تب مرورگر پین کن تا همیشه دسترسی داشته باشی",
    },
    {
      id: "admin-team", title: "مدیریت تیم", href: "/team",
      description: "افزودن کاربر، تغییر نقش، مشاهده عملکرد هر عضو",
      icon: UsersRound, color: "text-blue-500", bg: "bg-blue-500/10",
      steps: [
        "از تب 'اعضای تیم' لیست کارمندان را ببین — نقش و وضعیت هر نفر نمایش داده می‌شود",
        "برای افزودن عضو جدید روی '+کاربر جدید' کلیک کن و اطلاعات را کامل کن",
        "برای تغییر نقش: کلیک روی کاربر → ویرایش → تغییر نقش",
        "تب 'نقش‌ها و دسترسی‌ها' را ببین تا بدانی هر نقش به چه بخش‌هایی دسترسی دارد",
      ],
    },
    {
      id: "admin-settings", title: "تنظیمات شرکت", href: "/settings",
      description: "اطلاعات شرکت، لوگو، قالب فاکتور و تنظیمات سیستم",
      icon: Settings, color: "text-gray-500", bg: "bg-gray-500/10",
      steps: [
        "تب 'تنظیمات شرکت' را باز کن — نام قانونی، شناسه مالیاتی و آدرس را کامل کن",
        "لوگوی شرکت را آپلود کن تا روی فاکتورها نمایش داده شود",
        "تب 'قالب فاکتور' را باز کن — رنگ اصلی و متن پاورقی فاکتور را تنظیم کن",
        "تب 'ظاهر و تم' را برای تغییر حالت روشن/تاریک استفاده کن",
      ],
      tip: "بعد از وارد کردن اطلاعات شرکت، یک فاکتور آزمایشی چاپ کن",
    },
    {
      id: "admin-finance", title: "مالی شرکت", href: "/finance",
      description: "گزارش P&L، درآمد، هزینه‌ها و سود خالص",
      icon: DollarSign, color: "text-yellow-500", bg: "bg-yellow-500/10",
      steps: [
        "صفحه مالی را باز کن — کارت‌های KPI (درآمد، هزینه، سود) را در بالا ببین",
        "تب 'سود و زیان' را باز کن — جدول P&L ماهانه را بررسی کن",
        "نمودار ماهانه را با نگه داشتن ماوس روی هر نقطه جزئیات بیشتر ببین",
        "دکمه 'Export PDF' را بزن تا گزارش مالی را ذخیره کنی",
      ],
    },
    {
      id: "admin-activity", title: "لاگ فعالیت", href: "/activity",
      description: "ثبت همه اقدامات کاربران — ایجاد، ویرایش، حذف",
      icon: Activity, color: "text-red-500", bg: "bg-red-500/10",
      steps: [
        "صفحه لاگ فعالیت را باز کن — همه اقدامات به ترتیب زمانی نمایش داده می‌شوند",
        "فیلتر نوع عملیات را تنظیم کن: ایجاد / ویرایش / حذف",
        "فیلتر کاربر را برای دیدن فعالیت‌های یک نفر خاص استفاده کن",
        "دکمه 'Export Excel' را برای گزارش حسابرسی بزن",
      ],
      tip: "هفته‌ای یک بار لاگ را بررسی کن — فعالیت‌های غیرعادی را سریع متوجه می‌شوی",
    },
    {
      id: "admin-reports", title: "گزارش‌ها", href: "/reports",
      description: "تحلیل فروش، عملکرد تیم و روند رشد کسب‌وکار",
      icon: BarChart3, color: "text-purple-500", bg: "bg-purple-500/10",
      steps: [
        "صفحه گزارش‌ها را باز کن — فیلتر بازه زمانی را تنظیم کن",
        "گزارش فروش را ببین: بهترین کارشناس، بیشترین مشتری، پربازده‌ترین کانال",
        "نمودار روند ماهانه را بررسی کن — ماه‌های کم‌فروش را شناسایی کن",
        "گزارش دلخواه را با دکمه Export دانلود کن",
      ],
    },
    {
      id: "admin-crm-guide", title: "راهنمای نقش‌ها", href: "/crm-guide",
      description: "مشاهده راهنمای هر نقش از دید مدیر سیستم",
      icon: HelpCircle, color: "text-teal-500", bg: "bg-teal-500/10",
      steps: [
        "در بالای صفحه، منوی نقش را باز کن",
        "نقش هر کارمند را انتخاب کن — راهنمای اختصاصی آن نقش را ببین",
        "این صفحه را به کارمندان جدید معرفی کن تا راحت‌تر شروع کنند",
      ],
    },
  ],

  sales_rep: [
    {
      id: "sr-mysales", title: "داشبورد من", href: "/my-sales",
      description: "آمار شخصی، یادآورهای follow-up و هدف ماهانه",
      icon: UserSquare2, color: "text-emerald-500", bg: "bg-emerald-500/10",
      steps: [
        "اول هر روز 'داشبورد من' را باز کن — لیدهای جدید و یادآورهای امروز را ببین",
        "یادآورهای سررسیدشده را یک‌به‌یک تیک بزن بعد از پیگیری",
        "نوار هدف ماهانه را ببین — چقدر به هدف نزدیک هستی؟",
        "با دکمه '+ یادآور جدید' برای لیدهای مهم follow-up تنظیم کن",
      ],
      tip: "یادآور 24 ساعته برای هر لید جدید بگذار — فرصت را از دست نده",
    },
    {
      id: "sr-leads", title: "سرنخ‌ها", href: "/leads",
      description: "ثبت لید جدید، کانبان فروش، پیگیری وضعیت",
      icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/10",
      steps: [
        "دکمه '+ لید جدید' را بزن — نام، شماره تماس، منبع و ارزش تخمینی را وارد کن",
        "در نمای کانبان، کارت لید را بکش و بین ستون‌های قیف جابجا کن",
        "روی هر لید کلیک کن — جزئیات، یادداشت و تاریخچه تماس را وارد کن",
        "وقتی لید برنده یا از دست رفت، دلیل را در پاپ‌آپ ثبت کن",
        "با فیلتر 'لیدهای من'، فقط لیدهای خودت را ببین",
      ],
    },
    {
      id: "sr-clients", title: "مشتریان", href: "/clients",
      description: "دیتابیس مشتریان، اطلاعات تماس و تاریخچه کار",
      icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10",
      steps: [
        "بعد از بستن معامله، مشتری را در لیست مشتریان پیدا یا اضافه کن",
        "پروفایل مشتری را باز کن — تب‌های مختلف: پروژه‌ها، فاکتورها، یادداشت",
        "اطلاعات تماس را کامل کن: شخص اصلی، ایمیل، تلفن",
        "یادداشت‌های مهم مشتری را در بخش Notes ثبت کن",
      ],
    },
    {
      id: "sr-meetings", title: "جلسات", href: "/meetings",
      description: "ثبت جلسه، دستور کار، action items و پیگیری",
      icon: CalendarDays, color: "text-indigo-500", bg: "bg-indigo-500/10",
      steps: [
        "دکمه '+ جلسه جدید' را بزن — عنوان، تاریخ، ساعت و شرکت‌کنندگان را وارد کن",
        "لینک آنلاین (Google Meet / Zoom) یا مکان فیزیکی را وارد کن",
        "بعد از جلسه، به 'صورت‌جلسه' برگرد و نتایج را ثبت کن",
        "Action items را با مسئول و تاریخ اضافه کن",
      ],
      tip: "صورت‌جلسه را همان روز بنویس — جزئیات فراموش می‌شوند",
    },
    {
      id: "sr-advance", title: "مساعده حقوق", href: "/advance",
      description: "ثبت درخواست مساعده و پیگیری وضعیت تایید",
      icon: WalletCards, color: "text-orange-500", bg: "bg-orange-500/10",
      steps: [
        "دکمه '+ درخواست جدید' را بزن",
        "مبلغ مورد نیاز، دلیل و تاریخ نیاز را وارد کن",
        "وضعیت درخواست را از لیست 'درخواست‌های من' پیگیری کن",
        "بعد از تایید، تاریخ واریز را در وضعیت 'پرداخت شد' می‌بینی",
      ],
    },
    {
      id: "sr-calendar", title: "تقویم", href: "/calendar",
      description: "نمای تقویمی از جلسات و یادآورها",
      icon: Calendar, color: "text-teal-500", bg: "bg-teal-500/10",
      steps: [
        "تقویم را باز کن — جلسات و رویدادهای این ماه را ببین",
        "روی هر روز کلیک کن تا جزئیات آن روز را ببینی",
        "با arrow های بالای تقویم بین ماه‌ها جابجا شو",
      ],
    },
  ],

  sales_manager: [
    {
      id: "sm-pipeline", title: "قیف فروش", href: "/pipeline",
      description: "تحلیل نرخ تبدیل، پیش‌بینی درآمد و Win/Loss",
      icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10",
      steps: [
        "صفحه قیف فروش را باز کن — نمودار قیف با تعداد لید هر مرحله را ببین",
        "نرخ تبدیل بین مراحل را بررسی کن — کجا بیشترین ریزش داری؟",
        "تب 'تحلیل Win/Loss' را باز کن — دلایل باخت را بر اساس دسته‌بندی ببین",
        "بخش پیش‌بینی درآمد را ببین — ارزش pipeline فعلی × نرخ تبدیل",
      ],
      tip: "هر هفته قیف را با تیم مرور کن — لیدهای گیرکرده را شناسایی کن",
    },
    {
      id: "sm-leads", title: "سرنخ‌های تیم", href: "/leads",
      description: "مشاهده همه لیدها، تخصیص به کارشناس، نظارت",
      icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/10",
      steps: [
        "فیلتر 'کارشناس' را فعال کن — لیدهای هر نفر را جداگانه ببین",
        "لیدهای بدون متصدی را پیدا کن و به کارشناس مناسب تخصیص بده",
        "لیدهای گران‌قیمت (ارزش بالا) را با فیلتر ارزش شناسایی کن",
        "وضعیت لیدهای قدیمی (بدون آپدیت ۷ روز+) را بررسی کن",
      ],
    },
    {
      id: "sm-competition", title: "رقابت فروش", href: "/sales-competition",
      description: "لیدربورد تیم، پادیوم، پاداش‌ها و اهداف",
      icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/10",
      steps: [
        "صفحه رقابت را باز کن — پادیوم ۳ نفر برتر با آمار را ببین",
        "دکمه 'تنظیم رقابت' را بزن — عنوان، متریک (درآمد/تعداد/نرخ) و بازه را تنظیم کن",
        "مبلغ پاداش هر رتبه را وارد کن — برای انگیزه‌بخشی به تیم",
        "جدول رتبه‌بندی کامل را ببین — همه اعضای تیم با آمارشان",
      ],
    },
    {
      id: "sm-commissions", title: "پورسانت", href: "/commissions",
      description: "محاسبه و تایید پورسانت ماهانه کارشناسان",
      icon: BadgeDollarSign, color: "text-green-500", bg: "bg-green-500/10",
      steps: [
        "ماه مورد نظر را از selector انتخاب کن",
        "جدول کارشناسان را ببین — درآمد، درصد پورسانت و مبلغ نهایی",
        "درصد پورسانت هر نفر را در صورت نیاز تغییر بده",
        "بعد از بررسی، دکمه 'تایید پرداخت' را بزن",
      ],
    },
    {
      id: "sm-clients", title: "مشتریان", href: "/clients",
      description: "نمای کلی از پورتفولیوی مشتریان و ارزش هر حساب",
      icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10",
      steps: [
        "مرتب‌سازی بر اساس 'ارزش' را فعال کن — بزرگ‌ترین حساب‌ها را شناسایی کن",
        "مشتریان غیرفعال (بدون فاکتور ۶ ماه+) را پیدا کن",
        "پروفایل مشتری کلیدی را باز کن — تاریخچه فاکتور و پروژه را ببین",
      ],
    },
    {
      id: "sm-campaigns", title: "کمپین‌های مارکتینگ", href: "/marketing/campaigns",
      description: "پیگیری کمپین‌ها، ROI و بودجه مصرف‌شده",
      icon: Megaphone, color: "text-pink-500", bg: "bg-pink-500/10",
      steps: [
        "لیست کمپین‌های فعال را ببین — وضعیت، بودجه و ROI هر کمپین",
        "کمپین با بیشترین ROI را شناسایی کن — بودجه بیشتر تخصیص بده",
        "کمپین‌های ضررده را متوقف یا بازنگری کن",
      ],
    },
    {
      id: "sm-reports", title: "گزارش‌ها", href: "/reports",
      description: "گزارش عملکرد تیم، مقایسه دوره‌ای",
      icon: BarChart3, color: "text-purple-500", bg: "bg-purple-500/10",
      steps: [
        "گزارش ماهانه را اجرا کن — مقایسه با ماه قبل را ببین",
        "عملکرد هر کارشناس را در گزارش تیم ببین",
        "گزارش را Export و برای جلسه ماهانه آماده کن",
      ],
    },
  ],

  project_manager: [
    {
      id: "pm-projects", title: "پروژه‌ها", href: "/projects",
      description: "مدیریت پروژه، گانت چارت، مایلستون و تسک",
      icon: Briefcase, color: "text-blue-500", bg: "bg-blue-500/10",
      steps: [
        "پروژه جدید بساز — عنوان، مشتری، تاریخ شروع/پایان و اعضای تیم را وارد کن",
        "تسک‌ها را اضافه کن: عنوان، مسئول، تاریخ سررسید و اولویت",
        "نمای گانت چارت را باز کن — تایم‌لاین تسک‌ها را تصویری ببین",
        "مایلستون‌ها (نقاط عطف) را در timeline تعریف کن",
        "تب 'بار کاری تیم' را ببین — کدام عضو تیم کم‌کار یا زیادکار است؟",
      ],
      tip: "هفته‌ای یک‌بار وضعیت تسک‌های عقب‌افتاده را بررسی کن",
    },
    {
      id: "pm-timer", title: "تایمر", href: "/timer",
      description: "ردیابی ساعات کاری تیم برای پروژه‌ها",
      icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10",
      steps: [
        "پروژه مورد نظر را از dropdown انتخاب کن",
        "دکمه Start را بزن — تایمر شروع می‌کند",
        "بعد از اتمام کار Stop را بزن — ورودی زمانی ذخیره می‌شود",
        "در گزارش تایمر، ساعات هر پروژه را برای صدور فاکتور ببین",
      ],
    },
    {
      id: "pm-files", title: "فایل‌ها", href: "/files",
      description: "مدیریت فایل‌های پروژه، نسخه‌بندی",
      icon: FolderOpen, color: "text-teal-500", bg: "bg-teal-500/10",
      steps: [
        "فایل‌ها را بر اساس پروژه فیلتر کن",
        "فایل جدید آپلود کن — نوع (دیزاین، مستندات، ویدیو) را تعیین کن",
        "روی فایل راست کلیک کن — گزینه‌های دانلود، حذف، اشتراک‌گذاری",
        "نسخه جدید فایل را آپلود کن — تاریخچه نسخه‌ها نگهداری می‌شود",
      ],
    },
    {
      id: "pm-meetings", title: "جلسات", href: "/meetings",
      description: "برنامه‌ریزی جلسات پروژه و پیگیری action items",
      icon: CalendarDays, color: "text-indigo-500", bg: "bg-indigo-500/10",
      steps: [
        "جلسه هفتگی پروژه را تنظیم کن — شرکت‌کنندگان و دستور کار را وارد کن",
        "بعد از جلسه، صورت‌جلسه را در فیلد Minutes بنویس",
        "Action items را با مسئول و تاریخ تعریف کن",
        "جلسات بعدی را از تقویم پیگیری کن",
      ],
    },
    {
      id: "pm-tickets", title: "تیکت‌ها", href: "/tickets",
      description: "مدیریت مشکلات، درخواست‌های تغییر و باگ‌ها",
      icon: TicketCheck, color: "text-red-500", bg: "bg-red-500/10",
      steps: [
        "تیکت‌های پروژه را فیلتر کن — اولویت‌بندی بر اساس فوریت",
        "تیکت‌های open را به اعضای تیم تخصیص بده",
        "وضعیت تیکت را بعد از رفع مشکل به 'بسته' تغییر بده",
      ],
    },
    {
      id: "pm-wiki", title: "ویکی", href: "/wiki",
      description: "مستندسازی پروژه، فرآیندها و دانش تیم",
      icon: BookOpen, color: "text-purple-500", bg: "bg-purple-500/10",
      steps: [
        "مقاله جدید برای پروژه بساز — عنوان و دسته‌بندی را انتخاب کن",
        "مستندات فنی، فرآیند تحویل و نکات کلیدی را بنویس",
        "لینک‌های مرتبط (GitHub، Figma، Drive) را اضافه کن",
        "مقاله را با تیم اشتراک‌گذاری کن",
      ],
    },
  ],

  designer: [
    {
      id: "des-files", title: "فایل‌ها", href: "/files",
      description: "آپلود فایل‌های دیزاین، نسخه‌بندی و تاریخچه",
      icon: FolderOpen, color: "text-teal-500", bg: "bg-teal-500/10",
      steps: [
        "فایل دیزاین خود را آپلود کن — نوع را 'دیزاین' انتخاب کن",
        "پروژه مرتبط را در dropdown انتخاب کن",
        "نسخه جدید را آپلود کن — سیستم نسخه قبلی را نگه می‌دارد",
        "روی فایل کلیک کن تا پیش‌نمایش و وضعیت تایید را ببینی",
      ],
    },
    {
      id: "des-review", title: "بررسی دیزاین", href: "/design-review",
      description: "فرآیند تایید دیزاین، بازخورد مشتری و ثبت کامنت",
      icon: Palette, color: "text-pink-500", bg: "bg-pink-500/10",
      steps: [
        "فایل دیزاین را از لیست انتخاب کن — وضعیت تایید را ببین",
        "وضعیت را به 'در انتظار بررسی' تغییر بده تا مدیر/مشتری بررسی کند",
        "بازخوردهای ثبت‌شده را در بخش کامنت‌ها ببین",
        "بعد از اعمال تغییرات، نسخه جدید را آپلود کن",
        "بعد از تایید نهایی، وضعیت به 'تایید شد' تغییر می‌کند",
      ],
      tip: "برای هر مرحله از پروژه یک فایل جداگانه آپلود کن — سردرگمی کمتر",
    },
    {
      id: "des-content", title: "تقویم محتوا", href: "/marketing/content",
      description: "برنامه‌ریزی محتوای بصری در کانبان",
      icon: ClipboardList, color: "text-orange-500", bg: "bg-orange-500/10",
      steps: [
        "کانبان محتوا را باز کن — ستون‌ها: ایده، نوشتن، بررسی، زمان‌بندی، منتشر شد",
        "محتوای جدید را با '+' اضافه کن — نوع (ریلز، پست، استوری) و کانال را انتخاب کن",
        "کارت را بین ستون‌ها بکش و رها کن تا وضعیت تغییر کند",
        "روی کارت کلیک کن تا جزئیات و یادداشت‌ها را ببینی",
      ],
    },
    {
      id: "des-projects", title: "پروژه‌ها", href: "/projects",
      description: "پروژه‌های دیزاین، تسک‌های محوله و وضعیت",
      icon: Briefcase, color: "text-blue-500", bg: "bg-blue-500/10",
      steps: [
        "پروژه‌هایی که عضوش هستی را در لیست ببین",
        "تسک‌های محوله به خودت را با فیلتر 'مسئول من' پیدا کن",
        "وضعیت تسک را بعد از انجام به 'تکمیل' تغییر بده",
      ],
    },
    {
      id: "des-meetings", title: "جلسات", href: "/meetings",
      description: "جلسات پرزنتیشن دیزاین و بازخورد",
      icon: CalendarDays, color: "text-indigo-500", bg: "bg-indigo-500/10",
      steps: [
        "جلسه پرزنتیشن دیزاین را ثبت کن — لینک Figma را در توضیحات بگذار",
        "بعد از جلسه بازخوردها را در Action items ثبت کن",
      ],
    },
  ],

  developer: [
    {
      id: "dev-projects", title: "پروژه‌ها", href: "/projects",
      description: "پروژه‌های فنی، تب فنی (repo، سرور، چک‌لیست deploy)",
      icon: Briefcase, color: "text-blue-500", bg: "bg-blue-500/10",
      steps: [
        "پروژه را باز کن — تب 'فنی' را پیدا کن",
        "آدرس Repository را وارد کن — لینک کلیک‌پذیر می‌شود",
        "اطلاعات سرورها (dev/staging/production) را در بخش سرورها وارد کن",
        "چک‌لیست deploy را قبل از هر استقرار کامل کن و 'ثبت deploy' بزن",
        "مستندات فنی (API، معماری، tech stack) را در تب مستندات بنویس",
      ],
      tip: "چک‌لیست deploy را هر بار کامل کن — جلوی مشکلات پروداکشن را می‌گیرد",
    },
    {
      id: "dev-tickets", title: "تیکت‌ها", href: "/tickets",
      description: "باگ‌ها، درخواست‌های feature و مشکلات فنی",
      icon: TicketCheck, color: "text-red-500", bg: "bg-red-500/10",
      steps: [
        "تیکت‌های تخصیص‌یافته به خودت را با فیلتر ببین",
        "وضعیت تیکت را حین کار به 'در حال بررسی' تغییر بده",
        "بعد از رفع مشکل، توضیح راه‌حل را در کامنت بنویس",
        "تیکت را ببند و اگر نیاز به تست دارد به QA تخصیص بده",
      ],
    },
    {
      id: "dev-wiki", title: "ویکی", href: "/wiki",
      description: "مستندات فنی، معماری، نحوه راه‌اندازی",
      icon: BookOpen, color: "text-purple-500", bg: "bg-purple-500/10",
      steps: [
        "مقاله فنی جدید بساز — دسته 'فنی' را انتخاب کن",
        "README، نحوه راه‌اندازی و متغیرهای محیطی را مستند کن",
        "API endpoints را با مثال توضیح بده",
        "مقاله را به‌روز نگه دار — بعد از هر تغییر مهم آپدیت کن",
      ],
    },
    {
      id: "dev-files", title: "فایل‌ها", href: "/files",
      description: "فایل‌های فنی، اسکریپت‌ها و مستندات",
      icon: FolderOpen, color: "text-teal-500", bg: "bg-teal-500/10",
      steps: [
        "فایل‌های فنی را بر اساس پروژه فیلتر کن",
        "اسکریپت‌ها، دیتابیس بکاپ و config فایل‌ها را آپلود کن",
      ],
    },
    {
      id: "dev-timer", title: "تایمر", href: "/timer",
      description: "ثبت ساعات کاری برای فاکتور و گزارش",
      icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10",
      steps: [
        "پروژه را انتخاب کن و تایمر را Start کن",
        "بعد از هر session کاری Stop بزن",
        "ساعات ثبت‌شده در گزارش پروژه نمایش داده می‌شوند",
      ],
    },
  ],

  accountant: [
    {
      id: "acc-finance", title: "مالی شرکت", href: "/finance",
      description: "P&L، درآمد، هزینه‌ها، گزارش سود و زیان",
      icon: DollarSign, color: "text-yellow-500", bg: "bg-yellow-500/10",
      steps: [
        "ماه مورد نظر را انتخاب کن — کارت‌های درآمد، هزینه و سود را ببین",
        "تب 'سود و زیان' را باز کن — جدول P&L کامل با دسته‌بندی",
        "نمودار ماهانه را بررسی کن — ماه‌های منفی را شناسایی کن",
        "گزارش PDF را برای مدیریت صادر کن",
      ],
    },
    {
      id: "acc-invoicing", title: "فاکتورها", href: "/invoicing",
      description: "مدیریت فاکتورها، وضعیت پرداخت، فاکتور تکرارشونده",
      icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10",
      steps: [
        "فاکتورهای 'معوق' را با فیلتر وضعیت پیدا کن",
        "برای فاکتور معوق: دکمه 'یادآوری' را بزن یا وضعیت را به 'پرداخت شد' تغییر بده",
        "فاکتور جدید را با دکمه '+' بساز — اقلام را از کاتالوگ خدمات انتخاب کن",
        "فاکتور تکرارشونده را با toggle 'تکرارشونده' تنظیم کن",
      ],
    },
    {
      id: "acc-expenses", title: "هزینه‌ها", href: "/expenses",
      description: "تایید یا رد هزینه‌های pending، گزارش هزینه",
      icon: Receipt, color: "text-red-500", bg: "bg-red-500/10",
      steps: [
        "هزینه‌های 'در انتظار تایید' را با فیلتر پیدا کن",
        "روی هر هزینه کلیک کن — رسید را ببین و تایید یا رد کن",
        "یادداشت رد کردن را حتماً بنویس — درخواست‌کننده می‌بیند",
        "گزارش هزینه ماهانه را به تفکیک دسته‌بندی Export کن",
      ],
      tip: "هزینه‌های بالای سقف را قبل از تایید با مدیر هماهنگ کن",
    },
    {
      id: "acc-payroll", title: "حقوق و دستمزد", href: "/payroll",
      description: "تهیه حقوق ماهانه، کسورات، پاداش و تایید پرداخت",
      icon: Wallet, color: "text-green-500", bg: "bg-green-500/10",
      steps: [
        "ماه مورد نظر را انتخاب کن — پیش‌نویس حقوق ماه نمایش داده می‌شود",
        "پاداش و کسورات هر نفر را وارد کن",
        "خالص قابل پرداخت هر نفر را بررسی کن",
        "دکمه 'تایید کل' را بزن — وضعیت به 'تایید شد' تغییر می‌کند",
        "بعد از واریز، دکمه 'ثبت پرداخت' را بزن",
      ],
    },
    {
      id: "acc-commissions", title: "پورسانت", href: "/commissions",
      description: "بررسی و تایید پورسانت‌های محاسبه‌شده",
      icon: BadgeDollarSign, color: "text-purple-500", bg: "bg-purple-500/10",
      steps: [
        "ماه را انتخاب کن — پورسانت‌های محاسبه‌شده را ببین",
        "مبالغ را با مدیر فروش تطبیق بده",
        "دکمه 'تایید پرداخت' را بزن",
      ],
    },
  ],

  hr: [
    {
      id: "hr-team", title: "اعضای تیم", href: "/team",
      description: "مدیریت پرسنل، اطلاعات کارمندان، نقش‌ها",
      icon: UsersRound, color: "text-blue-500", bg: "bg-blue-500/10",
      steps: [
        "لیست کارمندان را ببین — نقش، تاریخ استخدام و وضعیت هر نفر",
        "پروفایل کارمند را باز کن — اطلاعات تماس اضطراری را کامل کن",
        "کارمند جدید را اضافه کن — نقش را با دقت انتخاب کن",
        "تب 'نقش‌ها و دسترسی‌ها' را ببین — هر نقش چه دسترسی‌هایی دارد",
      ],
    },
    {
      id: "hr-advance", title: "مساعده حقوق", href: "/advance",
      description: "بررسی و تایید درخواست‌های مساعده پرسنل",
      icon: WalletCards, color: "text-orange-500", bg: "bg-orange-500/10",
      steps: [
        "درخواست‌های 'در انتظار' را پیدا کن",
        "جزئیات هر درخواست را ببین — مبلغ، دلیل، تاریخ نیاز",
        "تایید یا رد کن — یادداشت رد را بنویس",
        "بعد از تایید، به حسابداری اطلاع بده",
      ],
    },
    {
      id: "hr-forms", title: "فرم‌ها", href: "/forms",
      description: "ایجاد فرم‌های HR: مصاحبه خروج، ارزیابی عملکرد",
      icon: ClipboardList, color: "text-teal-500", bg: "bg-teal-500/10",
      steps: [
        "فرم جدید بساز — نوع 'exit_interview' یا 'performance' را انتخاب کن",
        "سوالات را از پنل سازنده اضافه کن — نوع (متن، چندگزینه‌ای، امتیاز)",
        "فرم را فعال کن — لینک آن را برای کارمند ارسال کن",
        "پاسخ‌های دریافتی را در تب 'پاسخ‌ها' ببین",
      ],
    },
    {
      id: "hr-meetings", title: "جلسات", href: "/meetings",
      description: "جلسات ارزیابی عملکرد و مصاحبه‌ها",
      icon: CalendarDays, color: "text-indigo-500", bg: "bg-indigo-500/10",
      steps: [
        "جلسه ارزیابی عملکرد را ثبت کن",
        "شرکت‌کنندگان (کارمند + مدیر) را اضافه کن",
        "دستور کار و اهداف را در فیلد Agenda بنویس",
        "بعد از جلسه، نتایج و action items را ثبت کن",
      ],
    },
  ],

  marketing: [
    {
      id: "mkt-campaigns", title: "کمپین‌ها", href: "/marketing/campaigns",
      description: "ایجاد کمپین، پیگیری ROI، ویرایش اطلاعات",
      icon: Megaphone, color: "text-pink-500", bg: "bg-pink-500/10",
      steps: [
        "دکمه '+ کمپین جدید' را بزن — عنوان، کانال، بودجه، تاریخ شروع/پایان را وارد کن",
        "روی کمپین کلیک کن — متریک‌ها (ایمپرشن، کلیک، تبدیل، ROI) را ببین",
        "دکمه 'ویرایش' را بزن — همه فیلدها قابل ویرایش هستند",
        "وضعیت کمپین را (پیش‌نویس/فعال/متوقف/تمام شد) از بالای فرم تغییر بده",
        "تب 'پیشرفت' را ببین — یادداشت پیشرفت اضافه کن",
      ],
      tip: "هدف ROI و هدف تبدیل را موقع ایجاد وارد کن تا progress bar نمایش داده شود",
    },
    {
      id: "mkt-content", title: "تقویم محتوا", href: "/marketing/content",
      description: "کانبان محتوا، drag & drop بین مراحل",
      icon: ClipboardList, color: "text-orange-500", bg: "bg-orange-500/10",
      steps: [
        "کانبان را باز کن — ستون‌ها: ایده ← نوشتن ← بررسی ← زمان‌بندی ← منتشر شد",
        "محتوای جدید را با دکمه '+' بساز — عنوان، نوع، کانال، مسئول",
        "کارت را drag کن و به ستون بعدی بینداز تا وضعیت تغییر کند",
        "محتواهای منتشرشده را با دکمه 'آرشیو' به آرشیو ارسال کن",
        "نمای لیست را برای جستجوی سریع امتحان کن",
      ],
    },
    {
      id: "mkt-archive", title: "آرشیو محتوا", href: "/marketing/archive",
      description: "محتوای منتشرشده آرشیو‌شده، بازگردانی",
      icon: Archive, color: "text-gray-500", bg: "bg-gray-500/10",
      steps: [
        "فیلتر نوع (ریلز، پست، استوری) را برای جستجوی سریع استفاده کن",
        "روی کارت کلیک کن — متن کامل محتوا را ببین",
        "دکمه 'بازگردانی' را بزن تا محتوا به وضعیت 'منتشر شد' برگردد",
      ],
    },
    {
      id: "mkt-budget", title: "بودجه تبلیغات", href: "/marketing/budget",
      description: "برنامه‌ریزی بودجه، تخصیص به کانال، CRUD آیتم‌ها",
      icon: PieChart, color: "text-green-500", bg: "bg-green-500/10",
      steps: [
        "کارت 'بودجه کل' را ببین — آیکون قلم را بزن تا بودجه را ویرایش کنی",
        "جدول کانال‌ها را ببین — روی هر کانال کلیک کن تا آیتم‌هایش باز شود",
        "دکمه '+ آیتم جدید' را بزن — شرح، کانال، مبلغ، تاریخ، کمپین را وارد کن",
        "نمودار پای توزیع بودجه را در سمت راست ببین",
        "جدول کامل آیتم‌ها را در پایین صفحه ببین — هر آیتم قابل ویرایش/حذف",
      ],
    },
    {
      id: "mkt-analytics", title: "آنالیتیکس", href: "/marketing/analytics",
      description: "ROI کلی، مقایسه کانال‌ها، بهترین کمپین‌ها",
      icon: BarChart2, color: "text-purple-500", bg: "bg-purple-500/10",
      steps: [
        "KPI های بالا (ایمپرشن، کلیک، نرخ تبدیل، CPC) را ببین",
        "نمودار روند ماهانه را بررسی کن",
        "جدول مقایسه کانال‌ها را ببین — بهترین کانال بر اساس ROI کدام است؟",
        "جدول بهترین کمپین‌ها را در پایین ببین",
      ],
    },
  ],

  legal: [
    {
      id: "leg-cases", title: "پرونده‌ها", href: "/legal/cases",
      description: "مدیریت دعاوی، اقدامات حقوقی، تاریخ دادگاه",
      icon: Scale, color: "text-purple-500", bg: "bg-purple-500/10",
      steps: [
        "پرونده جدید بساز — شماره پرونده، عنوان، نوع، طرفین و وکیل را وارد کن",
        "پرونده را باز کن — اقدامات حقوقی را در تایم‌لاین اضافه کن",
        "تاریخ جلسه بعدی دادگاه را ثبت کن — یادآور خودکار دارد",
        "اسناد مرتبط را آپلود و لینک کن",
        "وضعیت پرونده را بعد از هر اقدام آپدیت کن",
      ],
      tip: "هر اقدام را فوراً ثبت کن — در دعاوی زمان بندی مهم است",
    },
    {
      id: "leg-contracts", title: "قراردادها", href: "/legal/contracts",
      description: "پیگیری قراردادها، هشدار انقضا، وضعیت امضا",
      icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10",
      steps: [
        "قرارداد جدید بساز — عنوان، نوع، طرفین، تاریخ شروع/پایان",
        "فایل قرارداد را آپلود کن",
        "قراردادهای نزدیک به انقضا (badge قرمز) را پیگیری کن",
        "وضعیت را از پیش‌نویس → بررسی → امضاشده به‌روز کن",
      ],
    },
    {
      id: "leg-archive", title: "آرشیو حقوقی", href: "/legal/archive",
      description: "اسناد و پرونده‌های بسته‌شده بایگانی‌شده",
      icon: Archive, color: "text-gray-500", bg: "bg-gray-500/10",
      steps: [
        "آرشیو را با فیلتر سال بررسی کن",
        "سند مورد نظر را با جستجو پیدا کن",
        "دکمه Export را برای فهرست آرشیو بزن",
      ],
    },
    {
      id: "leg-meetings", title: "جلسات", href: "/meetings",
      description: "جلسات دادگاه، مشاوره حقوقی، پیگیری",
      icon: CalendarDays, color: "text-indigo-500", bg: "bg-indigo-500/10",
      steps: [
        "جلسه دادگاه یا مشاوره را ثبت کن",
        "پرونده مرتبط را در توضیحات ذکر کن",
        "بعد از جلسه نتایج را ثبت کن",
      ],
    },
  ],
};

/* ─── level config ────────────────────────────────────────── */
const LEVELS = [
  { min: 0,   label: "مبتدی",           emoji: "🌱", color: "text-gray-400",    bar: "bg-gray-400" },
  { min: 25,  label: "در حال یادگیری",  emoji: "📚", color: "text-blue-400",   bar: "bg-blue-400" },
  { min: 50,  label: "آشنا",            emoji: "🔥", color: "text-orange-400", bar: "bg-orange-400" },
  { min: 75,  label: "حرفه‌ای",         emoji: "⚡", color: "text-indigo-400", bar: "bg-indigo-400" },
  { min: 100, label: "استاد",           emoji: "🏆", color: "text-yellow-400", bar: "bg-yellow-400" },
];

const BADGES = [
  { id: "first",  emoji: "🌱", title: "اولین قدم",   desc: "اولین ماژول را تکمیل کردی", count: 1,   pct: 0   },
  { id: "three",  emoji: "🔥", title: "در حرکتم",    desc: "۳ ماژول تکمیل شد",          count: 3,   pct: 0   },
  { id: "half",   emoji: "⚡", title: "نیمه راه",    desc: "نصف ماژول‌ها تکمیل شد",    count: 0,   pct: 50  },
  { id: "master", emoji: "🏆", title: "استاد",       desc: "همه ماژول‌ها تکمیل شد",    count: 0,   pct: 100 },
];

function getLevel(pct: number) {
  return [...LEVELS].reverse().find(l => pct >= l.min)!;
}

/* ─── module card ─────────────────────────────────────────── */
function ModuleCard({
  mod, done, onToggle,
}: {
  mod: GuideModule; done: boolean; onToggle: () => void;
}) {
  const [open, setOpen] = useState(false);
  const Icon = mod.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card overflow-hidden transition-all duration-300 ${done ? "ring-1 ring-primary/30" : ""}`}
    >
      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${mod.bg}`}>
            <Icon className={`w-5 h-5 ${mod.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-sm truncate">{mod.title}</h3>
              {done && (
                <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0 font-medium">
                  ✓ آموزش دیدم
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{mod.description}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          <Link href={mod.href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mod.bg} ${mod.color} hover:opacity-80`}>
            <Rocket className="w-3 h-3" />
            برو به صفحه
            <ArrowLeft className="w-3 h-3" />
          </Link>

          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {open ? "بستن" : "آموزش گام‌به‌گام"}
          </button>
        </div>
      </div>

      {/* Steps */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-2">
              {mod.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${mod.bg} ${mod.color}`}>
                    {i + 1}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
                </div>
              ))}

              {mod.tip && (
                <div className="flex items-start gap-2 mt-3 p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <Lightbulb className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">{mod.tip}</p>
                </div>
              )}

              {/* Mark done */}
              <button
                onClick={onToggle}
                className={`mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all ${
                  done
                    ? "bg-primary/10 text-primary"
                    : "bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground"
                }`}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                {done ? "آموزش دیدم ✓" : "آموزش دیدم — تیک بزن"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── main page ───────────────────────────────────────────── */
export default function CRMGuidePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [viewRole, setViewRole] = useState<UserRole>(user?.role ?? "admin");
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  // Load from localStorage
  useEffect(() => {
    const key = `crm-guide-${viewRole}`;
    const saved = localStorage.getItem(key);
    setCompleted(saved ? new Set(JSON.parse(saved)) : new Set());
  }, [viewRole]);

  // Persist to localStorage
  const toggle = (id: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem(`crm-guide-${viewRole}`, JSON.stringify([...next]));
      return next;
    });
  };

  const modules = useMemo(() => MODULES[viewRole] ?? [], [viewRole]);
  const total = modules.length;
  const done = modules.filter(m => completed.has(m.id)).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const xp = done * 10;
  const level = getLevel(pct);

  const unlockedBadges = BADGES.filter(b => {
    if (b.count > 0) return done >= b.count;
    return pct >= b.pct;
  });

  const ROLE_ICONS: Record<UserRole, React.ElementType> = {
    admin: Shield, sales_manager: BarChart2, sales_rep: Zap,
    project_manager: Briefcase, designer: Pen, developer: Code,
    accountant: Calculator, hr: UserCheck, marketing: Megaphone, legal: Scale,
  };
  const RoleIcon = ROLE_ICONS[viewRole] ?? HelpCircle;

  return (
    <div className="space-y-6 pb-8">

      {/* ─── Header ─────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">راهنمای تعاملی CRM</h1>
            <p className="text-sm text-muted-foreground">گام‌به‌گام یاد بگیر، بج جمع کن</p>
          </div>
        </div>

        {isAdmin && (
          <select value={viewRole} onChange={e => setViewRole(e.target.value as UserRole)}
            className="input-field text-sm">
            {Object.entries(ROLE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        )}
      </motion.div>

      {/* ─── Hero / Progress Card ───────────────────────────── */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        className="card p-5 relative overflow-hidden">

        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-primary/5" />
          <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-primary/3" />
        </div>

        <div className="relative flex items-start gap-4 flex-wrap">
          {/* Avatar + level */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <RoleIcon className="w-8 h-8 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card border-2 border-border flex items-center justify-center text-sm">
              {level.emoji}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-base">{ROLE_LABELS[viewRole]}</h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-muted ${level.color}`}>
                {level.emoji} {level.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {done} از {total} ماژول آموزش دیدی — {xp} XP
            </p>

            {/* XP bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">پیشرفت کلی</span>
                <span className={`font-bold ${level.color}`}>{pct}%</span>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${level.bar}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex gap-3 shrink-0">
            <div className="text-center px-3 py-2 rounded-xl bg-muted/50">
              <p className="text-xl font-bold text-primary">{done}</p>
              <p className="text-xs text-muted-foreground">تکمیل</p>
            </div>
            <div className="text-center px-3 py-2 rounded-xl bg-muted/50">
              <p className="text-xl font-bold">{total - done}</p>
              <p className="text-xs text-muted-foreground">باقیمانده</p>
            </div>
            <div className="text-center px-3 py-2 rounded-xl bg-muted/50">
              <p className="text-xl font-bold text-yellow-500">{xp}</p>
              <p className="text-xs text-muted-foreground">XP</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Badges ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Star className="w-4 h-4" /> دستاوردها
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BADGES.map(badge => {
            const unlocked = unlockedBadges.some(b => b.id === badge.id);
            return (
              <motion.div key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`card p-3 text-center transition-all ${
                  unlocked
                    ? "ring-1 ring-yellow-500/40 bg-yellow-500/5"
                    : "opacity-50 grayscale"
                }`}>
                <div className="text-2xl mb-1">{badge.emoji}</div>
                <p className="text-xs font-bold">{badge.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{badge.desc}</p>
                {unlocked && (
                  <span className="inline-block mt-1.5 text-[10px] text-yellow-600 dark:text-yellow-400 font-medium">
                    ✓ باز شد
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ─── Modules Grid ───────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            ماژول‌های آموزشی
          </h2>
          {done > 0 && (
            <button
              onClick={() => {
                setCompleted(new Set());
                localStorage.removeItem(`crm-guide-${viewRole}`);
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              پاک کردن پیشرفت
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {modules.map((mod, i) => (
            <motion.div key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}>
              <ModuleCard
                mod={mod}
                done={completed.has(mod.id)}
                onToggle={() => toggle(mod.id)}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── Completion banner ──────────────────────────────── */}
      <AnimatePresence>
        {pct === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="card p-6 text-center bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30"
          >
            <div className="text-4xl mb-2">🏆</div>
            <h3 className="font-bold text-lg text-yellow-600 dark:text-yellow-400">
              استاد شدی!
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              همه ماژول‌های نقش {ROLE_LABELS[viewRole]} را تکمیل کردی — حالا وقت عمل است!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
