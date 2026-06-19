import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, unauthorized, serverError } from "@/lib/auth";
import { verifyAdminToken } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminToken(req);
    if (!admin) return unauthorized();

    const settings = await prisma.agentSettings.upsert({
      where: { id: "global" },
      create: { id: "global" },
      update: {},
    });
    return ok(settings);
  } catch (e) {
    return serverError(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await verifyAdminToken(req);
    if (!admin) return unauthorized();

    const body = await req.json();
    const settings = await prisma.agentSettings.upsert({
      where: { id: "global" },
      create: { id: "global", ...body },
      update: body,
    });
    return ok(settings);
  } catch (e) {
    return serverError(e);
  }
}
