import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, badRequest, unauthorized, serverError } from "@/lib/auth";
import { requireAgentAuth } from "@/lib/agent-auth";
import OpenAI from "openai";
import { z } from "zod";

const schema = z.object({
  businessType: z.string(),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
  agentId: z.string().optional(),
});

const GAPGPT_BASE_URL = process.env.GAPGPT_BASE_URL!;
const GAPGPT_API_KEY = process.env.GAPGPT_API_KEY!;
const TEXT_MODEL = process.env.GAPGPT_TEXT_MODEL ?? "gpt-5.4";

const client = new OpenAI({ apiKey: GAPGPT_API_KEY, baseURL: GAPGPT_BASE_URL });

const INTERVIEW_SYSTEM = `تو یک متخصص آنبوردینگ هستی که اطلاعات کسب‌وکار را برای ساخت یک چت‌بات هوشمند جمع‌آوری می‌کنی.
وظیفه‌ات اینه که سوالات دقیق و هدفمند بپرسی تا بتونی یک دانش‌پایه کامل بسازی.

قوانین مهم:
- هر بار فقط یک سوال بپرس
- سوالات را کوتاه و واضح بپرس
- از جواب‌های کوتاه بیشتر بپرس (follow-up)
- بعد از ۱۰-۱۲ سوال یا وقتی اطلاعات کافی داری، با عبارت دقیق "[[INTERVIEW_COMPLETE]]" پاسخ بده
- وقتی INTERVIEW_COMPLETE فرستادی، یک JSON با این فرمت هم اضافه کن:
{"summary": "خلاصه کسب‌وکار", "knowledge": [{"title": "...", "content": "..."}]}
- زبان: فارسی`;

const BUSINESS_TYPE_QUESTIONS: Record<string, string> = {
  ecommerce: "اول بگید چه محصولاتی می‌فروشید و محدوده قیمتی‌تون چنده؟",
  restaurant: "اول بگید رستوران یا کافه‌تون چه نوع غذایی سرو می‌کنه و ساعت کاریتون چنده؟",
  clinic: "اول بگید کلینیک یا مطبتون چه تخصصی داره و چه خدماتی ارائه می‌دید؟",
  education: "اول بگید چه دوره‌هایی تدریس می‌کنید و مخاطبان اصلی‌تون چه کسانی هستند؟",
  legal: "اول بگید در چه حوزه‌ای از حقوق فعالیت می‌کنید و چه خدماتی ارائه می‌دهید؟",
  travel: "اول بگید چه تورها یا خدمات مسافرتی ارائه می‌دهید و در کدام مناطق فعال هستید؟",
  beauty: "اول بگید چه خدمات آرایشی یا زیبایی ارائه می‌دهید و آدرستون کجاست؟",
  construction: "اول بگید چه خدمات ساختمانی یا دکوراسیونی دارید و در چه مناطقی فعال هستید؟",
  insurance: "اول بگید چه نوع بیمه‌هایی ارائه می‌دهید و با کدام شرکت‌های بیمه کار می‌کنید؟",
  software: "اول بگید چه محصولات یا خدمات نرم‌افزاری دارید و مشتریان هدف‌تون چه کسانی هستند؟",
  b2b: "اول بگید چه خدماتی به کسب‌وکارها ارائه می‌دهید و چه صنایعی مشتری شما هستند؟",
  other: "اول کسب‌وکارتون را معرفی کنید و بگید چه خدمات یا محصولاتی دارید؟",
};

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAgentAuth(req);
    if (!auth) return unauthorized();

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("اطلاعات ناقص است");

    const { businessType, messages } = parsed.data;
    const firstQuestion = BUSINESS_TYPE_QUESTIONS[businessType] ?? BUSINESS_TYPE_QUESTIONS.other;

    // First message — AI starts with a targeted question
    if (messages.length === 0) {
      return ok({ message: firstQuestion, isComplete: false });
    }

    const completion = await client.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        { role: "system", content: INTERVIEW_SYSTEM },
        { role: "assistant", content: firstQuestion },
        ...messages,
      ],
      max_tokens: 800,
    });

    const reply = completion.choices[0].message.content ?? "";
    const isComplete = reply.includes("[[INTERVIEW_COMPLETE]]");

    let knowledge: { title: string; content: string }[] = [];
    let summary = "";

    if (isComplete) {
      try {
        const jsonMatch = reply.match(/\{[\s\S]*"knowledge"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          knowledge = parsed.knowledge ?? [];
          summary = parsed.summary ?? "";
        }
      } catch { /* ignore parse errors */ }
    }

    const cleanMessage = reply
      .replace("[[INTERVIEW_COMPLETE]]", "")
      .replace(/\{[\s\S]*"knowledge"[\s\S]*\}/, "")
      .trim();

    return ok({ message: cleanMessage, isComplete, knowledge, summary });
  } catch (e) {
    return serverError(e);
  }
}
