import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, badRequest, unauthorized, serverError } from "@/lib/auth";

const MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID ?? "";
const SANDBOX = process.env.ZARINPAL_SANDBOX === "true";
const ZP_API = SANDBOX
  ? "https://sandbox.zarinpal.com/pg/v4/payment/request.json"
  : "https://api.zarinpal.com/pg/v4/payment/request.json";

const PLAN_PRICES: Record<string, number> = {
  starter: 490000,
  professional: 990000,
  business: 1990000,
};

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (!payload.tenantId) return badRequest("workspace شما شناسایی نشد");

    const { plan } = await req.json();
    if (!plan || !PLAN_PRICES[plan]) return badRequest("پلن نامعتبر است");

    if (!MERCHANT_ID || MERCHANT_ID.includes("xxxx")) {
      return badRequest("درگاه پرداخت هنوز تنظیم نشده است. لطفاً ZARINPAL_MERCHANT_ID را تنظیم کنید.");
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: payload.tenantId },
      select: { name: true, ownerEmail: true },
    });
    if (!tenant) return badRequest("workspace یافت نشد");

    const amount = PLAN_PRICES[plan];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const callbackUrl = `${appUrl}/billing/callback?plan=${plan}&tenantId=${payload.tenantId}`;

    const zpResponse = await fetch(ZP_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        merchant_id: MERCHANT_ID,
        amount,
        currency: "IRT",
        description: `خرید پلن ${plan} برای ${tenant.name}`,
        email: tenant.ownerEmail,
        callback_url: callbackUrl,
        metadata: { order_id: `${payload.tenantId}-${plan}-${Date.now()}` },
      }),
    });

    const zpData = await zpResponse.json();

    if (zpData.data?.code !== 100) {
      console.error("[billing/pay] ZarinPal error:", zpData);
      return badRequest(`خطای درگاه: ${zpData.errors?.message ?? "خطای ناشناخته"}`);
    }

    const authority = zpData.data.authority;
    const startPayUrl = SANDBOX
      ? `https://sandbox.zarinpal.com/pg/StartPay/${authority}`
      : `https://www.zarinpal.com/pg/StartPay/${authority}`;

    return ok({ authority, startPayUrl, plan, amount });
  } catch (e) {
    return serverError(e);
  }
}
