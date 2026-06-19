import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, badRequest, notFound, serverError } from "@/lib/auth";
import OpenAI from "openai";
import { z } from "zod";

const GAPGPT_BASE_URL = process.env.GAPGPT_BASE_URL!;
const GAPGPT_API_KEY = process.env.GAPGPT_API_KEY!;
const TEXT_MODEL = process.env.GAPGPT_TEXT_MODEL ?? "gpt-5.4";

const client = new OpenAI({ apiKey: GAPGPT_API_KEY, baseURL: GAPGPT_BASE_URL });

const schema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(1000),
  visitorName: z.string().optional(),
  visitorEmail: z.string().optional(),
  visitorPhone: z.string().optional(),
});

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ agentId: string }> }) {
  try {
    const { agentId } = await params;
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, status: "ACTIVE" },
      include: { customization: true },
    });
    if (!agent) return notFound();

    return new Response(
      JSON.stringify({
        id: agent.id,
        name: agent.name,
        welcomeMessage: agent.welcomeMessage,
        languages: agent.languages,
        customization: agent.customization,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ agentId: string }> }) {
  try {
    const { agentId } = await params;

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, status: "ACTIVE" },
    });
    if (!agent) return notFound();

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("اطلاعات ناقص است");

    const { sessionId, message, visitorName, visitorEmail, visitorPhone } = parsed.data;

    // Get or create conversation
    let conversation = await prisma.agentConversation.findFirst({
      where: { agentId, sessionId },
    });

    if (!conversation) {
      conversation = await prisma.agentConversation.create({
        data: {
          agentId,
          sessionId,
          visitorName,
          visitorEmail,
          visitorPhone,
        },
      });
      await prisma.agent.update({
        where: { id: agentId },
        data: { totalConversations: { increment: 1 } },
      });
    } else if (visitorName || visitorEmail || visitorPhone) {
      await prisma.agentConversation.update({
        where: { id: conversation.id },
        data: {
          visitorName: visitorName ?? conversation.visitorName ?? undefined,
          visitorEmail: visitorEmail ?? conversation.visitorEmail ?? undefined,
          visitorPhone: visitorPhone ?? conversation.visitorPhone ?? undefined,
        },
      });
    }

    // Get last 10 messages for context
    const history = await prisma.agentMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    // Save user message
    await prisma.agentMessage.create({
      data: { conversationId: conversation.id, role: "user", content: message },
    });

    const systemPrompt = agent.systemPrompt ?? `تو دستیار ${agent.name} هستی. صادقانه و مفید پاسخ بده.`;

    const completion = await client.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user", content: message },
      ],
      max_tokens: 600,
    });

    const reply = completion.choices[0].message.content ?? agent.fallbackMessage ?? "متأسفانه پاسخی ندارم.";
    const tokensUsed = completion.usage?.total_tokens ?? 0;

    // Check if AI extracted lead info
    let leadData: { name?: string; email?: string; phone?: string } | null = null;
    try {
      const leadMatch = reply.match(/\{"lead":\s*\{[^}]+\}\}/);
      if (leadMatch) leadData = JSON.parse(leadMatch[0]).lead;
    } catch { /* ignore */ }

    const cleanReply = reply.replace(/\{"lead":[^}]+\}\}/, "").trim();

    // Save assistant message
    await prisma.agentMessage.create({
      data: { conversationId: conversation.id, role: "assistant", content: cleanReply, tokensUsed },
    });

    // Update stats
    await prisma.agentConversation.update({
      where: { id: conversation.id },
      data: {
        messageCount: { increment: 2 },
        lastMessageAt: new Date(),
        ...(leadData?.name ? { visitorName: leadData.name } : {}),
        ...(leadData?.email ? { visitorEmail: leadData.email } : {}),
        ...(leadData?.phone ? { visitorPhone: leadData.phone } : {}),
      },
    });

    await prisma.agent.update({
      where: { id: agentId },
      data: { totalMessages: { increment: 2 }, lastActiveAt: new Date() },
    });

    // Auto-create CRM lead if owner has CRM and visitor shared contact info
    const finalConv = await prisma.agentConversation.findUnique({ where: { id: conversation.id } });
    if (finalConv && (finalConv.visitorPhone || finalConv.visitorEmail) && !finalConv.leadCreated) {
      const agentOwner = await prisma.agentUser.findUnique({
        where: { id: agent.userId },
      });
      // Check if this agentUser has a corresponding CRM user by phone/email
      if (agentOwner) {
        const crmUser = await prisma.user.findFirst({
          where: {
            OR: [
              agentOwner.email ? { email: agentOwner.email } : {},
              agentOwner.phone ? { phone: agentOwner.phone } : {},
            ],
          },
        });
        if (crmUser?.tenantId) {
          await prisma.lead.create({
            data: {
              tenantId: crmUser.tenantId,
              companyName: finalConv.visitorName ?? "مخاطب از چت‌بات",
              contactName: finalConv.visitorName ?? "نامشخص",
              contactPhone: finalConv.visitorPhone ?? "",
              contactEmail: finalConv.visitorEmail ?? undefined,
              source: `چت‌بات: ${agent.name}`,
              status: "new",
              assigneeId: crmUser.id,
            },
          });
          await prisma.agentConversation.update({
            where: { id: conversation.id },
            data: { leadCreated: true },
          });
          await prisma.agent.update({
            where: { id: agentId },
            data: { totalLeads: { increment: 1 } },
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, data: { reply: cleanReply, conversationId: conversation.id } }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (e) {
    return serverError(e);
  }
}
