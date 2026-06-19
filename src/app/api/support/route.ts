import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const requests = await (prisma as any).supportRequest.findMany({
      where: payload.tenantId ? { tenantId: payload.tenantId } : { userId: payload.userId },
      include: { replies: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return ok(requests);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const body = await req.json();
    if (!body.subject || !body.message) return badRequest("موضوع و متن پیام الزامی است");

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { name: true, email: true },
    });
    if (!user) return unauthorized();

    const request = await (prisma as any).supportRequest.create({
      data: {
        tenantId: payload.tenantId ?? null,
        userId: payload.userId,
        userEmail: user.email,
        userName: user.name,
        subject: body.subject,
        message: body.message,
        category: body.category ?? "general",
        priority: body.priority ?? "medium",
        status: "open",
      },
    });
    return created(request);
  } catch (e) {
    return serverError(e);
  }
}
