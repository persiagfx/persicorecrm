import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, serverError, tenantFilter } from "@/lib/auth";
import { sendTicketCreatedEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const priority = searchParams.get("priority") ?? undefined;
    const projectId = searchParams.get("projectId") ?? undefined;
    const search = searchParams.get("search") ?? "";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const perPage = Math.min(100, Number(searchParams.get("perPage") ?? 20));

    const where = {
      ...tenantFilter(payload),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(projectId ? { projectId } : {}),
      ...(search ? { title: { contains: search } } : {}),
    };

    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        include: { comments: { orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return ok(tickets, { total, page, perPage });
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.title) return badRequest("عنوان الزامی است");

    const ticket = await prisma.ticket.create({
      data: {
        tenantId: payload.tenantId ?? null,
        title: body.title,
        description: body.description,
        status: "open",
        priority: body.priority ?? "medium",
        reporterId: payload.userId,
        assigneeId: body.assigneeId,
        projectId: body.projectId,
        tags: body.tags ?? [],
      },
    });

    // Notify admins via email
    if (payload.tenantId) {
      prisma.user.findMany({
        where: { tenantId: payload.tenantId, role: "admin", isActive: true },
        select: { email: true, name: true },
      }).then((admins) => {
        const reporter = admins.find((a) => a.email === payload.email);
        admins.filter(a => a.email).forEach((admin) => {
          sendTicketCreatedEmail({
            adminEmail: admin.email!,
            ticketTitle: ticket.title,
            reporterName: reporter?.name ?? payload.email ?? "کاربر",
            priority: ticket.priority,
            ticketId: ticket.id,
          }).catch((e) => console.error("[ticket-notify]", e));
        });
      }).catch((err) => console.error(err));
    }

    return created(ticket);
  } catch (e) {
    return serverError(e);
  }
}
