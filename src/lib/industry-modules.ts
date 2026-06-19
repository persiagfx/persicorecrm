import {
  LayoutDashboard, Zap, Building2, TrendingUp, Tag, Trophy, UserSquare2,
  BadgeDollarSign, Briefcase, Clock, FolderOpen, FileText, FileSignature,
  Receipt, DollarSign, Target, Wallet, BookMarked, Landmark, CreditCard,
  Package, Banknote, AreaChart, UsersRound, Network, UserCheck, GanttChart,
  CalendarDays, Star, Gift, BriefcaseBusiness, WalletCards, ClipboardList,
  GraduationCap, Megaphone, Mail, Link2, PersonStanding, FlaskConical,
  BarChart2, Scale, Gavel, AlarmClock, CalendarRange, MessageSquare,
  TicketCheck, BookOpen, ShoppingBag, Palette, BarChart3, Activity,
  Settings, HelpCircle, Warehouse, Truck, RotateCcw, Users, Phone,
  ChefHat, UtensilsCrossed, TableProperties, CalendarClock, ShoppingCart,
  Bug, Map, Key, Factory, Layers, CheckSquare2, Wrench, Trash2,
  Ship, Globe, DollarSign as DollarIcon, Headphones, MapPin, Shield,
  ThumbsUp, BookOpenCheck, UserPlus, CalendarCheck, FileQuestion,
  Award, Store, Package2, Tag as TagIcon, Bike, Star as StarIcon,
  Monitor,
  type LucideIcon,
} from "lucide-react";

export type IndustryType =
  | "GENERAL"
  | "RESTAURANT"
  | "IT"
  | "MANUFACTURING"
  | "TRADING"
  | "SERVICE"
  | "EDUCATION"
  | "ECOMMERCE";

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

export interface NavSection {
  label: string | null;
  items: NavItem[];
  industryOnly?: IndustryType[];
}

