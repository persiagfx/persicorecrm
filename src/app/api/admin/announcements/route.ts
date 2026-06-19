import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, forbidden, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (payload.role !== "admin") return forbidden();

    const announcements = await (prisma as any).systemAnnouncement.findMany({
      orderBy: { createdAt: "desc" },
    });
    return ok(announcements);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (payload.role !== "admin") return forbidden();

    const body = await req.json();
    if (!body.title || !body.message) return badRequest("عنوان و متن الزامی است");

    const ann = await (prisma as any).systemAnnouncement.create({
      data: {
        title: body.title,
        message: body.message,
        type: body.type ?? "info",
        targetPlans: body.targetPlans ?? [],
        isActive: body.isActive ?? true,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });
    return created(ann);
  } catch (e) {
    return serverError(e);
  }
}
