import prisma from "@/lib/db";

// VAPID configuration — set these environment variables:
// VAPID_PUBLIC_KEY=<your base64url public key>
// VAPID_PRIVATE_KEY=<your base64url private key>
// VAPID_EMAIL=mailto:admin@yourdomain.com
//
// Generate keys with: npx web-push generate-vapid-keys

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

// Try to load web-push at runtime; fall back to raw fetch if not installed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let webpush: any = null;
try {
  // Dynamic require so the module is optional
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  webpush = require("web-push");
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL ?? "mailto:admin@example.com";
  if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
  } else {
    console.warn("[push-notify] VAPID keys not set — web-push will not work");
    webpush = null;
  }
} catch {
  // web-push not installed — will use fetch fallback
  webpush = null;
}

async function deleteSubscription(id: string) {
  try {
    await prisma.pushSubscription.delete({ where: { id } });
  } catch {
    // already gone — ignore
  }
}

/**
 * Send a push notification to all active subscriptions for a user.
 * Failed / expired subscriptions are automatically removed.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<void> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) return;

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
  });

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        if (webpush) {
          // Use web-push library (handles encryption + VAPID signing)
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            notificationPayload
          );
        } else {
          // Minimal fetch fallback — works only for endpoints that don't require
          // payload encryption (e.g. internal test servers). For production,
          // install the web-push package: npm install web-push
          const res = await fetch(sub.endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", TTL: "86400" },
            body: notificationPayload,
          });
          if (res.status === 410 || res.status === 404) {
            await deleteSubscription(sub.id);
          }
        }
      } catch (err: unknown) {
        const status =
          err && typeof err === "object" && "statusCode" in err
            ? (err as { statusCode: number }).statusCode
            : 0;
        if (status === 410 || status === 404) {
          // Subscription expired / invalid — remove it
          await deleteSubscription(sub.id);
        } else {
          console.error("[push-notify] Delivery failed for", sub.endpoint, err);
        }
      }
    })
  );
}
