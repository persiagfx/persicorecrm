import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.fullName?.trim()) return badRequest("نام الزامی است");
    if (!body.phone?.trim() && !body.email?.trim()) return badRequest("شماره تماس یا ایمیل الزامی است");

    const job = await prisma.jobPosting.findFirst({
      where: { id, status: "open" },
    });
    if (!job) return badRequest("این موقعیت شغلی بسته شده است");

    const application = await prisma.jobApplication.create({
      data: {
        jobId: id,
        fullName: body.fullName.trim(),
        email: body.email?.trim() ?? "",
        phone: body.phone?.trim() ?? null,
        coverLetter: body.coverLetter?.trim() ?? null,
        resumeUrl: body.resumeUrl ?? null,
        status: "new",
      },
    });

    return ok(application);
  } catch (e) {
    return serverError(e);
  }
}
