import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, forbidden, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (payload.role !== "admin") return forbidden();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const priority = searchParams.get("priority") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const search = searchParams.get("search") ?? "";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const perPage = Math.min(100, Number(searchParams.get("perPage") ?? 20));

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { subject: { contains: search } },
        { userName: { contains: search } },
        { userEmail: { contains: search } },
      ];
    }

    const [total, requests] = await Promise.all([
      (prisma as any).supportRequest.count({ where }),
      (prisma as any).supportRequest.findMany({
        where,
        include: { replies: { orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    const statusCounts = await (prisma as any).supportRequest.groupBy({
      by: ["status"],
      _count: true,
    });

    return ok(requests, { total, page, perPage, statusCounts });
  } catch (e) {
    return serverError(e);
  }
}
