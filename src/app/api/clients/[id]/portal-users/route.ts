import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, notFound, serverError } from "@/lib/auth";
import { normalizePhone, isValidPhone } from "@/lib/sms";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id: clientId } = await params;

    const [portalUsers, tickets, messages] = await Promise.all([
      prisma.portalUser.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.portalTicket.findMany({
        where: { clientId },
        include: { replies: { orderBy: { createdAt: "desc" }, take: 1 } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.portalMessage.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return ok({ portalUsers, tickets, messages });
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id: clientId } = await params;

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return notFound("مشتری");

    const body = await req.json();
    if (!body.name || !body.phone) return badRequest("نام و شماره موبایل الزامی است");

    const phone = normalizePhone(body.phone);
    if (!isValidPhone(phone)) return badRequest("شماره موبایل معتبر نیست");

    const existing = await prisma.portalUser.findUnique({ where: { phone } });
    if (existing) return badRequest("این شماره موبایل قبلاً ثبت شده است");

    const user = await prisma.portalUser.create({
      data: {
        clientId,
        name: body.name,
        phone,
        email: null,
        passwordHash: null,
        role: body.role ?? "viewer",
      },
    });

    return created(user);
  } catch (e) {
    return serverError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id: clientId } = await params;
    const body = await req.json();
    if (!body.userId) return badRequest("userId الزامی است");

    const user = await prisma.portalUser.findFirst({ where: { id: body.userId, clientId } });
    if (!user) return notFound("کاربر پرتال");

    const updated = await prisma.portalUser.update({
      where: { id: body.userId },
      data: { isActive: body.isActive ?? !user.isActive },
    });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}
