import { NextRequest } from "next/server";
import { requireAuth, verifyToken } from "@/lib/auth";
import { registerClient, unregisterClient } from "@/lib/sse";

export async function GET(req: NextRequest) {
  // EventSource can't send headers — accept token from query param as fallback
  let payload = requireAuth(req);
  if (!payload) {
    const qToken = new URL(req.url).searchParams.get("token");
    if (qToken) payload = verifyToken(qToken);
  }
  if (!payload) return new Response("Unauthorized", { status: 401 });

  const userId = payload.userId;

  const stream = new ReadableStream({
    start(controller) {
      registerClient(userId, controller);

      // ping هر ۳۰ ثانیه برای نگه داشتن اتصال
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`: ping\n\n`));
        } catch {
          clearInterval(pingInterval);
          unregisterClient(userId);
        }
      }, 30000);

      // اتصال اولیه
      const welcome = `data: ${JSON.stringify({ type: "connected", data: { userId } })}\n\n`;
      controller.enqueue(new TextEncoder().encode(welcome));

      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        unregisterClient(userId);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
