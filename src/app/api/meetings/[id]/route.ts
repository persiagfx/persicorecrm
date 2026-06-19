import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const meeting = await prisma.meeting.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) },
      include: {
        attendees: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    if (!meeting) return notFound("جلسه");
    return ok(meeting);
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

    await prisma.meetingAttendee.deleteMany({ where: { meetingId: id } });

    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        title: body.title,
        type: body.type,
        status: body.status,
        startAt: body.startAt ? new Date(body.startAt) : undefined,
        endAt: body.endAt ? new Date(body.endAt) : undefined,
        location: body.location,
        meetingUrl: body.meetingUrl,
        agenda: body.agenda,
        minutes: body.minutes,
        actionItems: body.actionItems,
        attendees: {
          create: (body.attendeeIds ?? []).map((userId: string) => ({ userId })),
        },
      },
      include: { attendees: { include: { user: { select: { id: true, name: true } } } } },
    });

    return ok(meeting);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    await prisma.meeting.delete({ where: { id } });
    return ok({ message: "جلسه حذف شد" });
  } catch (e) {
    return serverError(e);
  }
}
