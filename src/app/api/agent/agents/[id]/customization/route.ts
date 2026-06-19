import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, badRequest, unauthorized, notFound, serverError } from "@/lib/auth";
import { requireAgentAuth } from "@/lib/agent-auth";
import { z } from "zod";

const schema = z.object({
  primaryColor: z.string().optional(),
  avatarType: z.enum(["initials", "image", "emoji"]).optional(),
  avatarUrl: z.string().optional(),
  avatarEmoji: z.string().optional(),
  position: z.enum(["bottom-left", "bottom-right"]).optional(),
  widgetTitle: z.string().optional(),
  inputPlaceholder: z.string().optional(),
  showBranding: z.boolean().optional(),
  darkMode: z.boolean().optional(),
  borderRadius: z.number().min(0).max(24).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAgentAuth(req);
    if (!auth) return unauthorized();
    const { id } = await params;

    const agent = await prisma.agent.findFirst({ where: { id, userId: auth.userId } });
    if (!agent) return notFound();

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("اطلاعات نامعتبر است");

    const customization = await prisma.agentCustomization.upsert({
      where: { agentId: id },
      create: { agentId: id, ...parsed.data },
      update: parsed.data,
    });
    return ok(customization);
  } catch (e) {
    return serverError(e);
  }
}
