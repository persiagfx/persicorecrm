import prisma from "@/lib/db";
import { JwtPayload } from "@/lib/auth";

export async function checkClientLimit(payload: JwtPayload): Promise<string | null> {
  if (!payload.tenantId) return null;
  const tenant = await prisma.tenant.findUnique({
    where: { id: payload.tenantId },
    select: { maxClients: true, plan: true, status: true, trialEndsAt: true },
  });
  if (!tenant) return null;
  if (tenant.status !== "active") return "این workspace فعال نیست";
  if (tenant.trialEndsAt && tenant.trialEndsAt < new Date() && tenant.plan === "trial") {
    return "دوره تریال شما به پایان رسیده است. برای ادامه پلن انتخاب کنید";
  }
  const count = await prisma.client.count({ where: { tenantId: payload.tenantId } });
  if (count >= tenant.maxClients) {
    return `به حداکثر تعداد مشتری (${tenant.maxClients}) در پلن ${tenant.plan} رسیده‌اید`;
  }
  return null;
}

export async function checkUserLimit(payload: JwtPayload): Promise<string | null> {
  if (!payload.tenantId) return null;
  const tenant = await prisma.tenant.findUnique({
    where: { id: payload.tenantId },
    select: { maxUsers: true, plan: true, status: true, trialEndsAt: true },
  });
  if (!tenant) return null;
  if (tenant.status !== "active") return "این workspace فعال نیست";
  if (tenant.trialEndsAt && tenant.trialEndsAt < new Date() && tenant.plan === "trial") {
    return "دوره تریال شما به پایان رسیده است. برای ادامه پلن انتخاب کنید";
  }
  const count = await prisma.user.count({ where: { tenantId: payload.tenantId } });
  if (count >= tenant.maxUsers) {
    return `به حداکثر تعداد کاربر (${tenant.maxUsers}) در پلن ${tenant.plan} رسیده‌اید`;
  }
  return null;
}

export async function getTenantInfo(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true, name: true, plan: true, status: true,
      trialEndsAt: true, maxUsers: true, maxClients: true,
      _count: { select: { users: true } },
    },
  });
}

export function isTrialExpired(tenant: { plan: string; trialEndsAt: Date | null }): boolean {
  if (tenant.plan !== "trial") return false;
  if (!tenant.trialEndsAt) return false;
  return tenant.trialEndsAt < new Date();
}

export function daysUntilTrialEnd(trialEndsAt: Date | null): number | null {
  if (!trialEndsAt) return null;
  const diff = trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
