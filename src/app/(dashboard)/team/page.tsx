"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { apiClient } from "@/lib/api/client";
import {
  UsersRound, Wallet, X, ArrowDownLeft, ArrowUpRight,
  TrendingUp, Award, Clock, ChevronLeft, Send, Plus,
  Pencil, Trash2, Eye, EyeOff, Shield, Mail, Phone, Key,
  Check, Lock, Unlock, ChevronDown, ChevronRight, AlertTriangle,
  Settings, CalendarDays,
} from "lucide-react";
import TeamScheduleTab from "@/components/team/TeamScheduleTab";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { USER_ROLES } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import type { User, UserRole } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Permission System ────────────────────────────────────────────────
export interface Permission {
  id: string;
  label: string;
  description: string;
}

export interface PermissionGroup {
  id: string;
  label: string;
  icon: string;
  permissions: Permission[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "leads",
    label: "سرنخ‌ها",
    icon: "⚡",
    permissions: [
      { id: "leads.view", label: "مشاهده", description: "دیدن لیست و جزئیات سرنخ‌ها" },
      { id: "leads.create", label: "ایجاد", description: "افزودن سرنخ جدید" },
      { id: "leads.edit", label: "ویرایش", description: "ویرایش اطلاعات سرنخ" },
      { id: "leads.delete", label: "حذف", description: "حذف سرنخ" },
      { id: "leads.export", label: "خروجی Excel", description: "دانلود لیست سرنخ‌ها" },
      { id: "leads.import", label: "ورودی Excel", description: "آپلود سرنخ از فایل" },
      { id: "leads.assign", label: "واگذاری", description: "واگذاری سرنخ به اعضا" },
    ],
  },
  {
    id: "clients",
    label: "مشتریان",
    icon: "👥",
    permissions: [
      { id: "clients.view", label: "مشاهده", description: "دیدن پروفایل مشتریان" },
      { id: "clients.create", label: "ایجاد", description: "ثبت مشتری جدید" },
      { id: "clients.edit", label: "ویرایش", description: "ویرایش اطلاعات مشتری" },
      { id: "clients.delete", label: "حذف", description: "حذف مشتری" },
      { id: "clients.vip_manage", label: "مدیریت VIP", description: "تغییر وضعیت VIP" },
    ],
  },
  {
    id: "projects",
    label: "پروژه‌ها",
    icon: "📁",
    permissions: [
      { id: "projects.view", label: "مشاهده", description: "دیدن پروژه‌ها" },
      { id: "projects.create", label: "ایجاد", description: "ساختن پروژه جدید" },
      { id: "projects.edit", label: "ویرایش", description: "ویرایش اطلاعات پروژه" },
      { id: "projects.delete", label: "حذف", description: "حذف پروژه" },
      { id: "projects.manage_members", label: "مدیریت اعضا", description: "اضافه/حذف اعضای پروژه" },
      { id: "projects.view_budget", label: "مشاهده بودجه", description: "دیدن بودجه و هزینه‌ها" },
      { id: "projects.edit_budget", label: "ویرایش بودجه", description: "تغییر بودجه پروژه" },
    ],
  },
  {
    id: "tasks",
    label: "تسک‌ها",
    icon: "✅",
    permissions: [
      { id: "tasks.view", label: "مشاهده", description: "دیدن تسک‌ها" },
      { id: "tasks.create", label: "ایجاد", description: "ایجاد تسک جدید" },
      { id: "tasks.edit", label: "ویرایش", description: "ویرایش تسک" },
      { id: "tasks.delete", label: "حذف", description: "حذف تسک" },
      { id: "tasks.assign", label: "واگذاری", description: "واگذاری تسک به اعضا" },
      { id: "tasks.change_status", label: "تغییر وضعیت", description: "جابجایی بین ستون‌های کانبان" },
      { id: "tasks.track_time", label: "ردیابی زمان", description: "شروع/توقف تایمر" },
    ],
  },
  {
    id: "invoices",
    label: "فاکتورها",
    icon: "📄",
    permissions: [
      { id: "invoices.view", label: "مشاهده", description: "دیدن فاکتورها" },
      { id: "invoices.create", label: "ایجاد", description: "صدور فاکتور جدید" },
      { id: "invoices.edit", label: "ویرایش", description: "ویرایش فاکتور" },
      { id: "invoices.delete", label: "حذف", description: "حذف فاکتور" },
      { id: "invoices.send", label: "ارسال", description: "ارسال فاکتور به مشتری" },
      { id: "invoices.mark_paid", label: "ثبت پرداخت", description: "علامت‌گذاری به عنوان پرداخت‌شده" },
      { id: "invoices.export_pdf", label: "PDF", description: "دانلود PDF فاکتور" },
    ],
  },
  {
    id: "expenses",
    label: "هزینه‌ها",
    icon: "💸",
    permissions: [
      { id: "expenses.view", label: "مشاهده", description: "دیدن هزینه‌ها" },
      { id: "expenses.create", label: "ثبت", description: "ثبت هزینه جدید" },
      { id: "expenses.edit", label: "ویرایش", description: "ویرایش هزینه" },
      { id: "expenses.delete", label: "حذف", description: "حذف هزینه" },
      { id: "expenses.approve", label: "تأیید", description: "تأیید هزینه‌های اعضا" },
      { id: "expenses.view_all", label: "مشاهده همه", description: "دیدن هزینه‌های همه اعضا" },
    ],
  },
  {
    id: "contracts",
    label: "قراردادها",
    icon: "📝",
    permissions: [
      { id: "contracts.view", label: "مشاهده", description: "دیدن قراردادها" },
      { id: "contracts.create", label: "ایجاد", description: "تنظیم قرارداد جدید" },
      { id: "contracts.edit", label: "ویرایش", description: "ویرایش قرارداد" },
      { id: "contracts.delete", label: "حذف", description: "حذف قرارداد" },
      { id: "contracts.send", label: "ارسال", description: "ارسال برای امضا" },
      { id: "contracts.manage_templates", label: "مدیریت قالب‌ها", description: "ایجاد/ویرایش قالب‌ها" },
    ],
  },
  {
    id: "tickets",
    label: "تیکت‌ها",
    icon: "🎫",
    permissions: [
      { id: "tickets.view", label: "مشاهده", description: "دیدن تیکت‌ها" },
      { id: "tickets.create", label: "ایجاد", description: "ایجاد تیکت جدید" },
      { id: "tickets.edit", label: "ویرایش", description: "ویرایش تیکت" },
      { id: "tickets.delete", label: "حذف", description: "حذف تیکت" },
      { id: "tickets.assign", label: "واگذاری", description: "واگذاری تیکت به اعضا" },
      { id: "tickets.resolve", label: "بستن", description: "بستن/حل تیکت" },
    ],
  },
  {
    id: "wiki",
    label: "ویکی",
    icon: "📚",
    permissions: [
      { id: "wiki.view", label: "مشاهده", description: "خواندن مقالات" },
      { id: "wiki.create", label: "ایجاد", description: "نوشتن مقاله جدید" },
      { id: "wiki.edit", label: "ویرایش", description: "ویرایش مقالات" },
      { id: "wiki.delete", label: "حذف", description: "حذف مقالات" },
      { id: "wiki.manage_folders", label: "مدیریت پوشه‌ها", description: "ایجاد/حذف پوشه‌ها" },
    ],
  },
  {
    id: "files",
    label: "فایل‌ها",
    icon: "📎",
    permissions: [
      { id: "files.view", label: "مشاهده", description: "دیدن فایل‌ها" },
      { id: "files.upload", label: "آپلود", description: "آپلود فایل جدید" },
      { id: "files.download", label: "دانلود", description: "دانلود فایل" },
      { id: "files.delete", label: "حذف", description: "حذف فایل" },
    ],
  },
  {
    id: "reports",
    label: "گزارشات",
    icon: "📊",
    permissions: [
      { id: "reports.view", label: "مشاهده", description: "دیدن گزارشات" },
      { id: "reports.export", label: "خروجی", description: "دانلود گزارشات" },
      { id: "reports.financial", label: "گزارش مالی", description: "دیدن گزارشات مالی" },
    ],
  },
  {
    id: "team",
    label: "تیم",
    icon: "🏢",
    permissions: [
      { id: "team.view_members", label: "مشاهده اعضا", description: "دیدن لیست اعضای تیم" },
      { id: "team.manage_members", label: "مدیریت اعضا", description: "اضافه/ویرایش/حذف اعضا" },
      { id: "team.manage_roles", label: "مدیریت نقش‌ها", description: "ایجاد و ویرایش نقش‌ها" },
      { id: "team.view_wallets", label: "مشاهده کیف پول", description: "دیدن موجودی اعضا" },
      { id: "team.manage_wallets", label: "مدیریت کیف پول", description: "انجام تراکنش‌های مالی" },
    ],
  },
  {
    id: "settings",
    label: "تنظیمات",
    icon: "⚙️",
    permissions: [
      { id: "settings.view", label: "مشاهده", description: "دیدن تنظیمات" },
      { id: "settings.edit", label: "ویرایش", description: "تغییر تنظیمات سیستم" },
      { id: "settings.integrations", label: "اتصالات", description: "مدیریت اتصال به سرویس‌های خارجی" },
    ],
  },
];