// ─── Base sections (all industries) ──────────────────────────────────
const BASE_SECTIONS: NavSection[] = [
  {
    label: null,
    items: [{ href: "/", icon: LayoutDashboard, label: "داشبورد" }],
  },
  {
    label: "فروش",
    items: [
      { href: "/leads", icon: Zap, label: "سرنخ‌ها" },
      { href: "/clients", icon: Building2, label: "مشتریان" },
      { href: "/pipeline", icon: TrendingUp, label: "قیف فروش" },
      { href: "/crm/segments", icon: Tag, label: "سگمنت‌بندی" },
      { href: "/crm/call-logs", icon: Phone, label: "لاگ تماس‌ها" },
      { href: "/crm/journey", icon: Map, label: "نقشه سفر مشتری" },
      { href: "/sales-competition", icon: Trophy, label: "رقابت فروش" },
      { href: "/my-sales", icon: UserSquare2, label: "داشبورد من" },
      { href: "/commissions", icon: BadgeDollarSign, label: "پورسانت" },
    ],
  },
  {
    label: "مالی و حسابداری",
    items: [
      { href: "/invoicing", icon: FileText, label: "فاکتورها" },
      { href: "/contracts", icon: FileSignature, label: "قراردادهای مشتری" },
      { href: "/contracts/templates", icon: FileText, label: "قالب‌های قرارداد" },
      { href: "/expenses", icon: Receipt, label: "هزینه‌ها" },
      { href: "/finance", icon: DollarSign, label: "مالی شرکت" },
      { href: "/finance/budget", icon: Target, label: "بودجه در مقابل واقعی" },
      { href: "/payroll", icon: Wallet, label: "حقوق و دستمزد" },
      { href: "/erp/chart-of-accounts", icon: BookMarked, label: "دفتر حساب‌ها" },
      { href: "/erp/ledger", icon: FileText, label: "دفتر کل" },
      { href: "/erp/journal-vouchers", icon: Receipt, label: "اسناد حسابداری" },
      { href: "/erp/cost-centers", icon: Building2, label: "مراکز هزینه" },
      { href: "/erp/budget", icon: Wallet, label: "بودجه‌ریزی" },
      { href: "/erp/bank-accounts", icon: Landmark, label: "حساب‌های بانکی" },
      { href: "/erp/checks", icon: CreditCard, label: "مدیریت چک" },
      { href: "/erp/fixed-assets", icon: Package, label: "دارایی‌های ثابت" },
      { href: "/erp/tax", icon: Banknote, label: "مالیات" },
      { href: "/erp/reports", icon: AreaChart, label: "گزارش‌های مالی" },
      { href: "/erp/financial-kpi", icon: BarChart2, label: "داشبورد KPI مالی" },
      { href: "/erp/cash-flow", icon: TrendingUp, label: "جریان نقدی" },
      { href: "/erp/bank-reconciliation", icon: CheckSquare2, label: "تطبیق بانکی" },
      { href: "/erp/aging-report", icon: AlarmClock, label: "گزارش سنی مطالبات" },
      { href: "/erp/recurring-invoices", icon: RotateCcw, label: "فاکتورهای تکراری" },
    ],
  },
  {
    label: "تیم و HR",
    items: [
      { href: "/team", icon: UsersRound, label: "اعضای تیم" },
      { href: "/hr/org-chart", icon: Network, label: "نمودار سازمانی" },
      { href: "/hr/contracts", icon: UserCheck, label: "قراردادهای کارمندان" },
      { href: "/hr/attendance", icon: GanttChart, label: "حضور و غیاب" },
      { href: "/hr/leave-requests", icon: CalendarDays, label: "مرخصی" },
      { href: "/hr/kpi", icon: Star, label: "ارزیابی عملکرد" },
      { href: "/hr/benefits", icon: Gift, label: "مزایا" },
      { href: "/hr/recruitment", icon: BriefcaseBusiness, label: "استخدام" },
      { href: "/hr/shifts", icon: AlarmClock, label: "مدیریت شیفت" },
      { href: "/hr/overtime", icon: Clock, label: "اضافه‌کاری و تاخیر" },
      { href: "/hr/onboarding", icon: UserPlus, label: "ورود و خروج پرسنل" },
      { href: "/hr/employee-dashboard", icon: LayoutDashboard, label: "داشبورد کارمند" },
      { href: "/advance", icon: WalletCards, label: "مساعده حقوق" },
      { href: "/forms", icon: ClipboardList, label: "فرم‌ها" },
    ],
  },
  {
    label: "همکاری",
    items: [
      { href: "/meetings", icon: CalendarRange, label: "جلسات" },
      { href: "/messages", icon: MessageSquare, label: "پیامرسان داخلی" },
      { href: "/tickets", icon: TicketCheck, label: "تیکت‌ها" },
      { href: "/wiki", icon: BookOpen, label: "ویکی" },
    ],
  },
  {
    label: "گزارش‌ها",
    items: [
      { href: "/reports", icon: BarChart3, label: "گزارش‌ها" },
      { href: "/activity", icon: Activity, label: "لاگ فعالیت" },
    ],
  },
];

// ─── Shared inventory/supplier (multi-industry) ───────────────────────
const INVENTORY_SECTION: NavSection = {
  label: "انبار و موجودی",
  industryOnly: ["RESTAURANT", "MANUFACTURING", "TRADING", "ECOMMERCE", "GENERAL"],
  items: [
    { href: "/inventory", icon: Warehouse, label: "موجودی کالا" },
    { href: "/inventory/movements", icon: RotateCcw, label: "ورود / خروج کالا" },
    { href: "/inventory/locations", icon: MapPin, label: "مکان‌های انبار" },
    { href: "/suppliers", icon: Users, label: "تأمین‌کنندگان" },
    { href: "/purchase-orders", icon: ShoppingCart, label: "سفارشات خرید (PO)" },
    { href: "/inventory/valuation", icon: BarChart2, label: "ارزیابی موجودی" },
    { href: "/inventory/stock-count", icon: ClipboardList, label: "شمارش موجودی" },
    { href: "/returns", icon: RotateCcw, label: "مرجوعی" },
  ],
};

