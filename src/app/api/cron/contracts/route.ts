import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { sendContractSms, normalizePhone, isValidPhone } from "@/lib/sms";
import { sendContractSigningEmail } from "@/lib/email";
import { ok, serverError } from "@/lib/auth";

// این endpoint باید هر ساعت یه بار از یه cron job خارجی صدا زده بشه
// مثال: curl -H "x-cron-secret: YOUR_SECRET" https://yourdomain.com/api/cron/contracts
// در لینوکس: 0 * * * * curl -H "x-cron-secret: SECRET" https://yourdomain.com/api/cron/contracts

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // ۱. قراردادهای منقضی‌شده را به expired تغییر بده
    const expired = await prisma.contract.updateMany({
      where: {
        status: { in: ["sent", "admin_signed"] },
        expiresAt: { lt: now },
      },
      data: { status: "expired" },
    });

    // ۲. قراردادهایی که ظرف ۳ روز منقضی می‌شن و reminder نخوردن
    const expiringSoon = await prisma.contract.findMany({
      where: {
        status: { in: ["sent", "admin_signed"] },
        expiresAt: { gte: now, lte: in3Days },
        signToken: { not: null },
      },
      include: {
        client: { select: { contactEmail: true, contactPhone: true, contactName: true, companyName: true } },
      },
    });

    let reminders = 0;
    for (const contract of expiringSoon) {
      const signLink = `${appUrl}/sign/${contract.signToken}`;
      const clientName = contract.client?.contactName ?? contract.client?.companyName ?? "مشتری";

      // ارسال SMS
      if (contract.client?.contactPhone) {
        const phone = normalizePhone(contract.client.contactPhone);
        if (isValidPhone(phone)) {
          await sendContractSms(phone, clientName).catch(() => null);
        }
      }

      // ارسال ایمیل
      if (contract.client?.contactEmail) {
        await sendContractSigningEmail({
          to: contract.client.contactEmail,
          clientName,
          contractTitle: contract.title,
          signLink,
          expiresAt: contract.expiresAt,
        }).catch(() => null);
      }

      reminders++;
    }

    return ok({
      expiredCount: expired.count,
      remindersCount: reminders,
      processedAt: now.toISOString(),
    });
  } catch (e) {
    return serverError(e);
  }
}

// GET برای تست دستی (بدون secret)
export async function GET(_req: NextRequest) {
  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const [expiredCount, remindersCount] = await Promise.all([
    prisma.contract.count({
      where: { status: { in: ["sent", "admin_signed"] }, expiresAt: { lt: now } },
    }),
    prisma.contract.count({
      where: { status: { in: ["sent", "admin_signed"] }, expiresAt: { gte: now, lte: in3Days } },
    }),
  ]).catch(() => [0, 0]);

  return ok({
    pendingExpiry: expiredCount,
    pendingReminders: remindersCount,
    note: "برای اجرا، یک POST با هدر x-cron-secret ارسال کنید",
  });
}
