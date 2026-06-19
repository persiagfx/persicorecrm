import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folderId") ?? undefined;
    const projectId = searchParams.get("projectId") ?? undefined;
    const type = searchParams.get("type") ?? undefined; // "image", "document", etc.
    const search = searchParams.get("search") ?? "";

    const files = await prisma.fileItem.findMany({
      where: {
        folder: { tenantId: payload.tenantId ?? undefined },
        ...(folderId !== undefined ? { folderId: folderId === "root" ? null : folderId } : {}),
        ...(projectId ? { projectId } : {}),
        ...(type ? { type: { contains: type } } : {}),
        ...(search ? { name: { contains: search } } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(files);
  } catch (e) {
    return serverError(e);
  }
}
