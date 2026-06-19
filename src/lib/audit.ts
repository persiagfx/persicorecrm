import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";

interface AuditLogOptions {
  actorId: string;
  tenantId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  description: string;
  metadata?: Record<string, unknown>;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  req?: NextRequest;
}

export function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

export function getUserAgent(req: NextRequest): string {
  return req.headers.get("user-agent") ?? "unknown";
}

export async function logActivity(opts: AuditLogOptions): Promise<void> {
  const ip = opts.req ? getClientIP(opts.req) : undefined;
  const userAgent = opts.req ? getUserAgent(opts.req) : undefined;

  await prisma.activityLog.create({
    data: {
      tenantId: opts.tenantId ?? null,
      actorId: opts.actorId,
      action: opts.action,
      entityType: opts.entityType,
      entityId: opts.entityId,
      entityName: opts.entityName,
      description: opts.description,
      metadata: {
        ...opts.metadata,
        ...(ip ? { ip } : {}),
        ...(userAgent ? { userAgent } : {}),
        ...(opts.before !== undefined ? { before: opts.before } : {}),
        ...(opts.after !== undefined ? { after: opts.after } : {}),
      } as Prisma.InputJsonValue,
    },
  });
}

// Fire-and-forget version — won't throw
export function logActivitySilent(opts: AuditLogOptions): void {
  logActivity(opts).catch((err) => logger.error("[audit] logActivity failed:", err));
}
