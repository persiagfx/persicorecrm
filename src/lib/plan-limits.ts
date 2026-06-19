import prisma from "@/lib/db";

// Default limits per plan (fallback if PlanConfig not in DB)
const PLAN_DEFAULTS: Record<string, { users: number; clients: number; leads: number }> = {
  trial:      { users: 3,          clients: 10,   leads: 50 },
  starter:    { users: 10,         clients: 100,  leads: 500 },
  pro:        { users: 50,         clients: 1000, leads: -1 },   // -1 = unlimited
  enterprise: { users: -1,         clients: -1,   leads: -1 },
};

const UNLIMITED = 999_999_999;

function resolveLimit(raw: number): number {
  return raw <= 0 ? UNLIMITED : raw;
}

export type PlanResource = "users" | "clients" | "leads" | "projects" | "invoices";

export interface PlanLimitResult {
  allowed: boolean;
  limit: number;
  current: number;
  planName: string;
}

async function countResource(tenantId: string, resource: PlanResource): Promise<number> {
  switch (resource) {
    case "users":
      return prisma.user.count({ where: { tenantId } });
    case "clients":
      return prisma.client.count({ where: { tenantId } });
    case "leads":
      return prisma.lead.count({ where: { tenantId } });
    case "projects":
      return prisma.project.count({ where: { tenantId } });
    case "invoices":
      return prisma.invoice.count({ where: { tenantId } });
    default:
      return 0;
  }
}

export async function checkPlanLimit(
  tenantId: string,
  resource: PlanResource,
  currentCount?: number
): Promise<PlanLimitResult> {
  // Fetch tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true, maxUsers: true, maxClients: true },
  });

  if (!tenant) {
    return { allowed: true, limit: UNLIMITED, current: currentCount ?? 0, planName: "unknown" };
  }

  const planKey = tenant.plan ?? "trial";

  // Try to get PlanConfig from DB
  const planConfig = await prisma.planConfig.findUnique({
    where: { key: planKey },
    select: { maxUsers: true, maxClients: true, name: true, nameFa: true, features: true },
  });

  const planName = planConfig?.nameFa ?? planConfig?.name ?? planKey;

  // Determine limit for the resource
  let limit: number;

  if (resource === "users") {
    const raw = planConfig?.maxUsers ?? tenant.maxUsers ?? PLAN_DEFAULTS[planKey]?.users ?? 3;
    limit = resolveLimit(raw);
  } else if (resource === "clients") {
    const raw = planConfig?.maxClients ?? tenant.maxClients ?? PLAN_DEFAULTS[planKey]?.clients ?? 10;
    limit = resolveLimit(raw);
  } else if (resource === "leads") {
    const defaultVal = PLAN_DEFAULTS[planKey]?.leads ?? 50;
    limit = defaultVal <= 0 ? UNLIMITED : defaultVal;
  } else {
    // projects, invoices — not restricted by plan config, unlimited
    limit = UNLIMITED;
  }

  // Get current count
  const current = currentCount !== undefined ? currentCount : await countResource(tenantId, resource);

  return {
    allowed: current < limit,
    limit,
    current,
    planName,
  };
}

export async function getPlanFeatures(tenantId: string): Promise<string[]> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });

  if (!tenant) return [];

  const planConfig = await prisma.planConfig.findUnique({
    where: { key: tenant.plan ?? "trial" },
    select: { features: true },
  });

  if (!planConfig?.features) return [];

  // features is stored as Json array of strings
  const features = planConfig.features;
  if (Array.isArray(features)) return features as string[];
  return [];
}