// ─── Default role permission presets ─────────────────────────────────
const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.id));
const BASIC_VIEW = PERMISSION_GROUPS.flatMap((g) => g.permissions.filter((p) => p.id.endsWith(".view")).map((p) => p.id));

export interface RoleDefinition {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
  memberCount?: number;
}

const initialRoles: RoleDefinition[] = [
  {
    id: "admin",
    name: "مدیر کل",
    color: "#D4A843",
    icon: "👑",
    description: "دسترسی کامل به همه بخش‌های سیستم",
    isSystem: true,
    permissions: ALL_PERMISSIONS,
  },
  {
    id: "project_manager",
    name: "مدیر پروژه",
    color: "#3B82F6",
    icon: "📋",
    description: "مدیریت پروژه‌ها، تسک‌ها و تیم",
    isSystem: true,
    permissions: [
      "leads.view", "clients.view",
      "projects.view", "projects.create", "projects.edit", "projects.manage_members", "projects.view_budget",
      "tasks.view", "tasks.create", "tasks.edit", "tasks.assign", "tasks.change_status", "tasks.track_time",
      "invoices.view",
      "expenses.view", "expenses.create",
      "tickets.view", "tickets.create", "tickets.assign", "tickets.resolve",
      "wiki.view", "wiki.create", "wiki.edit",
      "files.view", "files.upload", "files.download",
      "reports.view",
      "team.view_members",
    ],
  },
  {
    id: "sales_manager",
    name: "مدیر فروش",
    color: "#8B5CF6",
    icon: "🎯",
    description: "مدیریت سرنخ‌ها، مشتریان و قراردادها",
    isSystem: true,
    permissions: [
      "leads.view", "leads.create", "leads.edit", "leads.delete", "leads.export", "leads.import", "leads.assign",
      "clients.view", "clients.create", "clients.edit", "clients.vip_manage",
      "projects.view",
      "invoices.view", "invoices.create", "invoices.edit", "invoices.send",
      "contracts.view", "contracts.create", "contracts.edit", "contracts.send",
      "reports.view", "reports.financial",
      "team.view_members",
    ],
  },
  {
    id: "designer",
    name: "طراح",
    color: "#EC4899",
    icon: "🎨",
    description: "کار روی تسک‌های طراحی و فایل‌ها",
    isSystem: true,
    permissions: [
      "projects.view", "tasks.view", "tasks.create", "tasks.edit", "tasks.change_status", "tasks.track_time",
      "wiki.view", "wiki.create", "wiki.edit",
      "files.view", "files.upload", "files.download",
      "tickets.view", "tickets.create",
      "team.view_members",
    ],
  },
  {
    id: "developer",
    name: "دولوپر",
    color: "#10B981",
    icon: "💻",
    description: "توسعه پروژه‌ها و مدیریت تسک‌های فنی",
    isSystem: true,
    permissions: [
      "projects.view", "tasks.view", "tasks.create", "tasks.edit", "tasks.change_status", "tasks.track_time",
      "tickets.view", "tickets.create", "tickets.edit", "tickets.resolve",
      "wiki.view", "wiki.create", "wiki.edit",
      "files.view", "files.upload", "files.download",
      "team.view_members",
    ],
  },
  {
    id: "accountant",
    name: "حسابدار",
    color: "#F59E0B",
    icon: "💰",
    description: "مدیریت مالی، فاکتورها و هزینه‌ها",
    isSystem: true,
    permissions: [
      "invoices.view", "invoices.create", "invoices.edit", "invoices.send", "invoices.mark_paid", "invoices.export_pdf",
      "expenses.view", "expenses.create", "expenses.edit", "expenses.approve", "expenses.view_all",
      "reports.view", "reports.export", "reports.financial",
      "clients.view",
      "team.view_members", "team.view_wallets",
    ],
  },
];