// ─── Restaurant sections ──────────────────────────────────────────────
const RESTAURANT_SECTIONS: NavSection[] = [
  {
    label: "رستوران",
    industryOnly: ["RESTAURANT"],
    items: [
      { href: "/restaurant/dashboard", icon: ChefHat, label: "داشبورد رستوران" },
      { href: "/restaurant/menu", icon: UtensilsCrossed, label: "مدیریت منو" },
      { href: "/restaurant/tables", icon: TableProperties, label: "مدیریت میز" },
      { href: "/restaurant/orders", icon: ShoppingCart, label: "سفارش‌گیری (POS)" },
      { href: "/restaurant/kitchen", icon: ChefHat, label: "نمایش آشپزخانه (KDS)" },
      { href: "/restaurant/reservations", icon: CalendarClock, label: "رزرو میز" },
      { href: "/restaurant/shifts", icon: Clock, label: "مدیریت شیفت" },
      { href: "/restaurant/reports", icon: BarChart3, label: "گزارش فروش روزانه" },
    ],
  },
];

// ─── IT sections ──────────────────────────────────────────────────────
const IT_SECTIONS: NavSection[] = [
  {
    label: "پروژه‌ها",
    industryOnly: ["IT"],
    items: [
      { href: "/projects", icon: Briefcase, label: "پروژه‌ها" },
      { href: "/it/sprints", icon: Layers, label: "Sprint Board" },
      { href: "/it/bugs", icon: Bug, label: "باگ تراکر" },
      { href: "/it/roadmap", icon: Map, label: "Roadmap محصول" },
      { href: "/it/licenses", icon: Key, label: "لایسنس‌های نرم‌افزار" },
      { href: "/it/assets", icon: Monitor, label: "رجیستری دارایی‌ها" },
      { href: "/timer", icon: Clock, label: "تایمر" },
      { href: "/files", icon: FolderOpen, label: "فایل‌ها" },
    ],
  },
];

// ─── Manufacturing sections ───────────────────────────────────────────
const MANUFACTURING_SECTIONS: NavSection[] = [
  {
    label: "تولید",
    industryOnly: ["MANUFACTURING"],
    items: [
      { href: "/manufacturing/dashboard", icon: Factory, label: "داشبورد تولید" },
      { href: "/manufacturing/analytics", icon: BarChart2, label: "آنالیتیکس و OEE" },
      { href: "/manufacturing/lines", icon: Layers, label: "خطوط تولید" },
      { href: "/manufacturing/orders", icon: ClipboardList, label: "دستور تولید" },
      { href: "/manufacturing/bom", icon: Package, label: "لیست مواد (BOM)" },
      { href: "/manufacturing/quality", icon: CheckSquare2, label: "کنترل کیفیت" },
      { href: "/manufacturing/equipment", icon: Wrench, label: "ماشین‌آلات" },
      { href: "/manufacturing/waste", icon: Trash2, label: "مدیریت ضایعات" },
    ],
  },
];

// ─── Trading sections ─────────────────────────────────────────────────
const TRADING_SECTIONS: NavSection[] = [
  {
    label: "بازرگانی",
    industryOnly: ["TRADING"],
    items: [
      { href: "/trading/dashboard", icon: LayoutDashboard, label: "داشبورد بازرگانی" },
      { href: "/trading/shipments", icon: Ship, label: "محموله‌ها" },
      { href: "/trading/trade-records", icon: Globe, label: "واردات / صادرات" },
      { href: "/trading/pricing", icon: TagIcon, label: "قیمت‌گذاری چندسطحی" },
    ],
  },
];

// ─── Service sections ─────────────────────────────────────────────────
const SERVICE_SECTIONS: NavSection[] = [
  {
    label: "مدیریت خدمات",
    industryOnly: ["SERVICE"],
    items: [
      { href: "/service/dashboard", icon: LayoutDashboard, label: "داشبورد خدمات" },
      { href: "/service/requests", icon: Headphones, label: "درخواست‌های خدمات" },
      { href: "/service/schedule", icon: CalendarCheck, label: "زمان‌بندی تکنسین" },
      { href: "/service/sla", icon: Shield, label: "مدیریت SLA" },
      { href: "/service/feedback", icon: ThumbsUp, label: "نظرسنجی مشتری" },
      { href: "/service/map", icon: MapPin, label: "نقشه میدانی" },
    ],
  },
];

