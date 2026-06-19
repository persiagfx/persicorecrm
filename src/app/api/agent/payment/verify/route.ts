import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/auth";
import { z } from "zod";

const MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID ?? "";
const SANDBOX = process.env.ZARINPAL_SANDBOX === "true";
const ZP_VERIFY = SANDBOX
  ? "https://sandbox.zarinpal.com/pg/v4/payment/verify.json"
  : "https://api.zarinpal.com/pg/v4/payment/verify.json";

const schema = z.object({
  authority: z.string(),
  status: z.string(),
  userId: z.string(),
  plan: z.enum(["STARTER", "PRO", "ENTERPRISE"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("پارامترهای نامعتبر");

    const { authority, status, userId, plan } = parsed.data;

    if (status === "NOK") return badRequest("پرداخت لغو شد");

    const sub = await prisma.agentSubscription.findUnique({ where: { userId } });
    if (!sub) return badRequest("اشتراک یافت نشد");

    if (sub.status === "active" && sub.zarinpalRefId) {
      return ok({ status: "already_paid", refId: sub.zarinpalRefId });
    }

    const zpRes = await fetch(ZP_VERIFY, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        merchant_id: MERCHANT_ID,
        amount: sub.amount,
        currency: "IRT",
        authority,
      }),
    });

    const zpData = await zpRes.json();
    const code = zpData.data?.code;

    if (code === 100 || code === 101) {
      const refId = String(zpData.data?.ref_id ?? "");
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await Promise.all([
        prisma.agentSubscription.update({
          where: { userId },
          data: { status: "active", zarinpalRefId: refId, expiresAt },
        }),
        prisma.agentUser.update({
          where: { id: userId },
          data: { plan: plan as any },
        }),
      ]);

      return ok({ status: "success", refId, plan });
    }

    return badRequest(`تأیید پرداخت ناموفق (کد: ${code})`);
  } catch (e) {
    return serverError(e);
  }
}