// ─── Color options for custom roles ──────────────────────────────────
const ROLE_COLORS = [
  "#D4A843", "#8B5CF6", "#10B981", "#F43F5E",
  "#3B82F6", "#F59E0B", "#6366F1", "#EC4899",
  "#14B8A6", "#F97316", "#84CC16", "#06B6D4",
];
const ROLE_ICONS = ["🛡️", "⭐", "🔑", "📌", "🏷️", "🔷", "🌟", "🚀", "💎", "🎖️", "🔥", "✨"];

// ─── Colors ───────────────────────────────────────────────────────────
const MEMBER_COLORS = [
  "#D4A843", "#8B5CF6", "#10B981", "#F43F5E",
  "#3B82F6", "#F59E0B", "#6366F1",
];

// ─── Mock transactions ────────────────────────────────────────────────
const TRANSACTIONS: Record<string, { id: string; type: "credit" | "debit"; amount: number; desc: string; date: string }[]> = {
  u1: [
    { id: "t1", type: "credit", amount: 8_500_000, desc: "سهم درآمد — پارسی‌شاپ", date: "۱۴۰۴/۰۲/۰۸" },
    { id: "t2", type: "credit", amount: 5_000_000, desc: "پاداش پروژه", date: "۱۴۰۴/۰۲/۱۹" },
    { id: "t3", type: "debit", amount: 3_000_000, desc: "برداشت", date: "۱۴۰۴/۰۱/۱۶" },
  ],
  u2: [
    { id: "t4", type: "credit", amount: 5_200_000, desc: "سهم درآمد — پارسی‌شاپ", date: "۱۴۰۴/۰۲/۰۸" },
    { id: "t5", type: "credit", amount: 3_000_000, desc: "کمیسیون فروش", date: "۱۴۰۴/۰۱/۲۵" },
  ],
  u5: [
    { id: "t10", type: "credit", amount: 12_000_000, desc: "سهم درآمد — پارسی‌شاپ", date: "۱۴۰۴/۰۲/۰۸" },
    { id: "t11", type: "debit", amount: 5_000_000, desc: "برداشت", date: "۱۴۰۴/۰۲/۱۵" },
  ],
};

