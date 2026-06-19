import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError, tenantFilter } from "@/lib/auth";

const INTERNAL_SECRET = process.env.RECURRING_SECRET ?? "";

// این endpoint فاکتورهای تکرارشونده‌ای که موعدشان رسیده را می‌سازد
// باید روزانه صدا زده شود (cron یا هنگام load invoices page)
// دسترسی: admin/accountant یا هدر x-internal-secret معتبر
export async function POST(req: NextRequest) {
  try {
    const internalSecret = req.headers.get("x-internal-secret");
    const isInternalCall = INTERNAL_SECRET && internalSecret === INTERNAL_SECRET;

    let tenantId: string | null = null;

    if (!isInternalCall) {
      const payload = requireAuth(req);
      if (!payload) return unauthorized();
      if (!["admin", "accountant"].includes(payload.role))
        return Response.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
      tenantId = payload.tenantId ?? null;
    }

    const now = new Date();

    // فاکتورهای تکرارشونده‌ای که nextInvoiceDate گذشته یا امروز است
    const dueRecurring = await prisma.invoice.findMany({
      where: {
        isRecurring: true,
        status: "paid",
        nextInvoiceDate: { lte: now },
        ...(tenantId ? { tenantId } : {}),
      },
      include: { client: { select: { id: true, companyName: true } } },
    });

    const generated: string[] = [];

    for (const inv of dueRecurring) {
      // محاسبه تاریخ فاکتور بعدی
      const nextDate = new Date(inv.nextInvoiceDate!);
      let newNextDate: Date;

      if (inv.recurringInterval === "monthly") {
        newNextDate = new Date(nextDate);
        newNextDate.setMonth(newNextDate.getMonth() + 1);
      } else if (inv.recurringInterval === "quarterly") {
        newNextDate = new Date(nextDate);
        newNextDate.setMonth(newNextDate.getMonth() + 3);
      } else if (inv.recurringInterval === "yearly") {
        newNextDate = new Date(nextDate);
        newNextDate.setFullYear(newNextDate.getFullYear() + 1);
      } else {
        newNextDate = new Date(nextDate);
        newNextDate.setMonth(newNextDate.getMonth() + 1);
      }

      // شماره فاکتور جدید
      const count = await prisma.invoice.count();
      const invoiceNumber = `INV-${String(count + 1).padStart(4, "0")}`;

      const dueDate = new Date(nextDate);
      dueDate.setDate(dueDate.getDate() + 30);

      // ایجاد فاکتور جدید
      const newInvoice = await prisma.invoice.create({
        data: {
          tenantId: inv.tenantId ?? null,
          invoiceNumber,
          type: inv.type,
          clientId: inv.clientId,
          projectId: inv.projectId,
          items: inv.items as object,
          subtotal: inv.subtotal,
          taxRate: inv.taxRate,
          taxAmount: inv.taxAmount,
          discount: inv.discount,
          total: inv.total,
          status: "draft",
          issuedAt: now,
          dueDate,
          notes: inv.notes,
          isRecurring: true,
          recurringInterval: inv.recurringInterval,
          nextInvoiceDate: newNextDate,
        },
      });

      // به‌روز کردن nextInvoiceDate فاکتور اصلی
      await prisma.invoice.update({
        where: { id: inv.id },
        data: { nextInvoiceDate: newNextDate },
      });

      // notification برای مسئول مالی
      const admins = await prisma.user.findMany({
        where: { role: { in: ["admin", "accountant"] }, isActive: true },
        select: { id: true },
      });
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: "invoice_generated",
            title: "فاکتور تکرارشونده ایجاد شد",
            body: `فاکتور ${newInvoice.invoiceNumber} برای ${inv.client.companyName} به‌صورت خودکار ایجاد شد`,
            entityId: newInvoice.id,
            entityType: "invoice",
          },
        });
      }

      generated.push(newInvoice.invoiceNumber);
    }

    return ok({ generated, count: generated.length });
  } catch (e) {
    return serverError(e);
  }
}
