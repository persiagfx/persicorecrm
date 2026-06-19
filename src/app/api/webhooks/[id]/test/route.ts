import { NextRequest } from "next/server";
import { createHmac } from "crypto";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const webhook = await prisma.webhook.findFirst({
      where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) },
    });
    if (!webhook) return notFound("Webhook");

    const testPayload = JSON.stringify({
      event: "test",
      data: { message: "This is a test webhook delivery from PersicoCRM" },
      timestamp: new Date().toISOString(),
    });

    const secret = (webhook.secret as string | null) ?? "";
    const signature = createHmac("sha256", secret).update(testPayload).digest("hex");

    let success = false;
    let statusCode = 0;
    let response = "";

    try {
      const res = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": `sha256=${signature}`,
        },
        body: testPayload,
        signal: AbortSignal.timeout(10_000),
      });
      statusCode = res.status;
      response = await res.text().catch(() => "");
      success = res.ok;
    } catch (fetchErr) {
      statusCode = 0;
      response = fetchErr instanceof Error ? fetchErr.message : "Connection failed";
      success = false;
    }

    return ok({ success, statusCode, response });
  } catch (e) {
    return serverError(e);
  }
}
