import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, badRequest, unauthorized, notFound, serverError } from "@/lib/auth";
import { requireAgentAuth } from "@/lib/agent-auth";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  welcomeMessage: z.string().optional(),
  fallbackMessage: z.string().optional(),
  tone: z.string().optional(),
  languages: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]).optional(),
  systemPrompt: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAgentAuth(req);
    if (!auth) return unauthorized();
    const { id } = await params;

    const agent = await prisma.agent.findFirst({
      where: { id, userId: auth.userId },
      include: {
        customization: true,
        knowledge: { orderBy: { createdAt: "desc" } },
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
    const auth = await requireAgentAuth(req);
    if (!auth) return unauthorized();
    const { id } = await params;

    const agent = await prisma.agent.findFirst({ where: { id, userId: auth.userId } });
    if (!agent) return notFound();

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return badRequest("اطلاعات نامعتبر است");

    const updated = await prisma.agent.update({
      where: { id },
      data: parsed.data,
      include: { customization: true },
    });
    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAgentAuth(req);
    if (!auth) return unauthorized();
    const { id } = await params;

    const agent = await prisma.agent.findFirst({ where: { id, userId: auth.userId } });
    if (!agent) return notFound();

    await prisma.agent.update({ where: { id }, data: { status: "DELETED" } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
