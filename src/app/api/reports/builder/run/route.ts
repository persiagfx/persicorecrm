import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import {
  requireAuth,
  ok,
  badRequest,
  unauthorized,
  serverError,
  tenantFilter,
} from "@/lib/auth";

type Entity = "leads" | "clients" | "invoices" | "expenses" | "campaigns";

interface ReportFilter {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}

interface ReportConfig {
  entity: Entity;
  columns: string[];
  filters?: ReportFilter;
  groupBy?: string;
  chartType?: "bar" | "line" | "pie";
  limit?: number;
}

const ENTITY_DATE_FIELD: Record<Entity, string> = {
  leads: "createdAt",
  clients: "createdAt",
  invoices: "issuedAt",
  expenses: "date",
  campaigns: "startDate",
};

function buildWhere(
  tf: Record<string, unknown>,
  filters: ReportFilter | undefined,
  entity: Entity
) {
  const dateField = ENTITY_DATE_FIELD[entity];
  const where: Record<string, unknown> = { ...tf };

  if (filters?.dateFrom || filters?.dateTo) {
    where[dateField] = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    };
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  return where;
}

// POST /api/reports/builder/run — execute a report config
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const config: ReportConfig = await req.json();
    const { entity, columns, filters, limit = 500 } = config;

    const validEntities: Entity[] = ["leads", "clients", "invoices", "expenses", "campaigns"];
    if (!entity || !validEntities.includes(entity)) {
      return badRequest(`entity must be one of: ${validEntities.join(", ")}`);
    }

    const tf = tenantFilter(payload);
    const where = buildWhere(tf as Record<string, unknown>, filters, entity);
    const take = Math.min(Math.max(1, Number(limit) || 500), 1000);

    // Build prisma select from columns array
    // Always include id; if columns empty fall back to a sensible default
    function buildSelect(cols: string[], defaults: string[]): Record<string, boolean> | undefined {
      const list = cols.length > 0 ? [...new Set(["id", ...cols])] : defaults;
      if (list.length === 0) return undefined;
      return Object.fromEntries(list.map((c) => [c, true]));
    }

    let rows: Record<string, unknown>[] = [];

    if (entity === "leads") {
      const select = buildSelect(columns, [
        "id", "companyName", "contactName", "contactPhone", "contactEmail",
        "estimatedValue", "conversionProbability", "status", "source", "createdAt",
      ]);
      rows = (await prisma.lead.findMany({ where, select, orderBy: { createdAt: "desc" }, take })) as Record<string, unknown>[];
    } else if (entity === "clients") {
      const select = buildSelect(columns, [
        "id", "companyName", "contactName", "contactPhone", "contactEmail",
        "status", "totalRevenue", "projectCount", "createdAt",
      ]);
      rows = (await prisma.client.findMany({ where, select, orderBy: { createdAt: "desc" }, take })) as Record<string, unknown>[];
    } else if (entity === "invoices") {
      const select = buildSelect(columns, [
        "id", "invoiceNumber", "status", "total", "subtotal", "taxAmount",
        "discount", "issuedAt", "dueDate", "paidAt",
      ]);
      rows = (await prisma.invoice.findMany({ where, select, orderBy: { issuedAt: "desc" }, take })) as Record<string, unknown>[];
    } else if (entity === "expenses") {
      const select = buildSelect(columns, [
        "id", "title", "amount", "category", "date", "approvalStatus", "createdAt",
      ]);
      rows = (await prisma.expense.findMany({ where, select, orderBy: { date: "desc" }, take })) as Record<string, unknown>[];
    } else if (entity === "campaigns") {
      const select = buildSelect(columns, [
        "id", "title", "channel", "status", "budget", "startDate", "endDate", "createdAt",
      ]);
      rows = (await prisma.campaign.findMany({ where, select, orderBy: { startDate: "desc" }, take })) as Record<string, unknown>[];
    }

    const resultColumns = rows.length > 0 ? Object.keys(rows[0]) : (columns.length > 0 ? columns : []);

    return ok({ rows, total: rows.length, columns: resultColumns });
  } catch (e) {
    return serverError(e);
  }
}
