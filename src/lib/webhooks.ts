import { createHmac } from "crypto";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";

export function triggerWebhook(tenantId: string, event: string, payload: object): void {
  (async () => {
    try {
      const webhooks = await prisma.webhook.findMany({
        where: { tenantId, isActive: true },
      });

      const matching = webhooks.filter((wh) => {
        const events = wh.events as string[];
        return Array.isArray(events) && events.includes(event);
      });

      for (const wh of matching) {
        const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
        const secret = (wh.secret as string | null) ?? "";
        const signature = createHmac("sha256", secret).update(body).digest("hex");

        let statusCode = 0;
        let responseText = "";
        let deliveredAt: Date | null = null;

        try {
          const res = await fetch(wh.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Webhook-Signature": `sha256=${signature}`,
            },
            body,
            signal: AbortSignal.timeout(10_000),
          });
          statusCode = res.status;
          responseText = await res.text().catch(() => "");
          deliveredAt = new Date();
        } catch (fetchErr) {
          statusCode = 0;
          responseText = fetchErr instanceof Error ? fetchErr.message : "Unknown error";
        }

        await prisma.webhookDelivery.create({
          data: {
            webhookId: wh.id,
            event,
            payload: body,
            statusCode,
            response: responseText,
            attempts: 1,
            deliveredAt,
          },
        }).catch((err) => logger.error("[webhook] failed to record delivery:", err));
      }
    } catch (err) {
      logger.error("[webhook] triggerWebhook failed:", err);
    }
  })();
}
