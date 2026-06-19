import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requirePortalAuth } from "@/lib/portal-auth";
import { ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requirePortalAuth(req);
    if (!payload) return unauthorized();

    const projects = await prisma.project.findMany({
      where: { clientId: payload.clientId },
      select: { id: true },
    });
    const projectIds = projects.map((p) => p.id);

    const files = await prisma.fileItem.findMany({
      where: { projectId: { in: projectIds } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        type: true,
        size: true,
        url: true,
        thumbnailUrl: true,
        projectId: true,
        createdAt: true,
      },
    });

    return ok(files);
  } catch (e) {
    return serverError(e);
  }
}
