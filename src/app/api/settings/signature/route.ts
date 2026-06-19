import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const settings = await prisma.companySettings.findFirst({
      select: { adminSavedSignature: true },
    });

    return ok({ signature: settings?.adminSavedSignature ?? null });
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (payload.role !== "admin") return Response.json({ error: "فقط ادمین می‌تواند امضا ذخیره کند" }, { status: 403 });

    const { signatureDataUrl } = await req.json();
    if (!signatureDataUrl) return badRequest("امضا الزامی است");

    await prisma.companySettings.upsert({
      where: { id: "default" },
      create: { id: "default", adminSavedSignature: signatureDataUrl },
      update: { adminSavedSignature: signatureDataUrl },
    });

    return ok({ message: "امضا ذخیره شد" });
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (payload.role !== "admin") return Response.json({ error: "فقط ادمین می‌تواند امضا حذف کند" }, { status: 403 });

    await prisma.companySettings.upsert({
      where: { id: "default" },
      create: { id: "default", adminSavedSignature: null },
      update: { adminSavedSignature: null },
    });

    return ok({ message: "امضا حذف شد" });
  } catch (e) {
    return serverError(e);
  }
}