// ─── Education sections ───────────────────────────────────────────────
const EDUCATION_SECTIONS: NavSection[] = [
  {
    label: "آموزشگاه",
    industryOnly: ["EDUCATION"],
    items: [
      { href: "/education/dashboard", icon: GraduationCap, label: "داشبورد آموزشگاه" },
      { href: "/education/courses", icon: BookOpenCheck, label: "دوره‌ها" },
      { href: "/education/students", icon: UserPlus, label: "دانش‌آموزان" },
      { href: "/education/schedule", icon: CalendarCheck, label: "برنامه کلاس" },
      { href: "/education/exams", icon: FileQuestion, label: "آزمون‌ها" },
      { href: "/education/gradebook", icon: BarChart2, label: "دفتر نمرات" },
      { href: "/education/certificates", icon: Award, label: "گواهینامه‌ها" },
      { href: "/education/attendance", icon: GanttChart, label: "حضور و غیاب" },
    ],
  },
];

// ─── Ecommerce sections ───────────────────────────────────────────────
const ECOMMERCE_SECTIONS: NavSection[] = [
  {
    label: "فروشگاه",
    industryOnly: ["ECOMMERCE"],
    items: [
      { href: "/ecommerce/dashboard", icon: Store, label: "داشبورد فروشگاه" },
      { href: "/ecommerce/analytics", icon: BarChart2, label: "آنالیتیکس فروش" },
      { href: "/ecommerce/products", icon: Package2, label: "محصولات" },
      { href: "/ecommerce/categories", icon: Layers, label: "دسته‌بندی‌ها" },
      { href: "/ecommerce/orders", icon: ShoppingCart, label: "سفارش‌ها" },
      { href: "/ecommerce/discounts", icon: TagIcon, label: "کد تخفیف" },
      { href: "/ecommerce/delivery", icon: Bike, label: "ردیابی ارسال" },
      { href: "/ecommerce/reviews", icon: StarIcon, label: "نظرات محصول" },
    ],
  },
];

// ─── Marketing (common) ───────────────────────────────────────────────
const MARKETING_SECTION: NavSection = {
  label: "مارکتینگ",
  items: [
    { href: "/marketing/campaigns", icon: Megaphone, label: "کمپین‌ها" },
    { href: "/marketing/email", icon: Mail, label: "کمپین ایمیل" },
    { href: "/marketing/utm", icon: Link2, label: "UTM لینک‌ها" },
    { href: "/marketing/personas", icon: PersonStanding, label: "پرسوناها" },
    { href: "/marketing/ab-tests", icon: FlaskConical, label: "آزمون A/B" },
    { href: "/marketing/content", icon: ClipboardList, label: "تقویم محتوا" },
    { href: "/marketing/budget", icon: DollarSign, label: "بودجه مارکتینگ" },
    { href: "/marketing/archive", icon: FolderOpen, label: "آرشیو محتوا" },
    { href: "/marketing/analytics", icon: BarChart2, label: "آنالیتیکس" },
  ],
};

const LEGAL_SECTION: NavSection = {
  label: "حقوقی",
  items: [
    { href: "/legal/cases", icon: Scale, label: "پرونده‌های حقوقی" },
    { href: "/legal/hearings", icon: Gavel, label: "جلسات دادگاه" },
    { href: "/legal/deadlines", icon: AlarmClock, label: "مهلت‌های قانونی" },
    { href: "/legal/contracts", icon: FileSignature, label: "قراردادهای حقوقی" },
    { href: "/legal/archive", icon: FolderOpen, label: "آرشیو حقوقی" },
    { href: "/legal/billing", icon: Receipt, label: "صورتحساب حقوقی" },
  ],
};

