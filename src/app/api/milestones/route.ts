import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.projectId || !body.title || !body.dueDate)
      return badRequest("پروژه، عنوان و تاریخ الزامی است");

    const milestone = await prisma.milestone.create({
      data: {
        projectId: body.projectId,
        title: body.title,
        description: body.description,
        dueDate: new Date(body.dueDate),
        color: body.color,
      },
    });
    return created(milestone);
  } catch (e) {
    return serverError(e);
  }
}
