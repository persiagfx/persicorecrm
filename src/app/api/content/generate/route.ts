import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { unauthorized, badRequest, verifyToken, getTokenFromRequest } from "@/lib/auth";
import OpenAI from "openai";
import { z } from "zod";

const schema = z.object({
  platform: z.enum(["instagram", "telegram", "bale", "blog", "email", "sms"]),
  language: z.enum(["fa", "en"]),
  topic: z.string().min(2),
  subtopics: z.array(z.string()).min(1),
  tone: z.enum(["friendly", "formal", "fun"]),
  contentType: z.enum(["news", "educational", "promotional", "fun"]),
  keyword: z.string().optional(),
});

const PLATFORM_SPECS: Record<string, { maxWords: string; notes: string }> = {
  instagram: { maxWords: "150-220 کلمه (۱۰۰۰-۱۵۰۰ کاراکتر)", notes: "۱۰ تا ۱۵ هشتگ مرتبط در انتها، emoji های مناسب" },
  telegram: { maxWords: "200-400 کلمه", notes: "فرمت‌بندی Markdown مناسب تلگرام، لینک‌های مرتبط" },
  bale: { maxWords: "150-300 کلمه", notes: "ساده و خوانا، emoji مناسب" },
  blog: { maxWords: "800-1500 کلمه", notes: "H1، H2، H3 سلسله‌مراتبی، پاراگراف‌بندی کامل، meta description، پیشنهاد لینک داخلی" },
  email: { maxWords: "200-400 کلمه", notes: "Subject line جذاب، preheader text، CTA واضح" },
  sms: { maxWords: "حداکثر ۱۵۰ کاراکتر", notes: "پیام کوتاه، CTA واضح، بدون هشتگ" },
};

const TONE_MAP: Record<string, string> = {
  friendly: "دوستانه و صمیمی",
  formal: "رسمی و حرفه‌ای",
  fun: "شاد و سرگرم‌کننده",
};

const CONTENT_TYPE_MAP: Record<string, string> = {
  news: "خبری و اطلاع‌رسانی",
  educational: "آموزشی و اطلاعاتی",
  promotional: "تبلیغاتی و بازاریابی",
  fun: "طنز و سرگرمی",
};

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return unauthorized();
  const payload = verifyToken(token);
  if (!payload) return unauthorized();

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest("اطلاعات ناقص است");

  const { platform, language, topic, subtopics, tone, contentType, keyword } = parsed.data;

  // Quota check for non-CRM users
  let contentUserId: string | null = null;
  let crmUserId: string | null = null;

  if (payload.isContentUser) {
    contentUserId = payload.userId;
    const user = await prisma.contentUser.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) return unauthorized();

    const settings = await prisma.contentSettings.findFirst({ where: { id: "global" } });
    const limits: Record<string, number> = {
      FREE: settings?.freePlanLimit ?? 5,
      PRO: settings?.proPlanLimit ?? 20,
      PLUS: settings?.plusPlanLimit ?? 50,
    };

    // Reset monthly usage if needed
    const now = new Date();
    const resetAt = new Date(user.monthResetAt);
    if (now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()) {
      await prisma.contentUser.update({ where: { id: user.id }, data: { usedThisMonth: 0, monthResetAt: now } });
      user.usedThisMonth = 0;
    }

    const limit = limits[user.plan] ?? 5;
    if (user.usedThisMonth >= limit) {
      return Response.json({ error: "سقف ماهانه تولید محتوای شما تمام شده. پلن خود را ارتقا دهید." }, { status: 429 });
    }
  } else {
    crmUserId = payload.userId;
  }

  const spec = PLATFORM_SPECS[platform];
  const subtopicStr = subtopics.map((s, i) => `${i + 1}. ${s}`).join("\n");
  const keywordNote = keyword ? (language === "fa" ? `\nکلمه کلیدی اصلی: "${keyword}" - این کلمه را در عنوان، ابتدا و انتهای متن استفاده کن.` : `\nFocus keyword: "${keyword}" — use in title, intro, and conclusion.`) : "";

  const prompt =
    language === "fa"
      ? `تولید محتوای سئوشده و حرفه‌ای:
موضوع اصلی: ${topic}
زیرموضوعات انتخاب‌شده:
${subtopicStr}
پلتفرم: ${platform} — ${spec.notes}
طول محتوا: ${spec.maxWords}
لحن: ${TONE_MAP[tone]}
نوع محتوا: ${CONTENT_TYPE_MAP[contentType]}${keywordNote}

ملاحظات سئو:
- عنوان جذاب و کلیدواژه‌محور
- ساختار مناسب (تیتر، بدنه، نتیجه)
- جملات کوتاه و خوانا
- density مناسب کلمات کلیدی
- meta description در انتها (فقط برای بلاگ)
متن را مستقیم شروع کن بدون توضیح اضافه.`
      : `Create SEO-optimized professional content:
Main topic: ${topic}
Selected subtopics:
${subtopicStr}
Platform: ${platform} — ${spec.notes}
Length: ${spec.maxWords}
Tone: ${tone}
Content type: ${contentType}${keywordNote}

SEO guidelines:
- Compelling keyword-rich title
- Clear structure (heading, body, conclusion)
- Short readable sentences
- Appropriate keyword density
- Meta description at end (blog only)
Start the content directly without extra explanation.`;

  const client = new OpenAI({
    baseURL: process.env.GAPGPT_BASE_URL,
    apiKey: process.env.GAPGPT_API_KEY,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      let fullText = "";

      try {
        const response = await client.chat.completions.create({
          model: process.env.GAPGPT_TEXT_MODEL ?? "gpt-5.4",
          messages: [{ role: "user", content: prompt }],
          stream: true,
          temperature: 0.7,
        });

        for await (const chunk of response) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            fullText += text;
            controller.enqueue(enc.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
        }

        // Save to DB
        const generation = await prisma.contentGeneration.create({
          data: {
            contentUserId,
            crmUserId,
            platform,
            language,
            topic,
            subtopics,
            tone,
            contentType,
            keyword: keyword ?? null,
            textOutput: fullText,
            metadata: { spec },
          },
        });

        // Increment usage counter
        if (contentUserId) {
          await prisma.contentUser.update({
            where: { id: contentUserId },
            data: { usedThisMonth: { increment: 1 } },
          });
        }

        controller.enqueue(enc.encode(`data: ${JSON.stringify({ done: true, id: generation.id })}\n\n`));
      } catch (e) {
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ error: "خطا در تولید محتوا" })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
