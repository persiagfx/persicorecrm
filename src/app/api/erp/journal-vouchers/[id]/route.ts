import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const voucher = await prisma.journalVoucher.findFirst({
      where: { id, ...tenantFilter(payload) },
      include: {
        lines: {
          include: { account: { select: { id: true, code: true, nameFa: true, type: true } } },
        },
        createdBy: { select: { name: true } },
      },
    });
    if (!voucher) return badRequest("سند یافت نشد");
    return ok(voucher);
  } catch (e) { return serverError(e); }
}

/** PUT — تغییر وضعیت: post (ثبت نهایی) یا cancel (ابطال) */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const tf = tenantFilter(payload);
    const { id } = await params;
    const body = await req.json();

    const voucher = await prisma.journalVoucher.findFirst({
      where: { id, ...tf },
      include: { lines: true },
    });
    if (!voucher) return badRequest("سند یافت نشد");
    if (voucher.status === "posted" && body.status !== "cancelled") {
      return badRequest("سند ثبت‌شده را نمی‌توان ویرایش کرد");
    }

    const updated = await prisma.journalVoucher.update({
      where: { id },
      data: { status: body.status },
    });
    return ok(updated);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const voucher = await prisma.journalVoucher.findFirst({
      where: { id, ...tenantFilter(payload) },
    });
    if (!voucher) return badRequest("سند یافت نشد");
    if (voucher.status === "posted") return badRequest("سند ثبت‌شده را نمی‌توان حذف کرد");

    await prisma.journalVoucher.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
