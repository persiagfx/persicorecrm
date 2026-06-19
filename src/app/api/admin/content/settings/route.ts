import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, unauthorized, serverError, verifyToken, getTokenFromRequest } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const payload = token ? verifyToken(token) : null;
    if (!payload?.isSuperAdmin) return unauthorized();

    const settings = await prisma.contentSettings.upsert({
      where: { id: "global" },
      create: { id: "global", updatedAt: new Date() },
      update: {},
    });

    return ok(settings);
  } catch (e) {
    return serverError(e);
  }
}

const schema = z.object({
  freePlanLimit: z.number().min(1).optional(),
  proPlanLimit: z.number().min(1).optional(),
  plusPlanLimit: z.number().min(1).optional(),
  proPlanPrice: z.number().min(0).optional(),
  plusPlanPrice: z.number().min(0).optional(),
  apiKey: z.string().optional(),
  textModel: z.string().optional(),
  imageModel: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const payload = token ? verifyToken(token) : null;
    if (!payload?.isSuperAdmin) return unauthorized();

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "اطلاعات نامعتبر" }, { status: 400 });

    const settings = await prisma.contentSettings.upsert({
      where: { id: "global" },
      create: { id: "global", ...parsed.data, updatedAt: new Date() },
      update: { ...parsed.data, updatedAt: new Date() },
    });

    return ok(settings);
  } catch (e) {
    return serverError(e);
  }
}
