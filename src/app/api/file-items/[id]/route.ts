import { NextRequest } from "next/server";
import { unlink } from "fs/promises";
import { join } from "path";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const file = await prisma.fileItem.findUnique({ where: { id } });
    if (!file) return notFound("فایل");

    const existingComments = Array.isArray(file.designComments) ? file.designComments as object[] : [];
    const newComments = body.comment
      ? [...existingComments, {
          text: body.comment,
          authorName: body.authorName ?? "تیم",
          authorType: "team",
          createdAt: new Date().toISOString(),
        }]
      : existingComments;

    const updated = await prisma.fileItem.update({
      where: { id },
      data: {
        ...(body.approvalStatus ? { approvalStatus: body.approvalStatus } : {}),
        designComments: newComments,
      },
    });
    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const file = await prisma.fileItem.findUnique({ where: { id } });
    if (!file) return notFound("فایل");

    // حذف فایل از disk
    if (file.url.startsWith("/uploads/")) {
      const fullPath = join(process.cwd(), "public", file.url);
      await unlink(fullPath).catch((err) => console.error(err)); // اگر فایل وجود نداشت، ادامه بده
    }

    await prisma.fileItem.delete({ where: { id } });
    return ok({ message: "فایل حذف شد" });
  } catch (e) {
    return serverError(e);
  }
}
