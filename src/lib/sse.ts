// SSE (Server-Sent Events) utility — shared across API routes
// Must live outside src/app/api/ so it doesn't violate Next.js route file constraints

const clients = new Map<string, ReadableStreamDefaultController>();

export function registerClient(userId: string, controller: ReadableStreamDefaultController) {
  clients.set(userId, controller);
}

export function unregisterClient(userId: string) {
  clients.delete(userId);
}

export function sendEventToUser(userId: string, event: { type: string; data: unknown }) {
  const controller = clients.get(userId);
  if (controller) {
    try {
      const payload = `data: ${JSON.stringify(event)}\n\n`;
      controller.enqueue(new TextEncoder().encode(payload));
    } catch {
      clients.delete(userId);
    }
  }
}

export function sendEventToAll(event: { type: string; data: unknown }) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  const encoded = new TextEncoder().encode(payload);
  for (const [userId, controller] of clients.entries()) {
    try {
      controller.enqueue(encoded);
    } catch {
      clients.delete(userId);
    }
  }
}