// ─── Main export: get nav sections for industry ───────────────────────
export function getNavSections(industryType: IndustryType = "GENERAL"): NavSection[] {
  const sections: NavSection[] = [...BASE_SECTIONS];

  switch (industryType) {
    case "RESTAURANT":
      sections.splice(2, 0, INVENTORY_SECTION);
      sections.push(...RESTAURANT_SECTIONS);
      sections.push(MARKETING_SECTION);
      break;

    case "IT":
      sections.push(...IT_SECTIONS);
      sections.push(LEGAL_SECTION);
      sections.push(MARKETING_SECTION);
      break;

    case "MANUFACTURING":
      sections.splice(2, 0, INVENTORY_SECTION);
      sections.push(...MANUFACTURING_SECTIONS);
      break;

    case "TRADING":
      sections.splice(2, 0, INVENTORY_SECTION);
      sections.push(...TRADING_SECTIONS);
      sections.push(LEGAL_SECTION);
      break;

    case "SERVICE":
      sections.push(...SERVICE_SECTIONS);
      sections.push(MARKETING_SECTION);
      break;

    case "EDUCATION":
      sections.push(...EDUCATION_SECTIONS);
      sections.push(MARKETING_SECTION);
      break;

    case "ECOMMERCE":
      sections.splice(2, 0, INVENTORY_SECTION);
      sections.push(...ECOMMERCE_SECTIONS);
      sections.push(MARKETING_SECTION);
      break;

    case "GENERAL":
    default:
      sections.splice(3, 0, {
        label: "پروژه‌ها",
        items: [
          { href: "/projects", icon: Briefcase, label: "پروژه‌ها" },
          { href: "/timer", icon: Clock, label: "تایمر" },
          { href: "/files", icon: FolderOpen, label: "فایل‌ها" },
        ],
      });
      sections.splice(4, 0, INVENTORY_SECTION);
      sections.push(MARKETING_SECTION);
      sections.push(LEGAL_SECTION);
      sections.push({
        label: "آموزش",
        items: [{ href: "/training", icon: GraduationCap, label: "دوره‌های آموزشی" }],
      });
      sections.push({
        label: "دانش",
        items: [
          { href: "/services", icon: ShoppingBag, label: "خدمات و محصولات" },
          { href: "/design-review", icon: Palette, label: "بررسی دیزاین" },
        ],
      });
      break;
  }

  return sections;
}

// ─── Industry metadata (for registration page) ───────────────────────
export const INDUSTRIES: { type: IndustryType; label: string; icon: string; description: string; color: string }[] = [
  {
    type: "RESTAURANT",
    label: "کافه / رستوران",
    icon: "🍽️",
    description: "مدیریت منو، میز، سفارش، شیفت و انبار مواد اولیه",
    color: "from-orange-500/20 to-red-500/20 border-orange-500/30",
  },
  {
    type: "IT",
    label: "شرکت فناوری اطلاعات",
    icon: "💻",
    description: "Sprint، Bug Tracker، Roadmap، پروژه‌ها و لایسنس نرم‌افزار",
    color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
  },
  {
    type: "MANUFACTURING",
    label: "تولیدی / کارخانه",
    icon: "🏭",
    description: "خط تولید، BOM، کنترل کیفیت، ماشین‌آلات و مدیریت ضایعات",
    color: "from-gray-500/20 to-slate-500/20 border-gray-500/30",
  },
  {
    type: "TRADING",
    label: "شرکت بازرگانی",
    icon: "🚢",
    description: "انبار، تامین‌کنندگان، محموله، واردات/صادرات و قیمت‌گذاری",
    color: "from-teal-500/20 to-emerald-500/20 border-teal-500/30",
  },
  {
    type: "SERVICE",
    label: "شرکت خدماتی",
    icon: "🔧",
    description: "درخواست خدمات، زمان‌بندی تکنسین، SLA و نظرسنجی",
    color: "from-yellow-500/20 to-amber-500/20 border-yellow-500/30",
  },
  {
    type: "EDUCATION",
    label: "آموزشگاه / مدرسه",
    icon: "🎓",
    description: "دوره‌ها، دانش‌آموزان، برنامه کلاس، آزمون و گواهینامه",
    color: "from-violet-500/20 to-purple-500/20 border-violet-500/30",
  },
  {
    type: "ECOMMERCE",
    label: "فروشگاه آنلاین",
    icon: "🛒",
    description: "محصولات، سفارش‌ها، کد تخفیف، ارسال و نظرات محصول",
    color: "from-pink-500/20 to-rose-500/20 border-pink-500/30",
  },
  {
    type: "GENERAL",
    label: "عمومی / سایر",
    icon: "🏢",
    description: "دسترسی به تمام ماژول‌های CRM بدون محدودیت",
    color: "from-primary/20 to-secondary/20 border-primary/30",
  },
];
