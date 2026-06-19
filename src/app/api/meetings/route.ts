import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const type = searchParams.get("type") ?? undefined;

    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const perPage = Math.min(100, Number(searchParams.get("perPage") ?? 30));

    const where = {
      ...tenantFilter(payload),
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      OR: [
        { createdById: payload.userId },
        { attendees: { some: { userId: payload.userId } } },
        { isPrivate: false },
      ],
    };

    const [total, meetings] = await Promise.all([
      prisma.meeting.count({ where }),
      prisma.meeting.findMany({
        where,
        include: {
          attendees: { include: { user: { select: { id: true, name: true, avatar: true } } } },
          createdBy: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          client: { select: { id: true, companyName: true } },
        },
        orderBy: { startAt: "asc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return ok(meetings, { total, page, perPage });
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.title || !body.startAt || !body.endAt) return badRequest("عنوان، زمان شروع و پایان الزامی است");

    const meeting = await prisma.meeting.create({
      data: {
        title: body.title,
        tenantId: payload.tenantId ?? null,
        type: body.type ?? "internal",
        status: "scheduled",
        startAt: new Date(body.startAt),
        endAt: new Date(body.endAt),
        location: body.location,
        meetingUrl: body.meetingUrl,
        agenda: body.agenda,
        relatedProjectId: body.relatedProjectId,
        relatedClientId: body.relatedClientId,
        isPrivate: body.isPrivate ?? false,
        createdById: payload.userId,
        actionItems: body.actionItems ?? [],
        attendees: {
          create: (body.attendeeIds ?? []).map((userId: string) => ({ userId })),
        },
      },
      include: {
        attendees: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    return created(meeting);
  } catch (e) {
    return serverError(e);
  }
}
