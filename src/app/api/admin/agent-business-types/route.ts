import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, badRequest, unauthorized, serverError } from "@/lib/auth";
import { verifyAdminToken } from "@/lib/admin-auth";
import { z } from "zod";

const createSchema = z.object({
  key: z.string().min(2),
  nameFa: z.string().min(1),
  icon: z.string().default("🏢"),
  description: z.string().optional(),
  questions: z.array(z.string()).default([]),
  order: z.number().default(0),
});

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminToken(req);
    if (!admin) return unauthorized();

    const types = await prisma.agentBusinessType.findMany({ orderBy: { order: "asc" } });
    return ok(types);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminToken(req);
    if (!admin) return unauthorized();

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("اطلاعات نامعتبر");

    const type = await prisma.agentBusinessType.create({ data: parsed.data });
    return ok(type);
  } catch (e) {
    return serverError(e);
  }
}
