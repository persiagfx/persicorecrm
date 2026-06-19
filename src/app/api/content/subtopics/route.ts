import { NextRequest } from "next/server";
import { badRequest, serverError, unauthorized, verifyToken, getTokenFromRequest } from "@/lib/auth";
import OpenAI from "openai";
import { z } from "zod";

const schema = z.object({
  topic: z.string().min(2).max(200),
  platform: z.string(),
  language: z.enum(["fa", "en"]),
});

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token || !verifyToken(token)) return unauthorized();

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("اطلاعات ناقص است");

    const { topic, platform, language } = parsed.data;

    const client = new OpenAI({
      baseURL: process.env.GAPGPT_BASE_URL,
      apiKey: process.env.GAPGPT_API_KEY,
    });

    const platformLabel: Record<string, string> = {
      instagram: "اینستاگرام",
      telegram: "تلگرام",
      bale: "بله",
      blog: "مقاله وبلاگ",
      email: "ایمیل مارکتینگ",
      sms: "پیامک",
    };

    const prompt =
      language === "fa"
        ? `موضوع اصلی: "${topic}" برای پلتفرم ${platformLabel[platform] ?? platform}\n5 زیرموضوع جذاب و متنوع پیشنهاد بده که هر کدام قابلیت تولید محتوای مستقل داشته باشند. فقط لیست JSON بده بدون توضیح اضافه:\n["زیرموضوع ۱", "زیرموضوع ۲", "زیرموضوع ۳", "زیرموضوع ۴", "زیرموضوع ۵"]`
        : `Main topic: "${topic}" for ${platform}\nSuggest 5 compelling and diverse subtopics, each capable of independent content creation. Return only JSON array, no extra text:\n["Subtopic 1", "Subtopic 2", "Subtopic 3", "Subtopic 4", "Subtopic 5"]`;

    const response = await client.chat.completions.create({
      model: process.env.GAPGPT_TEXT_MODEL ?? "gpt-5.4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    const content = response.choices[0]?.message?.content ?? "[]";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const subtopics = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return Response.json({ data: { subtopics } });
  } catch (e) {
    return serverError(e);
  }
}
