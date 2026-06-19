import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? undefined;
    const type = searchParams.get("type") ?? undefined;
    const status = searchParams.get("status") ?? undefined;

    const records = await prisma.employeeOnboarding.findMany({
      where: {
        ...tenantFilter(payload),
        ...(userId ? { userId } : {}),
        ...(type ? { type: type as "onboarding" | "offboarding" } : {}),
        ...(status ? { status: status as "pending" | "inProgress" | "completed" } : {}),
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return ok(records);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.userId || !body.type) return badRequest("کارمند و نوع فرآیند الزامی است");

    const defaultTasks = body.type === "onboarding"
      ? [
          { id: "1", title: "تهیه تجهیزات کاری", done: false },
          { id: "2", title: "راه‌اندازی حساب کاربری", done: false },
          { id: "3", title: "معرفی به تیم", done: false },
          { id: "4", title: "آموزش‌های اولیه", done: false },
          { id: "5", title: "امضای قرارداد", done: false },
          { id: "6", title: "ثبت اطلاعات در سیستم", done: false },
        ]
      : [
          { id: "1", title: "تحویل تجهیزات", done: false },
          { id: "2", title: "بستن حساب‌های کاربری", done: false },
          { id: "3", title: "تسویه مالی", done: false },
          { id: "4", title: "مصاحبه خروج", done: false },
          { id: "5", title: "انتقال دانش", done: false },
        ];

    const record = await prisma.employeeOnboarding.create({
      data: {
        tenantId: payload.tenantId ?? null,
        userId: body.userId,
        type: body.type,
        startDate: new Date(),
        tasks: body.tasks ?? defaultTasks,
        status: "in_progress",
        notes: body.notes ?? null,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
    return created(record);
  } catch (e) { return serverError(e); }
}
