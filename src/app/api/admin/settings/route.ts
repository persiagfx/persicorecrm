import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, requireRole, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    let settings = await prisma.siteSettings.findUnique({ where: { id: "main" } });
    if (!settings) {
      settings = await prisma.siteSettings.create({ data: { id: "main" } });
    }
    return ok(settings);
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin");
    if (roleErr) return roleErr;

    const body = await req.json();
    const settings = await prisma.siteSettings.upsert({
      where: { id: "main" },
      create: { id: "main", ...body },
      update: body,
    });
    return ok(settings);
  } catch (e) {
    return serverError(e);
  }
}
