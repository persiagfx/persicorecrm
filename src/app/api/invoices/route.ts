import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, serverError, tenantFilter } from "@/lib/auth";
import { createInvoiceCreatedEntry } from "@/lib/erp/auto-ledger";
import { invoiceSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId") ?? undefined;
    const projectId = searchParams.get("projectId") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const type = searchParams.get("type") ?? undefined;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const perPage = Math.min(100, Number(searchParams.get("perPage") ?? 20));

    const where = {
      ...tenantFilter(payload),
      ...(clientId ? { clientId } : {}),
      ...(projectId ? { projectId } : {}),
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
    };

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        include: {
          client: { select: { id: true, companyName: true } },
          installments: true,
        },
        orderBy: { issuedAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return ok(invoices, { total, page, perPage });
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const raw = await req.json();
    const parsed = invoiceSchema.safeParse(raw);
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join("، ");
      return badRequest(msg);
    }
    const body = parsed.data;

    const count = await prisma.invoice.count({ where: tenantFilter(payload) });
    const invoiceNumber = `INV-${String(count + 1).padStart(4, "0")}`;

    const items = body.items;
    const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const taxRate = body.taxRate ?? 9;
    const taxAmount = Math.round(subtotal * (taxRate / 100));
    const discount = body.discount ?? 0;
    const total = subtotal + taxAmount - discount;

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: payload.tenantId ?? null,
        invoiceNumber,
        type: body.type ?? "invoice",
        clientId: body.clientId,
        projectId: body.projectId,
        items: items.map((i) => ({ ...i, total: i.quantity * i.unitPrice })),
        subtotal,
        taxRate,
        taxAmount,
        discount,
        total,
        status: body.status ?? "draft",
        dueDate: new Date(body.dueDate),
        notes: body.notes,
        isRecurring: body.isRecurring ?? false,
        recurringInterval: body.recurringInterval,
      },
    });

    if (body.installments?.length) {
      await prisma.installment.createMany({
        data: body.installments.map((ins: { amount: number; dueDate: string }) => ({
          invoiceId: invoice.id,
          amount: ins.amount,
          dueDate: new Date(ins.dueDate),
          status: "pending",
        })),
      });
    }

    await prisma.activityLog.create({
      data: {
        tenantId: payload.tenantId ?? null,
        actorId: payload.userId,
        action: "create",
        entityType: "invoice",
        entityId: invoice.id,
        entityName: invoice.invoiceNumber,
        description: `فاکتور ${invoice.invoiceNumber} صادر شد`,
      },
    });

    createInvoiceCreatedEntry({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.total,
      createdById: payload.userId,
    }).catch((err) => console.error("[auto-ledger] invoice created entry failed:", err));

    return created(invoice);
  } catch (e) {
    return serverError(e);
  }
}
