import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, created, badRequest, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");
    if (!postId) return badRequest("postId الزامی است");

    const comments = await prisma.blogComment.findMany({
      where: { postId, approved: true },
      select: {
        id: true,
        authorName: true,
        content: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return ok(comments);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { postId, authorName, authorEmail, content } = body ?? {};

    if (!postId || !authorName || !authorEmail || !content) {
      return badRequest("همه فیلدها الزامی هستند");
    }

    if (typeof authorName !== "string" || authorName.trim().length < 2) {
      return badRequest("نام باید حداقل ۲ کاراکتر باشد");
    }

    if (typeof content !== "string" || content.trim().length < 5) {
      return badRequest("متن دیدگاه باید حداقل ۵ کاراکتر باشد");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authorEmail)) {
      return badRequest("ایمیل معتبر نیست");
    }

    // verify post exists
    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) return badRequest("پست یافت نشد");

    const comment = await prisma.blogComment.create({
      data: {
        postId,
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim().toLowerCase(),
        content: content.trim(),
        approved: false,
      },
      select: {
        id: true,
        authorName: true,
        content: true,
        approved: true,
        createdAt: true,
      },
    });

    return created(comment);
  } catch (e) {
    return serverError(e);
  }
}
