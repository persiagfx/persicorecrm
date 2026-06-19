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

    const designs = await prisma.fileItem.findMany({
      where: {
        projectId: { in: projectIds },
        type: { startsWith: "image/" },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(designs);
  } catch (e) {
    return serverError(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = requirePortalAuth(req);
    if (!payload) return unauthorized();

    const body = await req.json();
    const { id, approvalStatus, comment } = body;

    const projects = await prisma.project.findMany({
      where: { clientId: payload.clientId },
      select: { id: true },
    });
    const projectIds = projects.map((p) => p.id);

    const file = await prisma.fileItem.findFirst({
      where: { id, projectId: { in: projectIds } },
    });
    if (!file) return ok({ error: "یافت نشد" });

    const existingComments = Array.isArray(file.designComments) ? file.designComments as object[] : [];
    const newComments = comment
      ? [...existingComments, { text: comment, authorType: "client", createdAt: new Date().toISOString() }]
      : existingComments;

    const updated = await prisma.fileItem.update({
      where: { id },
      data: {
        ...(approvalStatus ? { approvalStatus } : {}),
        designComments: newComments,
      },
    });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}
