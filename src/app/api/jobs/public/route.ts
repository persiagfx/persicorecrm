import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dept = searchParams.get("department") ?? undefined;
    const type = searchParams.get("type") ?? undefined;

    const jobs = await prisma.jobPosting.findMany({
      where: {
        status: "open",
        ...(dept ? { department: dept } : {}),
        ...(type ? { type } : {}),
        OR: [
          { deadline: null },
          { deadline: { gte: new Date() } },
        ],
      },
      select: {
        id: true,
        title: true,
        department: true,
        type: true,
        location: true,
        salaryFrom: true,
        salaryTo: true,
        deadline: true,
        createdAt: true,
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(jobs);
  } catch (e) {
    return serverError(e);
  }
}
