import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, badRequest, unauthorized, notFound, serverError } from "@/lib/auth";
import { requireAgentAuth } from "@/lib/agent-auth";
import { z } from "zod";

const addSchema = z.object({
  type: z.enum(["TEXT", "FILE", "URL"]),
  title: z.string().min(1),
  content: z.string().min(1),
  sourceUrl: z.string().optional(),
  fileUrl: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAgentAuth(req);
    if (!auth) return unauthorized();
    const { id } = await params;

    const agent = await prisma.agent.findFirst({ where: { id, userId: auth.userId } });
    if (!agent) return notFound();

    const items = await prisma.agentKnowledge.findMany({
      where: { agentId: id },
      orderBy: { createdAt: "desc" },
    });
    return ok(items);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAgentAuth(req);
    if (!auth) return unauthorized();
    const { id } = await params;

    const agent = await prisma.agent.findFirst({ where: { id, userId: auth.userId } });
    if (!agent) return notFound();

    const body = await req.json();
    const parsed = addSchema.safeParse(body);
    if (!parsed.success) return badRequest("اطلاعات ناقص است");

    // Estimate token count (rough: 1 token ≈ 4 chars)
    const tokens = Math.ceil(parsed.data.content.length / 4);

    const item = await prisma.agentKnowledge.create({
      data: {
        agentId: id,
        ...parsed.data,
        tokens,
        status: "READY",
      },
    });

    // Rebuild system prompt after new knowledge
    await rebuildSystemPrompt(id);

    return ok(item);
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

    const url = new URL(req.url);
    const knowledgeId = url.searchParams.get("knowledgeId");
    if (!knowledgeId) return badRequest("knowledgeId مشخص نشده");

    await prisma.agentKnowledge.delete({ where: { id: knowledgeId, agentId: id } });
    await rebuildSystemPrompt(id);
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}

async function rebuildSystemPrompt(agentId: string) {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: { knowledge: { where: { status: "READY" } } },
  });
  if (!agent) return;

  const knowledgeText = agent.knowledge
    .map((k) => `### ${k.title}\n${k.content}`)
    .join("\n\n");

  const toneMap: Record<string, string> = {
    friendly: "صمیمی و دوستانه",
    formal: "رسمی و حرفه‌ای",
    professional: "حرفه‌ای و مختصر",
  };
  const toneDesc = toneMap[agent.tone] ?? "دوستانه";

  const systemPrompt = `تو دستیار هوشمند "${agent.name}" هستی.
لحن تو ${toneDesc} است.
زبان‌های پشتیبانی‌شده: ${(agent.languages as string[]).join(", ")}

## دانش کسب‌وکار:
${knowledgeText}

## قوانین:
- فقط بر اساس اطلاعات بالا پاسخ بده
- اگر سوال خارج از حوزه دانش بود، بگو: "${agent.fallbackMessage}"
- هرگز اطلاعات نادرست نده
- مختصر و مفید پاسخ بده
- اگر بازدیدکننده اطلاعات تماسش را داد (نام، ایمیل یا تلفن)، آن را در پاسخت با فرمت JSON بگنج: {"lead":{"name":"...","email":"...","phone":"..."}}`;

  await prisma.agent.update({ where: { id: agentId }, data: { systemPrompt } });
}
