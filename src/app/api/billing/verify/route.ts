import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, badRequest, unauthorized, serverError } from "@/lib/auth";

const MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID ?? "";
const SANDBOX = process.env.ZARINPAL_SANDBOX === "true";
const ZP_VERIFY = SANDBOX
  ? "https://sandbox.zarinpal.com/pg/v4/payment/verify.json"
  : "https://api.zarinpal.com/pg/v4/payment/verify.json";

const PLAN_PRICES: Record<string, number> = {
  starter: 490000,
  professional: 990000,
  business: 1990000,
};

const PLAN_DURATION_DAYS = 30;

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (!payload.tenantId) return badRequest("workspace شناسایی نشد");

    const { authority, plan } = await req.json();
    if (!authority || !plan || !PLAN_PRICES[plan]) return badRequest("پارامترهای ناقص");

    const amount = PLAN_PRICES[plan];

    const zpResponse = await fetch(ZP_VERIFY, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ merchant_id: MERCHANT_ID, amount, authority }),
    });

    const zpData = await zpResponse.json();

    if (zpData.data?.code !== 100 && zpData.data?.code !== 101) {
      return badRequest(`پرداخت تأیید نشد: ${zpData.errors?.message ?? "خطای ناشناخته"}`);
    }

    const refId = String(zpData.data.ref_id);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + PLAN_DURATION_DAYS);

    await prisma.tenant.update({
      where: { id: payload.tenantId },
      data: { plan, status: "active", trialEndsAt: expiresAt },
    });

    // Record the payment
    try {
      await (prisma as any).tenantPayment.create({
        data: {
          tenantId: payload.tenantId,
          plan,
          amount,
          status: "confirmed",
          refId,
          authority,
          confirmedAt: new Date(),
          expiresAt,
        },
      });
    } catch {
      // TenantPayment may have different schema
    }

    return ok({ success: true, refId, plan, expiresAt });
  } catch (e) {
    return serverError(e);
  }
}
