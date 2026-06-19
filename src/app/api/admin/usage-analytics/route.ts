import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, requireRole, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin");
    if (roleErr) return roleErr;

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined;
    const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined;

    const dateFilter = from || to
      ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {};

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tenants = await prisma.tenant.findMany({
      where: dateFilter,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
        users: {
          select: { lastLoginAt: true },
          orderBy: { lastLoginAt: "desc" },
          take: 1,
        },
        payments: {
          where: { status: "paid" },
          select: { amount: true },
        },
      },
    });

    const tenantIds = tenants.map((t) => t.id);

    const [clientCounts, leadCounts, invoiceCounts, fileSizes] = await Promise.all([
      prisma.client.groupBy({
        by: ["tenantId"],
        where: { tenantId: { in: tenantIds } },
        _count: { _all: true },
      }),
      prisma.lead.groupBy({
        by: ["tenantId"],
        where: { tenantId: { in: tenantIds } },
        _count: { _all: true },
      }),
      prisma.invoice.groupBy({
        by: ["tenantId"],
        where: { tenantId: { in: tenantIds } },
        _count: { _all: true },
      }),
      prisma.fileItem.groupBy({
        by: ["folderId"],
        _sum: { size: true },
      }),
    ]);

    // Map folderId -> tenantId via FileFolder
    const folderTenantMap = await prisma.fileFolder.findMany({
      where: { tenantId: { in: tenantIds } },
      select: { id: true, tenantId: true },
    });
    const folderToTenant: Record<string, string> = {};
    for (const f of folderTenantMap) {
      if (f.tenantId) folderToTenant[f.id] = f.tenantId;
    }

    const storageByTenant: Record<string, number> = {};
    for (const fs of fileSizes) {
      if (fs.folderId && folderToTenant[fs.folderId]) {
        const tid = folderToTenant[fs.folderId];
        storageByTenant[tid] = (storageByTenant[tid] ?? 0) + (fs._sum.size ?? 0);
      }
    }

    const clientMap: Record<string, number> = {};
    for (const c of clientCounts) {
      if (c.tenantId) clientMap[c.tenantId] = c._count._all;
    }
    const leadMap: Record<string, number> = {};
    for (const l of leadCounts) {
      if (l.tenantId) leadMap[l.tenantId] = l._count._all;
    }
    const invoiceMap: Record<string, number> = {};
    for (const inv of invoiceCounts) {
      if (inv.tenantId) invoiceMap[inv.tenantId] = inv._count._all;
    }

    const tenantStats = tenants.map((t) => {
      const lastActiveAt = t.users[0]?.lastLoginAt ?? null;
      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        plan: t.plan,
        status: t.status,
        userCount: t._count.users,
        clientCount: clientMap[t.id] ?? 0,
        leadCount: leadMap[t.id] ?? 0,
        invoiceCount: invoiceMap[t.id] ?? 0,
        storageUsed: storageByTenant[t.id] ?? 0,
        totalRevenue: t.payments.reduce((sum, p) => sum + p.amount, 0),
        lastActiveAt,
        createdAt: t.createdAt,
      };
    });

    const activeTenants = tenantStats.filter(
      (t) => t.lastActiveAt && new Date(t.lastActiveAt) >= thirtyDaysAgo
    ).length;

    const totalRevenue = tenantStats.reduce((sum, t) => sum + t.totalRevenue, 0);

    return ok({
      tenants: tenantStats,
      aggregate: {
        totalTenants: tenants.length,
        activeTenants,
        totalRevenue,
      },
    });
  } catch (e) {
    return serverError(e);
  }
}