// ─── Initial members ──────────────────────────────────────────────────
const initialMembers: (User & { password?: string })[] = [
  { id: "u1", name: "مهرداد احمدی", email: "mehrdad@persicore.ir", phone: "09120000001", role: "admin", color: MEMBER_COLORS[0], walletBalance: 12_500_000, joinedAt: "2024-01-01", isActive: true },
  { id: "u2", name: "سارا رضایی", email: "sara@persicore.ir", phone: "09120000002", role: "sales_manager", color: MEMBER_COLORS[1], walletBalance: 8_200_000, joinedAt: "2024-02-01", isActive: true },
  { id: "u3", name: "علی کریمی", email: "ali@persicore.ir", phone: "09120000003", role: "designer", color: MEMBER_COLORS[2], walletBalance: 6_800_000, joinedAt: "2024-03-01", isActive: true },
  { id: "u4", name: "نیلوفر حسینی", email: "nilufar@persicore.ir", phone: "09120000004", role: "developer", color: MEMBER_COLORS[3], walletBalance: 7_400_000, joinedAt: "2024-03-15", isActive: true },
  { id: "u5", name: "رضا محمودی", email: "reza@persicore.ir", phone: "09120000005", role: "project_manager", color: MEMBER_COLORS[4], walletBalance: 9_600_000, joinedAt: "2024-04-01", isActive: true },
  { id: "u6", name: "فاطمه نوری", email: "fateme@persicore.ir", phone: "09120000006", role: "sales_manager", color: MEMBER_COLORS[5], walletBalance: 5_300_000, joinedAt: "2024-05-01", isActive: true },
  { id: "u7", name: "کیوان صادقی", email: "keyvan@persicore.ir", phone: "09120000007", role: "accountant", color: MEMBER_COLORS[6], walletBalance: 4_600_000, joinedAt: "2024-06-01", isActive: false },
];

// ─── CustomTooltip ────────────────────────────────────────────────────
function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-xl text-sm">
      <p className="font-medium text-foreground">{payload[0].name}</p>
      <p className="text-primary font-bold">{formatPrice(payload[0].value, true)}</p>
    </div>
  );
}

// ─── Payout Modal ─────────────────────────────────────────────────────
function PayoutModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"form" | "done">("form");
  const txs = TRANSACTIONS[user.id] ?? [];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
        <div className="px-6 pt-6 pb-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center font-bold text-black">{user.name.slice(0, 1)}</div>
            <div><h3 className="font-bold text-foreground">{user.name}</h3><p className="text-xs text-muted-foreground">کیف پول و برداشت</p></div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/5">
          <p className="text-xs text-muted-foreground mb-1">موجودی فعلی</p>
          <p className="text-3xl font-bold text-primary tabular-nums">{formatPrice(user.walletBalance, true)}</p>
        </div>
        <div className="px-6 py-4 space-y-4 max-h-[400px] overflow-y-auto">
          {step === "form" ? (<>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">مبلغ برداشت</label>
              <div className="flex gap-2">
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="مبلغ (تومان)"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <button onClick={() => setAmount(String(user.walletBalance))} className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20">حداکثر</button>
              </div>
            </div>
            <button onClick={() => { if (!amount || Number(amount) <= 0 || Number(amount) > user.walletBalance) return; setStep("done"); }}
              disabled={!amount || Number(amount) <= 0 || Number(amount) > user.walletBalance}
              className="w-full py-3 rounded-xl gradient-brand text-black font-bold text-sm gold-glow disabled:opacity-40 flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />ثبت درخواست
            </button>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">تاریخچه</p>
              {txs.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${tx.type === "credit" ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                      {tx.type === "credit" ? <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />}
                    </div>
                    <div><p className="text-xs font-medium text-foreground">{tx.desc}</p><p className="text-[10px] text-muted-foreground">{tx.date}</p></div>
                  </div>
                  <span className={`text-xs font-bold tabular-nums ${tx.type === "credit" ? "text-emerald-400" : "text-red-400"}`}>
                    {tx.type === "credit" ? "+" : "-"}{formatPrice(tx.amount, true)}
                  </span>
                </div>
              ))}
            </div>
          </>) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4"><Send className="w-7 h-7 text-emerald-400" /></div>
              <h4 className="font-bold text-foreground mb-1">ثبت شد</h4>
              <p className="text-sm text-muted-foreground">{formatPrice(Number(amount), true)} برای {user.name}</p>
              <button onClick={onClose} className="mt-4 px-5 py-2.5 rounded-xl gradient-brand text-black text-sm font-bold gold-glow">بستن</button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Member Form Modal ────────────────────────────────────────────────
