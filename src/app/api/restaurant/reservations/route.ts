import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const reservations = await prisma.restReservation.findMany({
    where: {
      tenantId: payload.tenantId,
      ...(date ? { date: { gte: new Date(date), lt: new Date(new Date(date).getTime() + 86400000) } } : {}),
    },
    include: { table: { select: { number: true, name: true } } },
    orderBy: { date: "asc" },
  });
  return ok(reservations);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const reservation = await prisma.restReservation.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(reservation);
}
