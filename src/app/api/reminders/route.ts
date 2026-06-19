import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const completed = searchParams.get("completed") === "true";

    const reminders = await prisma.reminder.findMany({
      where: { userId: payload.userId, isCompleted: completed },
      orderBy: { dueDate: "asc" },
    });

    return ok(reminders);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.title || !body.dueDate) return badRequest("عنوان و تاریخ الزامی است");

    const reminder = await prisma.reminder.create({
      data: {
        userId: payload.userId,
        leadId: body.leadId,
        clientId: body.clientId,
        title: body.title,
        notes: body.notes,
        dueDate: new Date(body.dueDate),
      },
    });

    return created(reminder);
  } catch (e) {
    return serverError(e);
  }
}
