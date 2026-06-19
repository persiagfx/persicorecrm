import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import prisma from "@/lib/db";
import { requireAuth, ok, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null; // "leads" | "clients"

    if (!file) return badRequest("فایل الزامی است");
    if (!type || !["leads", "clients"].includes(type)) return badRequest("نوع import نامعتبر است");
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) return badRequest("فقط فایل‌های Excel و CSV مجاز هستند");

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as Record<string, string>[];

    if (rows.length === 0) return badRequest("فایل خالی است");
    if (rows.length > 500) return badRequest("حداکثر ۵۰۰ ردیف در هر بار مجاز است");

    let created = 0;
    const errors: string[] = [];

    if (type === "leads") {
      for (const [i, row] of rows.entries()) {
        const companyName = String(row["نام شرکت"] ?? row["companyName"] ?? "").trim();
        const contactName = String(row["نام مخاطب"] ?? row["contactName"] ?? "").trim();
        const contactPhone = String(row["تلفن"] ?? row["phone"] ?? row["contactPhone"] ?? "").trim();

        if (!companyName || !contactName || !contactPhone) {
          errors.push(`ردیف ${i + 2}: نام شرکت، نام مخاطب و تلفن الزامی است`);
          continue;
        }

        await prisma.lead.create({
          data: {
            tenantId: payload.tenantId ?? undefined,
            companyName,
            contactName,
            contactPhone,
            contactEmail: String(row["ایمیل"] ?? row["email"] ?? "").trim() || undefined,
            estimatedValue: Number(row["ارزش تخمینی"] ?? row["estimatedValue"] ?? 0) || 0,
            status: "new",
            columnId: "new",
            source: String(row["منبع"] ?? row["source"] ?? "import").trim(),
          },
        });
        created++;
      }
    } else if (type === "clients") {
      for (const [i, row] of rows.entries()) {
        const companyName = String(row["نام شرکت"] ?? row["companyName"] ?? "").trim();
        const contactName = String(row["نام مخاطب"] ?? row["contactName"] ?? "").trim();
        const contactPhone = String(row["تلفن"] ?? row["phone"] ?? row["contactPhone"] ?? "").trim();

        if (!companyName || !contactName || !contactPhone) {
          errors.push(`ردیف ${i + 2}: نام شرکت، نام مخاطب و تلفن الزامی است`);
          continue;
        }

        await prisma.client.create({
          data: {
            tenantId: payload.tenantId ?? undefined,
            companyName,
            contactName,
            contactPhone,
            contactEmail: String(row["ایمیل"] ?? row["email"] ?? "").trim() || undefined,
            address: String(row["آدرس"] ?? row["address"] ?? "").trim() || undefined,
            website: String(row["وبسایت"] ?? row["website"] ?? "").trim() || undefined,
            status: "active",
          },
        });
        created++;
      }
    }

    await prisma.activityLog.create({
      data: {
        tenantId: payload.tenantId ?? undefined,
        actorId: payload.userId,
        action: "import",
        entityType: type,
        entityId: "bulk",
        entityName: `Import ${type}`,
        description: `${created} ${type === "leads" ? "لید" : "مشتری"} از Excel وارد شد`,
      },
    });

    return ok({ created, errors, total: rows.length });
  } catch (e) {
    return serverError(e);
  }
}
