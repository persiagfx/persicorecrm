import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, badRequest, unauthorized, notFound, serverError } from "@/lib/auth";
import { verifyAdminToken } from "@/lib/admin-auth";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "DELETED"]).optional(),
  name: z.string().optional(),
  systemPrompt: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdminToken(req);
    if (!admin) return unauthorized();
    const { id } = await params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        user: true,
        knowledge: { orderBy: { createdAt: "desc" } },
        customization: true,
        conversations: { orderBy: { startedAt: "desc" }, take: 20, include: { messages: { take: 5, orderBy: { createdAt: "desc" } } } },
      },
    });
    if (!agent) return notFound();
    return ok(agent);
  } catch (e) {
    return serverError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdminToken(req);
    if (!admin) return unauthorized();
    const { id } = await params;

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return badRequest("اطلاعات نامعتبر است");

    const agent = await prisma.agent.update({ where: { id }, data: parsed.data });
    return ok(agent);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdminToken(req);
    if (!admin) return unauthorized();
    const { id } = await params;

    await prisma.agent.update({ where: { id }, data: { status: "DELETED" } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
