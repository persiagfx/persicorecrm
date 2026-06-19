import { NextRequest } from "next/server";
import { verifyPortalToken } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

// Per-client SSE controllers keyed by portalUserId
const portalClients = new Map<string, ReadableStreamDefaultController>();

export function sendEventToPortalUser(portalUserId: string, event: { type: string; data: unknown }) {
  const controller = portalClients.get(portalUserId);
  if (controller) {
    try {
      const payload = `data: ${JSON.stringify(event)}\n\n`;
      controller.enqueue(new TextEncoder().encode(payload));
    } catch {
      portalClients.delete(portalUserId);
    }
  }
}

export function sendEventToClientConversation(clientId: string, event: { type: string; data: unknown }) {
  for (const [uid, controller] of portalClients.entries()) {
    if (uid.startsWith(clientId + ":")) {
      try {
        const payload = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(new TextEncoder().encode(payload));
      } catch {
        portalClients.delete(uid);
      }
    }
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return new Response("Unauthorized", { status: 401 });

  const payload = verifyPortalToken(token);
  if (!payload) return new Response("Unauthorized", { status: 401 });

  // key = clientId:portalUserId so we can broadcast to all portal users in same client
  const key = `${payload.clientId}:${payload.portalUserId}`;

  const stream = new ReadableStream({
    start(controller) {
      portalClients.set(key, controller);
      // heartbeat every 25s to keep connection alive
      const hb = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": ping\n\n"));
        } catch {
          clearInterval(hb);
        }
      }, 25_000);

      req.signal.addEventListener("abort", () => {
        clearInterval(hb);
        portalClients.delete(key);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
