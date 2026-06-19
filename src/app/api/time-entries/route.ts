import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? undefined;
    const userId = searchParams.get("userId") ?? undefined;
    const isRunning = searchParams.get("isRunning") === "true" ? true : undefined;

    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: payload.userId,
        ...(projectId ? { projectId } : {}),
        ...(isRunning !== undefined ? { isRunning } : {}),
      },
      include: {
        task: { select: { id: true, title: true } },
        project: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { startedAt: "desc" },
      take: 100,
    });

    return ok(entries);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.projectId) return badRequest("پروژه الزامی است");

    // Stop any running timer for this user
    await prisma.timeEntry.updateMany({
      where: { userId: payload.userId, isRunning: true },
      data: { isRunning: false, endedAt: new Date() },
    });

    const entry = await prisma.timeEntry.create({
      data: {
        taskId: body.taskId,
        projectId: body.projectId,
        userId: payload.userId,
        startedAt: new Date(),
        isRunning: true,
        durationSeconds: 0,
        notes: body.notes,
      },
    });

    return created(entry);
  } catch (e) {
    return serverError(e);
  }
}
