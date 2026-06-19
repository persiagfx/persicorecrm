import { z } from "zod";

// Auth
export const loginSchema = z.object({
  email: z.string().email("ایمیل نامعتبر است"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
});

// Lead (API)
export const leadSchema = z.object({
  companyName: z.string().min(1, "نام شرکت الزامی است").max(200),
  contactName: z.string().min(1, "نام مخاطب الزامی است").max(200),
  contactPhone: z.string().min(1, "شماره تماس الزامی است").max(20),
  contactEmail: z.string().email("ایمیل نامعتبر است").optional().or(z.literal("")).optional(),
  status: z.enum(["new", "contacted", "meeting", "proposal", "negotiation", "won", "lost"]).optional(),
  columnId: z.string().optional(),
  estimatedValue: z.number().min(0).optional(),
  conversionProbability: z.number().min(0).max(100).optional(),
  assigneeId: z.string().optional(),
  source: z.string().max(100).optional(),
  notes: z.string().max(5000).optional(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Client
export const clientSchema = z.object({
  companyName: z.string().min(2, "نام شرکت الزامی است"),
  contactName: z.string().min(2, "نام مسئول الزامی است"),
  contactPhone: z.string().min(10, "شماره تلفن نامعتبر است"),
  contactEmail: z.string().email("ایمیل نامعتبر است").optional().or(z.literal("")),
  website: z.string().url("آدرس وب‌سایت نامعتبر است").optional().or(z.literal("")),
  industry: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["active", "inactive", "at_risk", "vip"]).optional(),
  tags: z.array(z.string()).optional(),
  anniversaryDate: z.string().optional(),
  notes: z.string().optional(),
});

// Task
export const taskSchema = z.object({
  title: z.string().min(2, "عنوان الزامی است"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["backlog", "todo", "in_progress", "review", "done"]),
  projectId: z.string(),
  assigneeIds: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
});

// Invoice
export const invoiceSchema = z.object({
  clientId: z.string().min(1, "انتخاب مشتری الزامی است"),
  projectId: z.string().optional(),
  type: z.enum(["invoice", "quote"]).optional(),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
  items: z.array(z.object({
    description: z.string().min(1, "توضیح آیتم الزامی است"),
    quantity: z.number().min(1, "تعداد باید حداقل ۱ باشد"),
    unitPrice: z.number().min(0, "قیمت واحد نمی‌تواند منفی باشد"),
  })).min(1, "حداقل یک آیتم الزامی است"),
  taxRate: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).optional(),
  notes: z.string().max(5000).optional(),
  dueDate: z.string().min(1, "تاریخ سررسید الزامی است"),
  isRecurring: z.boolean().optional(),
  recurringInterval: z.string().optional(),
  installments: z.array(z.object({
    amount: z.number().min(0),
    dueDate: z.string(),
  })).optional(),
});

// Expense
export const expenseSchema = z.object({
  title: z.string().min(2, "عنوان الزامی است"),
  amount: z.number().min(1000, "مبلغ باید بیشتر از ۱۰۰۰ تومان باشد"),
  category: z.enum(["rent", "internet", "tools", "ads", "salary", "other"]),
  date: z.string(),
  receipt: z.string().optional(),
  notes: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type LeadInput = z.infer<typeof leadSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
