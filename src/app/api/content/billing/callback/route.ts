import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  Authority: z.string(),
  Status: z.string(),
  plan: z.enum(["PRO", "PLUS"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("اطلاعات نامعتبر");

    const { Authority, Status, plan } = parsed.data;

    if (Status !== "OK") {
      await prisma.contentSubscription.updateMany({
        where: { authority: Authority },
        data: { status: "failed" },
      });
      return ok({ success: false, message: "پرداخت لغو شد" });
    }

    const sub = await prisma.contentSubscription.findFirst({ where: { authority: Authority } });
    if (!sub) return badRequest("تراکنش یافت نشد");

    const isSandbox = process.env.ZARINPAL_SANDBOX === "true";
    const zarinpalBase = isSandbox
      ? "https://sandbox.zarinpal.com/pg/v4/payment"
      : "https://api.zarinpal.com/pg/v4/payment";

    const zpRes = await fetch(`${zarinpalBase}/verify.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: process.env.ZARINPAL_MERCHANT_ID,
        amount: sub.amount * 10,
        authority: Authority,
      }),
    });
    const zpData = await zpRes.json();

    if (![100, 101].includes(zpData?.data?.code)) {
      await prisma.contentSubscription.update({ where: { id: sub.id }, data: { status: "failed" } });
      return ok({ success: false, message: "تایید پرداخت ناموفق بود" });
    }

    const refId = String(zpData.data.ref_id);
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await prisma.contentSubscription.update({
      where: { id: sub.id },
      data: { status: "active", zarinpalRefId: refId, expiresAt, plan },
    });

    await prisma.contentUser.update({
      where: { id: sub.userId },
      data: { plan, usedThisMonth: 0, monthResetAt: new Date() },
    });

    return ok({ success: true, refId, plan });
  } catch (e) {
    return serverError(e);
  }
}
