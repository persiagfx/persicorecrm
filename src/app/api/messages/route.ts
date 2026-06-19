import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";
import { sendEventToUser } from "@/lib/sse";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    // مکالمه‌هایی که کاربر عضوشان است
    const conversations = await prisma.teamConversation.findMany({
      where: { participantIds: { string_contains: payload.userId }, tenantId: payload.tenantId ?? undefined },
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });

    const normalized = conversations.map((c) => ({
      ...c,
      participantIds: Array.isArray(c.participantIds)
        ? c.participantIds
        : JSON.parse(c.participantIds as unknown as string),
    }));
    return ok(normalized);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();

    if (body._action === "create_conversation") {
      if (!body.participantIds?.length) return badRequest("شرکت‌کنندگان الزامی است");
      const allIds = [...new Set([payload.userId, ...body.participantIds])];
      const conv = await prisma.teamConversation.create({
        data: {
          participantIds: allIds,
          isGroup: body.isGroup ?? allIds.length > 2,
          groupName: body.groupName,
          tenantId: payload.tenantId ?? null,
        },
        include: { messages: true },
      });
      return created(conv);
    }

    if (body._action === "send_message") {
      if (!body.conversationId || !body.content?.trim()) return badRequest("اطلاعات ناقص");
      const conv = await prisma.teamConversation.findFirst({
        where: { id: body.conversationId, participantIds: { string_contains: payload.userId } },
      });
      if (!conv) return badRequest("دسترسی غیرمجاز");
      const msg = await prisma.teamMessage.create({
        data: {
          conversationId: body.conversationId,
          senderId: payload.userId,
          content: body.content.trim(),
          type: body.type ?? "text",
          readBy: [payload.userId],
        },
      });
      await prisma.teamConversation.update({
        where: { id: body.conversationId },
        data: { updatedAt: new Date() },
      });
      // notify all participants except sender
      const participantIds: string[] = Array.isArray(conv.participantIds)
        ? (conv.participantIds as string[])
        : JSON.parse(conv.participantIds as unknown as string);
      for (const pid of participantIds) {
        if (pid !== payload.userId) {
          sendEventToUser(pid, { type: "message.new", data: { ...msg, conversationId: body.conversationId } });
        }
      }
      return created(msg);
    }

    if (body._action === "mark_read") {
      if (!body.conversationId) return badRequest("conversationId الزامی است");
      const msgs = await prisma.teamMessage.findMany({
        where: { conversationId: body.conversationId },
      });
      for (const msg of msgs) {
        const readBy = Array.isArray(msg.readBy) ? msg.readBy as string[] : [];
        if (!readBy.includes(payload.userId)) {
          await prisma.teamMessage.update({
            where: { id: msg.id },
            data: { readBy: [...readBy, payload.userId] },
          });
        }
      }
      return ok({ updated: true });
    }

    return badRequest("عملیات نامعتبر");
  } catch (e) {
    return serverError(e);
  }
}
