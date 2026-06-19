import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, badRequest, unauthorized, serverError } from "@/lib/auth";
import { requireAgentAuth, getPlanLimits } from "@/lib/agent-auth";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2).max(60),
  businessType: z.string().min(1),
  welcomeMessage: z.string().optional(),
  tone: z.string().optional(),
  languages: z.array(z.string()).min(1),
});

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 30) + "-" + Math.random().toString(36).slice(2, 7);
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAgentAuth(req);
    if (!auth) return unauthorized();

    const agents = await prisma.agent.findMany({
      where: { userId: auth.userId, status: { not: "DELETED" } },
      include: { customization: true },
      orderBy: { createdAt: "desc" },
    });

    return ok(agents);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAgentAuth(req);
    if (!auth) return unauthorized();

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return badRequest(`اطلاعات ناقص: ${firstError?.path.join(".")} — ${firstError?.message}`);
    }

    const limits = getPlanLimits(auth.plan);
    const existing = await prisma.agent.count({
      where: { userId: auth.userId, status: { not: "DELETED" } },
    });
    if (existing >= limits.maxAgents) {
      return badRequest(`پلن شما حداکثر ${limits.maxAgents} ایجنت را پشتیبانی می‌کند`);
    }

    const { name, businessType, welcomeMessage, tone, languages } = parsed.data;
    const slug = generateSlug(name);

    const agent = await prisma.agent.create({
      data: {
        userId: auth.userId,
        name,
        slug,
        businessType,
        welcomeMessage: welcomeMessage ?? `سلام! من دستیار ${name} هستم. چطور می‌تونم کمکتون کنم؟`,
        fallbackMessage: "متأسفانه پاسخ این سوال را نمی‌دانم. لطفاً با پشتیبانی تماس بگیرید.",
        tone: tone ?? "friendly",
        languages,
        status: "DRAFT",
        customization: {
          create: {
            primaryColor: "#5b6cff",
            avatarType: "initials",
            position: "bottom-left",
            showBranding: true,
          },
        },
      },
      include: { customization: true },
    });

    return ok(agent);
  } catch (e) {
    return serverError(e);
  }
}
