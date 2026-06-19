import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requirePortalAuth } from "@/lib/portal-auth";
import { ok, badRequest, unauthorized, serverError, notFound } from "@/lib/auth";

const MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID ?? "";
const SANDBOX = process.env.ZARINPAL_SANDBOX === "true";

if (!MERCHANT_ID || MERCHANT_ID.includes("xxxx")) {
  console.warn("[ZarinPal] ZARINPAL_MERCHANT_ID is not configured properly.");
}
const ZP_API = SANDBOX
  ? "https://sandbox.zarinpal.com/pg/v4/payment/request.json"
  : "https://api.zarinpal.com/pg/v4/payment/request.json";

export async function POST(req: NextRequest) {
  try {
    const payload = requirePortalAuth(req);
    if (!payload) return unauthorized();

    const { invoiceId } = await req.json();
    if (!invoiceId) return badRequest("invoiceId الزامی است");

    // بررسی وجود و مالکیت فاکتور
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, clientId: payload.clientId },
      include: { client: { select: { companyName: true, contactEmail: true } } },
    });

    if (!invoice) return notFound("فاکتور");
    if (invoice.status === "paid") return badRequest("این فاکتور قبلاً پرداخت شده است");

    // مبلغ به تومان (تبدیل از ریال/تومان ذخیره‌شده)
    const amountToman = invoice.total; // فرض: ذخیره به تومان

    if (amountToman < 1000) return badRequest("مبلغ حداقل ۱۰۰۰ تومان باید باشد");
    if (!MERCHANT_ID || MERCHANT_ID.includes("xxxx")) return badRequest("درگاه پرداخت هنوز تنظیم نشده است");

    const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const callbackUrl = `${portalUrl}/portal/payment/callback?invoiceId=${invoiceId}`;

    const zpResponse = await fetch(ZP_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        merchant_id: MERCHANT_ID,
        amount: amountToman,
        currency: "IRT",
        description: `پرداخت فاکتور ${invoice.invoiceNumber}`,
        email: invoice.client.contactEmail ?? "",
        callback_url: callbackUrl,
        metadata: { order_id: invoice.invoiceNumber },
      }),
    });

    const zpData = await zpResponse.json();

    if (zpData.data?.code !== 100) {
      console.error("ZarinPal error:", zpData);
      return badRequest(`خطای درگاه پرداخت: ${zpData.errors?.message ?? "خطای ناشناخته"}`);
    }

    const authority = zpData.data.authority;
    const startPayUrl = SANDBOX
      ? `https://sandbox.zarinpal.com/pg/StartPay/${authority}`
      : `https://www.zarinpal.com/pg/StartPay/${authority}`;

    return ok({ authority, startPayUrl });
  } catch (e) {
    return serverError(e);
  }
}
