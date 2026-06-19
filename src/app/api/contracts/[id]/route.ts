import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, badRequest, unauthorized, notFound, serverError } from "@/lib/auth";
import { sendContractSigningEmail } from "@/lib/email";
import { sendContractSms, normalizePhone, isValidPhone } from "@/lib/sms";
import { logActivitySilent } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const contract = await prisma.contract.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) },
      include: {
        client: true,
        project: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } },
      },
    });
    if (!contract) return notFound("قرارداد");
    return ok(contract);
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    let updateData: Record<string, unknown> = {
      title: body.title,
      content: body.content,
      status: body.status,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    };

    if (body._action === "send") {
      const token = randomBytes(32).toString("hex");
      updateData = { ...updateData, status: "sent", signToken: token, sentAt: new Date() };

      // fetch client email to send signing link
      const existing = await prisma.contract.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) },
        include: { client: { select: { contactEmail: true, contactPhone: true, contactName: true, companyName: true } } },
      });
      const clientEmail = existing?.client?.contactEmail;
      const clientPhone = existing?.client?.contactPhone;
      const clientName = existing?.client?.contactName ?? existing?.client?.companyName ?? "مشتری";
      const contractTitle = existing?.title ?? "قرارداد";
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const signLink = `${appUrl}/sign/${token}`;

      if (clientEmail) {
        sendContractSigningEmail({
          to: clientEmail,
          clientName,
          contractTitle,
          signLink,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        }).catch((e) => console.error("[Email] contract sign email failed:", e));
      }

      if (clientPhone) {
        const normalized = normalizePhone(clientPhone);
        if (isValidPhone(normalized)) {
          sendContractSms(normalized, clientName).catch((e) => console.error("[SMS] contract sign sms failed:", e));
        }
      }

      // activity log
      logActivitySilent({
        actorId: payload.userId,
        action: "contract_sent",
        entityType: "contract",
        entityId: id,
        entityName: contractTitle,
        description: `قرارداد "${contractTitle}" برای امضای ${clientName} ارسال شد`,
        metadata: { signLink },
        req,
      });
    }

    if (body._action === "admin-sign") {
      if (!body.signatureDataUrl) return badRequest("امضا الزامی است");
      updateData = {
        status: "admin_signed",
        adminSignedAt: new Date(),
        adminSignatureDataUrl: body.signatureDataUrl,
      };
    }

    const contract = await prisma.contract.update({ where: { id }, data: updateData });
    return ok(contract);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const contract = await prisma.contract.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) } });
    if (!contract) return notFound("قرارداد");
    if (contract.status === "signed") return badRequest("قرارداد امضاشده قابل حذف نیست");
    await prisma.contract.delete({ where: { id } });
    return ok({ message: "قرارداد حذف شد" });
  } catch (e) {
    return serverError(e);
  }
}
