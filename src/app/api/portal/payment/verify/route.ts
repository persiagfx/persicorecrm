import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/auth";

const MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID ?? "";
const SANDBOX = process.env.ZARINPAL_SANDBOX === "true";
const ZP_VERIFY = SANDBOX
  ? "https://sandbox.zarinpal.com/pg/v4/payment/verify.json"
  : "https://api.zarinpal.com/pg/v4/payment/verify.json";

export async function POST(req: NextRequest) {
  try {
    const { authority, status, invoiceId } = await req.json();

    if (status === "NOK") {
      return badRequest("پرداخت لغو شد");
    }

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return badRequest("فاکتور یافت نشد");
    if (invoice.status === "paid") {
      // پرداخت تکراری — موفق برگردان
      return ok({ status: "already_paid", refId: null });
    }

    const zpResponse = await fetch(ZP_VERIFY, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        merchant_id: MERCHANT_ID,
        amount: invoice.total,
        currency: "IRT",
        authority,
      }),
    });

    const zpData = await zpResponse.json();
    const code = zpData.data?.code;

    if (code === 100 || code === 101) {
      const refId = zpData.data?.ref_id ?? "";

      await Promise.all([
        prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: "paid", paidAt: new Date() },
        }),
        prisma.portalPayment.create({
          data: {
            clientId: invoice.clientId,
            invoiceId,
            amount: invoice.total,
            method: "zarinpal",
            status: "paid",
            authority,
            trackingCode: String(refId),
            paidAt: new Date(),
          },
        }),
      ]);

      return ok({ status: "success", refId: String(refId) });
    } else {
      return badRequest(`تأیید پرداخت ناموفق (کد: ${code})`);
    }
  } catch (e) {
    return serverError(e);
  }
}
