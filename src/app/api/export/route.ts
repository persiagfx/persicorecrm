import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, unauthorized, serverError, tenantFilter } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const type = new URL(req.url).searchParams.get("type") ?? "clients";

    let workbook: XLSX.WorkBook;

    if (type === "clients") {
      const clients = await prisma.client.findMany({
        where: tenantFilter(payload),
        orderBy: { createdAt: "desc" },
        select: {
          companyName: true,
          contactName: true,
          contactPhone: true,
          contactEmail: true,
          status: true,
          totalRevenue: true,
          projectCount: true,
          address: true,
          website: true,
          createdAt: true,
          lastInteractionAt: true,
        },
      });

      const rows = clients.map((c) => ({
        "نام شرکت": c.companyName,
        "نام مخاطب": c.contactName,
        "تلفن": c.contactPhone,
        "ایمیل": c.contactEmail ?? "",
        "وضعیت": c.status,
        "کل درآمد (تومان)": c.totalRevenue,
        "تعداد پروژه": c.projectCount,
        "آدرس": c.address ?? "",
        "وبسایت": c.website ?? "",
        "تاریخ ثبت": c.createdAt.toISOString().slice(0, 10),
        "آخرین تعامل": c.lastInteractionAt?.toISOString().slice(0, 10) ?? "",
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, ws, "مشتریان");

    } else if (type === "invoices") {
      const invoices = await prisma.invoice.findMany({
        where: tenantFilter(payload),
        orderBy: { issuedAt: "desc" },
        include: { client: { select: { companyName: true } } },
      });

      const rows = invoices.map((inv) => ({
        "شماره فاکتور": inv.invoiceNumber,
        "مشتری": inv.client?.companyName ?? "",
        "مبلغ کل (تومان)": inv.total,
        "وضعیت": inv.status,
        "تاریخ صدور": inv.issuedAt.toISOString().slice(0, 10),
        "سررسید": inv.dueDate.toISOString().slice(0, 10),
        "تاریخ پرداخت": inv.paidAt?.toISOString().slice(0, 10) ?? "",
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, ws, "فاکتورها");

    } else if (type === "leads") {
      const leads = await prisma.lead.findMany({
        where: tenantFilter(payload),
        orderBy: { createdAt: "desc" },
        include: { assignee: { select: { name: true } } },
      });

      const rows = leads.map((l) => ({
        "نام شرکت": l.companyName,
        "مخاطب": l.contactName,
        "تلفن": l.contactPhone,
        "ایمیل": l.contactEmail ?? "",
        "ارزش تخمینی (تومان)": l.estimatedValue,
        "احتمال تبدیل (٪)": l.conversionProbability,
        "وضعیت": l.status,
        "مسئول": l.assignee?.name ?? "",
        "تاریخ ایجاد": l.createdAt.toISOString().slice(0, 10),
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, ws, "لیدها");

    } else {
      return NextResponse.json({ error: "نوع نامعتبر" }, { status: 400 });
    }

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${type}-export.xlsx"`,
      },
    });
  } catch (e) {
    return serverError(e);
  }
}
