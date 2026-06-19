import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, badRequest, unauthorized, serverError } from "@/lib/auth";
import { requireAgentAuth } from "@/lib/agent-auth";
import { z } from "zod";

const MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID ?? "";
const SANDBOX = process.env.ZARINPAL_SANDBOX === "true";
const ZP_API = SANDBOX
  ? "https://sandbox.zarinpal.com/pg/v4/payment/request.json"
  : "https://api.zarinpal.com/pg/v4/payment/request.json";

const PLAN_KEYS = ["STARTER", "PRO", "ENTERPRISE"] as const;
type PaidPlan = (typeof PLAN_KEYS)[number];

const schema = z.object({ plan: z.enum(PLAN_KEYS) });

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAgentAuth(req);
    if (!auth) return unauthorized();

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("پلن نامعتبر است");

    const { plan } = parsed.data;

    // Get price from settings
    const settings = await prisma.agentSettings.upsert({
      where: { id: "global" },
      create: { id: "global" },
      update: {},
    });

    const PRICE_MAP: Record<PaidPlan, number> = {
      STARTER: settings.starterPlanPrice,
      PRO: settings.proPlanPrice,
      ENTERPRISE: settings.enterprisePlanPrice,
    };
    const amount = PRICE_MAP[plan];
    if (!amount || amount < 1000) return badRequest("قیمت این پلن هنوز تنظیم نشده است");

    if (!MERCHANT_ID || MERCHANT_ID.includes("xxxx")) return badRequest("درگاه پرداخت هنوز تنظیم نشده است");

    const user = await prisma.agentUser.findUnique({ where: { id: auth.userId } });
    if (!user) return unauthorized();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const callbackUrl = `${baseUrl}/agent/payment/callback?plan=${plan}&userId=${auth.userId}`;

    const zpRes = await fetch(ZP_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        merchant_id: MERCHANT_ID,
        amount,
        currency: "IRT",
        description: `ارتقای پلن ${plan} — Persicore Agent`,
        email: user.email ?? "",
        mobile: user.phone ?? "",
        callback_url: callbackUrl,
        metadata: { order_id: `agent-${auth.userId}-${plan}` },
      }),
    });

    const zpData = await zpRes.json();
    if (zpData.data?.code !== 100) {
      return badRequest(`خطای درگاه: ${zpData.errors?.message ?? "خطای ناشناخته"}`);
    }

    const authority = zpData.data.authority;
    const startPayUrl = SANDBOX
      ? `https://sandbox.zarinpal.com/pg/StartPay/${authority}`
      : `https://www.zarinpal.com/pg/StartPay/${authority}`;

    // Save pending subscription
    await prisma.agentSubscription.upsert({
      where: { userId: auth.userId },
      create: {
        userId: auth.userId,
        plan: plan as any,
        status: "pending",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        authority,
        amount,
      },
      update: { plan: plan as any, status: "pending", authority, amount },
    });

    return ok({ authority, startPayUrl, amount, plan });
  } catch (e) {
    return serverError(e);
  }
}
