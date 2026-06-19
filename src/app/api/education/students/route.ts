import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const perPage = Math.min(100, Number(searchParams.get("perPage") ?? 20));

  const where = {
    tenantId: payload.tenantId,
    ...(status ? { status } : {}),
    ...(search ? {
      OR: [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ],
    } : {}),
  };

  const [total, students] = await Promise.all([
    prisma.eduStudent.count({ where }),
    prisma.eduStudent.findMany({
      where,
      include: { _count: { select: { enrollments: true, certificates: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return ok(
    students.map(s => ({ ...s, enrollmentCount: s._count.enrollments, certificateCount: s._count.certificates })),
    { total, page, perPage }
  );
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const student = await prisma.eduStudent.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(student);
}
