import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, badRequest, unauthorized, notFound, serverError } from "@/lib/auth";
import { requireAgentAuth } from "@/lib/agent-auth";

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim() ?? "";
}

function chunkText(text: string, maxChars = 3000): string[] {
  const paragraphs = text.split(/\n{2,}|\.\s+/);
  const chunks: string[] = [];
  let current = "";
  for (const p of paragraphs) {
    if ((current + p).length > maxChars && current) {
      chunks.push(current.trim());
      current = p;
    } else {
      current += " " + p;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter((c) => c.length > 50);
}

async function rebuildSystemPrompt(agentId: string) {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: { knowledge: { where: { status: "READY" } } },
  });
  if (!agent) return;

  const knowledgeText = agent.knowledge.map((k) => `### ${k.title}\n${k.content}`).join("\n\n");
  const toneMap: Record<string, string> = { friendly: "صمیمی و دوستانه", formal: "رسمی و حرفه‌ای", casual: "ساده و راحت", technical: "دقیق و تخصصی" };
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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAgentAuth(req);
    if (!auth) return unauthorized();
    const { id } = await params;

    const agent = await prisma.agent.findFirst({ where: { id, userId: auth.userId } });
    if (!agent) return notFound();

    const { url } = await req.json();
    if (!url || !url.startsWith("http")) return badRequest("آدرس URL معتبر نیست");

    // Fetch the URL
    let html: string;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PersicoreBot/1.0)" },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return badRequest(`صفحه قابل دسترسی نیست (${res.status})`);
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("text/html") && !ct.includes("text/plain")) {
        return badRequest("فقط صفحات HTML پشتیبانی می‌شوند");
      }
      html = await res.text();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "خطای شبکه";
      return badRequest(`خطا در دسترسی به URL: ${msg}`);
    }

    const pageTitle = extractTitle(html) || new URL(url).hostname;
    const plainText = stripHtml(html);

    if (plainText.length < 100) return badRequest("محتوای متنی کافی در این صفحه پیدا نشد");

    const chunks = chunkText(plainText);
    if (chunks.length === 0) return badRequest("محتوای قابل استخراج پیدا نشد");

    // Save each chunk as a separate knowledge item (max 5 chunks per URL)
    const saved: string[] = [];
    for (const [i, chunk] of chunks.slice(0, 5).entries()) {
      const title = chunks.length === 1 ? pageTitle : `${pageTitle} — بخش ${i + 1}`;
      const item = await prisma.agentKnowledge.create({
        data: {
          agentId: id,
          type: "URL",
          title,
          content: chunk,
          sourceUrl: url,
          tokens: Math.ceil(chunk.length / 4),
          status: "READY",
        },
      });
      saved.push(item.id);
    }

    await rebuildSystemPrompt(id);

    return ok({
      crawled: true,
      url,
      pageTitle,
      chunksCreated: saved.length,
      totalChars: plainText.length,
      knowledgeIds: saved,
    });
  } catch (e) {
    return serverError(e);
  }
}
