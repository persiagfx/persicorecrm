import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, requireRole, ok, badRequest, unauthorized, notFound, serverError } from "@/lib/auth";
import { sendEventToAll } from "@/lib/sse";
import { sendInvoiceSigningEmail } from "@/lib/email";
import { createInvoicePaidEntry } from "@/lib/erp/auto-ledger";
import { triggerWebhook } from "@/lib/webhooks";
import { runAutomation } from "@/lib/automation-engine";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) },
      include: {
        client: true,
        project: { select: { id: true, name: true } },
        installments: { orderBy: { dueDate: "asc" } },
      },
    });
    if (!invoice) return notFound("فاکتور");
    return ok(invoice);
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

    // ─── Admin sign ───────────────────────────────────────────────
    if (body._action === "admin-sign") {
      if (!body.signatureDataUrl) return badRequest("امضا الزامی است");
      const invoice = await prisma.invoice.update({
        where: { id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { adminSignatureDataUrl: body.signatureDataUrl, adminSignedAt: new Date() } as any,
      });
      return ok(invoice);
    }

    // ─── Send to client (generates signToken + email) ─────────────
    if (body._action === "send") {
      const existing = await prisma.invoice.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) },
        include: { client: { select: { contactEmail: true, contactName: true, companyName: true } } },
      });
      if (!existing) return notFound("فاکتور");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingAny = existing as any;
      const token = existingAny.signToken ?? randomBytes(32).toString("hex");
      const clientEmail = existing.client?.contactEmail;
      const clientName = existing.client?.contactName ?? existing.client?.companyName ?? "مشتری";
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const signLink = `${appUrl}/invoice-sign/${token}`;

      const invoice = await prisma.invoice.update({
        where: { id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { status: "sent", signToken: token } as any,
      });

      if (clientEmail) {
        sendInvoiceSigningEmail({
          to: clientEmail,
          clientName,
          invoiceNumber: existing.invoiceNumber,
          total: existing.total,
          signLink,
          dueDate: existing.dueDate,
        }).catch((e) => console.error("[Email] invoice sign email failed:", e));
      }

      prisma.activityLog.create({
        data: {
          actorId: payload.userId,
          action: "invoice_sent",
          entityType: "invoice",
          entityId: id,
          entityName: existing.invoiceNumber,
          description: `فاکتور ${existing.invoiceNumber} برای ${clientName} ارسال شد`,
          metadata: { signLink },
        },
      }).catch((err) => console.error(err));

      return ok(invoice);
    }

    // ─── Regular update ───────────────────────────────────────────
    const items = body.items as Array<{ description: string; quantity: number; unitPrice: number }>;
    let updateData: Record<string, unknown> = { status: body.status, notes: body.notes, dueDate: body.dueDate ? new Date(body.dueDate) : undefined };

    if (items) {
      const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
      const taxRate = body.taxRate ?? 9;
      const taxAmount = Math.round(subtotal * (taxRate / 100));
      const discount = body.discount ?? 0;
      updateData = {
        ...updateData,
        items: items.map((i) => ({ ...i, total: i.quantity * i.unitPrice })),
        subtotal, taxRate, taxAmount, discount,
        total: subtotal + taxAmount - discount,
      };
    }

    if (body.status === "paid" && !body.paidAt) updateData.paidAt = new Date();

    const invoice = await prisma.invoice.update({ where: { id }, data: updateData });

    if (invoice.status === "paid") {
      await prisma.client.update({
        where: { id: invoice.clientId },
        data: { totalRevenue: { increment: invoice.total }, lastInteractionAt: new Date() },
      });
      sendEventToAll({ type: "invoice_paid", data: { invoiceId: invoice.id, total: invoice.total } });
      if (invoice.tenantId) {
        triggerWebhook(invoice.tenantId, "invoice.paid", invoice);
        runAutomation("invoice_paid", { invoice }, invoice.tenantId).catch((err) => console.error(err));
      }
      createInvoicePaidEntry({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.total,
        createdById: payload.userId,
        date: invoice.paidAt ?? new Date(),
      }).catch((e) => console.error("[AutoLedger] invoice paid entry failed:", e));
    }

    return ok(invoice);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin");
    if (roleErr) return roleErr;
    const { id } = await params;
    const invoice = await prisma.invoice.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) } });
    if (!invoice) return notFound("فاکتور");
    if (invoice.status === "paid") return badRequest("فاکتور پرداخت‌شده قابل حذف نیست");
    await prisma.invoice.delete({ where: { id } });
    return ok({ message: "فاکتور حذف شد" });
  } catch (e) {
    return serverError(e);
  }
}
