import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, badRequest, notFound, serverError } from "@/lib/auth";
import { sendContractSignedNotification } from "@/lib/email";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const contract = await prisma.contract.findUnique({
      where: { signToken: token },
      include: { client: { select: { companyName: true, contactName: true } } },
    });
    if (!contract) return notFound("قرارداد");
    if (contract.expiresAt && contract.expiresAt < new Date() && contract.status !== "signed")
      return Response.json({ error: "لینک قرارداد منقضی شده است" }, { status: 410 });

    const { signatureDataUrl: _sig, ...safe } = contract;
    return ok({
      ...safe,
      clientName: contract.client?.contactName ?? contract.client?.companyName ?? "",
    });
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const body = await req.json();
    if (!body.signatureDataUrl) return badRequest("امضا الزامی است");

    const contract = await prisma.contract.findUnique({ where: { signToken: token } });
    if (!contract) return notFound("قرارداد");
    if (contract.status === "signed") return badRequest("قرارداد قبلاً امضا شده است");
    if (contract.expiresAt && contract.expiresAt < new Date())
      return Response.json({ error: "لینک منقضی شده است" }, { status: 410 });

    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    const signedAt = new Date();

    const updated = await prisma.contract.update({
      where: { signToken: token },
      data: { status: "signed", signedAt, signedIp: ip, signatureDataUrl: body.signatureDataUrl },
      include: { client: { select: { contactName: true, companyName: true } } },
    });

    const clientName = updated.client?.contactName ?? updated.client?.companyName ?? "مشتری";

    // notify admin via company email
    const settings = await prisma.companySettings.findFirst({ select: { email: true } }).catch(() => null);
    if (settings?.email) {
      sendContractSignedNotification({
        adminEmail: settings.email,
        clientName,
        contractTitle: updated.title,
        signedAt,
      }).catch((e) => console.error("[Email] contract signed notification failed:", e));
    }

    // activity log is skipped here — no authenticated actor in public sign route

    return ok({ message: "قرارداد با موفقیت امضا شد", signedAt: updated.signedAt });
  } catch (e) {
    return serverError(e);
  }
}