function MemberModal({ member, roles, onClose, onSave }: {
  member?: User & { password?: string };
  roles: RoleDefinition[];
  onClose: () => void;
  onSave: (m: User & { password?: string }) => void;
}) {
  const isEdit = !!member;
  const [name, setName] = useState(member?.name ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [role, setRole] = useState<UserRole>(member?.role ?? "designer");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [walletBalance, setWalletBalance] = useState(String(member?.walletBalance ?? 0));
  const [isActive, setIsActive] = useState(member?.isActive ?? true);

  const handleSave = () => {
    if (!name.trim() || !email.trim()) return;
    onSave({
      id: member?.id ?? `u${Date.now()}`,
      name: name.trim(), email: email.trim(), phone: phone.trim() || undefined,
      role, color: member?.color ?? MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)],
      walletBalance: Number(walletBalance) || 0,
      joinedAt: member?.joinedAt ?? new Date().toISOString(),
      isActive, password: password || member?.password,
    });
    onClose();
    toast.success(isEdit ? "عضو ویرایش شد" : "عضو جدید اضافه شد");
  };

  const selectedRoleDef = roles.find((r) => r.id === role);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <UsersRound className="w-4 h-4 text-primary" />{isEdit ? "ویرایش عضو" : "عضو جدید"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">نام و نام خانوادگی *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: علی محمدی"
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1"><Mail className="w-3.5 h-3.5" />ایمیل *</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@company.ir" dir="ltr"
                className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-start" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1"><Phone className="w-3.5 h-3.5" />تلفن</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxxx" dir="ltr"
                className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-start" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1"><Key className="w-3.5 h-3.5" />{isEdit ? "رمز جدید (خالی = بدون تغییر)" : "رمز عبور *"}</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? "برای تغییر وارد کنید" : "رمز عبور"} dir="ltr"
                className="w-full px-4 pe-10 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-start" />
              <button type="button" onClick={() => setShowPass((p) => !p)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-1"><Shield className="w-3.5 h-3.5" />نقش</label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((r) => (
                <button key={r.id} onClick={() => setRole(r.id as UserRole)}
                  className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-right",
                    role === r.id ? "border-2 bg-muted" : "border-border bg-muted/50 hover:border-border-strong"
                  )} style={{ borderColor: role === r.id ? r.color : undefined }}>
                  <span className="text-lg">{r.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{r.permissions.length} دسترسی</p>
                  </div>
                </button>
              ))}
            </div>
            {selectedRoleDef && (
              <p className="text-xs text-muted-foreground mt-2 p-2 rounded-lg bg-muted/50">{selectedRoleDef.description}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1"><Wallet className="w-3.5 h-3.5" />موجودی</label>
              <input type="number" value={walletBalance} onChange={(e) => setWalletBalance(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div className="flex items-end">
              <button onClick={() => setIsActive((a) => !a)}
                className={cn("w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all",
                  isActive ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-border bg-muted text-muted-foreground")}>
                <span className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                {isActive ? "فعال" : "غیرفعال"}
              </button>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm">انصراف</button>
          <button onClick={handleSave} disabled={!name.trim() || !email.trim()}
            className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow disabled:opacity-40 disabled:cursor-not-allowed">
            {isEdit ? "ذخیره تغییرات" : "افزودن عضو"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Role Editor Modal ─────────────────────────────────────────────────
function RoleEditorModal({ role, onClose, onSave }: {
  role?: RoleDefinition;
  onClose: () => void;
  onSave: (r: RoleDefinition) => void;
}) {
  const isEdit = !!role;
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [color, setColor] = useState(role?.color ?? ROLE_COLORS[0]);
  const [icon, setIcon] = useState(role?.icon ?? ROLE_ICONS[0]);
  const [permissions, setPermissions] = useState<string[]>(role?.permissions ?? []);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["leads"]);

  const togglePermission = (id: string) => {
    setPermissions((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  const toggleGroup = (groupId: string) => {
    const group = PERMISSION_GROUPS.find((g) => g.id === groupId)!;
    const groupPerms = group.permissions.map((p) => p.id);
    const allChecked = groupPerms.every((p) => permissions.includes(p));
    if (allChecked) {
      setPermissions((prev) => prev.filter((p) => !groupPerms.includes(p)));
    } else {
      setPermissions((prev) => [...new Set([...prev, ...groupPerms])]);
    }
  };

  const toggleExpandGroup = (id: string) => {
    setExpandedGroups((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: role?.id ?? `role_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      color,
      icon,
      isSystem: false,
      permissions,
    });
    onClose();
    toast.success(isEdit ? "نقش ویرایش شد" : "نقش جدید ایجاد شد");
  };

  const totalPermCount = PERMISSION_GROUPS.reduce((s, g) => s + g.permissions.length, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />{isEdit ? "ویرایش نقش" : "نقش جدید"}
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{permissions.length}</span>
            از {totalPermCount} دسترسی
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Role info */}
          <div className="w-64 shrink-0 border-e border-border p-5 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">نام نقش *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: ناظر پروژه"
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">توضیح</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="شرح نقش..."
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">آیکون</label>
              <div className="grid grid-cols-6 gap-1.5">
                {ROLE_ICONS.map((ic) => (
                  <button key={ic} onClick={() => setIcon(ic)}
                    className={cn("text-lg rounded-lg p-1.5 transition-all", icon === ic ? "bg-primary/20 ring-1 ring-primary" : "hover:bg-muted")}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">رنگ</label>
              <div className="grid grid-cols-6 gap-1.5">
                {ROLE_COLORS.map((c) => (
                  <button key={c} onClick={() => setColor(c)}
                    className={cn("w-7 h-7 rounded-full transition-all", color === c ? "ring-2 ring-offset-2 ring-offset-card scale-110" : "opacity-70 hover:opacity-100")}
                    style={{ backgroundColor: c, outlineColor: c }} />
                ))}
              </div>
            </div>
            {/* Preview */}
            <div className="p-3 rounded-xl bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-2">پیش‌نمایش</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{ backgroundColor: `${color}20` }}>
                  {icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{name || "نام نقش"}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${color}20`, color }}>
                    {permissions.length} دسترسی
                  </span>
                </div>
              </div>
            </div>
            {/* Quick presets */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">قالب‌های سریع</p>
              <div className="space-y-1.5">
                <button onClick={() => setPermissions(ALL_PERMISSIONS)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-right">
                  ✓ همه دسترسی‌ها
                </button>
                <button onClick={() => setPermissions(BASIC_VIEW)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors text-right">
                  👁 فقط مشاهده
                </button>
                <button onClick={() => setPermissions([])}
                  className="w-full text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-right">
                  ✕ پاک کردن همه
                </button>
              </div>
            </div>
          </div>

          {/* Right: Permissions */}
          <div className="flex-1 overflow-y-auto p-5 space-y-2">
            {PERMISSION_GROUPS.map((group) => {
              const groupPerms = group.permissions.map((p) => p.id);
              const checkedCount = groupPerms.filter((p) => permissions.includes(p)).length;
              const allChecked = checkedCount === groupPerms.length;
              const someChecked = checkedCount > 0 && !allChecked;
              const isExpanded = expandedGroups.includes(group.id);

              return (
                <div key={group.id} className="rounded-xl border border-border overflow-hidden">
                  {/* Group header */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 cursor-pointer"
                    onClick={() => toggleExpandGroup(group.id)}>
                    {/* Checkbox for entire group */}
                    <button onClick={(e) => { e.stopPropagation(); toggleGroup(group.id); }}
                      className={cn(
                        "w-5 h-5 rounded flex items-center justify-center border-2 transition-all shrink-0",
                        allChecked ? "bg-primary border-primary" : someChecked ? "bg-primary/30 border-primary" : "border-border-strong"
                      )}>
                      {allChecked && <Check className="w-3 h-3 text-black" />}
                      {someChecked && <div className="w-2 h-0.5 bg-primary rounded" />}
                    </button>
                    <span className="text-base">{group.icon}</span>
                    <span className="font-medium text-foreground text-sm flex-1">{group.label}</span>
                    <span className="text-xs text-muted-foreground">{checkedCount}/{groupPerms.length}</span>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  </div>

                  {/* Permissions list */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                        className="overflow-hidden">
                        <div className="divide-y divide-border/50">
                          {group.permissions.map((perm) => {
                            const isChecked = permissions.includes(perm.id);
                            return (
                              <label key={perm.id}
                                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/20 transition-colors">
                                <div onClick={() => togglePermission(perm.id)}
                                  className={cn(
                                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0",
                                    isChecked ? "bg-primary border-primary" : "border-border-strong hover:border-primary"
                                  )}>
                                  {isChecked && <Check className="w-3 h-3 text-black" />}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-foreground">{perm.label}</p>
                                  <p className="text-xs text-muted-foreground">{perm.description}</p>
                                </div>
                                <code className="text-[10px] text-muted-foreground/60 hidden md:block dir-ltr">{perm.id}</code>
                              </label>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm">انصراف</button>
          <button onClick={handleSave} disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow disabled:opacity-40 disabled:cursor-not-allowed">
            {isEdit ? "ذخیره تغییرات" : "ایجاد نقش"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Roles & Permissions Tab ──────────────────────────────────────────
function RolesTab({ members }: { members: User[] }) {
  const [roles, setRoles] = useState<RoleDefinition[]>(initialRoles);
  const [editingRole, setEditingRole] = useState<RoleDefinition | undefined>(undefined);
  const [showNewRole, setShowNewRole] = useState(false);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);

  const handleSaveRole = (role: RoleDefinition) => {
    setRoles((prev) => prev.some((r) => r.id === role.id)
      ? prev.map((r) => r.id === role.id ? role : r)
      : [...prev, role]
    );
  };

  const handleDeleteRole = (id: string) => {
    setRoles((prev) => prev.filter((r) => r.id !== id));
    setDeleteRoleId(null);
    toast.success("نقش حذف شد");
  };

  const getMemberCount = (roleId: string) =>
    members.filter((m) => m.role === roleId).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">نقش‌ها و دسترسی‌ها</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{roles.length} نقش تعریف شده</p>
        </div>
        <button onClick={() => setShowNewRole(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow">
          <Plus className="w-4 h-4" />نقش جدید
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "کل نقش‌ها", value: roles.length, icon: "🛡️" },
          { label: "نقش‌های سیستمی", value: roles.filter((r) => r.isSystem).length, icon: "🔒" },
          { label: "نقش‌های سفارشی", value: roles.filter((r) => !r.isSystem).length, icon: "✨" },
          { label: "کل دسترسی‌ها", value: PERMISSION_GROUPS.reduce((s, g) => s + g.permissions.length, 0), icon: "🔑" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl bg-card border border-border">
            <span className="text-xl">{s.icon}</span>
            <p className="text-2xl font-bold text-foreground tabular-nums mt-1">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Roles list */}
      <div className="space-y-3">
        {roles.map((role) => {
          const memberCount = getMemberCount(role.id);
          const isExpanded = expandedRole === role.id;

          return (
            <div key={role.id} className="rounded-2xl bg-card border border-border overflow-hidden transition-all">
              {/* Role header */}
              <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setExpandedRole(isExpanded ? null : role.id)}>
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: `${role.color}20` }}>
                  {role.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{role.name}</h3>
                    {role.isSystem && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground">
                        <Lock className="w-2.5 h-2.5" />سیستمی
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: `${role.color}15`, color: role.color }}>
                      {role.permissions.length} دسترسی
                    </span>
                    {memberCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] bg-muted text-muted-foreground">
                        {memberCount} عضو
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => { setEditingRole(role); }}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {!role.isSystem && (
                    <button
                      onClick={() => setDeleteRoleId(role.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {/* Expanded permissions matrix */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-border">
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {PERMISSION_GROUPS.map((group) => {
                        const groupPerms = group.permissions.map((p) => p.id);
                        const grantedPerms = groupPerms.filter((p) => role.permissions.includes(p));
                        if (grantedPerms.length === 0) return null;
                        return (
                          <div key={group.id} className="p-3 rounded-xl bg-muted/30 border border-border/50">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm">{group.icon}</span>
                              <span className="text-xs font-semibold text-foreground">{group.label}</span>
                              <span className="ms-auto text-[10px] text-muted-foreground">{grantedPerms.length}/{groupPerms.length}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {group.permissions.map((perm) => {
                                const granted = role.permissions.includes(perm.id);
                                return (
                                  <span key={perm.id}
                                    className={cn(
                                      "px-1.5 py-0.5 rounded-md text-[10px] font-medium",
                                      granted ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/40 line-through"
                                    )}>
                                    {perm.label}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      {/* Show groups with no permissions */}
                      {PERMISSION_GROUPS.filter((g) => !g.permissions.some((p) => role.permissions.includes(p.id))).map((group) => (
                        <div key={group.id} className="p-3 rounded-xl bg-muted/10 border border-border/30 opacity-40">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{group.icon}</span>
                            <span className="text-xs text-muted-foreground">{group.label}</span>
                            <span className="ms-auto text-[10px] text-red-400 flex items-center gap-1"><X className="w-2.5 h-2.5" />بدون دسترسی</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Members with this role */}
                    {memberCount > 0 && (
                      <div className="px-4 pb-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">اعضا با این نقش</p>
                        <div className="flex items-center gap-2">
                          {members.filter((m) => m.role === role.id).map((m, i) => (
                            <div key={m.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs text-foreground">
                              <div className="w-4 h-4 rounded-full gradient-brand flex items-center justify-center text-[8px] font-bold text-black">
                                {m.name.slice(0, 1)}
                              </div>
                              {m.name.split(" ")[0]}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(showNewRole || editingRole) && (
          <RoleEditorModal
            role={editingRole}
            onClose={() => { setShowNewRole(false); setEditingRole(undefined); }}
            onSave={handleSaveRole}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteRoleId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeleteRoleId(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="font-bold text-foreground mb-2">حذف نقش</h3>
              <p className="text-sm text-muted-foreground mb-6">
                اعضایی که این نقش را دارند بدون نقش می‌مانند. آیا مطمئن هستید؟
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteRoleId(null)} className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm">انصراف</button>
                <button onClick={() => handleDeleteRole(deleteRoleId)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600">حذف</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function TeamPage() {
  const [members, setMembers] = useState<(User & { password?: string })[]>(initialMembers);
  const [activeTab, setActiveTab] = useState<"members" | "roles" | "schedule">("members");

  useEffect(() => {
    apiClient.get("/users").then((res) => {
      if (res.data.data?.length) setMembers(res.data.data);
    }).catch(console.error);
  }, []);
  const [payoutUser, setPayoutUser] = useState<User | null>(null);
  const [editMember, setEditMember] = useState<(User & { password?: string }) | null>(null);
  const [deleteMember, setDeleteMember] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [roles] = useState<RoleDefinition[]>(initialRoles);

  const totalWallet = members.reduce((s, u) => s + u.walletBalance, 0);
  const revenueShareData = members.map((u, i) => ({
    name: u.name,
    value: u.walletBalance,
    color: MEMBER_COLORS[i % MEMBER_COLORS.length],
  }));
  const projectCounts = members.reduce<Record<string, number>>((acc, u) => {
    acc[u.id] = 0;
    return acc;
  }, {});

  const handleSaveMember = (saved: User & { password?: string }) => {
    setMembers((prev) =>
      prev.some((m) => m.id === saved.id) ? prev.map((m) => m.id === saved.id ? saved : m) : [...prev, saved]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <UsersRound className="w-6 h-6 text-primary" />تیم و سهام
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{members.filter(m => m.isActive).length} عضو فعال</p>
        </div>
        {activeTab === "members" && (
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow">
            <Plus className="w-4 h-4" />عضو جدید
          </motion.button>
        )}
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab("members")}
          className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "members" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          <UsersRound className="w-4 h-4" />اعضای تیم
        </button>
        <button onClick={() => setActiveTab("roles")}
          className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "roles" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          <Shield className="w-4 h-4" />نقش‌ها و دسترسی‌ها
        </button>
        <button onClick={() => setActiveTab("schedule")}
          className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "schedule" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          <CalendarDays className="w-4 h-4" />برنامه‌ریزی
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "schedule" && (
          <motion.div key="schedule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TeamScheduleTab members={members} />
          </motion.div>
        )}
        {activeTab === "members" ? (
          <motion.div key="members" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Revenue Share + Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="lg:col-span-1 p-5 rounded-2xl bg-card border border-border">
                <h2 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />سهم کیف پول تیم
                </h2>
                <p className="text-xs text-muted-foreground mb-4">مجموع: <span className="text-primary font-bold">{formatPrice(totalWallet, true)}</span></p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={revenueShareData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {revenueShareData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {revenueShareData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground truncate max-w-[100px]">{item.name.split(" ")[0]}</span>
                      </div>
                      <span className="text-foreground font-medium tabular-nums">
                        {totalWallet > 0 ? Math.round((item.value / totalWallet) * 100) : 0}٪
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="lg:col-span-2 grid grid-cols-2 gap-4 content-start">
                {[
                  { label: "کل موجودی تیم", value: formatPrice(totalWallet, true), icon: Wallet, color: "text-primary" },
                  { label: "بیشترین موجودی", value: formatPrice(Math.max(...members.map(u => u.walletBalance), 0), true), icon: Award, color: "text-amber-400" },
                  { label: "اعضای فعال", value: `${members.filter(u => u.isActive).length} نفر`, icon: UsersRound, color: "text-emerald-400" },
                  { label: "اعضای غیرفعال", value: `${members.filter(u => !u.isActive).length} نفر`, icon: Clock, color: "text-blue-400" },
                ].map((stat, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-card border border-border">
                    <div className="flex items-center gap-2 mb-2"><stat.icon className={`w-4 h-4 ${stat.color}`} /><span className="text-xs text-muted-foreground">{stat.label}</span></div>
                    <p className="text-xl font-bold text-foreground tabular-nums">{stat.value}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Member cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {members.map((member, i) => {
                const roleDef = roles.find((r) => r.id === member.role);
                const projects = projectCounts[member.id] ?? 0;
                const sharePercent = totalWallet > 0 ? Math.round((member.walletBalance / totalWallet) * 100) : 0;
                const memberColor = MEMBER_COLORS[i % MEMBER_COLORS.length];

                return (
                  <motion.div key={member.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }} whileHover={{ y: -3 }}
                    className={cn("p-5 rounded-2xl bg-card border hover:border-primary/30 hover:shadow-lg transition-all group relative",
                      member.isActive ? "border-border" : "border-border/50 opacity-70")}>
                    {/* Edit/Delete */}
                    <div className="absolute top-3 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditMember(member)} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => setDeleteMember(member)} className="p-1.5 rounded-lg bg-muted hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                    </div>

                    {/* Avatar */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
                        style={{ backgroundColor: memberColor }}>
                        {member.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground text-sm truncate">{member.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: `${roleDef?.color ?? "#888"}20`, color: roleDef?.color ?? "#888" }}>
                          {roleDef?.icon} {roleDef?.name ?? member.role}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2.5 mb-4">
                      <div className="flex justify-between"><span className="text-xs text-muted-foreground flex items-center gap-1"><Wallet className="w-3 h-3" />کیف پول</span><span className="text-xs font-bold text-primary tabular-nums">{formatPrice(member.walletBalance, true)}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-muted-foreground">سهم از کل</span><span className="text-xs font-medium">{sharePercent}٪</span></div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${sharePercent}%` }} transition={{ delay: i * 0.05 + 0.3, duration: 0.6 }}
                          className="h-full rounded-full" style={{ backgroundColor: memberColor }} />
                      </div>
                      <div className="flex justify-between"><span className="text-xs text-muted-foreground">ایمیل</span><span className="text-xs text-muted-foreground truncate max-w-[130px]">{member.email}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-muted-foreground">پروژه‌ها</span><span className="text-xs text-foreground">{projects}</span></div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${member.isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
                        <span className="text-xs text-muted-foreground">{member.isActive ? "فعال" : "غیرفعال"}</span>
                      </div>
                      <button onClick={() => setPayoutUser(member)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors">
                        <Wallet className="w-3 h-3" />برداشت<ChevronLeft className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div key="roles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RolesTab members={members} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {payoutUser && <PayoutModal user={payoutUser} onClose={() => setPayoutUser(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showAddModal && <MemberModal roles={roles} onClose={() => setShowAddModal(false)} onSave={handleSaveMember} />}
      </AnimatePresence>
      <AnimatePresence>
        {editMember && <MemberModal member={editMember} roles={roles} onClose={() => setEditMember(null)} onSave={handleSaveMember} />}
      </AnimatePresence>
      <AnimatePresence>
        {deleteMember && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeleteMember(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4"><Trash2 className="w-5 h-5 text-red-400" /></div>
              <h3 className="font-bold text-foreground mb-2">حذف عضو</h3>
              <p className="text-sm text-muted-foreground mb-6">آیا از حذف <span className="font-semibold text-foreground">{deleteMember.name}</span> مطمئن هستید؟</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteMember(null)} className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm">انصراف</button>
                <button onClick={() => { setMembers((p) => p.filter((m) => m.id !== deleteMember.id)); setDeleteMember(null); toast.success("عضو حذف شد"); }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm">حذف</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
