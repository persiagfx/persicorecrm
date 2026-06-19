import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, notFound, serverError } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const resume = await prisma.resume.findFirst({
      where: { slug, isPublished: true },
    });
    if (!resume) return notFound("رزومه");

    // افزایش views
    prisma.resume.update({ where: { id: resume.id }, data: { views: { increment: 1 } } }).catch((err) => console.error(err));

    return ok(resume);
  } catch (e) {
    return serverError(e);
  }
}
