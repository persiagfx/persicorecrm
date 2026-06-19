import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, forbidden, serverError } from "@/lib/auth";

const DEFAULT_PLANS = [
  {
    key: "trial", name: "Trial", nameFa: "آزمایشی", monthlyPrice: 0, yearlyPrice: 0,
    maxUsers: 3, maxClients: 5, maxStorageGb: 1, order: 0, color: "#6B7280", badge: null,
    features: ["clients", "leads", "projects", "invoices", "time_tracking"],
  },
  {
    key: "starter", name: "Starter", nameFa: "استارتر", monthlyPrice: 299000, yearlyPrice: 2990000,
    maxUsers: 5, maxClients: 50, maxStorageGb: 5, order: 1, color: "#3B82F6", badge: null,
    features: ["clients", "leads", "projects", "invoices", "time_tracking", "contracts", "tickets", "wiki"],
  },
  {
    key: "pro", name: "Pro", nameFa: "حرفه‌ای", monthlyPrice: 699000, yearlyPrice: 6990000,
    maxUsers: 15, maxClients: 200, maxStorageGb: 20, order: 2, color: "#8B5CF6", badge: "popular",
    features: ["clients", "leads", "projects", "invoices", "time_tracking", "contracts", "tickets", "wiki", "files", "payroll", "campaigns", "portal", "api_access", "analytics_advanced"],
  },
  {
    key: "enterprise", name: "Enterprise", nameFa: "سازمانی", monthlyPrice: 1490000, yearlyPrice: 14900000,
    maxUsers: 999, maxClients: 9999, maxStorageGb: 100, order: 3, color: "#F59E0B", badge: "best_value",
    features: ["clients", "leads", "projects", "invoices", "time_tracking", "contracts", "tickets", "wiki", "files", "payroll", "campaigns", "portal", "api_access", "analytics_advanced", "white_label", "dedicated_support", "custom_domain", "email_campaigns"],
  },
];

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (payload.role !== "admin") return forbidden();

    let plans = await (prisma as any).planConfig.findMany({ orderBy: { order: "asc" } });

    // Seed defaults if empty
    if (!plans || plans.length === 0) {
      for (const p of DEFAULT_PLANS) {
        await (prisma as any).planConfig.create({ data: p });
      }
      plans = await (prisma as any).planConfig.findMany({ orderBy: { order: "asc" } });
    }

    return ok(plans);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (payload.role !== "admin") return forbidden();

    const body = await req.json();
    if (!body.key || !body.name) return badRequest("key و name الزامی است");

    const plan = await (prisma as any).planConfig.create({ data: body });
    return created(plan);
  } catch (e) {
    return serverError(e);
  }
}
