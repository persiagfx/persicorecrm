import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, badRequest, notFound, serverError } from "@/lib/auth";
import { sendInvoiceSignedNotification } from "@/lib/email";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoice = await (prisma.invoice as any).findUnique({
      where: { signToken: token },
      include: {
        client: { select: { companyName: true, contactName: true } },
        items: false,
      },
      select: {
        id: true, invoiceNumber: true, total: true, status: true,
        subtotal: true, taxRate: true, taxAmount: true, discount: true,
        issuedAt: true, dueDate: true, items: true, notes: true,
        adminSignedAt: true, adminSignatureDataUrl: true,
        clientSignedAt: true, signToken: true,
        client: { select: { companyName: true, contactName: true } },
      },
    });
    if (!invoice) return notFound("فاکتور");
    if (invoice.clientSignedAt) return badRequest("این فاکتور قبلاً امضا شده است");
    return ok(invoice);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const body = await req.json();
    if (!body.signatureDataUrl) return badRequest("امضا الزامی است");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoice = await (prisma.invoice as any).findUnique({
      where: { signToken: token },
      include: { client: { select: { contactName: true, companyName: true } } },
    });
    if (!invoice) return notFound("فاکتور");
    if (invoice.clientSignedAt) return badRequest("این فاکتور قبلاً امضا شده است");

    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    const signedAt = new Date();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.invoice as any).update({
      where: { signToken: token },
      data: { clientSignatureDataUrl: body.signatureDataUrl, clientSignedAt: signedAt, clientSignedIp: ip, status: "signed" },
    });

    const clientName = invoice.client?.contactName ?? invoice.client?.companyName ?? "مشتری";
    const settings = await prisma.companySettings.findFirst({ select: { email: true } }).catch(() => null);
    if (settings?.email) {
      sendInvoiceSignedNotification({
        adminEmail: settings.email,
        clientName,
        invoiceNumber: invoice.invoiceNumber,
        signedAt,
      }).catch((e) => console.error("[Email] invoice signed notification failed:", e));
    }

    return ok({ message: "فاکتور با موفقیت امضا شد", signedAt });
  } catch (e) {
    return serverError(e);
  }
}
