import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, badRequest, unauthorized, serverError, verifyToken, getTokenFromRequest } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({ plan: z.enum(["PRO", "PLUS"]) });

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload?.isContentUser) return unauthorized();

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("پلن نامعتبر است");

    const { plan } = parsed.data;

    const settings = await prisma.contentSettings.findFirst({ where: { id: "global" } });
    const prices = { PRO: settings?.proPlanPrice ?? 0, PLUS: settings?.plusPlanPrice ?? 0 };
    const amount = prices[plan];
    if (amount <= 0) return badRequest("قیمت پلن تنظیم نشده است");

    const contentUrl = process.env.NEXT_PUBLIC_CONTENT_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
    const callbackUrl = `${contentUrl}/content/billing/callback?plan=${plan}`;

    const merchantId = process.env.ZARINPAL_MERCHANT_ID ?? "";
    const isSandbox = process.env.ZARINPAL_SANDBOX === "true";
    const zarinpalBase = isSandbox
      ? "https://sandbox.zarinpal.com/pg/v4/payment"
      : "https://api.zarinpal.com/pg/v4/payment";

    const zpRes = await fetch(`${zarinpalBase}/request.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: merchantId,
        amount: amount * 10,
        description: `اشتراک پلن ${plan} - تولید محتوا`,
        callback_url: callbackUrl,
      }),
    });
    const zpData = await zpRes.json();
    if (zpData?.data?.code !== 100) return badRequest("خطا در اتصال به درگاه پرداخت");

    const authority = zpData.data.authority;
    const startPayUrl = isSandbox
      ? `https://sandbox.zarinpal.com/pg/StartPay/${authority}`
      : `https://www.zarinpal.com/pg/StartPay/${authority}`;

    // Store pending subscription
    await prisma.contentSubscription.upsert({
      where: { userId: payload.userId },
      create: {
        userId: payload.userId,
        plan,
        status: "pending",
        expiresAt: new Date(),
        authority,
        amount,
      },
      update: { plan, status: "pending", authority, amount },
    });

    return ok({ startPayUrl });
  } catch (e) {
    return serverError(e);
  }
}
